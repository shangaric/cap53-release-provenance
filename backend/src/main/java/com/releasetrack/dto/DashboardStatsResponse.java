package com.releasetrack.dto;

import java.util.List;

public record DashboardStatsResponse(
        long totalReleases,
        long totalDeployments,
        long successfulDeployments,
        long failedDeployments,
        long productionDeployments,
        List<DeploymentResponse> recentDeployments
) {
}
