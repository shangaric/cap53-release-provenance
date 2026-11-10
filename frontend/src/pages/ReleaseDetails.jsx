import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Boxes, ClipboardCheck, GitCommitHorizontal, PackageCheck, Rocket, ShieldCheck } from 'lucide-react'
import DataTable from '../components/DataTable.jsx'
import { ErrorState, LoadingState } from '../components/LoadState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import useApiData from '../hooks/useApiData.js'
import { api, formatDate } from '../services/api.js'

export default function ReleaseDetails() {
  const { id } = useParams()
  const release = useApiData(() => api.release(id), [id])
  const deployments = useApiData(() => api.releaseDeployments(id), [id])
  const approvals = useApiData(() => api.approvals(id), [id])
  const evidence = useApiData(() => api.testEvidence(id), [id])

  if (release.loading && !release.data) return <LoadingState label="Loading release details…" />
  if (release.error) return <><Link className="back-link" to="/releases"><ArrowLeft size={16} /> Back to releases</Link><ErrorState message={release.error} onRetry={release.reload} /></>
  if (!release.data) return null

  const item = release.data
  const secondaryError = deployments.error || approvals.error || evidence.error

  return (
    <>
      <Link className="back-link" to="/releases"><ArrowLeft size={16} /> Back to releases</Link>
      <section className="release-detail-hero">
        <div className="detail-title-block">
          <div className="detail-release-mark"><Boxes size={22} /></div>
          <div><div className="eyebrow"><span className="eyebrow-line" /> RELEASE RECORD</div><h1>Version {item.version}</h1><p>{item.serviceName}</p></div>
        </div>
        <div className="detail-created"><span>CREATED</span><strong>{formatDate(item.createdAt)}</strong></div>
      </section>

      <section className="detail-info-grid">
        <div className="detail-info-card"><span className="detail-info-icon"><GitCommitHorizontal size={17} /></span><span className="detail-info-label">Git commit</span><code>{item.gitCommit || 'Not provided'}</code></div>
        <div className="detail-info-card"><span className="detail-info-icon"><PackageCheck size={17} /></span><span className="detail-info-label">Artifact filename</span><strong title={item.artifactName}>{item.artifactName || 'Not provided'}</strong></div>
        <div className="detail-info-card checksum-card"><span className="detail-info-icon"><ShieldCheck size={17} /></span><span className="detail-info-label">SHA-256 checksum</span><code>{item.checksum || 'Not provided'}</code></div>
      </section>

      {secondaryError && <ErrorState message={secondaryError} onRetry={() => { deployments.reload(); approvals.reload(); evidence.reload() }} />}
      <div className="detail-sections">
        <section className="content-card">
          <div className="list-toolbar"><div className="list-title"><div className="section-icon"><Rocket size={18} /></div><div><h2>Deployments</h2><p>Environment records for this release.</p></div></div><span className="toolbar-count">{deployments.data?.length ?? '—'} records</span></div>
          {deployments.loading && !deployments.data && <LoadingState />}
          {deployments.data && <DataTable rows={deployments.data} emptyTitle="No deployment history" emptyDescription="Deployment records for this version will appear here." columns={[
            { key: 'environment', label: 'ENVIRONMENT', render: (row) => <StatusBadge value={row.environment} /> },
            { key: 'status', label: 'STATUS', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'deployedAt', label: 'DATE', render: (row) => <span className="date-cell">{formatDate(row.deployedAt)}</span> },
          ]} />}
        </section>
        <section className="content-card">
          <div className="list-toolbar"><div className="list-title"><div className="section-icon"><ShieldCheck size={18} /></div><div><h2>Approvals</h2><p>Review history linked to this version.</p></div></div><span className="toolbar-count">{approvals.data?.length ?? '—'} records</span></div>
          {approvals.loading && !approvals.data && <LoadingState />}
          {approvals.data && <DataTable rows={approvals.data} emptyTitle="No approvals yet" emptyDescription="Approval requests for this release will appear here." columns={[
            { key: 'approverName', label: 'APPROVER', render: (row) => row.approverName },
            { key: 'approvalStatus', label: 'STATUS', render: (row) => <StatusBadge value={row.approvalStatus} /> },
            { key: 'comments', label: 'COMMENTS', render: (row) => <span className="comment-cell" title={row.comments}>{row.comments || '—'}</span> },
            { key: 'approvedAt', label: 'DATE', render: (row) => <span className="date-cell">{formatDate(row.approvedAt)}</span> },
          ]} />}
        </section>
        <section className="content-card">
          <div className="list-toolbar"><div className="list-title"><div className="section-icon"><ClipboardCheck size={18} /></div><div><h2>Test evidence</h2><p>Recorded test results for this version.</p></div></div><span className="toolbar-count">{evidence.data?.length ?? '—'} records</span></div>
          {evidence.loading && !evidence.data && <LoadingState />}
          {evidence.data && <DataTable rows={evidence.data} emptyTitle="No test evidence" emptyDescription="Test results for this release will appear here." columns={[
            { key: 'testName', label: 'TEST', render: (row) => <strong className="table-strong">{row.testName}</strong> },
            { key: 'testStatus', label: 'RESULT', render: (row) => <StatusBadge value={row.testStatus} /> },
            { key: 'evidenceDetails', label: 'EVIDENCE', render: (row) => <span className="comment-cell" title={row.evidenceDetails}>{row.evidenceDetails || '—'}</span> },
            { key: 'executedAt', label: 'EXECUTED', render: (row) => <span className="date-cell">{formatDate(row.executedAt)}</span> },
          ]} />}
        </section>
      </div>
    </>
  )
}
