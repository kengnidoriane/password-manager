package com.passwordmanager.backend.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.function.Supplier;

/**
 * Advanced rate limiting service using Bucket4j with Redis backend.
 * 
 * Provides distributed rate limiting with different limits for:
 * - Authentication endpoints: 5 requests per minute
 * - Vault operations: 100 requests per minute
 * - Export operations: 3 requests per hour
 * 
 * Requirements: All (security)
 */
@Service
public class Bucket4jRateLimitService {

    private static final Logger logger = LoggerFactory.getLogger(Bucket4jRateLimitService.class);

    private final ProxyManager<String> proxyManager;

    // Rate limit configurations
    private static final int AUTH_REQUESTS_PER_MINUTE = 5;
    private static final int VAULT_REQUESTS_PER_MINUTE = 100;
    private static final int EXPORT_REQUESTS_PER_HOUR = 3;

    public Bucket4jRateLimitService(ProxyManager<String> proxyManager) {
        this.proxyManager = proxyManager;
        logger.info("Bucket4j rate limiting service initialized with Redis backend");
    }

    /**
     * Checks if an authentication request is allowed.
     * Rate limit: 5 requests per minute per IP address.
     * 
     * @param ipAddress Client IP address
     * @return RateLimitResult with allowed status and remaining tokens
     */
    public RateLimitResult checkAuthenticationLimit(String ipAddress) {
        String key = "auth:" + ipAddress;
        Supplier<BucketConfiguration> configSupplier = () -> 
            BucketConfiguration.builder()
                .addLimit(Bandwidth.simple(AUTH_REQUESTS_PER_MINUTE, Duration.ofMinutes(1)))
                .build();

        return checkLimit(key, configSupplier, "authentication");
    }

    /**
     * Checks if a vault operation request is allowed.
     * Rate limit: 100 requests per minute per user.
     * 
     * @param userId User ID
     * @return RateLimitResult with allowed status and remaining tokens
     */
    public RateLimitResult checkVaultOperationLimit(String userId) {
        String key = "vault:" + userId;
        Supplier<BucketConfiguration> configSupplier = () -> 
            BucketConfiguration.builder()
                .addLimit(Bandwidth.simple(VAULT_REQUESTS_PER_MINUTE, Duration.ofMinutes(1)))
                .build();

        return checkLimit(key, configSupplier, "vault operation");
    }

    /**
     * Checks if an export request is allowed.
     * Rate limit: 3 requests per hour per user.
     * 
     * @param userId User ID
     * @return RateLimitResult with allowed status and remaining tokens
     */
    public RateLimitResult checkExportLimit(String userId) {
        String key = "export:" + userId;
        Supplier<BucketConfiguration> configSupplier = () -> 
            BucketConfiguration.builder()
                .addLimit(Bandwidth.simple(EXPORT_REQUESTS_PER_HOUR, Duration.ofHours(1)))
                .build();

        return checkLimit(key, configSupplier, "export");
    }

    /**
     * Generic method to check rate limit using Bucket4j.
     * 
     * @param key Redis key for the bucket
     * @param configSupplier Supplier for bucket configuration
     * @param operationType Type of operation for logging
     * @return RateLimitResult with allowed status and metadata
     */
    private RateLimitResult checkLimit(String key, Supplier<BucketConfiguration> configSupplier, 
                                      String operationType) {
        try {
            Bucket bucket = proxyManager.builder().build(key, configSupplier);
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

            if (probe.isConsumed()) {
                logger.debug("{} request allowed for key: {} - remaining: {}", 
                           operationType, key, probe.getRemainingTokens());
                return new RateLimitResult(
                    true,
                    probe.getRemainingTokens(),
                    0
                );
            } else {
                long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000; // Convert to seconds
                logger.warn("{} rate limit exceeded for key: {} - retry after: {}s", 
                          operationType, key, waitForRefill);
                return new RateLimitResult(
                    false,
                    0,
                    waitForRefill
                );
            }
        } catch (Exception e) {
            logger.error("Failed to check {} rate limit for key {}: {}", 
                        operationType, key, e.getMessage());
            // Fail open for availability
            return new RateLimitResult(true, -1, 0);
        }
    }

    /**
     * Result of a rate limit check.
     */
    public static class RateLimitResult {
        private final boolean allowed;
        private final long remainingTokens;
        private final long retryAfterSeconds;

        public RateLimitResult(boolean allowed, long remainingTokens, long retryAfterSeconds) {
            this.allowed = allowed;
            this.remainingTokens = remainingTokens;
            this.retryAfterSeconds = retryAfterSeconds;
        }

        public boolean isAllowed() {
            return allowed;
        }

        public long getRemainingTokens() {
            return remainingTokens;
        }

        public long getRetryAfterSeconds() {
            return retryAfterSeconds;
        }
    }
}
