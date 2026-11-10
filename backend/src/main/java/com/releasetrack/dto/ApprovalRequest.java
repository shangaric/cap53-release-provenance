package com.releasetrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.lang.NonNull;

public record ApprovalRequest(
        @NonNull @NotNull Long releaseId,
        @NotBlank @Size(max = 100) String approverName,
        @Size(max = 5000) String comments
) {
}
