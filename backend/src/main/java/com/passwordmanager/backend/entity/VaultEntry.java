package com.passwordmanager.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a vault entry in the password manager system.
 * 
 * This entity stores encrypted vault data including credentials, secure notes, folders, and tags.
 * All sensitive data is encrypted client-side using AES-256-GCM before being stored.
 * 
 * The entity supports:
 * - Zero-knowledge architecture (server never sees unencrypted data)
 * - Soft delete functionality (30-day trash retention)
 * - Version control for conflict resolution during sync
 * - Hierarchical organization through folder relationships
 * 
 * Requirements: 3.1, 3.2, 3.4, 7.1, 10.1
 */
@Entity
@Table(name = "vault_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaultEntry {

    /**
     * Types of vault entries supported by the system.
     */
    public enum EntryType {
        CREDENTIAL,    // Login credentials (username/password)
        SECURE_NOTE,   // Encrypted text notes
        FOLDER,        // Organizational folders
        TAG           // Tags for categorization
    }

    /**
     * Unique identifier for the vault entry.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Reference to the user who owns this vault entry.
     * 
     * All vault entries are owned by a specific user and cannot be accessed
     * by other users (except through explicit sharing mechanisms).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private UserAccount user;

    /**
     * AES-256-GCM encrypted JSON blob containing the actual vault data.
     * 
     * The structure of the encrypted data depends on the entry type:
     * - CREDENTIAL: {title, username, password, url, notes, tags}
     * - SECURE_NOTE: {title, content, attachments}
     * - FOLDER: {name, description}
     * - TAG: {name, color}
     * 
     * This data is encrypted client-side and the server never has access
     * to the unencrypted content.
     */
    @Column(name = "encrypted_data", nullable = false, columnDefinition = "TEXT")
    @NotBlank(message = "Encrypted data is required")
    private String encryptedData;

    /**
     * Initialization vector for AES-GCM encryption.
     * 
     * A unique IV is generated for each encryption operation to ensure
     * that identical plaintexts produce different ciphertexts.
     */
    @Column(nullable = false, length = 255)
    @NotBlank(message = "IV is required")
    private String iv;

    /**
     * Authentication tag for AES-GCM encryption integrity verification.
     * 
     * This tag ensures that the encrypted data has not been tampered with
     * and provides authenticated encryption.
     */
    @Column(name = "auth_tag", nullable = false, length = 255)
    @NotBlank(message = "Authentication tag is required")
    private String authTag;

    /**
     * Type of vault entry (credential, secure note, folder, or tag).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 50)
    @NotNull(message = "Entry type is required")
    @Builder.Default
    private EntryType entryType = EntryType.CREDENTIAL;

    /**
     * Reference to the parent folder for hierarchical organization.
     * 
     * Null for root-level entries. Supports up to 5 levels of nesting
     * as per requirement 7.1.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private Folder folder;

    /**
     * Version number for optimistic locking and conflict resolution.
     * 
     * This field is automatically incremented by JPA on each update
     * and is used to detect conflicts during synchronization between devices.
     */
    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 1L;

    /**
     * Timestamp when the entry was created.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the entry was last updated.
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Soft delete timestamp.
     * 
     * When an entry is deleted, this field is set to the current timestamp
     * instead of physically removing the record. The entry remains in the
     * trash for 30 days before permanent deletion.
     * 
     * Null indicates the entry is not deleted.
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * Timestamp of the last access/use of this entry.
     * 
     * Updated when credentials are copied to clipboard or when secure notes
     * are viewed. Used for sorting by recent use and analytics.
     */
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    /**
     * Checks if this entry is currently deleted (in trash).
     * 
     * @return true if the entry is soft-deleted, false otherwise
     */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * Checks if this entry is active (not deleted).
     * 
     * @return true if the entry is not deleted, false otherwise
     */
    public boolean isActive() {
        return deletedAt == null;
    }

    /**
     * Soft deletes this entry by setting the deleted timestamp.
     * 
     * The entry will be moved to trash and can be restored within 30 days.
     */
    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    /**
     * Restores this entry from trash by clearing the deleted timestamp.
     */
    public void restore() {
        this.deletedAt = null;
    }

    /**
     * Updates the last used timestamp to the current time.
     * 
     * Should be called when the entry is accessed (e.g., password copied).
     */
    public void updateLastUsed() {
        this.lastUsedAt = LocalDateTime.now();
    }

    /**
     * Checks if this entry is a folder.
     * 
     * @return true if the entry type is FOLDER
     */
    public boolean isFolder() {
        return EntryType.FOLDER.equals(entryType);
    }

    /**
     * Checks if this entry is a credential.
     * 
     * @return true if the entry type is CREDENTIAL
     */
    public boolean isCredential() {
        return EntryType.CREDENTIAL.equals(entryType);
    }

    /**
     * Checks if this entry is a secure note.
     * 
     * @return true if the entry type is SECURE_NOTE
     */
    public boolean isSecureNote() {
        return EntryType.SECURE_NOTE.equals(entryType);
    }

    /**
     * Checks if this entry is a tag.
     * 
     * @return true if the entry type is TAG
     */
    public boolean isTag() {
        return EntryType.TAG.equals(entryType);
    }

    /**
     * Checks if this entry can have child entries (i.e., is a folder).
     * 
     * @return true if this entry can contain other entries
     */
    public boolean canHaveChildren() {
        return isFolder();
    }

    /**
     * Gets the user ID for this vault entry.
     * 
     * @return the UUID of the owning user
     */
    public UUID getUserId() {
        return user != null ? user.getId() : null;
    }

    /**
     * Gets the folder ID for this vault entry.
     * 
     * @return the UUID of the parent folder, or null if root level
     */
    public UUID getFolderId() {
        return folder != null ? folder.getId() : null;
    }

    /**
     * Checks if this entry has a specific tag.
     * 
     * This is a simplified implementation that checks if the tag ID
     * appears in the encrypted data. In a production system, you would
     * want to store tag associations in a separate join table.
     * 
     * @param tagId the tag ID to check
     * @return true if the entry has the tag, false otherwise
     */
    public boolean hasTag(UUID tagId) {
        if (encryptedData == null || tagId == null) {
            return false;
        }
        
        // This is a simplified check - in production, use a proper join table
        String tagIdString = tagId.toString();
        return encryptedData.contains(tagIdString);
    }

    /**
     * Increments the version number for this vault entry.
     * 
     * This method is used during account recovery to force client-side
     * re-encryption of vault entries with the new master password.
     */
    public void incrementVersion() {
        if (this.version == null) {
            this.version = 1L;
        } else {
            this.version++;
        }
    }
}