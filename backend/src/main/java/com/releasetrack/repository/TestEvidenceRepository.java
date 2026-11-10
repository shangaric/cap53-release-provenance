package com.releasetrack.repository;

import com.releasetrack.entity.TestEvidence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestEvidenceRepository extends JpaRepository<TestEvidence, Long> {
    List<TestEvidence> findAllByOrderByExecutedAtDesc();
    List<TestEvidence> findByRelease_IdOrderByExecutedAtDesc(Long releaseId);
    void deleteByRelease_Id(Long releaseId);
}
