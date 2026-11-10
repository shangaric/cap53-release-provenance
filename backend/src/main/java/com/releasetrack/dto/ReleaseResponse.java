package com.releasetrack.dto;

import java.time.LocalDateTime;

public record ReleaseResponse(
        Long id,
        String version,
        String serviceName,
        String gitCommit,
        String artifactName,
        String checksum,
        LocalDateTime createdAt
) {
}
