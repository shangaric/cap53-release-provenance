
import argparse
import csv
import io
import json
import os
import sys
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

DEFAULT_BUCKET = "releasetrack-artifacts-2026-unique"
DEFAULT_REGION = "ap-south-1"
ENVIRONMENTS = ("staging", "production")


# ---------------------------------------------------------------- S3 helpers

def list_objects(s3, bucket, prefix):
    objects = []
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        objects.extend(page.get("Contents", []))
    return objects


def get_text(s3, bucket, key):
    try:
        return s3.get_object(Bucket=bucket, Key=key)["Body"].read().decode("utf-8")
    except ClientError as err:
        if err.response["Error"]["Code"] in ("NoSuchKey", "404"):
            return None
        raise


def get_json(s3, bucket, key):
    text = get_text(s3, bucket, key)
    return json.loads(text) if text else None


def file_name(key):
    return key.rsplit("/", 1)[-1]


def record_time(record):
    return record.get("deployed_at") or record.get("recorded_at") or record.get("_file", "")


# ------------------------------------------------------------- ledger loading

def load_ledger(s3, bucket, release_id):
    data = {
        "manifest": get_json(s3, bucket, f"ledger/releases/{release_id}.json"),
        "revoked": get_json(s3, bucket, f"ledger/revoked/{release_id}.json"),
        "deployments": [],
        "approvals": [],
        "evidence": {},
    }

    for obj in list_objects(s3, bucket, f"ledger/deployments/{release_id}/"):
        record = get_json(s3, bucket, obj["Key"])
        if record:
            record["_file"] = file_name(obj["Key"])
            data["deployments"].append(record)
    data["deployments"].sort(key=record_time)

    for obj in list_objects(s3, bucket, f"ledger/approvals/{release_id}/"):
        record = get_json(s3, bucket, obj["Key"])
        if record:
            record["_file"] = file_name(obj["Key"])
            data["approvals"].append(record)

    for obj in list_objects(s3, bucket, f"ledger/evidence/{release_id}/"):
        text = get_text(s3, bucket, obj["Key"])
        if text:
            data["evidence"][file_name(obj["Key"])] = list(csv.DictReader(io.StringIO(text)))

    return data


# --------------------------------------------------------------------- checks

def run_checks(release_id, data):
    checks = []

    def add(name, status, detail):
        checks.append({"name": name, "status": status, "detail": detail})

    manifest = data["manifest"]
    add("Release manifest written at build",
        "PASS" if manifest else "FAIL",
        "found" if manifest else "no manifest in ledger/releases/")

    deploys = [d for d in data["deployments"]
               if d.get("type") in ("DEPLOY", "ROLLBACK") and d.get("result") == "SUCCEEDED"]
    by_env = {env: [d for d in deploys if d.get("environment") == env] for env in ENVIRONMENTS}

    for env in ENVIRONMENTS:
        count = len(by_env[env])
        add(f"Deployed to {env}", "PASS" if count else "FAIL",
            f"{count} successful deployment record(s)")

    # Same checksum everywhere
    hashes = []
    if manifest:
        hashes.append(("Build manifest", manifest.get("sha256")))
    for d in deploys:
        hashes.append((f"{d['environment']} {d['type'].lower()} ({d['_file']})", d.get("verified_sha256")))
        if d.get("staging_verified_sha256"):
            hashes.append((f"Staging hash as read by production ({d['_file']})", d["staging_verified_sha256"]))
    values = {h for _, h in hashes if h}
    equal = len(hashes) > 1 and all(h for _, h in hashes) and len(values) == 1
    add("Checksum identical at build, staging and production",
        "PASS" if equal else "FAIL",
        next(iter(values)) if equal else f"{len(values)} different value(s) across {len(hashes)} source(s)")
    data["hashes"] = hashes

    # Version label equals release ID everywhere (no second build)
    labels_ok = bool(deploys) and all(d.get("eb_version_label") == release_id for d in deploys)
    add("Every deployment used the Elastic Beanstalk version labelled with this release ID",
        "PASS" if labels_ok else "FAIL",
        f"{len(deploys)} deployment record(s) checked")

    # Production approval
    prod_deploys = [d for d in by_env["production"] if d.get("type") == "DEPLOY"]
    if prod_deploys:
        approval = next((a for a in data["approvals"] if a["_file"] == "production.json"), None)
        approved = bool(approval) and approval.get("decision") == "APPROVED" and any(
            a.get("state") == "approved" for a in approval.get("approvals", []))
        who = ", ".join(a.get("approver", "?") for a in approval.get("approvals", [])) if approval else "none"
        add("Production deployment was approved", "PASS" if approved else "FAIL", f"approver(s): {who}")

    # Test evidence
    for env in ENVIRONMENTS:
        if not by_env[env]:
            continue
        rows = data["evidence"].get(f"{env}-smoke.csv")
        if not rows:
            add(f"{env.capitalize()} smoke tests recorded", "FAIL", "no evidence file")
        else:
            passed = sum(1 for r in rows if r.get("http_code") == "200")
            add(f"{env.capitalize()} smoke tests passed",
                "PASS" if passed == len(rows) else "FAIL",
                f"{passed} of {len(rows)} checks returned HTTP 200")

    # Revocation (information only)
    revoked = data["revoked"]
    if revoked:
        add("Revocation status", "INFO",
            f"REVOKED by {revoked.get('revoked_by')} at {revoked.get('revoked_at')}: {revoked.get('reason')}")
    else:
        add("Revocation status", "INFO", "not revoked")

    return checks


