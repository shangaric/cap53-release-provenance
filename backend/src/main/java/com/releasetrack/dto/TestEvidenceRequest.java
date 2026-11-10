package com.releasetrack.dto;

import com.releasetrack.entity.TestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.lang.NonNull;

public record TestEvidenceRequest(
        @NonNull @NotNull Long releaseId,
        @NotBlank @Size(max = 150) String testName,
        @NotNull TestStatus testStatus,
        @Size(max = 10000) String evidenceDetails
) {
}
