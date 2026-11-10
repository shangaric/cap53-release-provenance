package com.releasetrack.repository;

import com.releasetrack.entity.Release;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReleaseRepository extends JpaRepository<Release, Long> {
    boolean existsByVersion(String version);
    List<Release> findAllByOrderByCreatedAtDesc();
    List<Release> findByVersionContainingIgnoreCaseOrServiceNameContainingIgnoreCaseOrderByCreatedAtDesc(
            String version, String serviceName);
}
