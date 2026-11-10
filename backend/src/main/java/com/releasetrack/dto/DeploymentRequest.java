package com.releasetrack.dto;

import com.releasetrack.entity.DeploymentEnvironment;
import com.releasetrack.entity.DeploymentStatus;
import jakarta.validation.constraints.NotNull;
import org.springframework.lang.NonNull;

public record DeploymentRequest(
        @NonNull @NotNull Long releaseId,
        @NotNull DeploymentEnvironment environment,
        @NotNull DeploymentStatus status
) {
}
