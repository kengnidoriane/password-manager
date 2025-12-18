package com.passwordmanager.backend.repository;

import com.passwordmanager.backend.entity.SecureNote;
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
 * Repository interface for SecureNote entity operations.
 * 
 * Provides data access methods for secure note management including:
 * - CRUD operations with user isolation
 * - Folder organization and hierarchy
 * - Soft delete functionality
 * - Search capabilities (title-based)
 * - Attachment management and size tracking
 * - Access tracking and analytics
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
@Repository
public interface SecureNoteRepository extends JpaRepository<SecureNote, UUID> {

    // ========== Basic CRUD Operations ==========

    /**
     * Finds all active (non-deleted) secure notes for a specific user.
     * 
     * @param userId the user ID
     * @return list of active secure notes ordered by last accessed date
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL ORDER BY s.lastAccessedAt DESC NULLS LAST, s.updatedAt DESC")
    List<SecureNote> findActiveByUserId(@Param("userId") UUID userId);

    /**
     * Finds all active secure notes for a user with pagination.
     * 
     * @param userId the user ID
     * @param pageable pagination parameters
     * @return page of active secure notes
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL ORDER BY s.lastAccessedAt DESC NULLS LAST, s.updatedAt DESC")
    Page<SecureNote> findActiveByUserId(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Finds a specific secure note by ID and user ID (security check).
     * 
     * @param id the note ID
     * @param userId the user ID
     * @return optional containing the note if found and owned by user
     */
    @Query("SELECT s FROM SecureNote s WHERE s.id = :id AND s.user.id = :userId")
    Optional<SecureNote> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    /**
     * Finds an active secure note by ID and user ID.
     * 
     * @param id the note ID
     * @param userId the user ID
     * @return optional containing the active note if found and owned by user
     */
    @Query("SELECT s FROM SecureNote s WHERE s.id = :id AND s.user.id = :userId AND s.deletedAt IS NULL")
    Optional<SecureNote> findActiveByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    // ========== Folder Organization ==========

    /**
     * Finds all active secure notes in a specific folder.
     * 
     * @param userId the user ID
     * @param folderId the folder ID
     * @return list of notes in the folder ordered by last accessed date
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.folder.id = :folderId AND s.deletedAt IS NULL ORDER BY s.lastAccessedAt DESC NULLS LAST, s.updatedAt DESC")
    List<SecureNote> findActiveByUserIdAndFolderId(@Param("userId") UUID userId, @Param("folderId") UUID folderId);

    /**
     * Finds all active root-level secure notes (not in any folder).
     * 
     * @param userId the user ID
     * @return list of root-level notes
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.folder IS NULL AND s.deletedAt IS NULL ORDER BY s.lastAccessedAt DESC NULLS LAST, s.updatedAt DESC")
    List<SecureNote> findActiveRootNotesByUserId(@Param("userId") UUID userId);

    /**
     * Counts active secure notes in a specific folder.
     * 
     * @param userId the user ID
     * @param folderId the folder ID
     * @return count of notes in the folder
     */
    @Query("SELECT COUNT(s) FROM SecureNote s WHERE s.user.id = :userId AND s.folder.id = :folderId AND s.deletedAt IS NULL")
    long countActiveByUserIdAndFolderId(@Param("userId") UUID userId, @Param("folderId") UUID folderId);

    /**
     * Moves all secure notes from one folder to another.
     * 
     * @param userId the user ID
     * @param fromFolderId the source folder ID
     * @param toFolderId the destination folder ID (can be null for root)
     * @return number of moved notes
     */
    @Modifying
    @Query("UPDATE SecureNote s SET s.folder.id = :toFolderId WHERE s.user.id = :userId AND s.folder.id = :fromFolderId AND s.deletedAt IS NULL")
    int moveNotesBetweenFolders(@Param("userId") UUID userId, @Param("fromFolderId") UUID fromFolderId, @Param("toFolderId") UUID toFolderId);

    // ========== Search and Filtering ==========

    /**
     * Finds secure notes that match a search query in the title.
     * 
     * Note: Content search requires decryption and should be handled at the service layer.
     * 
     * @param query the search query
     * @param userId the user ID
     * @return list of matching notes ordered by relevance
     */
    @Query("""
        SELECT s FROM SecureNote s 
        WHERE s.user.id = :userId AND s.deletedAt IS NULL 
        AND LOWER(s.title) LIKE LOWER(CONCAT('%', :query, '%'))
        ORDER BY 
            CASE WHEN LOWER(s.title) = LOWER(:query) THEN 1 ELSE 2 END,
            CASE WHEN LOWER(s.title) LIKE LOWER(CONCAT(:query, '%')) THEN 1 ELSE 2 END,
            s.lastAccessedAt DESC NULLS LAST,
            s.updatedAt DESC
        """)
    List<SecureNote> searchByTitle(@Param("query") String query, @Param("userId") UUID userId);

