package com.releasetrack.repository;

import com.releasetrack.entity.Approval;
import com.releasetrack.entity.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {
    List<Approval> findAllByOrderByIdDesc();
    List<Approval> findByRelease_IdOrderByIdDesc(Long releaseId);
    boolean existsByRelease_IdAndApprovalStatus(Long releaseId, ApprovalStatus approvalStatus);
    void deleteByRelease_Id(Long releaseId);
}
