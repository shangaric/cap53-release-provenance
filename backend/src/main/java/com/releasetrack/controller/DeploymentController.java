package com.releasetrack.controller;

import com.releasetrack.dto.DeploymentRequest;
import com.releasetrack.dto.DeploymentResponse;
import com.releasetrack.service.DeploymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/deployments")
public class DeploymentController {
    private final DeploymentService deploymentService;

    public DeploymentController(DeploymentService deploymentService) {
        this.deploymentService = deploymentService;
    }

    @GetMapping
    public List<DeploymentResponse> findAll() {
        return deploymentService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeploymentResponse create(@Valid @RequestBody DeploymentRequest request) {
        return deploymentService.create(request);
    }
}
