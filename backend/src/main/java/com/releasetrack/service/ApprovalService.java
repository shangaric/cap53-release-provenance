package com.releasetrack.service;

import com.releasetrack.dto.ApprovalDecisionRequest;
import com.releasetrack.dto.ApprovalRequest;
import com.releasetrack.dto.ApprovalResponse;
import com.releasetrack.entity.Approval;
import com.releasetrack.entity.ApprovalStatus;
import com.releasetrack.entity.Release;
import com.releasetrack.repository.ApprovalRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ApprovalService {
    private final ApprovalRepository approvalRepository;
    private final ReleaseService releaseService;

    public ApprovalService(ApprovalRepository approvalRepository, ReleaseService releaseService) {
        this.approvalRepository = approvalRepository;
        this.releaseService = releaseService;
    }

    @Transactional(readOnly = true)
    public List<ApprovalResponse> findAll(Long releaseId) {
        List<Approval> approvals;
        if (releaseId == null) {
            approvals = approvalRepository.findAllByOrderByIdDesc();
        } else {
            releaseService.requireRelease(releaseId);
            approvals = approvalRepository.findByRelease_IdOrderByIdDesc(releaseId);
        }
        return approvals.stream().map(ApprovalService::toResponse).toList();
    }

    @Transactional
    public ApprovalResponse create(ApprovalRequest request) {
        Release release = releaseService.requireRelease(request.releaseId());
        Approval approval = new Approval();
        approval.setRelease(release);
        approval.setApproverName(request.approverName().trim());
        approval.setApprovalStatus(ApprovalStatus.PENDING);
        approval.setComments(trimToNull(request.comments()));
        return toResponse(approvalRepository.save(approval));
    }

    @Transactional
    public ApprovalResponse decide(@NonNull Long id, ApprovalDecisionRequest request) {
        if (request.approvalStatus() == ApprovalStatus.PENDING) {
            throw new IllegalStateException("An approval decision must be APPROVED or REJECTED.");
        }
        Approval approval = approvalRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Approval " + id + " was not found."));
        if (approval.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw new IllegalStateException("This approval request has already been decided.");
        }
        approval.setApproverName(request.approverName().trim());
        approval.setApprovalStatus(request.approvalStatus());
        approval.setComments(trimToNull(request.comments()));
        approval.setApprovedAt(LocalDateTime.now());
        return toResponse(approvalRepository.save(approval));
    }

    private static ApprovalResponse toResponse(Approval approval) {
        Release release = approval.getRelease();
        return new ApprovalResponse(approval.getId(), release.getId(), release.getVersion(),
                release.getServiceName(), approval.getApproverName(), approval.getApprovalStatus(),
                approval.getComments(), approval.getApprovedAt());
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
