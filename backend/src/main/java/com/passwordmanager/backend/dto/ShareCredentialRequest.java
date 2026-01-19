package com.passwordmanager.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

/**
 * Request DTO for sharing a credential with another user.
 */
public class ShareCredentialRequest {
    
    @NotNull(message = "Credential ID is required")
    private UUID credentialId;
    
    @NotBlank(message = "Recipient email is required")
    private String recipientEmail;
    
    @NotNull(message = "Permissions are required")
    @Size(min = 1, message = "At least one permission must be specified")
    private List<String> permissions;
    
    @NotBlank(message = "Encrypted data is required")
    private String encryptedData;
    
    @NotBlank(message = "IV is required")
    private String iv;
    
    @NotBlank(message = "Auth tag is required")
    private String authTag;
    
    // Constructors
    public ShareCredentialRequest() {}
    
    public ShareCredentialRequest(UUID credentialId, String recipientEmail, 
                                List<String> permissions, String encryptedData, 
                                String iv, String authTag) {
        this.credentialId = credentialId;
        this.recipientEmail = recipientEmail;
        this.permissions = permissions;
        this.encryptedData = encryptedData;
        this.iv = iv;
        this.authTag = authTag;
    }
    
    // Getters and setters
    public UUID getCredentialId() {
        return credentialId;
    }
    
    public void setCredentialId(UUID credentialId) {
        this.credentialId = credentialId;
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
}