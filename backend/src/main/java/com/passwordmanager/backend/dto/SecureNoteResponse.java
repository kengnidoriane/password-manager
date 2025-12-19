package com.passwordmanager.backend.dto;

import com.passwordmanager.backend.entity.SecureNote;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for secure note operations.
 * 
 * Contains encrypted note content and metadata returned from secure note operations.
 * The server returns encrypted data that can only be decrypted client-side
 * with the user's master key.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Response containing secure note data and metadata")
public class SecureNoteResponse {

    /**
     * Unique identifier for the secure note.
     */
    @Schema(description = "Unique identifier for the secure note", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;

    /**
     * Display title of the secure note.
     */
    @Schema(description = "Display title of the secure note", example = "Meeting Notes")
    private String title;

    /**
     * AES-256-GCM encrypted content of the secure note.
     */
    @Schema(description = "AES-256-GCM encrypted note content", example = "eyJjb250ZW50IjoiVGhpcyBpcyBhIHNlY3VyZSBub3RlIn0=")
    private String encryptedContent;

    /**
     * Initialization vector for content encryption.
     */
    @Schema(description = "Initialization vector for content encryption", example = "MTIzNDU2Nzg5MDEyMzQ1Ng==")
    private String contentIv;

    /**
     * Authentication tag for content encryption integrity verification.
     */
    @Schema(description = "Authentication tag for content encryption", example = "YWJjZGVmZ2hpams=")
    private String contentAuthTag;

    /**
     * AES-256-GCM encrypted file attachments.
     */
    @Schema(description = "AES-256-GCM encrypted file attachments (optional)", example = "eyJhdHRhY2htZW50cyI6W119")
    private String encryptedAttachments;

    /**
     * Initialization vector for attachments encryption.
     */
    @Schema(description = "Initialization vector for attachments encryption", example = "MTIzNDU2Nzg5MDEyMzQ1Ng==")
    private String attachmentsIv;

    /**
     * Authentication tag for attachments encryption integrity verification.
     */
    @Schema(description = "Authentication tag for attachments encryption", example = "YWJjZGVmZ2hpams=")
    private String attachmentsAuthTag;

    /**
     * Total size of all attachments in bytes.
     */
    @Schema(description = "Total size of all attachments in bytes", example = "1048576")
    private Long attachmentsSize;

    /**
     * Number of file attachments.
     */
    @Schema(description = "Number of file attachments", example = "3")
    private Integer attachmentCount;

    /**
     * ID of the parent folder for hierarchical organization.
     */
    @Schema(description = "ID of the parent folder (null for root level)", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID folderId;

    /**
     * Version number for optimistic locking and conflict resolution.
     */
    @Schema(description = "Version number for conflict resolution", example = "1")
    private Long version;

    /**
     * Timestamp when the note was created.
     */
    @Schema(description = "Timestamp when the note was created", example = "2023-12-01T10:30:00")
    private LocalDateTime createdAt;

    /**
     * Timestamp when the note was last updated.
     */
    @Schema(description = "Timestamp when the note was last updated", example = "2023-12-01T15:45:00")
    private LocalDateTime updatedAt;

    /**
     * Timestamp of the last access/view of this note.
     */
    @Schema(description = "Timestamp of the last access/view of this note", example = "2023-12-01T16:20:00")
    private LocalDateTime lastAccessedAt;

    /**
     * Soft delete timestamp (null if not deleted).
     */
    @Schema(description = "Soft delete timestamp (null if not deleted)", example = "2023-12-01T17:00:00")
    private LocalDateTime deletedAt;

    /**
     * Creates a SecureNoteResponse from a SecureNote entity.
     * 
     * @param entity the SecureNote entity
     * @return the response DTO
     */
    public static SecureNoteResponse fromEntity(SecureNote entity) {
        if (entity == null) {
            return null;
        }

        return SecureNoteResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .encryptedContent(entity.getEncryptedContent())
                .contentIv(entity.getContentIv())
                .contentAuthTag(entity.getContentAuthTag())
                .encryptedAttachments(entity.getEncryptedAttachments())
                .attachmentsIv(entity.getAttachmentsIv())
                .attachmentsAuthTag(entity.getAttachmentsAuthTag())
                .attachmentsSize(entity.getAttachmentsSize())
                .attachmentCount(entity.getAttachmentCount())
                .folderId(entity.getFolderId())
                .version(entity.getVersion())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .lastAccessedAt(entity.getLastAccessedAt())
                .deletedAt(entity.getDeletedAt())
                .build();
    }

    /**
     * Checks if this note is currently deleted.
     * 
     * @return true if the note is soft-deleted, false otherwise
     */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * Checks if this note is active (not deleted).
     * 
     * @return true if the note is not deleted, false otherwise
     */
    public boolean isActive() {
        return deletedAt == null;
    }

    /**
     * Checks if this note has file attachments.
     * 
     * @return true if the note has attachments, false otherwise
     */
    public boolean hasAttachments() {
        return attachmentCount != null && attachmentCount > 0;
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
     * Gets a human-readable description of the attachment count and size.
     * 
     * @return formatted string describing attachments (e.g., "3 files, 2.5 MB")
     */
    public String getAttachmentSummary() {
        if (!hasAttachments()) {
            return "No attachments";
        }
        
        String fileText = attachmentCount == 1 ? "file" : "files";
        double sizeMB = getAttachmentsSizeOrZero() / (1024.0 * 1024.0);
        
        if (sizeMB < 0.1) {
            return String.format("%d %s, < 0.1 MB", attachmentCount, fileText);
        } else {
            return String.format("%d %s, %.1f MB", attachmentCount, fileText, sizeMB);
        }
    }

    /**
     * Creates a preview of the note title for display purposes.
     * 
     * Truncates long titles and adds ellipsis if necessary.
     * 
     * @param maxLength the maximum length for the preview
     * @return truncated title with ellipsis if needed
     */
    public String getTitlePreview(int maxLength) {
        if (title == null) {
            return "";
        }
        
        if (title.length() <= maxLength) {
            return title;
        }
        
        return title.substring(0, maxLength - 3) + "...";
    }

    /**
     * Gets the attachment size as a percentage of the maximum allowed.
     * 
     * @param maxSize maximum allowed attachment size
     * @return percentage (0-100) of attachment space used
     */
    public double getAttachmentSizePercentage(long maxSize) {
        if (!hasAttachments() || maxSize <= 0) {
            return 0.0;
        }
        
        return (double) getAttachmentsSizeOrZero() / maxSize * 100.0;
    }

    /**
     * Checks if this note was recently accessed (within the last hour).
     * 
     * @return true if accessed within the last hour, false otherwise
     */
    public boolean isRecentlyAccessed() {
        if (lastAccessedAt == null) {
            return false;
        }
        
        return lastAccessedAt.isAfter(LocalDateTime.now().minusHours(1));
    }

    /**
     * Checks if this note was recently created (within the last 24 hours).
     * 
     * @return true if created within the last 24 hours, false otherwise
     */
    public boolean isRecentlyCreated() {
        if (createdAt == null) {
            return false;
        }
        
        return createdAt.isAfter(LocalDateTime.now().minusDays(1));
    }

    /**
     * Checks if this note was recently updated (within the last 24 hours).
     * 
     * @return true if updated within the last 24 hours, false otherwise
     */
    public boolean isRecentlyUpdated() {
        if (updatedAt == null) {
            return false;
        }
        
        return updatedAt.isAfter(LocalDateTime.now().minusDays(1));
    }
}