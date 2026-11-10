package com.releasetrack.repository;

import com.releasetrack.entity.Deployment;
import com.releasetrack.entity.DeploymentEnvironment;
import com.releasetrack.entity.DeploymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DeploymentRepository extends JpaRepository<Deployment, Long> {
    List<Deployment> findAllByOrderByDeployedAtDesc();
    List<Deployment> findAllByOrderByDeployedAtDesc(Pageable pageable);
    List<Deployment> findByRelease_IdOrderByDeployedAtDesc(Long releaseId);
    long countByRelease_Id(Long releaseId);
    long countByStatus(DeploymentStatus status);
    long countByEnvironment(DeploymentEnvironment environment);
}
