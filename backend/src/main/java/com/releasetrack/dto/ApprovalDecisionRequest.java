package com.releasetrack.dto;

import com.releasetrack.entity.ApprovalStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ApprovalDecisionRequest(
        @NotNull ApprovalStatus approvalStatus,
        @NotBlank @Size(max = 100) String approverName,
        @Size(max = 5000) String comments
) {
}
