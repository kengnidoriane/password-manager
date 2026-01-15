package com.passwordmanager.backend.controller;

import com.passwordmanager.backend.dto.SecurityReportResponse;
import com.passwordmanager.backend.service.SecurityAnalyzerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for audit and security analysis endpoints.
 * 
 * Provides endpoints for:
 * - Security analysis and reporting
 * - Audit log retrieval
 * - Security recommendations
 * 
 * Requirements: 8.3, 8.4, 18.1, 18.2
 */
@RestController
@RequestMapping("/api/v1/audit")
@Tag(name = "Audit", description = "Security analysis and audit logging endpoints")
public class AuditController {

    private static final Logger logger = LoggerFactory.getLogger(AuditController.class);

    private final SecurityAnalyzerService securityAnalyzerService;

    public AuditController(SecurityAnalyzerService securityAnalyzerService) {
        this.securityAnalyzerService = securityAnalyzerService;
    }

    /**
     * Generates a comprehensive security report for the authenticated user's vault.
     * 
     * The report includes:
     * - Overall security score (0-100)
     * - Weak password detection (entropy < 40 bits)
     * - Reused password detection
     * - Password age analysis (90+ days old, 365+ days old)
     * - Actionable security recommendations
     * 
     * @param authentication the authenticated user
     * @return security report with analysis results
     */
    @GetMapping("/security-report")
    @Operation(
        summary = "Generate security report",
        description = "Analyzes the user's vault for security issues and generates a comprehensive report with recommendations",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Security report generated successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = SecurityReportResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - invalid or missing authentication token",
            content = @Content(mediaType = "application/json")
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error during security analysis",
            content = @Content(mediaType = "application/json")
        )
    })
    public ResponseEntity<SecurityReportResponse> getSecurityReport(
            @Parameter(hidden = true) Authentication authentication) {
        
        UUID userId = UUID.fromString(authentication.getName());
        
        logger.debug("Generating security report for user: {}", userId);

        try {
            SecurityAnalyzerService.SecurityReport report = securityAnalyzerService.generateSecurityReport(userId);
            SecurityReportResponse response = SecurityReportResponse.fromSecurityReport(report);

            logger.info("Security report generated for user: {} - Score: {}, Issues: weak={}, reused={}, old={}", 
                       userId, response.getOverallScore(), 
                       response.getWeakPasswords().size(),
                       response.getReusedPasswords().size(),
                       response.getOldPasswords().size() + response.getVeryOldPasswords().size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Failed to generate security report for user: {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}