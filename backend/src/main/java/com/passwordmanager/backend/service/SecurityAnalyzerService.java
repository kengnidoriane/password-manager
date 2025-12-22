package com.passwordmanager.backend.service;

import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.repository.VaultRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for analyzing vault security and detecting security issues.
 * 
 * This service provides:
 * - Weak password detection based on entropy thresholds
 * - Reused password detection across credentials
 * - Password age calculation and analysis
 * - Overall security score computation
 * 
 * Requirements: 8.3, 8.4
 */
@Service
@Transactional(readOnly = true)
public class SecurityAnalyzerService {

    private static final Logger logger = LoggerFactory.getLogger(SecurityAnalyzerService.class);
    
    // Security thresholds
    private static final double WEAK_PASSWORD_ENTROPY_THRESHOLD = 40.0; // bits
    private static final int OLD_PASSWORD_DAYS_THRESHOLD = 90; // days
    private static final int VERY_OLD_PASSWORD_DAYS_THRESHOLD = 365; // days
    
    // Security score weights
    private static final double WEAK_PASSWORD_PENALTY = 10.0;
    private static final double REUSED_PASSWORD_PENALTY = 15.0;
    private static final double OLD_PASSWORD_PENALTY = 5.0;
    private static final double VERY_OLD_PASSWORD_PENALTY = 10.0;
    
    private final VaultRepository vaultRepository;
    private final ObjectMapper objectMapper;

    public SecurityAnalyzerService(VaultRepository vaultRepository, ObjectMapper objectMapper) {
        this.vaultRepository = vaultRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Generates a comprehensive security report for a user's vault.
     * 
     * @param userId the user ID
     * @return security report with analysis results
     */
    public SecurityReport generateSecurityReport(UUID userId) {
        logger.debug("Generating security report for user: {}", userId);

        List<VaultEntry> credentials = vaultRepository.findActiveCredentialsByUserId(userId);
        
        if (credentials.isEmpty()) {
            logger.debug("No credentials found for user: {}", userId);
            return SecurityReport.builder()
                    .userId(userId)
                    .overallScore(100)
                    .totalCredentials(0)
                    .weakPasswords(Collections.emptyList())
                    .reusedPasswords(Collections.emptyMap())
                    .oldPasswords(Collections.emptyList())
                    .veryOldPasswords(Collections.emptyList())
                    .recommendations(Collections.emptyList())
                    .generatedAt(LocalDateTime.now())
                    .build();
        }

        List<CredentialAnalysis> analyses = credentials.stream()
                .map(this::analyzeCredential)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // Detect weak passwords
        List<WeakPasswordInfo> weakPasswords = detectWeakPasswords(analyses);
        
        // Detect reused passwords
        Map<String, List<String>> reusedPasswords = detectReusedPasswords(analyses);
        
        // Detect old passwords
        List<OldPasswordInfo> oldPasswords = detectOldPasswords(analyses, OLD_PASSWORD_DAYS_THRESHOLD);
        List<OldPasswordInfo> veryOldPasswords = detectOldPasswords(analyses, VERY_OLD_PASSWORD_DAYS_THRESHOLD);
        
        // Calculate overall security score
        int overallScore = calculateSecurityScore(analyses.size(), weakPasswords.size(), 
                                                reusedPasswords.size(), oldPasswords.size(), veryOldPasswords.size());
        
        // Generate recommendations
        List<String> recommendations = generateRecommendations(weakPasswords, reusedPasswords, oldPasswords, veryOldPasswords);

        SecurityReport report = SecurityReport.builder()
                .userId(userId)
                .overallScore(overallScore)
                .totalCredentials(analyses.size())
                .weakPasswords(weakPasswords)
                .reusedPasswords(reusedPasswords)
                .oldPasswords(oldPasswords)
                .veryOldPasswords(veryOldPasswords)
                .recommendations(recommendations)
                .generatedAt(LocalDateTime.now())
                .build();

        logger.info("Generated security report for user: {} - Score: {}, Weak: {}, Reused: {}, Old: {}", 
                   userId, overallScore, weakPasswords.size(), reusedPasswords.size(), oldPasswords.size());

        return report;
    }

    /**
     * Analyzes a single credential for security issues.
     * 
     * @param entry the vault entry to analyze
     * @return credential analysis or null if analysis fails
     */
    private CredentialAnalysis analyzeCredential(VaultEntry entry) {
        try {
            // Parse encrypted data to extract credential information
            // Note: In a real implementation, this would require decryption on the client side
            // For this service, we'll work with metadata and assume password analysis is done client-side
            JsonNode data = objectMapper.readTree(entry.getEncryptedData());
            
            // Extract metadata that can be analyzed server-side
            String title = data.has("title") ? data.get("title").asText() : "Unknown";
            String url = data.has("url") ? data.get("url").asText() : "";
            
            // For security analysis, we need password entropy and hash
            // These would be provided by the client during credential creation
            double passwordEntropy = data.has("passwordEntropy") ? data.get("passwordEntropy").asDouble() : 0.0;
            String passwordHash = data.has("passwordHash") ? data.get("passwordHash").asText() : "";
            
            return CredentialAnalysis.builder()
                    .credentialId(entry.getId())
                    .title(title)
                    .url(url)
                    .passwordEntropy(passwordEntropy)
                    .passwordHash(passwordHash)
                    .createdAt(entry.getCreatedAt())
                    .lastUsedAt(entry.getLastUsedAt())
                    .build();
                    
        } catch (Exception e) {
            logger.warn("Failed to analyze credential {}: {}", entry.getId(), e.getMessage());
            return null;
        }
    }

    /**
     * Detects weak passwords based on entropy threshold.
     * 
     * @param analyses list of credential analyses
     * @return list of weak password information
     */
    private List<WeakPasswordInfo> detectWeakPasswords(List<CredentialAnalysis> analyses) {
        return analyses.stream()
                .filter(analysis -> analysis.getPasswordEntropy() < WEAK_PASSWORD_ENTROPY_THRESHOLD)
                .map(analysis -> WeakPasswordInfo.builder()
                        .credentialId(analysis.getCredentialId())
                        .title(analysis.getTitle())
                        .url(analysis.getUrl())
                        .entropy(analysis.getPasswordEntropy())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Detects reused passwords by comparing password hashes.
     * 
     * @param analyses list of credential analyses
     * @return map of password hash to list of credential titles using that password
     */
    private Map<String, List<String>> detectReusedPasswords(List<CredentialAnalysis> analyses) {
        Map<String, List<CredentialAnalysis>> passwordGroups = analyses.stream()
                .filter(analysis -> analysis.getPasswordHash() != null && !analysis.getPasswordHash().isEmpty())
                .collect(Collectors.groupingBy(CredentialAnalysis::getPasswordHash));

        return passwordGroups.entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1) // Only passwords used more than once
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().stream()
                                .map(CredentialAnalysis::getTitle)
                                .collect(Collectors.toList())
                ));
    }

