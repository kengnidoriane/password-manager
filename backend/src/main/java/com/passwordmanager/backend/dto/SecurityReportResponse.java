package com.passwordmanager.backend.dto;

import com.passwordmanager.backend.service.SecurityAnalyzerService;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO for security analysis reports.
 * 
 * Contains comprehensive security analysis of a user's vault including:
 * - Overall security score (0-100)
 * - Weak password detection results
 * - Reused password detection results
 * - Password age analysis
 * - Actionable security recommendations
 * 
 * Requirements: 8.3, 8.4
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityReportResponse {

    /**
     * User ID for whom the report was generated.
     */
    @JsonProperty("user_id")
    private UUID userId;

    /**
     * Overall security score from 0 (very poor) to 100 (excellent).
     * 
     * The score is calculated based on:
     * - Percentage of weak passwords
     * - Number of reused passwords
     * - Age of passwords
     * - Other security factors
     */
    @JsonProperty("overall_score")
    private Integer overallScore;

    /**
     * Total number of credentials analyzed.
     */
    @JsonProperty("total_credentials")
    private Integer totalCredentials;

    /**
     * List of credentials with weak passwords (low entropy).
     */
    @JsonProperty("weak_passwords")
    private List<WeakPasswordInfo> weakPasswords;

    /**
     * Map of reused passwords to the credentials that use them.
     * Key: password hash, Value: list of credential titles
     */
    @JsonProperty("reused_passwords")
    private Map<String, List<String>> reusedPasswords;

    /**
     * List of credentials with old passwords (90+ days).
     */
    @JsonProperty("old_passwords")
    private List<OldPasswordInfo> oldPasswords;

    /**
     * List of credentials with very old passwords (365+ days).
     */
    @JsonProperty("very_old_passwords")
    private List<OldPasswordInfo> veryOldPasswords;

    /**
     * Actionable security recommendations for improving vault security.
     */
    @JsonProperty("recommendations")
    private List<String> recommendations;

    /**
     * Timestamp when the report was generated.
     */
    @JsonProperty("generated_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime generatedAt;

    /**
     * Information about a weak password.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WeakPasswordInfo {
        
        /**
         * ID of the credential with the weak password.
         */
        @JsonProperty("credential_id")
        private UUID credentialId;

        /**
         * Title/name of the credential.
         */
        @JsonProperty("title")
        private String title;

        /**
         * URL associated with the credential.
         */
        @JsonProperty("url")
        private String url;

        /**
         * Password entropy in bits (lower values indicate weaker passwords).
         */
        @JsonProperty("entropy")
        private Double entropy;
    }

    /**
     * Information about an old password.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OldPasswordInfo {
        
        /**
         * ID of the credential with the old password.
         */
        @JsonProperty("credential_id")
        private UUID credentialId;

        /**
         * Title/name of the credential.
         */
        @JsonProperty("title")
        private String title;

        /**
         * URL associated with the credential.
         */
        @JsonProperty("url")
        private String url;

        /**
         * Number of days since the password was created.
         */
        @JsonProperty("days_since_created")
        private Long daysSinceCreated;

        /**
         * Timestamp when the password was created.
         */
        @JsonProperty("created_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime createdAt;
    }

    /**
     * Creates a SecurityReportResponse from a SecurityAnalyzerService.SecurityReport.
     * 
     * @param report the security report from the service
     * @return the response DTO
     */
    public static SecurityReportResponse fromSecurityReport(SecurityAnalyzerService.SecurityReport report) {
        return SecurityReportResponse.builder()
                .userId(report.getUserId())
                .overallScore(report.getOverallScore())
                .totalCredentials(report.getTotalCredentials())
                .weakPasswords(report.getWeakPasswords().stream()
                        .map(SecurityReportResponse::fromWeakPasswordInfo)
                        .toList())
                .reusedPasswords(report.getReusedPasswords())
                .oldPasswords(report.getOldPasswords().stream()
                        .map(SecurityReportResponse::fromOldPasswordInfo)
                        .toList())
                .veryOldPasswords(report.getVeryOldPasswords().stream()
                        .map(SecurityReportResponse::fromOldPasswordInfo)
                        .toList())
                .recommendations(report.getRecommendations())
                .generatedAt(report.getGeneratedAt())
                .build();
    }

    /**
     * Converts a service WeakPasswordInfo to DTO WeakPasswordInfo.
     */
    private static WeakPasswordInfo fromWeakPasswordInfo(SecurityAnalyzerService.WeakPasswordInfo serviceInfo) {
        return WeakPasswordInfo.builder()
                .credentialId(serviceInfo.getCredentialId())
                .title(serviceInfo.getTitle())
                .url(serviceInfo.getUrl())
                .entropy(serviceInfo.getEntropy())
                .build();
    }

    /**
     * Converts a service OldPasswordInfo to DTO OldPasswordInfo.
     */
    private static OldPasswordInfo fromOldPasswordInfo(SecurityAnalyzerService.OldPasswordInfo serviceInfo) {
        return OldPasswordInfo.builder()
                .credentialId(serviceInfo.getCredentialId())
                .title(serviceInfo.getTitle())
                .url(serviceInfo.getUrl())
                .daysSinceCreated(serviceInfo.getDaysSinceCreated())
                .createdAt(serviceInfo.getCreatedAt())
                .build();
    }
}