# --------------------------------------------------------------------- report

def cell(value):
    text = "-" if value in (None, "") else str(value)
    return text.replace("|", "\\|").replace("\n", " ")


def table(headers, rows):
    lines = ["| " + " | ".join(headers) + " |",
             "| " + " | ".join("---" for _ in headers) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(cell(c) for c in row) + " |")
    return "\n".join(lines)


def build_report(release_id, bucket, data, checks, verified):
    manifest = data["manifest"] or {}
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    out = []

    out.append(f"# Provenance report: {release_id}")
    out.append(f"Generated {now} from s3://{bucket}/ledger/")
    out.append("")
    out.append("## Verdict")
    out.append("")
    out.append("**VERIFIED**: the artifact deployed to production is the artifact that was built and tested in staging."
               if verified else
               "**NOT VERIFIED**: at least one integrity check failed. See the checks below.")
    out.append("")

    # Trace
    out.append("## Commit to production trace")
    out.append("")
    steps = []
    if manifest:
        steps.append(f"Source commit `{manifest.get('commit_sha')}`")
        steps.append(f"Built once by workflow run {manifest.get('workflow_run_url')} at {manifest.get('built_at')}")
        steps.append(f"Stored as `{manifest.get('s3_key')}` with SHA-256 `{manifest.get('sha256')}`")
    for d in data["deployments"]:
        if d.get("type") == "DEPLOY" and d.get("environment") == "staging":
            steps.append(f"Deployed to staging at {d.get('deployed_at')} (version label {d.get('eb_version_label')})")
    for a in data["approvals"]:
        if a.get("decision") == "APPROVED" and a["_file"] == "production.json":
            who = ", ".join(x.get("approver", "?") for x in a.get("approvals", []))
            steps.append(f"Production approval by {who}")
    for d in data["deployments"]:
        if d.get("type") == "DEPLOY" and d.get("environment") == "production":
            steps.append(f"Deployed to production at {d.get('deployed_at')} (version label {d.get('eb_version_label')})")
    if not steps:
        steps.append("No ledger records found for this release ID.")
    for number, step in enumerate(steps, start=1):
        out.append(f"{number}. {step}")
    out.append("")

    # Release
    out.append("## Release")
    out.append("")
    out.append(table(["Field", "Value"], [
        ("Release ID", release_id),
        ("Commit SHA", manifest.get("commit_sha")),
        ("Version label", manifest.get("version_label")),
        ("Artifact", manifest.get("s3_key")),
        ("SHA-256", manifest.get("sha256")),
        ("Built at", manifest.get("built_at")),
        ("Build run", manifest.get("workflow_run_url")),
        ("Status", "REVOKED" if data["revoked"] else "active"),
    ]))
    out.append("")

    # Checks
    out.append("## Integrity checks")
    out.append("")
    out.append(table(["Check", "Result", "Detail"],
                     [(c["name"], c["status"], c["detail"]) for c in checks]))
    out.append("")

    # Checksums
    out.append("## Checksums seen")
    out.append("")
    out.append(table(["Source", "SHA-256"], data.get("hashes", [])))
    out.append("")

    # History
    out.append("## Deployment history")
    out.append("")
    out.append(table(
        ["Time (UTC)", "Environment", "Type", "Result", "Version label", "Run"],
        [(record_time(d), d.get("environment"), d.get("type"), d.get("result"),
          d.get("eb_version_label"), d.get("workflow_run_url")) for d in data["deployments"]]))
    out.append("")

    # Approvals
    out.append("## Approvals")
    out.append("")
    rows = []
    for a in data["approvals"]:
        people = "; ".join(f"{x.get('approver', '?')} ({x.get('state')})" for x in a.get("approvals", []))
        rows.append((a.get("environment"), a.get("decision"), a.get("purpose", "PROMOTION"), people, a["_file"]))
    out.append(table(["Environment", "Decision", "Purpose", "Reviewers", "Record"], rows))
    out.append("")

    # Evidence
    out.append("## Test evidence")
    for name in sorted(data["evidence"]):
        out.append("")
        out.append(f"### {name}")
        out.append("")
        out.append(table(["Check", "URL", "HTTP code", "Result"],
                         [(r.get("check"), r.get("url"), r.get("http_code"),
                           "PASS" if r.get("http_code") == "200" else "FAIL")
                          for r in data["evidence"][name]]))
    if not data["evidence"]:
        out.append("")
        out.append("No test evidence recorded.")
    out.append("")

    # Revocation
    if data["revoked"]:
        out.append("## Revocation")
        out.append("")
        out.append(table(["Field", "Value"], [
            ("Revoked by", data["revoked"].get("revoked_by")),
            ("Revoked at", data["revoked"].get("revoked_at")),
            ("Reason", data["revoked"].get("reason")),
            ("Run", data["revoked"].get("workflow_run_url")),
        ]))
        out.append("")

    return "\n".join(out)


