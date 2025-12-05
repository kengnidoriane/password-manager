package com.passwordmanager.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check controller for monitoring application status.
 * Provides basic health information and application metadata.
 */
@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health", description = "Health check endpoints")
public class HealthController {

    @Value("${spring.application.name}")
    private String applicationName;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    private final Instant startTime = Instant.now();

    /**
     * Basic health check endpoint.
     * 
     * @return Health status and application information
     */
    @GetMapping
    @Operation(
            summary = "Check application health",
            description = "Returns the health status and basic information about the application"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Application is healthy"),
            @ApiResponse(responseCode = "503", description = "Application is unhealthy")
    })
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Password Manager Backend is running");
        response.put("application", applicationName);
        response.put("profile", activeProfile);
        response.put("timestamp", Instant.now().toString());
        response.put("uptime", calculateUptime());
        return ResponseEntity.ok(response);
    }

    /**
     * Calculates application uptime.
     * 
     * @return Uptime in human-readable format
     */
    private String calculateUptime() {
        long uptimeSeconds = Instant.now().getEpochSecond() - startTime.getEpochSecond();
        long hours = uptimeSeconds / 3600;
        long minutes = (uptimeSeconds % 3600) / 60;
        long seconds = uptimeSeconds % 60;
        return String.format("%dh %dm %ds", hours, minutes, seconds);
    }
}
