package com.releasetrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ReleaseRequest(
        @NotBlank @Size(max = 30) String version,
        @NotBlank @Size(max = 100) String serviceName,
        @Size(max = 100) String gitCommit,
        @Size(max = 255) String artifactName,
        @Pattern(regexp = "(?i)^(?:|[a-f0-9]{64})$", message = "Checksum must be a 64-character SHA-256 hex value")
        String checksum
) {
}
