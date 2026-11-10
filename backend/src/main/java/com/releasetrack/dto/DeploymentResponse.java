package com.releasetrack.dto;

import com.releasetrack.entity.DeploymentEnvironment;
import com.releasetrack.entity.DeploymentStatus;

import java.time.LocalDateTime;

public record DeploymentResponse(
        Long id,
        Long releaseId,
        String version,
        String serviceName,
        DeploymentEnvironment environment,
        DeploymentStatus status,
        LocalDateTime deployedAt
) {
}
