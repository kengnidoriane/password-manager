package com.passwordmanager.backend.repository;

import com.passwordmanager.backend.entity.VaultEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for VaultEntry entity operations.
 * 
 * Provides data access methods for vault management including:
 * - CRUD operations with user isolation
 * - Soft delete functionality
 * - Version-based conflict resolution
 * - Hierarchical folder operations
 * - Sync and filtering capabilities
 * 
 * Requirements: 3.1, 3.2, 3.4, 7.1, 10.1
 */
@Repository
public interface VaultRepository extends JpaRepository<VaultEntry, UUID> {

    // ========== Basic CRUD Operations ==========

    /**
     * Finds all active (non-deleted) vault entries for a specific user.
     * 
     * @param userId the user ID
     * @return list of active vault entries
     */
    @Query("SELECT v FROM VaultEntry v WHERE v.user.id = :userId AND v.deletedAt IS NULL")
    List<VaultEntry> findActiveByUserId(@Param("userId") UUID userId);

    /**
     * Finds all active vault entries for a user with pagination.
     * 
     * @param userId the user ID
     * @param pageable pagination parameters
     * @return page of active vault entries
     */
    @Query("SELECT v FROM VaultEntry v WHERE v.user.id = :userId AND v.deletedAt IS NULL")
    Page<VaultEntry> findActiveByUserId(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Finds a specific vault entry by ID and user ID (security check).
     * 
     * @param id the entry ID
     * @param userId the user ID
     * @return optional containing the entry if found and owned by user
     */
    @Query("SELECT v FROM VaultEntry v WHERE v.id = :id AND v.user.id = :userId")
    Optional<VaultEntry> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    /**
     * Finds an active vault entry by ID and user ID.
     * 
     * @param id the entry ID
     * @param userId the user ID
     * @return optional containing the active entry if found and owned by user
     */
    @Query("SELECT v FROM VaultEntry v WHERE v.id = :id AND v.user.id = :userId AND v.deletedAt IS NULL")
    Optional<VaultEntry> findActiveByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    // ========== Entry Type Filtering ==========

    /**
     * Finds all active entries of a specific type for a user.
     * 
     * @param userId the user ID
     * @param entryType the entry type
     * @return list of entries of the specified type
     */
    @Query("SELECT v FROM VaultEntry v WHERE v.user.id = :userId AND v.entryType = :entryType AND v.deletedAt IS NULL")
    List<VaultEntry> findActiveByUserIdAndType(@Param("userId") UUID userId, @Param("entryType") VaultEntry.EntryType entryType);

    /**
     * Finds all active credentials for a user.
     * 
     * @param userId the user ID
     * @return list of credential entries
     */
    default List<VaultEntry> findActiveCredentialsByUserId(UUID userId) {
        return findActiveByUserIdAndType(userId, VaultEntry.EntryType.CREDENTIAL);
    }

    /**
     * Finds all active secure notes for a user.
     * 
     * @param userId the user ID
     * @return list of secure note entries
     */
    default List<VaultEntry> findActiveSecureNotesByUserId(UUID userId) {
        return findActiveByUserIdAndType(userId, VaultEntry.EntryType.SECURE_NOTE);
    }

    /**
     * Finds all active folders for a user.
     * 
     * @param userId the user ID
     * @return list of folder entries
     */
    default List<VaultEntry> findActiveFoldersByUserId(UUID userId) {
        return findActiveByUserIdAndType(userId, VaultEntry.EntryType.FOLDER);
    }

    /**
     * Finds all active tags for a user.
     * 
     * @param userId the user ID
     * @return list of tag entries
     */
    default List<VaultEntry> findActiveTagsByUserId(UUID userId) {
        return findActiveByUserIdAndType(userId, VaultEntry.EntryType.TAG);
    }

    // ========== Folder Hierarchy Operations ==========

    /**
     * Finds all active entries in a specific folder.
     * 
     * @param userId the user ID
     * @param folderId the folder ID
     * @return list of entries in the folder
     */
    @Query("SELECT v FROM VaultEntry v WHERE v.user.id = :userId AND v.folder.id = :folderId AND v.deletedAt IS NULL")
    List<VaultEntry> findActiveByUserIdAndFolderId(@Param("userId") UUID userId, @Param("folderId") UUID folderId);

    /**
     * Finds all active root-level entries (not in any folder).
     * 
     * @param userId the user ID
     * @return list of root-level entries
     */
    @Query("SELECT v FROM VaultEntry v WHERE v.user.id = :userId AND v.folder IS NULL AND v.deletedAt IS NULL")
    List<VaultEntry> findActiveRootEntriesByUserId(@Param("userId") UUID userId);

    /**
     * Counts active entries in a specific folder.
     * 
     * @param userId the user ID
     * @param folderId the folder ID
     * @return count of entries in the folder
     */
    @Query("SELECT COUNT(v) FROM VaultEntry v WHERE v.user.id = :userId AND v.folder.id = :folderId AND v.deletedAt IS NULL")
    long countActiveByUserIdAndFolderId(@Param("userId") UUID userId, @Param("folderId") UUID folderId);

    // ========== Soft Delete Operations ==========

    /**
     * Finds all deleted (trash) entries for a user.
     * 
     * @param userId the user ID
     * @return list of deleted entries
     */
    @Query("SELECT v FROM VaultEntry v WHERE v.user.id = :userId AND v.deletedAt IS NOT NULL ORDER BY v.deletedAt DESC")
    List<VaultEntry> findDeletedByUserId(@Param("userId") UUID userId);

    /**
     * Finds deleted entries older than a specific date (for permanent deletion).
     * 
     * @param cutoffDate entries deleted before this date
     * @return list of entries eligible for permanent deletion
     */
    @Query("SELECT v FROM VaultEntry v WHERE v.deletedAt IS NOT NULL AND v.deletedAt < :cutoffDate")
    List<VaultEntry> findDeletedOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Soft deletes a vault entry by setting deletedAt timestamp.
     * 
     * @param id the entry ID
     * @param userId the user ID (security check)
     * @param deletedAt the deletion timestamp
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE VaultEntry v SET v.deletedAt = :deletedAt WHERE v.id = :id AND v.user.id = :userId AND v.deletedAt IS NULL")
    int softDeleteByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId, @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * Restores a vault entry from trash by clearing deletedAt timestamp.
     * 
     * @param id the entry ID
     * @param userId the user ID (security check)
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE VaultEntry v SET v.deletedAt = NULL WHERE v.id = :id AND v.user.id = :userId AND v.deletedAt IS NOT NULL")
    int restoreByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    /**
     * Permanently deletes entries that have been in trash longer than the retention period.
     * 
     * @param cutoffDate entries deleted before this date will be permanently removed
     * @return number of permanently deleted entries
     */
    @Modifying
    @Query("DELETE FROM VaultEntry v WHERE v.deletedAt IS NOT NULL AND v.deletedAt < :cutoffDate")
    int permanentlyDeleteOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    // ========== Sync and Version Operations ==========

    /**
     * Finds entries modified after a specific timestamp for sync operations.
     * 
     * @param userId the user ID
     * @param lastSyncTime the last sync timestamp
     * @return list of entries modified since last sync
     */
    @Query("SELECT v FROM VaultEntry v WHERE v.user.id = :userId AND v.updatedAt > :lastSyncTime ORDER BY v.updatedAt ASC")
    List<VaultEntry> findModifiedSince(@Param("userId") UUID userId, @Param("lastSyncTime") LocalDateTime lastSyncTime);

    /**
     * Finds entries with version conflicts (same ID, different versions).
     * 
     * @param userId the user ID
     * @param entryId the entry ID
     * @param version the expected version
     * @return optional containing the entry if version differs
     */
    @Query("SELECT v FROM VaultEntry v WHERE v.user.id = :userId AND v.id = :entryId AND v.version != :version")
    Optional<VaultEntry> findVersionConflict(@Param("userId") UUID userId, @Param("entryId") UUID entryId, @Param("version") Long version);

    // ========== Usage Tracking ==========

    /**
     * Updates the last used timestamp for a vault entry.
     * 
     * @param id the entry ID
     * @param userId the user ID (security check)
     * @param lastUsedAt the timestamp to set
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE VaultEntry v SET v.lastUsedAt = :lastUsedAt WHERE v.id = :id AND v.user.id = :userId")
    int updateLastUsed(@Param("id") UUID id, @Param("userId") UUID userId, @Param("lastUsedAt") LocalDateTime lastUsedAt);

    /**
     * Finds recently used entries for a user.
     * 
     * @param userId the user ID
     * @param limit maximum number of entries to return
     * @return list of recently used entries
     */
    @Query("SELECT v FROM VaultEntry v WHERE v.user.id = :userId AND v.deletedAt IS NULL AND v.lastUsedAt IS NOT NULL ORDER BY v.lastUsedAt DESC")
    List<VaultEntry> findRecentlyUsed(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Finds entries that have never been used.
     * 
     * @param userId the user ID
     * @return list of unused entries
     */
    @Query("SELECT v FROM VaultEntry v WHERE v.user.id = :userId AND v.deletedAt IS NULL AND v.lastUsedAt IS NULL")
    List<VaultEntry> findNeverUsed(@Param("userId") UUID userId);

    // ========== Statistics and Counts ==========

    /**
     * Counts total active entries for a user.
     * 
     * @param userId the user ID
     * @return count of active entries
     */
    @Query("SELECT COUNT(v) FROM VaultEntry v WHERE v.user.id = :userId AND v.deletedAt IS NULL")
    long countActiveByUserId(@Param("userId") UUID userId);

    /**
     * Counts deleted entries for a user.
     * 
     * @param userId the user ID
     * @return count of deleted entries
     */
    @Query("SELECT COUNT(v) FROM VaultEntry v WHERE v.user.id = :userId AND v.deletedAt IS NOT NULL")
    long countDeletedByUserId(@Param("userId") UUID userId);

    /**
     * Counts entries by type for a user.
     * 
     * @param userId the user ID
     * @param entryType the entry type
     * @return count of entries of the specified type
     */
    @Query("SELECT COUNT(v) FROM VaultEntry v WHERE v.user.id = :userId AND v.entryType = :entryType AND v.deletedAt IS NULL")
    long countActiveByUserIdAndType(@Param("userId") UUID userId, @Param("entryType") VaultEntry.EntryType entryType);

    // ========== Bulk Operations ==========

    /**
     * Soft deletes all entries in a specific folder.
     * 
     * @param userId the user ID
     * @param folderId the folder ID
     * @param deletedAt the deletion timestamp
     * @return number of affected entries
     */
    @Modifying
    @Query("UPDATE VaultEntry v SET v.deletedAt = :deletedAt WHERE v.user.id = :userId AND v.folder.id = :folderId AND v.deletedAt IS NULL")
    int softDeleteByFolderId(@Param("userId") UUID userId, @Param("folderId") UUID folderId, @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * Moves all entries from one folder to another.
     * 
     * @param userId the user ID
     * @param fromFolderId the source folder ID
     * @param toFolderId the destination folder ID (can be null for root)
     * @return number of moved entries
     */
    @Modifying
    @Query("UPDATE VaultEntry v SET v.folder.id = :toFolderId WHERE v.user.id = :userId AND v.folder.id = :fromFolderId AND v.deletedAt IS NULL")
    int moveEntriesBetweenFolders(@Param("userId") UUID userId, @Param("fromFolderId") UUID fromFolderId, @Param("toFolderId") UUID toFolderId);

    /**
     * Checks if a user exists and has access to perform operations.
     * 
     * @param userId the user ID
     * @return true if user exists, false otherwise
     */
    @Query("SELECT COUNT(v) > 0 FROM VaultEntry v WHERE v.user.id = :userId")
    boolean existsByUserId(@Param("userId") UUID userId);
}