package com.passwordmanager.backend.service;

import com.passwordmanager.backend.entity.AuditLog;
import com.passwordmanager.backend.entity.AuditLog.AuditAction;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for comprehensive audit logging of security events and user actions.
 * 
 * This service logs all security-related events and vault operations including:
 * - Authentication events (login, logout, failures)
 * - Vault operations (create, read, update, delete)
 * - Security events (2FA, password changes, recovery)
 * - Export/import operations
 * - Share operations
 * 
 * Implements automatic log retention policy (90 days).
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 */
@Service
public class AuditLogService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuditLogService.class);
    private static final int LOG_RETENTION_DAYS = 90;

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Logs an audit event to the database.
     * 
     * @param user User performing the action
     * @param action Action type
     * @param ipAddress Client IP address
     * @param userAgent User agent string
     * @param deviceInfo Device information
     * @param success Whether the operation succeeded
     * @param errorMessage Error message if operation failed
     * @param resourceType Type of resource affected
     * @param resourceId ID of resource affected
     * @param metadata Additional metadata
     */
    public void logAuditEvent(UserAccount user, AuditAction action, String ipAddress, 
                             String userAgent, String deviceInfo, boolean success,
                             String errorMessage, String resourceType, UUID resourceId,
                             Map<String, Object> metadata) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .deviceInfo(deviceInfo)
                    .success(success)
                    .errorMessage(errorMessage)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .metadata(metadata)
                    .build();
            
            auditLogRepository.save(auditLog);
            
            LOGGER.info("AUDIT: {} - User: {}, IP: {}, Success: {}", 
                       action, user.getEmail(), ipAddress, success);
        } catch (Exception e) {
            LOGGER.error("Failed to store audit log entry: {}", e.getMessage());
            // Don't throw exception - audit logging failure shouldn't break operations
        }
    }

    /**
     * Logs a failed authentication attempt.
     * 
     * @param user User account
     * @param ipAddress Client IP address
     * @param userAgent User agent string
     * @param deviceInfo Device information
     * @param reason Failure reason
     */
    public void logFailedAuthentication(UserAccount user, String ipAddress, String userAgent, 
                                       String deviceInfo, String reason) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("reason", reason);
        
        logAuditEvent(user, AuditAction.LOGIN_FAILED, ipAddress, userAgent, deviceInfo,
                     false, reason, null, null, metadata);
        
        LOGGER.warn("AUDIT: Failed authentication attempt for {} from {} - {}", 
                   user.getEmail(), ipAddress, reason);
    }

    /**
     * Logs a successful authentication.
     * 
     * @param user User account
     * @param ipAddress Client IP address
     * @param userAgent User agent string
     * @param deviceInfo Device information
     */
    public void logSuccessfulAuthentication(UserAccount user, String ipAddress, String userAgent,
                                           String deviceInfo) {
        logAuditEvent(user, AuditAction.LOGIN, ipAddress, userAgent, deviceInfo,
                     true, null, null, null, null);
        
        LOGGER.info("AUDIT: Successful authentication for {} from {}", user.getEmail(), ipAddress);
    }

    /**
     * Logs an account lockout event.
     * 
     * @param user User account
     * @param ipAddress Client IP address
     * @param deviceInfo Device information
     * @param failedAttempts Number of failed attempts that triggered lockout
     * @param lockoutDurationSeconds Lockout duration in seconds
     */
    public void logAccountLockout(UserAccount user, String ipAddress, String deviceInfo,
                                 int failedAttempts, int lockoutDurationSeconds) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("failed_attempts", failedAttempts);
        metadata.put("lockout_duration_seconds", lockoutDurationSeconds);
        
        logAuditEvent(user, AuditAction.LOGIN_FAILED, ipAddress, null, deviceInfo,
                     false, "Account locked due to multiple failed attempts", null, null, metadata);
        
        LOGGER.warn("AUDIT: Account lockout for {} from {} after {} failed attempts, locked for {} seconds", 
                   user.getEmail(), ipAddress, failedAttempts, lockoutDurationSeconds);
    }

    /**
     * Logs a rate limiting event.
     * 
     * @param user User account (can be null for IP-based rate limiting)
     * @param ipAddress Client IP address
     * @param deviceInfo Device information
     * @param eventType Type of rate limited event (LOGIN, REGISTRATION, etc.)
     * @param remainingTime Remaining time until rate limit resets
     */
    public void logRateLimitExceeded(UserAccount user, String ipAddress, String deviceInfo,
                                    String eventType, long remainingTime) {
        if (user == null) {
            LOGGER.warn("AUDIT: Rate limit exceeded from {} - type: {}, remaining: {}s", 
                       ipAddress, eventType, remainingTime);
            return;
        }
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("rate_limit_type", eventType);
        metadata.put("remaining_time_seconds", remainingTime);
        
        logAuditEvent(user, AuditAction.LOGIN_FAILED, ipAddress, null, deviceInfo,
                     false, "Rate limit exceeded", null, null, metadata);
        
        LOGGER.warn("AUDIT: Rate limit exceeded for {} from {} - type: {}, remaining: {}s", 
                   user.getEmail(), ipAddress, eventType, remainingTime);
    }

    /**
     * Logs a session creation event.
     * 
     * @param user User account
     * @param sessionId Session ID
     * @param ipAddress Client IP address
     * @param deviceInfo Device information
     */
    public void logSessionCreated(UserAccount user, String sessionId, String ipAddress, 
                                 String deviceInfo) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("session_id", sessionId);
        
        logAuditEvent(user, AuditAction.LOGIN, ipAddress, null, deviceInfo,
                     true, null, "session", null, metadata);
        
        LOGGER.info("AUDIT: Session created for {} from {} - device: {}", 
                   user.getEmail(), ipAddress, deviceInfo);
    }

    /**
     * Logs a session expiration event.
     * 
     * @param user User account
     * @param sessionId Session ID
     * @param reason Expiration reason (TIMEOUT, LOGOUT, etc.)
     */
    public void logSessionExpired(UserAccount user, String sessionId, String reason) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("session_id", sessionId);
        metadata.put("reason", reason);
        
        logAuditEvent(user, AuditAction.LOGOUT, null, null, null,
                     true, null, "session", null, metadata);
        
        LOGGER.info("AUDIT: Session expired for {} - session: {}, reason: {}", 
                   user.getEmail(), sessionId, reason);
    }

    /**
     * Logs a vault operation (credential create, update, delete, etc.).
     * 
     * @param user User performing the operation
     * @param action Vault action type
     * @param resourceId ID of the affected resource
     * @param ipAddress Client IP address
     * @param deviceInfo Device information
     * @param success Whether the operation succeeded
     */
    public void logVaultOperation(UserAccount user, AuditAction action, UUID resourceId,
                                 String ipAddress, String deviceInfo, boolean success) {
        String resourceType = determineResourceType(action);
        
        logAuditEvent(user, action, ipAddress, null, deviceInfo,
                     success, null, resourceType, resourceId, null);
        
        LOGGER.info("AUDIT: Vault operation {} for user {} on resource {} - success: {}", 
                   action, user.getEmail(), resourceId, success);
    }

    /**
     * Retrieves audit logs for a specific user with pagination.
     * 
     * @param user User account
     * @param pageable Pagination parameters
     * @return Page of audit logs
     */
    public Page<AuditLog> getAuditLogsForUser(UserAccount user, Pageable pageable) {
        return auditLogRepository.findByUserOrderByTimestampDesc(user, pageable);
    }

    /**
     * Retrieves audit logs for a user within a date range.
     * 
     * @param user User account
     * @param startDate Start of date range
     * @param endDate End of date range
     * @param pageable Pagination parameters
     * @return Page of audit logs
     */
    public Page<AuditLog> getAuditLogsForUserInDateRange(UserAccount user, LocalDateTime startDate,
                                                         LocalDateTime endDate, Pageable pageable) {
        return auditLogRepository.findByUserAndTimestampBetweenOrderByTimestampDesc(
                user, startDate, endDate, pageable);
    }

    /**
     * Retrieves suspicious activities for a user.
     * 
     * @param user User account
     * @param pageable Pagination parameters
     * @return Page of suspicious audit logs
     */
    public Page<AuditLog> getSuspiciousActivities(UserAccount user, Pageable pageable) {
        return auditLogRepository.findByUserAndSuccessFalseOrderByTimestampDesc(user, pageable);
    }

    /**
     * Scheduled task to clean up old audit logs (runs daily at 2 AM).
     * Deletes logs older than the retention period (90 days).
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldAuditLogs() {
        LocalDateTime retentionDate = LocalDateTime.now().minusDays(LOG_RETENTION_DAYS);
        
        long count = auditLogRepository.countByTimestampBefore(retentionDate);
        if (count > 0) {
            LOGGER.info("Cleaning up {} audit logs older than {} days", count, LOG_RETENTION_DAYS);
            int deleted = auditLogRepository.deleteByTimestampBefore(retentionDate);
            LOGGER.info("Successfully deleted {} old audit log entries", deleted);
        }
    }

    /**
     * Determines the resource type based on the audit action.
     * 
     * @param action Audit action
     * @return Resource type string
     */
    private String determineResourceType(AuditAction action) {
        String actionName = action.name();
        if (actionName.startsWith("CREDENTIAL_")) {
            return "credential";
        } else if (actionName.startsWith("NOTE_")) {
            return "note";
        } else if (actionName.startsWith("FOLDER_")) {
            return "folder";
        } else if (actionName.startsWith("TAG_")) {
            return "tag";
        } else if (actionName.startsWith("SHARE_")) {
            return "share";
        } else if (actionName.startsWith("VAULT_")) {
            return "vault";
        }
        return null;
    }

    // Overloaded methods for backward compatibility with email-based logging
    // These are used during authentication when we don't have the UserAccount object yet
    
    /**
     * Logs a failed authentication attempt (email-based).
     * Note: This creates a minimal audit log without full user context.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @param userAgent User agent string
     * @param reason Failure reason
     */
    public void logFailedAuthentication(String email, String ipAddress, String userAgent, String reason) {
        LOGGER.warn("AUDIT: Failed authentication attempt for {} from {} - {}", email, ipAddress, reason);
        // For failed authentication, we may not have the user object
        // This is acceptable as the authentication failed
    }

    /**
     * Logs a successful authentication (email-based).
     * Note: This creates a minimal audit log without full user context.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @param userAgent User agent string
     */
    public void logSuccessfulAuthentication(String email, String ipAddress, String userAgent) {
        LOGGER.info("AUDIT: Successful authentication for {} from {}", email, ipAddress);
        // For successful authentication, the caller should use the UserAccount-based method
    }

    /**
     * Logs an account lockout event (email-based).
     * Note: This creates a minimal audit log without full user context.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @param failedAttempts Number of failed attempts
     * @param lockoutDurationSeconds Lockout duration in seconds
     */
    public void logAccountLockout(String email, String ipAddress, int failedAttempts, 
                                 int lockoutDurationSeconds) {
        LOGGER.warn("AUDIT: Account lockout for {} from {} after {} failed attempts, locked for {} seconds", 
                   email, ipAddress, failedAttempts, lockoutDurationSeconds);
    }

    /**
     * Logs a rate limit exceeded event (email-based).
     * Note: This creates a minimal audit log without full user context.
     * 
     * @param email User email (can be null)
     * @param ipAddress Client IP address
     * @param eventType Event type
     * @param remainingTime Remaining time in seconds
     */
    public void logRateLimitExceeded(String email, String ipAddress, String eventType, long remainingTime) {
        LOGGER.warn("AUDIT: Rate limit exceeded for {} from {} - type: {}, remaining: {}s", 
                   email != null ? email : "IP", ipAddress, eventType, remainingTime);
    }
}