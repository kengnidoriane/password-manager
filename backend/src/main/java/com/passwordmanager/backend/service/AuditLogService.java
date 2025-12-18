package com.passwordmanager.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Service for audit logging of security events.
 * 
 * This service logs security-related events such as:
 * - Failed authentication attempts
 * - Successful logins
 * - Account lockouts
 * - Rate limiting events
 * 
 * Requirements: 2.4, 18.1
 */
@Service
public class AuditLogService {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogService.class);
    private static final String AUDIT_LOG_KEY_PREFIX = "audit_log:";
    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final RedisTemplate<String, Object> redisTemplate;

    public AuditLogService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Logs a failed authentication attempt.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @param userAgent User agent string
     * @param reason Failure reason
     */
    public void logFailedAuthentication(String email, String ipAddress, String userAgent, String reason) {
        Map<String, Object> auditEntry = new HashMap<>();
        auditEntry.put("event_type", "FAILED_AUTHENTICATION");
        auditEntry.put("email", email);
        auditEntry.put("ip_address", ipAddress);
        auditEntry.put("user_agent", userAgent);
        auditEntry.put("reason", reason);
        auditEntry.put("timestamp", LocalDateTime.now().format(TIMESTAMP_FORMAT));
        auditEntry.put("severity", "WARNING");

        logAuditEvent(auditEntry);
        
        logger.warn("AUDIT: Failed authentication attempt for {} from {} - {}", email, ipAddress, reason);
    }

    /**
     * Logs a successful authentication.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @param userAgent User agent string
     */
    public void logSuccessfulAuthentication(String email, String ipAddress, String userAgent) {
        Map<String, Object> auditEntry = new HashMap<>();
        auditEntry.put("event_type", "SUCCESSFUL_AUTHENTICATION");
        auditEntry.put("email", email);
        auditEntry.put("ip_address", ipAddress);
        auditEntry.put("user_agent", userAgent);
        auditEntry.put("timestamp", LocalDateTime.now().format(TIMESTAMP_FORMAT));
        auditEntry.put("severity", "INFO");

        logAuditEvent(auditEntry);
        
        logger.info("AUDIT: Successful authentication for {} from {}", email, ipAddress);
    }

    /**
     * Logs an account lockout event.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @param failedAttempts Number of failed attempts that triggered lockout
     * @param lockoutDurationSeconds Lockout duration in seconds
     */
    public void logAccountLockout(String email, String ipAddress, int failedAttempts, int lockoutDurationSeconds) {
        Map<String, Object> auditEntry = new HashMap<>();
        auditEntry.put("event_type", "ACCOUNT_LOCKOUT");
        auditEntry.put("email", email);
        auditEntry.put("ip_address", ipAddress);
        auditEntry.put("failed_attempts", failedAttempts);
        auditEntry.put("lockout_duration_seconds", lockoutDurationSeconds);
        auditEntry.put("timestamp", LocalDateTime.now().format(TIMESTAMP_FORMAT));
        auditEntry.put("severity", "HIGH");

        logAuditEvent(auditEntry);
        
        logger.warn("AUDIT: Account lockout for {} from {} after {} failed attempts, locked for {} seconds", 
                   email, ipAddress, failedAttempts, lockoutDurationSeconds);
    }

    /**
     * Logs a rate limiting event.
     * 
     * @param email User email (can be null for IP-based rate limiting)
     * @param ipAddress Client IP address
     * @param eventType Type of rate limited event (LOGIN, REGISTRATION, etc.)
     * @param remainingTime Remaining time until rate limit resets
     */
    public void logRateLimitExceeded(String email, String ipAddress, String eventType, long remainingTime) {
        Map<String, Object> auditEntry = new HashMap<>();
        auditEntry.put("event_type", "RATE_LIMIT_EXCEEDED");
        auditEntry.put("email", email != null ? email : "N/A");
        auditEntry.put("ip_address", ipAddress);
        auditEntry.put("rate_limit_type", eventType);
        auditEntry.put("remaining_time_seconds", remainingTime);
        auditEntry.put("timestamp", LocalDateTime.now().format(TIMESTAMP_FORMAT));
        auditEntry.put("severity", "WARNING");

        logAuditEvent(auditEntry);
        
        logger.warn("AUDIT: Rate limit exceeded for {} from {} - type: {}, remaining: {}s", 
                   email != null ? email : "IP", ipAddress, eventType, remainingTime);
    }

    /**
     * Logs a session creation event.
     * 
     * @param email User email
     * @param sessionId Session ID
     * @param ipAddress Client IP address
     * @param deviceInfo Device information
     */
    public void logSessionCreated(String email, String sessionId, String ipAddress, String deviceInfo) {
        Map<String, Object> auditEntry = new HashMap<>();
        auditEntry.put("event_type", "SESSION_CREATED");
        auditEntry.put("email", email);
        auditEntry.put("session_id", sessionId);
        auditEntry.put("ip_address", ipAddress);
        auditEntry.put("device_info", deviceInfo);
        auditEntry.put("timestamp", LocalDateTime.now().format(TIMESTAMP_FORMAT));
        auditEntry.put("severity", "INFO");

        logAuditEvent(auditEntry);
        
        logger.info("AUDIT: Session created for {} from {} - device: {}", email, ipAddress, deviceInfo);
    }

    /**
     * Logs a session expiration event.
     * 
     * @param email User email
     * @param sessionId Session ID
     * @param reason Expiration reason (TIMEOUT, LOGOUT, etc.)
     */
    public void logSessionExpired(String email, String sessionId, String reason) {
        Map<String, Object> auditEntry = new HashMap<>();
        auditEntry.put("event_type", "SESSION_EXPIRED");
        auditEntry.put("email", email);
        auditEntry.put("session_id", sessionId);
        auditEntry.put("reason", reason);
        auditEntry.put("timestamp", LocalDateTime.now().format(TIMESTAMP_FORMAT));
        auditEntry.put("severity", "INFO");

        logAuditEvent(auditEntry);
        
        logger.info("AUDIT: Session expired for {} - session: {}, reason: {}", email, sessionId, reason);
    }

    /**
     * Stores an audit event in Redis with TTL.
     * 
     * @param auditEntry Audit event data
     */
    private void logAuditEvent(Map<String, Object> auditEntry) {
        try {
            // Generate unique key for this audit entry
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss_SSS"));
            String auditKey = AUDIT_LOG_KEY_PREFIX + timestamp + ":" + System.nanoTime();

            // Store audit entry with 90-day TTL (as per requirements)
            redisTemplate.opsForValue().set(auditKey, auditEntry, 90, TimeUnit.DAYS);

        } catch (Exception e) {
            logger.error("Failed to store audit log entry: {}", e.getMessage());
            // Don't throw exception - audit logging failure shouldn't break authentication
        }
    }

    /**
     * Retrieves recent audit logs for a specific email.
     * 
     * @param email User email
     * @param limit Maximum number of entries to return
     * @return List of audit log entries
     */
    public java.util.List<Map<String, Object>> getAuditLogsForUser(String email, int limit) {
        // This is a simplified implementation - in production, you might want to use
        // a more sophisticated indexing strategy or a dedicated audit log database
        java.util.List<Map<String, Object>> logs = new java.util.ArrayList<>();
        
        try {
            // Get all audit log keys (this is not efficient for large datasets)
            java.util.Set<String> keys = redisTemplate.keys(AUDIT_LOG_KEY_PREFIX + "*");
            
            if (keys != null) {
                for (String key : keys) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> entry = (Map<String, Object>) redisTemplate.opsForValue().get(key);
                    
                    if (entry != null && email.equals(entry.get("email"))) {
                        logs.add(entry);
                        
                        if (logs.size() >= limit) {
                            break;
                        }
                    }
                }
            }
            
            // Sort by timestamp (most recent first)
            logs.sort((a, b) -> {
                String timestampA = (String) a.get("timestamp");
                String timestampB = (String) b.get("timestamp");
                return timestampB.compareTo(timestampA);
            });
            
        } catch (Exception e) {
            logger.error("Failed to retrieve audit logs for user {}: {}", email, e.getMessage());
        }
        
        return logs;
    }
}