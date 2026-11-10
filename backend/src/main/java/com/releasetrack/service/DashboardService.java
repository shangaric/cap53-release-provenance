package com.releasetrack.service;

import com.releasetrack.dto.DashboardStatsResponse;
import com.releasetrack.entity.DeploymentEnvironment;
import com.releasetrack.entity.DeploymentStatus;
import com.releasetrack.repository.DeploymentRepository;
import com.releasetrack.repository.ReleaseRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {
    private final ReleaseRepository releaseRepository;
    private final DeploymentRepository deploymentRepository;

    public DashboardService(ReleaseRepository releaseRepository, DeploymentRepository deploymentRepository) {
        this.releaseRepository = releaseRepository;
        this.deploymentRepository = deploymentRepository;
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        var recentDeployments = deploymentRepository.findAllByOrderByDeployedAtDesc(PageRequest.of(0, 6)).stream()
                .map(DeploymentService::toResponse)
                .toList();
        return new DashboardStatsResponse(
                releaseRepository.count(),
                deploymentRepository.count(),
                deploymentRepository.countByStatus(DeploymentStatus.SUCCESS),
                deploymentRepository.countByStatus(DeploymentStatus.FAILED),
                deploymentRepository.countByEnvironment(DeploymentEnvironment.PRODUCTION),
                recentDeployments
        );
    }
}
