package com.passwordmanager.backend.dto;

import com.passwordmanager.backend.entity.VaultEntry;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for vault credential operations.
 * 
 * Contains encrypted credential data and metadata following the zero-knowledge
 * architecture where the server never has access to unencrypted data.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Response containing vault credential data and metadata")
public class CredentialResponse {

    /**
     * Unique identifier for the credential.
     */
    @Schema(
        description = "Unique identifier for the credential",
        example = "123e4567-e89b-12d3-a456-426614174000"
    )
    private UUID id;

    /**
     * AES-256-GCM encrypted credential data.
     * 
     * Contains the encrypted JSON blob with credential information
     * that can only be decrypted client-side with the user's master key.
     */
    @Schema(
        description = "AES-256-GCM encrypted credential data as base64 string",
        example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    )
    private String encryptedData;

    /**
     * Initialization vector for AES-GCM decryption.
     */
    @Schema(
        description = "Base64-encoded initialization vector for AES-GCM decryption",
        example = "MTIzNDU2Nzg5MDEyMzQ1Ng=="
    )
    private String iv;

    /**
     * Authentication tag for AES-GCM integrity verification.
     */
    @Schema(
        description = "Base64-encoded authentication tag for AES-GCM decryption",
        example = "dGFnMTIzNDU2Nzg5MDEyMzQ1Ng=="
    )
    private String authTag;

    /**
     * ID of the folder containing this credential (null for root level).
     */
    @Schema(
        description = "UUID of the folder containing this credential",
        example = "123e4567-e89b-12d3-a456-426614174000"
    )
    private UUID folderId;

    /**
     * Version number for optimistic locking and conflict resolution.
     */
    @Schema(
        description = "Version number for optimistic locking",
        example = "1"
    )
    private Long version;

    /**
     * Timestamp when the credential was created.
     */
    @Schema(
        description = "Timestamp when the credential was created",
        example = "2023-12-01T10:30:00"
    )
    private LocalDateTime createdAt;

    /**
     * Timestamp when the credential was last updated.
     */
    @Schema(
        description = "Timestamp when the credential was last updated",
        example = "2023-12-01T15:45:00"
    )
    private LocalDateTime updatedAt;

    /**
     * Timestamp when the credential was last used (copied to clipboard).
     */
    @Schema(
        description = "Timestamp when the credential was last used",
        example = "2023-12-01T14:20:00"
    )
    private LocalDateTime lastUsedAt;

    /**
     * Timestamp when the credential was deleted (null if not deleted).
     */
    @Schema(
        description = "Timestamp when the credential was deleted (null if active)",
        example = "2023-12-01T16:00:00"
    )
    private LocalDateTime deletedAt;

    /**
     * Indicates whether the credential is currently deleted (in trash).
     */
    @Schema(
        description = "Whether the credential is currently deleted",
        example = "false"
    )
    private boolean deleted;

    /**
     * Creates a CredentialResponse from a VaultEntry entity.
     * 
     * @param vaultEntry the vault entry entity
     * @return credential response DTO
     */
    public static CredentialResponse fromEntity(VaultEntry vaultEntry) {
        if (vaultEntry == null) {
            return null;
        }

        return CredentialResponse.builder()
                .id(vaultEntry.getId())
                .encryptedData(vaultEntry.getEncryptedData())
                .iv(vaultEntry.getIv())
                .authTag(vaultEntry.getAuthTag())
                .folderId(vaultEntry.getFolderId())
                .version(vaultEntry.getVersion())
                .createdAt(vaultEntry.getCreatedAt())
                .updatedAt(vaultEntry.getUpdatedAt())
                .lastUsedAt(vaultEntry.getLastUsedAt())
                .deletedAt(vaultEntry.getDeletedAt())
                .deleted(vaultEntry.isDeleted())
                .build();
    }

    /**
     * Checks if this credential is active (not deleted).
     * 
     * @return true if the credential is not deleted
     */
    public boolean isActive() {
        return !deleted;
    }

    /**
     * Checks if this credential is in a folder.
     * 
     * @return true if folderId is not null
     */
    public boolean isInFolder() {
        return folderId != null;
    }

    /**
     * Checks if this credential has been used recently (within last 30 days).
     * 
     * @return true if used within the last 30 days
     */
    public boolean isRecentlyUsed() {
        if (lastUsedAt == null) {
            return false;
        }
        return lastUsedAt.isAfter(LocalDateTime.now().minusDays(30));
    }

    /**
     * Gets the age of the credential in days since creation.
     * 
     * @return number of days since creation
     */
    public long getAgeInDays() {
        if (createdAt == null) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(createdAt, LocalDateTime.now());
    }

    /**
     * Gets the number of days since last update.
     * 
     * @return number of days since last update
     */
    public long getDaysSinceUpdate() {
        if (updatedAt == null) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(updatedAt, LocalDateTime.now());
    }
}