package com.releasetrack.service;

import com.releasetrack.dto.TestEvidenceRequest;
import com.releasetrack.dto.TestEvidenceResponse;
import com.releasetrack.entity.Release;
import com.releasetrack.entity.TestEvidence;
import com.releasetrack.repository.TestEvidenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TestEvidenceService {
    private final TestEvidenceRepository testEvidenceRepository;
    private final ReleaseService releaseService;

    public TestEvidenceService(TestEvidenceRepository testEvidenceRepository, ReleaseService releaseService) {
        this.testEvidenceRepository = testEvidenceRepository;
        this.releaseService = releaseService;
    }

    @Transactional(readOnly = true)
    public List<TestEvidenceResponse> findAll(Long releaseId) {
        List<TestEvidence> evidence;
        if (releaseId == null) {
            evidence = testEvidenceRepository.findAllByOrderByExecutedAtDesc();
        } else {
            releaseService.requireRelease(releaseId);
            evidence = testEvidenceRepository.findByRelease_IdOrderByExecutedAtDesc(releaseId);
        }
        return evidence.stream().map(TestEvidenceService::toResponse).toList();
    }

    @Transactional
    public TestEvidenceResponse create(TestEvidenceRequest request) {
        Release release = releaseService.requireRelease(request.releaseId());
        TestEvidence evidence = new TestEvidence();
        evidence.setRelease(release);
        evidence.setTestName(request.testName().trim());
        evidence.setTestStatus(request.testStatus());
        evidence.setEvidenceDetails(request.evidenceDetails() == null || request.evidenceDetails().isBlank()
                ? null : request.evidenceDetails().trim());
        return toResponse(testEvidenceRepository.save(evidence));
    }

    private static TestEvidenceResponse toResponse(TestEvidence evidence) {
        return new TestEvidenceResponse(evidence.getId(), evidence.getRelease().getId(),
                evidence.getRelease().getVersion(), evidence.getTestName(), evidence.getTestStatus(),
                evidence.getEvidenceDetails(), evidence.getExecutedAt());
    }
}
