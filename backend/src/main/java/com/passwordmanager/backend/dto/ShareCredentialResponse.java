package com.passwordmanager.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for credential sharing operations.
 */
public class ShareCredentialResponse {
    
    private UUID shareId;
    private UUID credentialId;
    private String credentialTitle;
    private String ownerEmail;
    private String recipientEmail;
    private List<String> permissions;
    private LocalDateTime sharedAt;
    private LocalDateTime lastAccessedAt;
    private boolean isActive;
    
    // Constructors
    public ShareCredentialResponse() {}
    
    public ShareCredentialResponse(UUID shareId, UUID credentialId, String credentialTitle,
                                 String ownerEmail, String recipientEmail, List<String> permissions,
                                 LocalDateTime sharedAt, LocalDateTime lastAccessedAt, boolean isActive) {
        this.shareId = shareId;
        this.credentialId = credentialId;
        this.credentialTitle = credentialTitle;
        this.ownerEmail = ownerEmail;
        this.recipientEmail = recipientEmail;
        this.permissions = permissions;
        this.sharedAt = sharedAt;
        this.lastAccessedAt = lastAccessedAt;
        this.isActive = isActive;
    }
    
    // Getters and setters
    public UUID getShareId() {
        return shareId;
    }
    
    public void setShareId(UUID shareId) {
        this.shareId = shareId;
    }
    
    public UUID getCredentialId() {
        return credentialId;
    }
    
    public void setCredentialId(UUID credentialId) {
        this.credentialId = credentialId;
    }
    
    public String getCredentialTitle() {
        return credentialTitle;
    }
    
    public void setCredentialTitle(String credentialTitle) {
        this.credentialTitle = credentialTitle;
    }
    
    public String getOwnerEmail() {
        return ownerEmail;
    }
    
    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }
    
    public String getRecipientEmail() {
        return recipientEmail;
    }
    
    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }
    
    public List<String> getPermissions() {
        return permissions;
    }
    
    public void setPermissions(List<String> permissions) {
        this.permissions = permissions;
    }
    
    public LocalDateTime getSharedAt() {
        return sharedAt;
    }
    
    public void setSharedAt(LocalDateTime sharedAt) {
        this.sharedAt = sharedAt;
    }
    
    public LocalDateTime getLastAccessedAt() {
        return lastAccessedAt;
    }
    
    public void setLastAccessedAt(LocalDateTime lastAccessedAt) {
        this.lastAccessedAt = lastAccessedAt;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
}