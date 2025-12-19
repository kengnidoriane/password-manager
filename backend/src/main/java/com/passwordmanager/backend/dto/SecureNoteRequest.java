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
 * Request DTO for creating or updating secure notes.
 * 
 * Contains encrypted note content and metadata for secure note operations.
 * All sensitive content is encrypted client-side using AES-256-GCM before
 * being sent to the server.
 * 
 * Requirements: 10.1, 10.2, 10.3
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request for creating or updating a secure note")
public class SecureNoteRequest {

    /**
     * Display title of the secure note.
     * 
     * Stored unencrypted to allow for efficient listing and search
     * without requiring decryption of the full content.
     */
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    @Schema(description = "Display title of the secure note", example = "Meeting Notes", maxLength = 255)
    private String title;

    /**
     * AES-256-GCM encrypted content of the secure note.
     * 
     * Contains rich text content stored as encrypted JSON, including:
     * - Formatted text content
     * - Embedded images (as base64)
     * - Metadata about formatting
     */
    @NotBlank(message = "Encrypted content is required")
    @Schema(description = "AES-256-GCM encrypted note content", example = "eyJjb250ZW50IjoiVGhpcyBpcyBhIHNlY3VyZSBub3RlIn0=")
    private String encryptedContent;

    /**
     * Initialization vector for content encryption.
     */
    @NotBlank(message = "Content IV is required")
    @Schema(description = "Initialization vector for content encryption", example = "MTIzNDU2Nzg5MDEyMzQ1Ng==")
    private String contentIv;

    /**
     * Authentication tag for content encryption integrity verification.
     */
    @NotBlank(message = "Content authentication tag is required")
    @Schema(description = "Authentication tag for content encryption", example = "YWJjZGVmZ2hpams=")
    private String contentAuthTag;

    /**
     * AES-256-GCM encrypted file attachments.
     * 
     * Contains encrypted binary data of attached files stored as base64.
     * Multiple files are stored as a JSON array of attachment objects,
     * each containing filename, content type, size, and encrypted data.
     * 
     * Optional field - null if no attachments are present.
     */
    @Schema(description = "AES-256-GCM encrypted file attachments (optional)", example = "eyJhdHRhY2htZW50cyI6W119")
    private String encryptedAttachments;

    /**
     * Initialization vector for attachments encryption.
     * 
     * Required if encryptedAttachments is provided.
     */
    @Schema(description = "Initialization vector for attachments encryption", example = "MTIzNDU2Nzg5MDEyMzQ1Ng==")
    private String attachmentsIv;

    /**
     * Authentication tag for attachments encryption integrity verification.
     * 
     * Required if encryptedAttachments is provided.
     */
    @Schema(description = "Authentication tag for attachments encryption", example = "YWJjZGVmZ2hpams=")
    private String attachmentsAuthTag;

    /**
     * Total size of all attachments in bytes.
     * 
     * Used for quota enforcement and display purposes.
     * Required if encryptedAttachments is provided.
     */
    @Schema(description = "Total size of all attachments in bytes", example = "1048576")
    private Long attachmentsSize;

    /**
     * Number of file attachments.
     * 
     * Required if encryptedAttachments is provided.
     */
    @Schema(description = "Number of file attachments", example = "3")
    private Integer attachmentCount;

    /**
     * ID of the parent folder for hierarchical organization.
     * 
     * Optional - null for root level notes.
     */
    @Schema(description = "ID of the parent folder (optional)", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID folderId;

    /**
     * Version number for optimistic locking and conflict resolution.
     * 
     * Required for update operations to prevent conflicts.
     */
    @Schema(description = "Version number for conflict resolution (required for updates)", example = "1")
    private Long version;

    /**
     * Validates that attachment-related fields are consistent.
     * 
     * If attachments are provided, all related fields must be present.
     * If no attachments, all related fields should be null or zero.
     * 
     * @return true if attachment fields are consistent, false otherwise
     */
    public boolean hasValidAttachmentFields() {
        boolean hasAttachments = encryptedAttachments != null && !encryptedAttachments.trim().isEmpty();
        
        if (hasAttachments) {
            // If attachments are provided, all related fields must be present
            return attachmentsIv != null && !attachmentsIv.trim().isEmpty() &&
                   attachmentsAuthTag != null && !attachmentsAuthTag.trim().isEmpty() &&
                   attachmentsSize != null && attachmentsSize > 0 &&
                   attachmentCount != null && attachmentCount > 0;
        } else {
            // If no attachments, related fields should be null or empty
            return (attachmentsIv == null || attachmentsIv.trim().isEmpty()) &&
                   (attachmentsAuthTag == null || attachmentsAuthTag.trim().isEmpty()) &&
                   (attachmentsSize == null || attachmentsSize == 0) &&
                   (attachmentCount == null || attachmentCount == 0);
        }
    }

    /**
     * Checks if this request includes file attachments.
     * 
     * @return true if attachments are included, false otherwise
     */
    public boolean hasAttachments() {
        return encryptedAttachments != null && !encryptedAttachments.trim().isEmpty() &&
               attachmentCount != null && attachmentCount > 0;
    }

    /**
     * Gets the attachment size or returns 0 if no attachments.
     * 
     * @return attachment size in bytes
     */
    public long getAttachmentsSizeOrZero() {
        return attachmentsSize != null ? attachmentsSize : 0L;
    }

    /**
     * Gets the attachment count or returns 0 if no attachments.
     * 
     * @return number of attachments
     */
    public int getAttachmentCountOrZero() {
        return attachmentCount != null ? attachmentCount : 0;
    }

    /**
     * Validates that the attachment size doesn't exceed the maximum allowed.
     * 
     * @param maxSize maximum allowed size in bytes
     * @return true if within limits, false otherwise
     */
    public boolean isAttachmentSizeValid(long maxSize) {
        return getAttachmentsSizeOrZero() <= maxSize;
    }

    /**
     * Clears all attachment-related fields.
     * 
     * Used when removing attachments from a note.
     */
    public void clearAttachments() {
        this.encryptedAttachments = null;
        this.attachmentsIv = null;
        this.attachmentsAuthTag = null;
        this.attachmentsSize = null;
        this.attachmentCount = null;
    }

    /**
     * Sets attachment metadata.
     * 
     * @param count number of attachments
     * @param size total size in bytes
     */
    public void setAttachmentMetadata(int count, long size) {
        this.attachmentCount = count;
        this.attachmentsSize = size;
    }
}