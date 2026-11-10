package com.releasetrack;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReleaseTrackApplicationTests {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void productionDeploymentRequiresApprovalAndDashboardUsesPersistedRecords() throws Exception {
        String release = """
                {"version":"2.1.0","serviceName":"ReleaseTrack API","gitCommit":"abc123",
                 "artifactName":"releasetrack.jar","checksum":"4e6f4a27f73c5b14c2b9c9b32a16f02c4e6f4a27f73c5b14c2b9c9b32a16f02c"}
                """;
        mockMvc.perform(post("/api/releases").contentType("application/json").content(release))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists());

        mockMvc.perform(post("/api/releases").contentType("application/json").content(release))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/releases").contentType("application/json")
                        .content("""
                                {"version":"2.2.0","serviceName":"ReleaseTrack API","checksum":"not-a-sha256"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.checksum").exists());

        mockMvc.perform(post("/api/deployments").contentType("application/json")
                        .content("{\"releaseId\":1,\"environment\":\"PRODUCTION\",\"status\":\"SUCCESS\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Production deployment requires an approved release approval."));

        mockMvc.perform(post("/api/approvals").contentType("application/json")
                        .content("{\"releaseId\":1,\"approverName\":\"Release Manager\",\"comments\":\"Ready for production\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.approvalStatus").value("PENDING"));

        mockMvc.perform(patch("/api/approvals/1/decision").contentType("application/json")
                        .content("{\"approvalStatus\":\"APPROVED\",\"approverName\":\"Release Manager\",\"comments\":\"Approved\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalStatus").value("APPROVED"));

        mockMvc.perform(post("/api/deployments").contentType("application/json")
                        .content("{\"releaseId\":1,\"environment\":\"PRODUCTION\",\"status\":\"SUCCESS\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/test-evidence").contentType("application/json")
                        .content("""
                                {"releaseId":1,"testName":"API integration suite","testStatus":"PASSED",
                                 "evidenceDetails":"All integration checks passed."}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.testStatus").value("PASSED"));

        mockMvc.perform(delete("/api/releases/1"))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalReleases").value(1))
                .andExpect(jsonPath("$.totalDeployments").value(1))
                .andExpect(jsonPath("$.successfulDeployments").value(1))
                .andExpect(jsonPath("$.productionDeployments").value(1));
    }
}