# ------------------------------------------------------------------- listing

def recent_releases(s3, bucket, limit=10):
    objects = [o for o in list_objects(s3, bucket, "ledger/releases/") if o["Key"].endswith(".json")]
    objects.sort(key=lambda o: o["LastModified"], reverse=True)
    return objects[:limit]


def print_release_list(s3, bucket):
    rows = []
    for obj in recent_releases(s3, bucket):
        release_id = file_name(obj["Key"])[:-5]
        envs = set()
        for d in list_objects(s3, bucket, f"ledger/deployments/{release_id}/"):
            name = file_name(d["Key"])
            if name.endswith("-DEPLOY.json"):
                envs.add(name.split("-", 1)[0])
        revoked = bool(list_objects(s3, bucket, f"ledger/revoked/{release_id}.json"))
        rows.append((release_id, obj["LastModified"].strftime("%Y-%m-%d %H:%M"),
                     ", ".join(sorted(envs)) or "-", "REVOKED" if revoked else "active"))
    print(table(["Release ID", "Recorded (UTC)", "Deployed to", "Status"], rows))


# ---------------------------------------------------------------------- main

def main():
    parser = argparse.ArgumentParser(description="Provenance report from the S3 ledger")
    parser.add_argument("--bucket", default=os.environ.get("ARTIFACT_BUCKET", DEFAULT_BUCKET))
    parser.add_argument("--region", default=os.environ.get("AWS_REGION", DEFAULT_REGION))
    choice = parser.add_mutually_exclusive_group(required=True)
    choice.add_argument("--release-id", help="release to report on")
    choice.add_argument("--latest", action="store_true", help="report on the most recent release")
    choice.add_argument("--list", action="store_true", help="list recent releases and exit")
    parser.add_argument("--out-dir", default=".", help="where to write the report")
    parser.add_argument("--no-strict", action="store_true", help="exit 0 even if checks fail")
    args = parser.parse_args()

    s3 = boto3.client("s3", region_name=args.region)

    if args.list:
        print_release_list(s3, args.bucket)
        return 0

    release_id = args.release_id
    if args.latest:
        latest = recent_releases(s3, args.bucket, limit=1)
        if not latest:
            print("No releases found in the ledger.")
            return 1
        release_id = file_name(latest[0]["Key"])[:-5]

    data = load_ledger(s3, args.bucket, release_id)
    checks = run_checks(release_id, data)
    verified = all(c["status"] in ("PASS", "INFO") for c in checks)

    os.makedirs(args.out_dir, exist_ok=True)
    path = os.path.join(args.out_dir, f"provenance-{release_id}.md")
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(build_report(release_id, args.bucket, data, checks, verified))

    for c in checks:
        print(f"[{c['status']}] {c['name']}: {c['detail']}")
    print(f"\nReport written to {path}")
    print("VERIFIED" if verified else "NOT VERIFIED")

    return 0 if verified or args.no_strict else 1


if __name__ == "__main__":
    sys.exit(main())