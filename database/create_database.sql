CREATE DATABASE IF NOT EXISTS releasetrack_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE releasetrack_db;

CREATE TABLE IF NOT EXISTS releases (
    id BIGINT NOT NULL AUTO_INCREMENT,
    version VARCHAR(30) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    git_commit VARCHAR(100),
    artifact_name VARCHAR(255),
    checksum VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uk_releases_version UNIQUE (version)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS deployments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    release_id BIGINT NOT NULL,
    environment VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    deployed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_deployments_release_id (release_id),
    CONSTRAINT fk_deployments_release FOREIGN KEY (release_id) REFERENCES releases (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS approvals (
    id BIGINT NOT NULL AUTO_INCREMENT,
    release_id BIGINT NOT NULL,
    approver_name VARCHAR(100) NOT NULL,
    approval_status VARCHAR(30) NOT NULL,
    comments TEXT,
    approved_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_approvals_release_id (release_id),
    CONSTRAINT fk_approvals_release FOREIGN KEY (release_id) REFERENCES releases (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS test_evidence (
    id BIGINT NOT NULL AUTO_INCREMENT,
    release_id BIGINT NOT NULL,
    test_name VARCHAR(150) NOT NULL,
    test_status VARCHAR(30) NOT NULL,
    evidence_details TEXT,
    executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_test_evidence_release_id (release_id),
    CONSTRAINT fk_test_evidence_release FOREIGN KEY (release_id) REFERENCES releases (id) ON DELETE CASCADE
) ENGINE=InnoDB;
