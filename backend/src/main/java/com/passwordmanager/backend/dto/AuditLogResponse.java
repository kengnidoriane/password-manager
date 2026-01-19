package com.passwordmanager.backend.dto;

import com.passwordmanager.backend.entity.AuditLog;
import com.passwordmanager.backend.entity.AuditLog.AuditAction;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * DTO for audit log response.
 * 
 * Contains audit log information including:
 * - Action type and timestamp
 * - Device and IP information
 * - Success status and error details
 * - Resource information
 * - Suspicious activity flag
 * 
 * Requirements: 18.2, 18.3, 18.4
 */
@Schema(description = "Audit log entry with action details and metadata")
public class AuditLogResponse {

    @Schema(description = "Unique identifier of the audit log entry", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "Action type performed", example = "LOGIN")
    private AuditAction action;

    @Schema(description = "Type of resource affected", example = "credential", nullable = true)
    private String resourceType;

    @Schema(description = "ID of the resource affected", example = "550e8400-e29b-41d4-a716-446655440001", nullable = true)
    private UUID resourceId;

    @Schema(description = "IP address of the client", example = "192.168.1.100")
    private String ipAddress;

    @Schema(description = "User agent string", example = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    private String userAgent;

    @Schema(description = "Device information", example = "Chrome on Windows")
    private String deviceInfo;

    @Schema(description = "Whether the operation succeeded", example = "true")
    private boolean success;

    @Schema(description = "Error message if operation failed", nullable = true)
    private String errorMessage;

    @Schema(description = "Additional metadata about the operation")
    private Map<String, Object> metadata;

    @Schema(description = "Timestamp when the action occurred", example = "2024-01-15T10:30:00")
    private LocalDateTime timestamp;

    @Schema(description = "Whether this activity is flagged as suspicious", example = "false")
    private boolean suspicious;

    // Default constructor
    public AuditLogResponse() {}

    // Constructor from entity
    public static AuditLogResponse fromEntity(AuditLog auditLog) {
        AuditLogResponse response = new AuditLogResponse();
        response.setId(auditLog.getId());
        response.setAction(auditLog.getAction());
        response.setResourceType(auditLog.getResourceType());
        response.setResourceId(auditLog.getResourceId());
        response.setIpAddress(auditLog.getIpAddress());
        response.setUserAgent(auditLog.getUserAgent());
        response.setDeviceInfo(auditLog.getDeviceInfo());
        response.setSuccess(auditLog.isSuccess());
        response.setErrorMessage(auditLog.getErrorMessage());
        response.setMetadata(auditLog.getMetadata());
        response.setTimestamp(auditLog.getTimestamp());
        response.setSuspicious(auditLog.isSuspicious());
        return response;
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public boolean isSuspicious() {
        return suspicious;
    }

    public void setSuspicious(boolean suspicious) {
        this.suspicious = suspicious;
    }
}
