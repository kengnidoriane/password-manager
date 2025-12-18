package com.passwordmanager.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entity representing a folder for organizing vault entries.
 * 
 * Folders provide hierarchical organization of credentials and secure notes.
 * They support nesting up to 5 levels deep as per requirement 7.1.
 * 
 * Unlike other vault entries, folder metadata (name, description) is not encrypted
 * to allow for efficient folder tree navigation and display.
 * 
 * Requirements: 7.1, 7.3, 7.4
 */
@Entity
@Table(name = "folders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"children", "vaultEntries"}) // Prevent circular references in toString
public class Folder {

    /**
     * Maximum allowed nesting depth for folders.
     */
    public static final int MAX_NESTING_DEPTH = 5;

    /**
     * Unique identifier for the folder.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Reference to the user who owns this folder.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private UserAccount user;

    /**
     * Display name of the folder.
     * 
     * This is stored unencrypted to allow for efficient folder tree display
     * and navigation without requiring decryption.
     */
    @Column(nullable = false, length = 255)
    @NotBlank(message = "Folder name is required")
    @Size(max = 255, message = "Folder name must not exceed 255 characters")
    private String name;

    /**
     * Optional description of the folder's purpose.
     */
    @Column(length = 1000)
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    /**
     * Reference to the parent folder for hierarchical organization.
     * 
     * Null for root-level folders.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Folder parent;

    /**
     * Child folders nested under this folder.
     */
    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Folder> children = new ArrayList<>();

    /**
     * Vault entries (credentials, secure notes) contained in this folder.
     */
    @OneToMany(mappedBy = "folder", fetch = FetchType.LAZY)
    @Builder.Default
    private List<VaultEntry> vaultEntries = new ArrayList<>();

    /**
     * Display order within the parent folder.
     * 
     * Lower values appear first. Allows users to customize folder ordering.
     */
    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    /**
     * Timestamp when the folder was created.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the folder was last updated.
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Soft delete timestamp.
     * 
     * When a folder is deleted, this field is set to the current timestamp.
     * Deleting a folder also soft-deletes all contained entries and subfolders.
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * Calculates the nesting depth of this folder.
     * 
     * Root folders have depth 0, their children have depth 1, etc.
     * 
     * @return the nesting depth (0 for root folders)
     */
    public int getDepth() {
        int depth = 0;
        Folder current = this.parent;
        while (current != null) {
            depth++;
            current = current.getParent();
        }
        return depth;
    }

    /**
     * Checks if this folder can accept a new child folder.
     * 
     * Validates against the maximum nesting depth limit.
     * 
     * @return true if a child folder can be added, false otherwise
     */
    public boolean canAddChildFolder() {
        return getDepth() < MAX_NESTING_DEPTH - 1;
    }

    /**
     * Checks if this folder is a root folder (has no parent).
     * 
     * @return true if this is a root folder, false otherwise
     */
    public boolean isRoot() {
        return parent == null;
    }

    /**
     * Checks if this folder is currently deleted.
     * 
     * @return true if the folder is soft-deleted, false otherwise
     */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * Checks if this folder is active (not deleted).
     * 
     * @return true if the folder is not deleted, false otherwise
     */
    public boolean isActive() {
        return deletedAt == null;
    }

    /**
     * Soft deletes this folder and all its contents.
     * 
     * This recursively soft-deletes all child folders and vault entries.
     */
    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
        
        // Soft delete all child folders
        for (Folder child : children) {
            if (child.isActive()) {
                child.softDelete();
            }
        }
        
        // Soft delete all vault entries in this folder
        for (VaultEntry entry : vaultEntries) {
            if (entry.isActive()) {
                entry.softDelete();
            }
        }
    }

    /**
     * Restores this folder from trash.
     * 
     * Note: This does not automatically restore child folders or entries.
     * They must be restored individually if desired.
     */
    public void restore() {
        this.deletedAt = null;
    }

    /**
     * Gets the full path of this folder from root.
     * 
     * @return the full folder path (e.g., "Work/Projects/Client A")
     */
    public String getFullPath() {
        if (isRoot()) {
            return name;
        }
        
        List<String> pathComponents = new ArrayList<>();
        Folder current = this;
        
        while (current != null) {
            pathComponents.add(0, current.getName());
            current = current.getParent();
        }
        
        return String.join("/", pathComponents);
    }

    /**
     * Gets the number of active (non-deleted) child folders.
     * 
     * @return count of active child folders
     */
    public long getActiveChildCount() {
        return children.stream()
                .filter(Folder::isActive)
                .count();
    }

    /**
     * Gets the number of active (non-deleted) vault entries in this folder.
     * 
     * @return count of active vault entries
     */
    public long getActiveEntryCount() {
        return vaultEntries.stream()
                .filter(VaultEntry::isActive)
                .count();
    }

    /**
     * Gets the total number of active items (folders + entries) in this folder.
     * 
     * @return total count of active items
     */
    public long getTotalActiveItemCount() {
        return getActiveChildCount() + getActiveEntryCount();
    }

    /**
     * Checks if this folder is empty (no active children or entries).
     * 
     * @return true if the folder contains no active items, false otherwise
     */
    public boolean isEmpty() {
        return getTotalActiveItemCount() == 0;
    }

    /**
     * Gets the user ID for this folder.
     * 
     * @return the UUID of the owning user
     */
    public UUID getUserId() {
        return user != null ? user.getId() : null;
    }

    /**
     * Gets the parent folder ID.
     * 
     * @return the UUID of the parent folder, or null if root level
     */
    public UUID getParentId() {
        return parent != null ? parent.getId() : null;
    }

    /**
     * Adds a child folder to this folder.
     * 
     * @param child the child folder to add
     * @throws IllegalArgumentException if adding the child would exceed max depth
     */
    public void addChild(Folder child) {
        if (!canAddChildFolder()) {
            throw new IllegalArgumentException(
                "Cannot add child folder: would exceed maximum nesting depth of " + MAX_NESTING_DEPTH
            );
        }
        
        children.add(child);
        child.setParent(this);
    }

    /**
     * Removes a child folder from this folder.
     * 
     * @param child the child folder to remove
     */
    public void removeChild(Folder child) {
        children.remove(child);
        child.setParent(null);
    }

    /**
     * Adds a vault entry to this folder.
     * 
     * @param entry the vault entry to add
     */
    public void addVaultEntry(VaultEntry entry) {
        vaultEntries.add(entry);
        entry.setFolder(this);
    }

    /**
     * Removes a vault entry from this folder.
     * 
     * @param entry the vault entry to remove
     */
    public void removeVaultEntry(VaultEntry entry) {
        vaultEntries.remove(entry);
        entry.setFolder(null);
    }
}