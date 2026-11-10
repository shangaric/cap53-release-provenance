package com.releasetrack.controller;

import com.releasetrack.dto.ApprovalDecisionRequest;
import com.releasetrack.dto.ApprovalRequest;
import com.releasetrack.dto.ApprovalResponse;
import com.releasetrack.service.ApprovalService;
import jakarta.validation.Valid;
import org.springframework.lang.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {
    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping
    public List<ApprovalResponse> findAll(@RequestParam(required = false) Long releaseId) {
        return approvalService.findAll(releaseId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApprovalResponse create(@Valid @RequestBody ApprovalRequest request) {
        return approvalService.create(request);
    }

    @PatchMapping("/{id}/decision")
    public ApprovalResponse decide(@PathVariable @NonNull Long id, @Valid @RequestBody ApprovalDecisionRequest request) {
        return approvalService.decide(id, request);
    }
}
