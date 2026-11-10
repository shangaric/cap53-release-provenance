package com.releasetrack.dto;

import com.releasetrack.entity.ApprovalStatus;

import java.time.LocalDateTime;

public record ApprovalResponse(
        Long id,
        Long releaseId,
        String version,
        String serviceName,
        String approverName,
        ApprovalStatus approvalStatus,
        String comments,
        LocalDateTime approvedAt
) {
}