    /**
     * Finds secure notes with attachments.
     * 
     * @param userId the user ID
     * @return list of notes that have file attachments
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL AND s.attachmentCount > 0 ORDER BY s.attachmentsSize DESC")
    List<SecureNote> findActiveWithAttachments(@Param("userId") UUID userId);

    /**
     * Finds secure notes without attachments.
     * 
     * @param userId the user ID
     * @return list of notes that have no file attachments
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL AND (s.attachmentCount IS NULL OR s.attachmentCount = 0) ORDER BY s.lastAccessedAt DESC NULLS LAST")
    List<SecureNote> findActiveWithoutAttachments(@Param("userId") UUID userId);

    /**
     * Finds secure notes by attachment count range.
     * 
     * @param userId the user ID
     * @param minCount minimum attachment count
     * @param maxCount maximum attachment count
     * @return list of notes with attachment count in the specified range
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL AND s.attachmentCount BETWEEN :minCount AND :maxCount ORDER BY s.attachmentCount DESC")
    List<SecureNote> findByAttachmentCountRange(@Param("userId") UUID userId, @Param("minCount") int minCount, @Param("maxCount") int maxCount);

    // ========== Access Tracking ==========

    /**
     * Updates the last accessed timestamp for a secure note.
     * 
     * @param id the note ID
     * @param userId the user ID (security check)
     * @param lastAccessedAt the timestamp to set
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE SecureNote s SET s.lastAccessedAt = :lastAccessedAt WHERE s.id = :id AND s.user.id = :userId")
    int updateLastAccessed(@Param("id") UUID id, @Param("userId") UUID userId, @Param("lastAccessedAt") LocalDateTime lastAccessedAt);

    /**
     * Finds recently accessed secure notes.
     * 
     * @param userId the user ID
     * @param limit maximum number of notes to return
     * @return list of recently accessed notes
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL AND s.lastAccessedAt IS NOT NULL ORDER BY s.lastAccessedAt DESC LIMIT :limit")
    List<SecureNote> findRecentlyAccessed(@Param("userId") UUID userId, @Param("limit") int limit);

    /**
     * Finds secure notes that have never been accessed.
     * 
     * @param userId the user ID
     * @return list of unaccessed notes
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL AND s.lastAccessedAt IS NULL ORDER BY s.createdAt DESC")
    List<SecureNote> findNeverAccessed(@Param("userId") UUID userId);

    /**
     * Finds secure notes accessed within a specific time period.
     * 
     * @param userId the user ID
     * @param since the start of the time period
     * @return list of notes accessed since the specified date
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL AND s.lastAccessedAt >= :since ORDER BY s.lastAccessedAt DESC")
    List<SecureNote> findAccessedSince(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    // ========== Soft Delete Operations ==========

    /**
     * Finds all deleted secure notes for a user.
     * 
     * @param userId the user ID
     * @return list of deleted notes ordered by deletion date
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NOT NULL ORDER BY s.deletedAt DESC")
    List<SecureNote> findDeletedByUserId(@Param("userId") UUID userId);

    /**
     * Soft deletes a secure note by setting deletedAt timestamp.
     * 
     * @param id the note ID
     * @param userId the user ID (security check)
     * @param deletedAt the deletion timestamp
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE SecureNote s SET s.deletedAt = :deletedAt WHERE s.id = :id AND s.user.id = :userId AND s.deletedAt IS NULL")
    int softDeleteByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId, @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * Soft deletes all secure notes in a specific folder.
     * 
     * @param userId the user ID
     * @param folderId the folder ID
     * @param deletedAt the deletion timestamp
     * @return number of affected notes
     */
    @Modifying
    @Query("UPDATE SecureNote s SET s.deletedAt = :deletedAt WHERE s.user.id = :userId AND s.folder.id = :folderId AND s.deletedAt IS NULL")
    int softDeleteByFolderId(@Param("userId") UUID userId, @Param("folderId") UUID folderId, @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * Restores a secure note from trash by clearing deletedAt timestamp.
     * 
     * @param id the note ID
     * @param userId the user ID (security check)
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE SecureNote s SET s.deletedAt = NULL WHERE s.id = :id AND s.user.id = :userId AND s.deletedAt IS NOT NULL")
    int restoreByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    /**
     * Permanently deletes notes that have been in trash longer than the retention period.
     * 
     * @param cutoffDate notes deleted before this date will be permanently removed
     * @return number of permanently deleted notes
     */
    @Modifying
    @Query("DELETE FROM SecureNote s WHERE s.deletedAt IS NOT NULL AND s.deletedAt < :cutoffDate")
    int permanentlyDeleteOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    // ========== Attachment Management ==========

    /**
     * Updates attachment metadata for a secure note.
     * 
     * @param id the note ID
     * @param userId the user ID (security check)
     * @param attachmentCount the new attachment count
     * @param attachmentsSize the new total size of attachments
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE SecureNote s SET s.attachmentCount = :attachmentCount, s.attachmentsSize = :attachmentsSize WHERE s.id = :id AND s.user.id = :userId")
    int updateAttachmentMetadata(@Param("id") UUID id, @Param("userId") UUID userId, @Param("attachmentCount") int attachmentCount, @Param("attachmentsSize") long attachmentsSize);

    /**
     * Clears all attachment data for a secure note.
     * 
     * @param id the note ID
     * @param userId the user ID (security check)
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE SecureNote s SET s.encryptedAttachments = NULL, s.attachmentsIv = NULL, s.attachmentsAuthTag = NULL, s.attachmentCount = 0, s.attachmentsSize = 0 WHERE s.id = :id AND s.user.id = :userId")
    int clearAttachments(@Param("id") UUID id, @Param("userId") UUID userId);

    /**
     * Calculates the total attachment size for a user.
     * 
     * @param userId the user ID
     * @return total size of all attachments in bytes
     */
    @Query("SELECT COALESCE(SUM(s.attachmentsSize), 0) FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL")
    long calculateTotalAttachmentSize(@Param("userId") UUID userId);

    /**
     * Finds secure notes with large attachments (above a size threshold).
     * 
     * @param userId the user ID
     * @param sizeThreshold minimum attachment size in bytes
     * @return list of notes with large attachments
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL AND s.attachmentsSize >= :sizeThreshold ORDER BY s.attachmentsSize DESC")
    List<SecureNote> findWithLargeAttachments(@Param("userId") UUID userId, @Param("sizeThreshold") long sizeThreshold);

    // ========== Statistics and Analytics ==========

    /**
     * Counts active secure notes for a user.
     * 
     * @param userId the user ID
     * @return count of active notes
     */
    @Query("SELECT COUNT(s) FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL")
    long countActiveByUserId(@Param("userId") UUID userId);

    /**
     * Counts deleted secure notes for a user.
     * 
     * @param userId the user ID
     * @return count of deleted notes
     */
    @Query("SELECT COUNT(s) FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NOT NULL")
    long countDeletedByUserId(@Param("userId") UUID userId);

    /**
     * Counts secure notes with attachments for a user.
     * 
     * @param userId the user ID
     * @return count of notes with attachments
     */
    @Query("SELECT COUNT(s) FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL AND s.attachmentCount > 0")
    long countWithAttachments(@Param("userId") UUID userId);

    /**
     * Gets attachment statistics for a user.
     * 
     * @param userId the user ID
     * @return array containing [total_notes_with_attachments, total_attachment_count, total_attachment_size]
     */
    @Query("SELECT COUNT(s), COALESCE(SUM(s.attachmentCount), 0), COALESCE(SUM(s.attachmentsSize), 0) FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL AND s.attachmentCount > 0")
    Object[] getAttachmentStatistics(@Param("userId") UUID userId);

    /**
     * Finds the most recently created secure notes.
     * 
     * @param userId the user ID
     * @param limit maximum number of notes to return
     * @return list of recently created notes
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL ORDER BY s.createdAt DESC LIMIT :limit")
    List<SecureNote> findRecentlyCreated(@Param("userId") UUID userId, @Param("limit") int limit);

    /**
     * Finds the most recently updated secure notes.
     * 
     * @param userId the user ID
     * @param limit maximum number of notes to return
     * @return list of recently updated notes
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.deletedAt IS NULL ORDER BY s.updatedAt DESC LIMIT :limit")
    List<SecureNote> findRecentlyUpdated(@Param("userId") UUID userId, @Param("limit") int limit);

    // ========== Sync Operations ==========

    /**
     * Finds secure notes modified after a specific timestamp for sync operations.
     * 
     * @param userId the user ID
     * @param lastSyncTime the last sync timestamp
     * @return list of notes modified since last sync
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.updatedAt > :lastSyncTime ORDER BY s.updatedAt ASC")
    List<SecureNote> findModifiedSince(@Param("userId") UUID userId, @Param("lastSyncTime") LocalDateTime lastSyncTime);

    /**
     * Finds secure notes with version conflicts.
     * 
     * @param userId the user ID
     * @param noteId the note ID
     * @param version the expected version
     * @return optional containing the note if version differs
     */
    @Query("SELECT s FROM SecureNote s WHERE s.user.id = :userId AND s.id = :noteId AND s.version != :version")
    Optional<SecureNote> findVersionConflict(@Param("userId") UUID userId, @Param("noteId") UUID noteId, @Param("version") Long version);
}