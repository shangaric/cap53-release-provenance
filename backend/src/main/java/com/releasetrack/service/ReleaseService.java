package com.releasetrack.service;

import com.releasetrack.dto.ReleaseRequest;
import com.releasetrack.dto.ReleaseResponse;
import com.releasetrack.entity.Release;
import com.releasetrack.repository.ApprovalRepository;
import com.releasetrack.repository.DeploymentRepository;
import com.releasetrack.repository.ReleaseRepository;
import com.releasetrack.repository.TestEvidenceRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ReleaseService {
    private final ReleaseRepository releaseRepository;
    private final DeploymentRepository deploymentRepository;
    private final ApprovalRepository approvalRepository;
    private final TestEvidenceRepository testEvidenceRepository;

    public ReleaseService(
            ReleaseRepository releaseRepository,
            DeploymentRepository deploymentRepository,
            ApprovalRepository approvalRepository,
            TestEvidenceRepository testEvidenceRepository
    ) {
        this.releaseRepository = releaseRepository;
        this.deploymentRepository = deploymentRepository;
        this.approvalRepository = approvalRepository;
        this.testEvidenceRepository = testEvidenceRepository;
    }

    @Transactional(readOnly = true)
    public List<ReleaseResponse> findAll(String query) {
        List<Release> releases = query == null || query.isBlank()
                ? releaseRepository.findAllByOrderByCreatedAtDesc()
                : releaseRepository.findByVersionContainingIgnoreCaseOrServiceNameContainingIgnoreCaseOrderByCreatedAtDesc(
                        query.trim(), query.trim());
        return releases.stream().map(ReleaseService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ReleaseResponse findById(@NonNull Long id) {
        return toResponse(requireRelease(id));
    }

    @Transactional
    public ReleaseResponse create(ReleaseRequest request) {
        if (releaseRepository.existsByVersion(request.version().trim())) {
            throw new IllegalStateException("A release with version '" + request.version().trim() + "' already exists.");
        }
        Release release = new Release();
        release.setVersion(request.version().trim());
        release.setServiceName(request.serviceName().trim());
        release.setGitCommit(trimToNull(request.gitCommit()));
        release.setArtifactName(trimToNull(request.artifactName()));
        release.setChecksum(trimToNull(request.checksum()));
        return toResponse(releaseRepository.save(release));
    }

    @Transactional
    public void delete(@NonNull Long id) {
        requireRelease(id);
        if (deploymentRepository.countByRelease_Id(id) > 0) {
            throw new IllegalStateException("This release has deployment history and cannot be deleted.");
        }
        approvalRepository.deleteByRelease_Id(id);
        testEvidenceRepository.deleteByRelease_Id(id);
        releaseRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Release requireRelease(@NonNull Long id) {
        return releaseRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Release " + id + " was not found."));
    }

    public static ReleaseResponse toResponse(Release release) {
        return new ReleaseResponse(release.getId(), release.getVersion(), release.getServiceName(),
                release.getGitCommit(), release.getArtifactName(), release.getChecksum(), release.getCreatedAt());
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
