package com.releasetrack.dto;

import com.releasetrack.entity.TestStatus;

import java.time.LocalDateTime;

public record TestEvidenceResponse(
        Long id,
        Long releaseId,
        String version,
        String testName,
        TestStatus testStatus,
        String evidenceDetails,
        LocalDateTime executedAt
) {
}
