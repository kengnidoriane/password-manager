package com.passwordmanager.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Entity representing audit log entries for security and activity tracking.
 * 
 * This entity tracks all user actions and security events including:
 * - Authentication events (login, logout, failures)
 * - Vault operations (create, read, update, delete)
 * - Security events (2FA, password changes, recovery)
 * - Export/import operations
 * 
 * Requirements: 18.1, 18.5
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(name = "action", nullable = false, length = 100)
    @Enumerated(EnumType.STRING)
    private AuditAction action;

    @Column(name = "resource_type", length = 50)
    private String resourceType;

    @Column(name = "resource_id")
    private UUID resourceId;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @Column(name = "success", nullable = false)
    private boolean success = true;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    // Default constructor
    public AuditLog() {}

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private AuditLog auditLog = new AuditLog();

        public Builder user(UserAccount user) {
            auditLog.user = user;
            return this;
        }

        public Builder action(AuditAction action) {
            auditLog.action = action;
            return this;
        }

        public Builder resourceType(String resourceType) {
            auditLog.resourceType = resourceType;
            return this;
        }

        public Builder resourceId(UUID resourceId) {
            auditLog.resourceId = resourceId;
            return this;
        }

        public Builder ipAddress(String ipAddress) {
            auditLog.ipAddress = ipAddress;
            return this;
        }

        public Builder userAgent(String userAgent) {
            auditLog.userAgent = userAgent;
            return this;
        }

        public Builder deviceInfo(String deviceInfo) {
            auditLog.deviceInfo = deviceInfo;
            return this;
        }

        public Builder success(boolean success) {
            auditLog.success = success;
            return this;
        }

        public Builder errorMessage(String errorMessage) {
            auditLog.errorMessage = errorMessage;
            return this;
        }

        public Builder metadata(Map<String, Object> metadata) {
            auditLog.metadata = metadata;
            return this;
        }

        public AuditLog build() {
            return auditLog;
        }
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UserAccount getUser() {
        return user;
    }

    public void setUser(UserAccount user) {
        this.user = user;
    }

    public AuditAction getAction() {
        return action;
    }

    public void setAction(AuditAction action) {
        this.action = action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public UUID getResourceId() {
        return resourceId;
    }

    public void setResourceId(UUID resourceId) {
        this.resourceId = resourceId;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getDeviceInfo() {
        return deviceInfo;
    }

    public void setDeviceInfo(String deviceInfo) {
        this.deviceInfo = deviceInfo;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    // Helper methods
    public boolean isAuthenticationEvent() {
        return action == AuditAction.LOGIN || 
               action == AuditAction.LOGOUT || 
               action == AuditAction.LOGIN_FAILED ||
               action == AuditAction.REGISTER;
    }

    public boolean isVaultOperation() {
        return action.name().startsWith("CREDENTIAL_") ||
               action.name().startsWith("NOTE_") ||
               action.name().startsWith("FOLDER_") ||
               action.name().startsWith("TAG_") ||
               action.name().startsWith("VAULT_");
    }

    public boolean isSecurityEvent() {
        return action.name().startsWith("TWO_FA_") ||
               action == AuditAction.PASSWORD_CHANGE ||
               action == AuditAction.ACCOUNT_RECOVERY ||
               action == AuditAction.ACCOUNT_DELETE;
    }

    public boolean isSuspicious() {
        return !success && (isAuthenticationEvent() || isSecurityEvent());
    }

    /**
     * Enumeration of audit actions.
     * Matches the CHECK constraint in the database migration.
     */
    public enum AuditAction {
        // Authentication events
        LOGIN,
        LOGOUT,
        LOGIN_FAILED,
        REGISTER,
        
        // Credential operations
        CREDENTIAL_CREATE,
        CREDENTIAL_READ,
        CREDENTIAL_UPDATE,
        CREDENTIAL_DELETE,
        CREDENTIAL_COPY,
        CREDENTIAL_EXPORT,
        CREDENTIAL_IMPORT,
        
        // Secure note operations
        NOTE_CREATE,
        NOTE_READ,
        NOTE_UPDATE,
        NOTE_DELETE,
        
        // Folder operations
        FOLDER_CREATE,
        FOLDER_UPDATE,
        FOLDER_DELETE,
        
        // Tag operations
        TAG_CREATE,
        TAG_UPDATE,
        TAG_DELETE,
        
        // Sharing operations
        SHARE_CREATE,
        SHARE_REVOKE,
        SHARE_ACCESS,
        
        // Vault operations
        VAULT_SYNC,
        VAULT_EXPORT,
        VAULT_IMPORT,
        
        // 2FA operations
        TWO_FA_ENABLE,
        TWO_FA_DISABLE,
        TWO_FA_VERIFY,
        
        // Account operations
        PASSWORD_CHANGE,
        ACCOUNT_RECOVERY,
        ACCOUNT_DELETE,
        
        // Settings operations
        SETTINGS_UPDATE,
        SESSION_TIMEOUT
    }
}
