package com.releasetrack.controller;

import com.releasetrack.dto.ReleaseRequest;
import com.releasetrack.dto.ReleaseResponse;
import com.releasetrack.dto.DeploymentResponse;
import com.releasetrack.service.DeploymentService;
import com.releasetrack.service.ReleaseService;
import jakarta.validation.Valid;
import org.springframework.lang.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/releases")
public class ReleaseController {
    private final ReleaseService releaseService;
    private final DeploymentService deploymentService;

    public ReleaseController(ReleaseService releaseService, DeploymentService deploymentService) {
        this.releaseService = releaseService;
        this.deploymentService = deploymentService;
    }

    @GetMapping
    public List<ReleaseResponse> findAll(@RequestParam(required = false) String q) {
        return releaseService.findAll(q);
    }

    @GetMapping("/{id}")
    public ReleaseResponse findById(@PathVariable @NonNull Long id) {
        return releaseService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReleaseResponse create(@Valid @RequestBody ReleaseRequest request) {
        return releaseService.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable @NonNull Long id) {
        releaseService.delete(id);
    }

    @GetMapping("/{id}/deployments")
    public List<DeploymentResponse> deployments(@PathVariable @NonNull Long id) {
        return deploymentService.findByRelease(id);
    }
}
