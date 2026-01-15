 package com.passwordmanager.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a secure note in the password manager system.
 * 
 * Secure notes allow users to store encrypted text content and file attachments
 * alongside their credentials. All content is encrypted client-side using AES-256-GCM.
 * 
 * Features:
 * - Rich text content support (stored as encrypted JSON)
 * - File attachments up to 10MB (stored as encrypted blobs)
 * - Hierarchical organization through folder relationships
 * - Full-text search capabilities
 * - Version control for conflict resolution
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
@Entity
@Table(name = "secure_notes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecureNote {

    /**
     * Maximum allowed size for file attachments (10MB).
     */
    public static final long MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    /**
     * Unique identifier for the secure note.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Reference to the user who owns this secure note.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private UserAccount user;

    /**
     * Display title of the secure note.
     * 
     * Stored unencrypted to allow for efficient listing and search
     * without requiring decryption of the full content.
     */
    @Column(nullable = false, length = 255)
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    /**
     * AES-256-GCM encrypted content of the secure note.
     * 
     * Contains rich text content stored as encrypted JSON, including:
     * - Formatted text content
     * - Embedded images (as base64)
     * - Metadata about formatting
     * 
     * The content is encrypted client-side and the server never has access
     * to the unencrypted text.
     */
    @Column(name = "encrypted_content", nullable = false, columnDefinition = "TEXT")
    @NotBlank(message = "Encrypted content is required")
    private String encryptedContent;

    /**
     * Initialization vector for content encryption.
     */
    @Column(name = "content_iv", nullable = false, length = 255)
    @NotBlank(message = "Content IV is required")
    private String contentIv;

    /**
     * Authentication tag for content encryption integrity verification.
     */
    @Column(name = "content_auth_tag", nullable = false, length = 255)
    @NotBlank(message = "Content authentication tag is required")
    private String contentAuthTag;

    /**
     * AES-256-GCM encrypted file attachments.
     * 
     * Contains encrypted binary data of attached files stored as base64.
     * Multiple files are stored as a JSON array of attachment objects,
     * each containing filename, content type, size, and encrypted data.
     * 
     * Null if no attachments are present.
     */
    @Column(name = "encrypted_attachments", columnDefinition = "TEXT")
    private String encryptedAttachments;

    /**
     * Initialization vector for attachments encryption.
     */
    @Column(name = "attachments_iv", length = 255)
    private String attachmentsIv;

    /**
     * Authentication tag for attachments encryption integrity verification.
     */
    @Column(name = "attachments_auth_tag", length = 255)
    private String attachmentsAuthTag;

    /**
     * Total size of all attachments in bytes.
     * 
     * Used for quota enforcement and display purposes.
     * Stored unencrypted for efficient size checking.
     */
    @Column(name = "attachments_size")
    @Builder.Default
    private Long attachmentsSize = 0L;

    /**
     * Number of file attachments.
     * 
     * Stored unencrypted for efficient display and validation.
     */
    @Column(name = "attachment_count")
    @Builder.Default
    private Integer attachmentCount = 0;

    /**
     * Reference to the parent folder for hierarchical organization.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private Folder folder;

    /**
     * Version number for optimistic locking and conflict resolution.
     */
    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 1L;

    /**
     * Timestamp when the note was created.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the note was last updated.
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Soft delete timestamp.
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * Timestamp of the last access/view of this note.
     */
    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt;

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
     * Soft deletes this note.
     */
    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    /**
     * Restores this note from trash.
     */
    public void restore() {
        this.deletedAt = null;
    }

    /**
     * Updates the last accessed timestamp to the current time.
     */
    public void updateLastAccessed() {
        this.lastAccessedAt = LocalDateTime.now();
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
     * Checks if adding an attachment of the given size would exceed the limit.
     * 
     * @param additionalSize the size of the attachment to add
     * @return true if the size limit would be exceeded, false otherwise
     */
    public boolean wouldExceedSizeLimit(long additionalSize) {
        long currentSize = attachmentsSize != null ? attachmentsSize : 0L;
        return (currentSize + additionalSize) > MAX_ATTACHMENT_SIZE;
    }

    /**
     * Gets the remaining attachment space in bytes.
     * 
     * @return the number of bytes available for additional attachments
     */
    public long getRemainingAttachmentSpace() {
        long currentSize = attachmentsSize != null ? attachmentsSize : 0L;
        return Math.max(0, MAX_ATTACHMENT_SIZE - currentSize);
    }

    /**
     * Gets the attachment size as a percentage of the maximum allowed.
     * 
     * @return percentage (0-100) of attachment space used
     */
    public double getAttachmentSizePercentage() {
        if (attachmentsSize == null || attachmentsSize == 0) {
            return 0.0;
        }
        
        return (double) attachmentsSize / MAX_ATTACHMENT_SIZE * 100.0;
    }

    /**
     * Updates attachment metadata when attachments are modified.
     * 
     * @param newCount the new number of attachments
     * @param newSize the new total size of attachments
     */
    public void updateAttachmentMetadata(int newCount, long newSize) {
        this.attachmentCount = newCount;
        this.attachmentsSize = newSize;
    }

    /**
     * Clears all attachment data and metadata.
     */
    public void clearAttachments() {
        this.encryptedAttachments = null;
        this.attachmentsIv = null;
        this.attachmentsAuthTag = null;
        this.attachmentCount = 0;
        this.attachmentsSize = 0L;
    }

    /**
     * Gets the user ID for this secure note.
     * 
     * @return the UUID of the owning user
     */
    public UUID getUserId() {
        return user != null ? user.getId() : null;
    }

    /**
     * Gets the folder ID for this secure note.
     * 
     * @return the UUID of the parent folder, or null if root level
     */
    public UUID getFolderId() {
        return folder != null ? folder.getId() : null;
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
     * Gets a human-readable description of the attachment count and size.
     * 
     * @return formatted string describing attachments (e.g., "3 files, 2.5 MB")
     */
    public String getAttachmentSummary() {
        if (!hasAttachments()) {
            return "No attachments";
        }
        
        String fileText = attachmentCount == 1 ? "file" : "files";
        double sizeMB = attachmentsSize / (1024.0 * 1024.0);
        
        if (sizeMB < 0.1) {
            return String.format("%d %s, < 0.1 MB", attachmentCount, fileText);
        } else {
            return String.format("%d %s, %.1f MB", attachmentCount, fileText, sizeMB);
        }
    }

    /**
     * Checks if this note matches a search query.
     * 
     * Performs case-insensitive matching against the title.
     * Note: Content search requires decryption and should be handled at the service layer.
     * 
     * @param query the search query
     * @return true if the note title matches the query, false otherwise
     */
    public boolean matchesQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            return true;
        }
        
        String lowerQuery = query.trim().toLowerCase();
        String lowerTitle = title != null ? title.toLowerCase() : "";
        
        return lowerTitle.contains(lowerQuery);
    }

    /**
     * Increments the version number for this secure note.
     * 
     * This method is used during account recovery to force client-side
     * re-encryption of secure notes with the new master password.
     */
    public void incrementVersion() {
        if (this.version == null) {
            this.version = 1L;
        } else {
            this.version++;
        }
    }
}