package com.releasetrack.service;

import com.releasetrack.dto.DeploymentRequest;
import com.releasetrack.dto.DeploymentResponse;
import com.releasetrack.entity.ApprovalStatus;
import com.releasetrack.entity.Deployment;
import com.releasetrack.entity.DeploymentEnvironment;
import com.releasetrack.entity.Release;
import com.releasetrack.repository.ApprovalRepository;
import com.releasetrack.repository.DeploymentRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DeploymentService {
    private final DeploymentRepository deploymentRepository;
    private final ApprovalRepository approvalRepository;
    private final ReleaseService releaseService;

    public DeploymentService(
            DeploymentRepository deploymentRepository,
            ApprovalRepository approvalRepository,
            ReleaseService releaseService
    ) {
        this.deploymentRepository = deploymentRepository;
        this.approvalRepository = approvalRepository;
        this.releaseService = releaseService;
    }

    @Transactional(readOnly = true)
    public List<DeploymentResponse> findAll() {
        return deploymentRepository.findAllByOrderByDeployedAtDesc().stream()
                .map(DeploymentService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DeploymentResponse> findByRelease(@NonNull Long releaseId) {
        releaseService.requireRelease(releaseId);
        return deploymentRepository.findByRelease_IdOrderByDeployedAtDesc(releaseId).stream()
                .map(DeploymentService::toResponse).toList();
    }

    @Transactional
    public DeploymentResponse create(DeploymentRequest request) {
        Release release = releaseService.requireRelease(request.releaseId());
        if (request.environment() == DeploymentEnvironment.PRODUCTION
                && !approvalRepository.existsByRelease_IdAndApprovalStatus(release.getId(), ApprovalStatus.APPROVED)) {
            throw new IllegalStateException("Production deployment requires an approved release approval.");
        }
        Deployment deployment = new Deployment();
        deployment.setRelease(release);
        deployment.setEnvironment(request.environment());
        deployment.setStatus(request.status());
        return toResponse(deploymentRepository.save(deployment));
    }

    public static DeploymentResponse toResponse(Deployment deployment) {
        Release release = deployment.getRelease();
        return new DeploymentResponse(deployment.getId(), release.getId(), release.getVersion(),
                release.getServiceName(), deployment.getEnvironment(), deployment.getStatus(),
                deployment.getDeployedAt());
    }
}