    /**
     * Detects old passwords based on age threshold.
     * 
     * @param analyses list of credential analyses
     * @param daysThreshold age threshold in days
     * @return list of old password information
     */
    private List<OldPasswordInfo> detectOldPasswords(List<CredentialAnalysis> analyses, int daysThreshold) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysThreshold);
        
        return analyses.stream()
                .filter(analysis -> analysis.getCreatedAt().isBefore(cutoffDate))
                .map(analysis -> {
                    long daysSinceCreated = ChronoUnit.DAYS.between(analysis.getCreatedAt(), LocalDateTime.now());
                    return OldPasswordInfo.builder()
                            .credentialId(analysis.getCredentialId())
                            .title(analysis.getTitle())
                            .url(analysis.getUrl())
                            .daysSinceCreated(daysSinceCreated)
                            .createdAt(analysis.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Calculates overall security score based on various factors.
     * 
     * @param totalCredentials total number of credentials
     * @param weakCount number of weak passwords
     * @param reusedCount number of reused passwords
     * @param oldCount number of old passwords
     * @param veryOldCount number of very old passwords
     * @return security score (0-100)
     */
    private int calculateSecurityScore(int totalCredentials, int weakCount, int reusedCount, 
                                     int oldCount, int veryOldCount) {
        if (totalCredentials == 0) {
            return 100; // Perfect score for empty vault
        }

        double totalPenalty = 0.0;
        
        // Calculate penalties as percentages of total credentials
        totalPenalty += (weakCount * WEAK_PASSWORD_PENALTY) / totalCredentials;
        totalPenalty += (reusedCount * REUSED_PASSWORD_PENALTY) / totalCredentials;
        totalPenalty += (oldCount * OLD_PASSWORD_PENALTY) / totalCredentials;
        totalPenalty += (veryOldCount * VERY_OLD_PASSWORD_PENALTY) / totalCredentials;

        int score = Math.max(0, (int) Math.round(100 - totalPenalty));
        
        logger.debug("Security score calculation: total={}, weak={}, reused={}, old={}, veryOld={}, penalty={}, score={}", 
                    totalCredentials, weakCount, reusedCount, oldCount, veryOldCount, totalPenalty, score);
        
        return score;
    }

    /**
     * Generates actionable security recommendations.
     * 
     * @param weakPasswords list of weak passwords
     * @param reusedPasswords map of reused passwords
     * @param oldPasswords list of old passwords
     * @param veryOldPasswords list of very old passwords
     * @return list of recommendations
     */
    private List<String> generateRecommendations(List<WeakPasswordInfo> weakPasswords,
                                               Map<String, List<String>> reusedPasswords,
                                               List<OldPasswordInfo> oldPasswords,
                                               List<OldPasswordInfo> veryOldPasswords) {
        List<String> recommendations = new ArrayList<>();

        if (!weakPasswords.isEmpty()) {
            recommendations.add(String.format("Update %d weak password(s) to use stronger, more complex passwords", 
                                            weakPasswords.size()));
        }

        if (!reusedPasswords.isEmpty()) {
            recommendations.add(String.format("Change %d reused password(s) to unique passwords for each account", 
                                            reusedPasswords.size()));
        }

        if (!veryOldPasswords.isEmpty()) {
            recommendations.add(String.format("Update %d password(s) that are over 1 year old", 
                                            veryOldPasswords.size()));
        } else if (!oldPasswords.isEmpty()) {
            recommendations.add(String.format("Consider updating %d password(s) that are over 90 days old", 
                                            oldPasswords.size()));
        }

        if (recommendations.isEmpty()) {
            recommendations.add("Your vault security looks good! Continue using strong, unique passwords.");
        }

        return recommendations;
    }

    // Inner classes for data structures

    /**
     * Internal class for credential analysis data.
     */
    private static class CredentialAnalysis {
        private final UUID credentialId;
        private final String title;
        private final String url;
        private final double passwordEntropy;
        private final String passwordHash;
        private final LocalDateTime createdAt;
        private final LocalDateTime lastUsedAt;

        private CredentialAnalysis(Builder builder) {
            this.credentialId = builder.credentialId;
            this.title = builder.title;
            this.url = builder.url;
            this.passwordEntropy = builder.passwordEntropy;
            this.passwordHash = builder.passwordHash;
            this.createdAt = builder.createdAt;
            this.lastUsedAt = builder.lastUsedAt;
        }

        public static Builder builder() {
            return new Builder();
        }

        // Getters
        public UUID getCredentialId() { return credentialId; }
        public String getTitle() { return title; }
        public String getUrl() { return url; }
        public double getPasswordEntropy() { return passwordEntropy; }
        public String getPasswordHash() { return passwordHash; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public LocalDateTime getLastUsedAt() { return lastUsedAt; }

        public static class Builder {
            private UUID credentialId;
            private String title;
            private String url;
            private double passwordEntropy;
            private String passwordHash;
            private LocalDateTime createdAt;
            private LocalDateTime lastUsedAt;

            public Builder credentialId(UUID credentialId) { this.credentialId = credentialId; return this; }
            public Builder title(String title) { this.title = title; return this; }
            public Builder url(String url) { this.url = url; return this; }
            public Builder passwordEntropy(double passwordEntropy) { this.passwordEntropy = passwordEntropy; return this; }
            public Builder passwordHash(String passwordHash) { this.passwordHash = passwordHash; return this; }
            public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
            public Builder lastUsedAt(LocalDateTime lastUsedAt) { this.lastUsedAt = lastUsedAt; return this; }

            public CredentialAnalysis build() {
                return new CredentialAnalysis(this);
            }
        }
    }

    /**
     * Information about weak passwords.
     */
    public static class WeakPasswordInfo {
        private final UUID credentialId;
        private final String title;
        private final String url;
        private final double entropy;

        private WeakPasswordInfo(Builder builder) {
            this.credentialId = builder.credentialId;
            this.title = builder.title;
            this.url = builder.url;
            this.entropy = builder.entropy;
        }

        public static Builder builder() {
            return new Builder();
        }

        // Getters
        public UUID getCredentialId() { return credentialId; }
        public String getTitle() { return title; }
        public String getUrl() { return url; }
        public double getEntropy() { return entropy; }

        public static class Builder {
            private UUID credentialId;
            private String title;
            private String url;
            private double entropy;

            public Builder credentialId(UUID credentialId) { this.credentialId = credentialId; return this; }
            public Builder title(String title) { this.title = title; return this; }
            public Builder url(String url) { this.url = url; return this; }
            public Builder entropy(double entropy) { this.entropy = entropy; return this; }

            public WeakPasswordInfo build() {
                return new WeakPasswordInfo(this);
            }
        }
    }

    /**
     * Information about old passwords.
     */
    public static class OldPasswordInfo {
        private final UUID credentialId;
        private final String title;
        private final String url;
        private final long daysSinceCreated;
        private final LocalDateTime createdAt;

        private OldPasswordInfo(Builder builder) {
            this.credentialId = builder.credentialId;
            this.title = builder.title;
            this.url = builder.url;
            this.daysSinceCreated = builder.daysSinceCreated;
            this.createdAt = builder.createdAt;
        }

        public static Builder builder() {
            return new Builder();
        }

        // Getters
        public UUID getCredentialId() { return credentialId; }
        public String getTitle() { return title; }
        public String getUrl() { return url; }
        public long getDaysSinceCreated() { return daysSinceCreated; }
        public LocalDateTime getCreatedAt() { return createdAt; }

        public static class Builder {
            private UUID credentialId;
            private String title;
            private String url;
            private long daysSinceCreated;
            private LocalDateTime createdAt;

            public Builder credentialId(UUID credentialId) { this.credentialId = credentialId; return this; }
            public Builder title(String title) { this.title = title; return this; }
            public Builder url(String url) { this.url = url; return this; }
            public Builder daysSinceCreated(long daysSinceCreated) { this.daysSinceCreated = daysSinceCreated; return this; }
            public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

            public OldPasswordInfo build() {
                return new OldPasswordInfo(this);
            }
        }
    }

    /**
     * Comprehensive security report for a user's vault.
     */
    public static class SecurityReport {
        private final UUID userId;
        private final int overallScore;
        private final int totalCredentials;
        private final List<WeakPasswordInfo> weakPasswords;
        private final Map<String, List<String>> reusedPasswords;
        private final List<OldPasswordInfo> oldPasswords;
        private final List<OldPasswordInfo> veryOldPasswords;
        private final List<String> recommendations;
        private final LocalDateTime generatedAt;

        private SecurityReport(Builder builder) {
            this.userId = builder.userId;
            this.overallScore = builder.overallScore;
            this.totalCredentials = builder.totalCredentials;
            this.weakPasswords = builder.weakPasswords;
            this.reusedPasswords = builder.reusedPasswords;
            this.oldPasswords = builder.oldPasswords;
            this.veryOldPasswords = builder.veryOldPasswords;
            this.recommendations = builder.recommendations;
            this.generatedAt = builder.generatedAt;
        }

        public static Builder builder() {
            return new Builder();
        }

        // Getters
        public UUID getUserId() { return userId; }
        public int getOverallScore() { return overallScore; }
        public int getTotalCredentials() { return totalCredentials; }
        public List<WeakPasswordInfo> getWeakPasswords() { return weakPasswords; }
        public Map<String, List<String>> getReusedPasswords() { return reusedPasswords; }
        public List<OldPasswordInfo> getOldPasswords() { return oldPasswords; }
        public List<OldPasswordInfo> getVeryOldPasswords() { return veryOldPasswords; }
        public List<String> getRecommendations() { return recommendations; }
        public LocalDateTime getGeneratedAt() { return generatedAt; }

        public static class Builder {
            private UUID userId;
            private int overallScore;
            private int totalCredentials;
            private List<WeakPasswordInfo> weakPasswords;
            private Map<String, List<String>> reusedPasswords;
            private List<OldPasswordInfo> oldPasswords;
            private List<OldPasswordInfo> veryOldPasswords;
            private List<String> recommendations;
            private LocalDateTime generatedAt;

            public Builder userId(UUID userId) { this.userId = userId; return this; }
            public Builder overallScore(int overallScore) { this.overallScore = overallScore; return this; }
            public Builder totalCredentials(int totalCredentials) { this.totalCredentials = totalCredentials; return this; }
            public Builder weakPasswords(List<WeakPasswordInfo> weakPasswords) { this.weakPasswords = weakPasswords; return this; }
            public Builder reusedPasswords(Map<String, List<String>> reusedPasswords) { this.reusedPasswords = reusedPasswords; return this; }
            public Builder oldPasswords(List<OldPasswordInfo> oldPasswords) { this.oldPasswords = oldPasswords; return this; }
            public Builder veryOldPasswords(List<OldPasswordInfo> veryOldPasswords) { this.veryOldPasswords = veryOldPasswords; return this; }
            public Builder recommendations(List<String> recommendations) { this.recommendations = recommendations; return this; }
            public Builder generatedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; return this; }

            public SecurityReport build() {
                return new SecurityReport(this);
            }
        }
    }
}