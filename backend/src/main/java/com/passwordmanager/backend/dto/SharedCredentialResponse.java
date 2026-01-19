package com.passwordmanager.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for accessing shared credentials.
 */
public class SharedCredentialResponse {
    
    private UUID shareId;
    private UUID credentialId;
    private String credentialTitle;
    private String ownerEmail;
    private List<String> permissions;
    private String encryptedData;
    private String iv;
    private String authTag;
    private LocalDateTime sharedAt;
    private LocalDateTime lastAccessedAt;
    private boolean canRead;
    private boolean canWrite;
    
    // Constructors
    public SharedCredentialResponse() {}
    
    public SharedCredentialResponse(UUID shareId, UUID credentialId, String credentialTitle,
                                  String ownerEmail, List<String> permissions, String encryptedData,
                                  String iv, String authTag, LocalDateTime sharedAt, 
                                  LocalDateTime lastAccessedAt, boolean canRead, boolean canWrite) {
        this.shareId = shareId;
        this.credentialId = credentialId;
        this.credentialTitle = credentialTitle;
        this.ownerEmail = ownerEmail;
        this.permissions = permissions;
        this.encryptedData = encryptedData;
        this.iv = iv;
        this.authTag = authTag;
        this.sharedAt = sharedAt;
        this.lastAccessedAt = lastAccessedAt;
        this.canRead = canRead;
        this.canWrite = canWrite;
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
    
    public List<String> getPermissions() {
        return permissions;
    }
    
    public void setPermissions(List<String> permissions) {
        this.permissions = permissions;
    }
    
    public String getEncryptedData() {
        return encryptedData;
    }
    
    public void setEncryptedData(String encryptedData) {
        this.encryptedData = encryptedData;
    }
    
    public String getIv() {
        return iv;
    }
    
    public void setIv(String iv) {
        this.iv = iv;
    }
    
    public String getAuthTag() {
        return authTag;
    }
    
    public void setAuthTag(String authTag) {
        this.authTag = authTag;
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
    
    public boolean isCanRead() {
        return canRead;
    }
    
    public void setCanRead(boolean canRead) {
        this.canRead = canRead;
    }
    
    public boolean isCanWrite() {
        return canWrite;
    }
    
    public void setCanWrite(boolean canWrite) {
        this.canWrite = canWrite;
    }
}