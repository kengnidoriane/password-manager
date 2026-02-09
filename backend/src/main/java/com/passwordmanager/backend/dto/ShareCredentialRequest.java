package com.passwordmanager.backend.dto;

import com.passwordmanager.backend.validation.ValidBase64;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Request DTO for sharing a credential with another user.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to share a credential with another user")
public class ShareCredentialRequest {
    
    @NotNull(message = "Credential ID is required")
    @Schema(description = "ID of the credential to share", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID credentialId;
    
    @NotBlank(message = "Recipient email is required")
    @Email(message = "Recipient email must be valid")
    @Size(max = 255, message = "Recipient email must not exceed 255 characters")
    @Schema(description = "Email address of the recipient", example = "recipient@example.com")
    private String recipientEmail;
    
    @NotNull(message = "Permissions are required")
    @Size(min = 1, max = 10, message = "Must specify between 1 and 10 permissions")
    @Schema(description = "List of permissions granted to the recipient", example = "[\"READ\", \"WRITE\"]")
    private List<String> permissions;
    
    @NotBlank(message = "Encrypted data is required")
    @ValidBase64(message = "Encrypted data must be valid Base64")
    @Size(max = 10000, message = "Encrypted data must not exceed 10000 characters")
    @Schema(description = "Credential data encrypted with recipient's public key")
    private String encryptedData;
    
    @NotBlank(message = "IV is required")
    @ValidBase64(message = "IV must be valid Base64")
    @Size(min = 16, max = 255, message = "IV must be between 16 and 255 characters")
    @Schema(description = "Initialization vector for encryption")
    private String iv;
    
    @NotBlank(message = "Auth tag is required")
    @ValidBase64(message = "Auth tag must be valid Base64")
    @Size(min = 16, max = 255, message = "Auth tag must be between 16 and 255 characters")
    @Schema(description = "Authentication tag for encryption integrity")
    private String authTag;
}
