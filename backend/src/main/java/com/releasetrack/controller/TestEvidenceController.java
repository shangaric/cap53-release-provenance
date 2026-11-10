package com.releasetrack.controller;

import com.releasetrack.dto.TestEvidenceRequest;
import com.releasetrack.dto.TestEvidenceResponse;
import com.releasetrack.service.TestEvidenceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/test-evidence")
public class TestEvidenceController {
    private final TestEvidenceService testEvidenceService;

    public TestEvidenceController(TestEvidenceService testEvidenceService) {
        this.testEvidenceService = testEvidenceService;
    }

    @GetMapping
    public List<TestEvidenceResponse> findAll(@RequestParam(required = false) Long releaseId) {
        return testEvidenceService.findAll(releaseId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TestEvidenceResponse create(@Valid @RequestBody TestEvidenceRequest request) {
        return testEvidenceService.create(request);
    }
}
