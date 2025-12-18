package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for creating and updating vault credentials.
 * 
 * This DTO contains encrypted credential data that follows the zero-knowledge
 * architecture - the server never has access to unencrypted credential data.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request for creating or updating a vault credential")
public class CredentialRequest {

    /**
     * AES-256-GCM encrypted JSON blob containing the credential data.
     * 
     * The encrypted data structure should contain:
     * {
     *   "title": "Website Name",
     *   "username": "user@example.com",
     *   "password": "encrypted_password",
     *   "url": "https://example.com",
     *   "notes": "Additional notes",
     *   "tags": ["work", "important"]
     * }
     */
    @NotBlank(message = "Encrypted data is required")
    @Size(max = 10000, message = "Encrypted data must not exceed 10000 characters")
    @Schema(
        description = "AES-256-GCM encrypted credential data as base64 string",
        example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        required = true
    )
    private String encryptedData;

    /**
     * Initialization vector for AES-GCM encryption.
     * 
     * A unique IV must be generated for each encryption operation
     * to ensure identical plaintexts produce different ciphertexts.
     */
    @NotBlank(message = "IV is required")
    @Size(min = 16, max = 255, message = "IV must be between 16 and 255 characters")
    @Schema(
        description = "Base64-encoded initialization vector for AES-GCM encryption",
        example = "MTIzNDU2Nzg5MDEyMzQ1Ng==",
        required = true
    )
    private String iv;

    /**
     * Authentication tag for AES-GCM encryption integrity verification.
     * 
     * This tag ensures the encrypted data has not been tampered with
     * and provides authenticated encryption.
     */
    @NotBlank(message = "Authentication tag is required")
    @Size(min = 16, max = 255, message = "Authentication tag must be between 16 and 255 characters")
    @Schema(
        description = "Base64-encoded authentication tag for AES-GCM encryption",
        example = "dGFnMTIzNDU2Nzg5MDEyMzQ1Ng==",
        required = true
    )
    private String authTag;

    /**
     * Optional folder ID for organizing credentials hierarchically.
     * 
     * If null, the credential will be placed at the root level.
     * The folder must exist and belong to the same user.
     */
    @Schema(
        description = "UUID of the folder to place this credential in (optional)",
        example = "123e4567-e89b-12d3-a456-426614174000"
    )
    private UUID folderId;

    /**
     * Version number for optimistic locking and conflict resolution.
     * 
     * Required for update operations to detect concurrent modifications.
     * Should match the current version of the credential being updated.
     */
    @Schema(
        description = "Version number for optimistic locking (required for updates)",
        example = "1"
    )
    private Long version;

    /**
     * Validates that the request contains all required encryption fields.
     * 
     * @return true if all encryption fields are present and valid
     */
    public boolean hasValidEncryption() {
        return encryptedData != null && !encryptedData.trim().isEmpty() &&
               iv != null && !iv.trim().isEmpty() &&
               authTag != null && !authTag.trim().isEmpty();
    }

    /**
     * Checks if this is an update request (has version number).
     * 
     * @return true if version is specified, indicating an update operation
     */
    public boolean isUpdateRequest() {
        return version != null;
    }

    /**
     * Checks if the credential should be placed in a folder.
     * 
     * @return true if folderId is specified
     */
    public boolean hasFolder() {
        return folderId != null;
    }
}