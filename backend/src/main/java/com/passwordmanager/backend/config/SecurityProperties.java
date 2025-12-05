package com.passwordmanager.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for security settings.
 * Binds properties from application.yml with prefix 'security'.
 */
@Configuration
@ConfigurationProperties(prefix = "security")
public class SecurityProperties {

    private RateLimit rateLimit = new RateLimit();
    private FailedAuth failedAuth = new FailedAuth();

    public RateLimit getRateLimit() {
        return rateLimit;
    }

    public void setRateLimit(RateLimit rateLimit) {
        this.rateLimit = rateLimit;
    }

    public FailedAuth getFailedAuth() {
        return failedAuth;
    }

    public void setFailedAuth(FailedAuth failedAuth) {
        this.failedAuth = failedAuth;
    }

    /**
     * Rate limiting configuration.
     */
    public static class RateLimit {
        private boolean enabled = true;
        private int authRequestsPerMinute = 5;
        private int vaultRequestsPerMinute = 100;
        private int exportRequestsPerHour = 3;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public int getAuthRequestsPerMinute() {
            return authRequestsPerMinute;
        }

        public void setAuthRequestsPerMinute(int authRequestsPerMinute) {
            this.authRequestsPerMinute = authRequestsPerMinute;
        }

        public int getVaultRequestsPerMinute() {
            return vaultRequestsPerMinute;
        }

        public void setVaultRequestsPerMinute(int vaultRequestsPerMinute) {
            this.vaultRequestsPerMinute = vaultRequestsPerMinute;
        }

        public int getExportRequestsPerHour() {
            return exportRequestsPerHour;
        }

        public void setExportRequestsPerHour(int exportRequestsPerHour) {
            this.exportRequestsPerHour = exportRequestsPerHour;
        }
    }

    /**
     * Failed authentication configuration.
     */
    public static class FailedAuth {
        private int maxAttempts = 3;
        private int lockoutDurationSeconds = 30;
        private int backoffMultiplier = 2;

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public int getLockoutDurationSeconds() {
            return lockoutDurationSeconds;
        }

        public void setLockoutDurationSeconds(int lockoutDurationSeconds) {
            this.lockoutDurationSeconds = lockoutDurationSeconds;
        }

        public int getBackoffMultiplier() {
            return backoffMultiplier;
        }

        public void setBackoffMultiplier(int backoffMultiplier) {
            this.backoffMultiplier = backoffMultiplier;
        }
    }
}
