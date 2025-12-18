package com.passwordmanager.backend.repository;

import com.passwordmanager.backend.entity.Tag;
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
 * Repository interface for Tag entity operations.
 * 
 * Provides data access methods for tag management including:
 * - Tag CRUD operations with user isolation
 * - Name uniqueness validation
 * - Soft delete functionality
 * - Search and filtering capabilities
 * - Usage statistics and analytics
 * 
 * Requirements: 7.2, 7.5
 */
@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {

    // ========== Basic CRUD Operations ==========

    /**
     * Finds all active (non-deleted) tags for a specific user.
     * 
     * @param userId the user ID
     * @return list of active tags ordered by sort order and name
     */
    @Query("SELECT t FROM Tag t WHERE t.user.id = :userId AND t.deletedAt IS NULL ORDER BY t.sortOrder ASC, t.name ASC")
    List<Tag> findActiveByUserId(@Param("userId") UUID userId);

    /**
     * Finds a specific tag by ID and user ID (security check).
     * 
     * @param id the tag ID
     * @param userId the user ID
     * @return optional containing the tag if found and owned by user
     */
    @Query("SELECT t FROM Tag t WHERE t.id = :id AND t.user.id = :userId")
    Optional<Tag> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    /**
     * Finds an active tag by ID and user ID.
     * 
     * @param id the tag ID
     * @param userId the user ID
     * @return optional containing the active tag if found and owned by user
     */
    @Query("SELECT t FROM Tag t WHERE t.id = :id AND t.user.id = :userId AND t.deletedAt IS NULL")
    Optional<Tag> findActiveByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    /**
     * Finds a tag by name and user ID (for uniqueness checking).
     * 
     * @param name the tag name (case-insensitive)
     * @param userId the user ID
     * @return optional containing the tag if found
     */
    @Query("SELECT t FROM Tag t WHERE LOWER(TRIM(t.name)) = LOWER(TRIM(:name)) AND t.user.id = :userId AND t.deletedAt IS NULL")
    Optional<Tag> findByNameAndUserId(@Param("name") String name, @Param("userId") UUID userId);

    /**
     * Checks if a tag name is unique for a user.
     * 
     * @param name the tag name
     * @param userId the user ID
     * @param excludeId tag ID to exclude from check (for updates)
     * @return true if name is unique, false otherwise
     */
    @Query("SELECT COUNT(t) = 0 FROM Tag t WHERE LOWER(TRIM(t.name)) = LOWER(TRIM(:name)) AND t.user.id = :userId AND t.deletedAt IS NULL AND (:excludeId IS NULL OR t.id != :excludeId)")
    boolean isNameUnique(@Param("name") String name, @Param("userId") UUID userId, @Param("excludeId") UUID excludeId);

    // ========== Search and Filtering ==========

    /**
     * Finds tags that match a search query.
     * 
     * Searches in tag name and description (case-insensitive).
     * 
     * @param query the search query
     * @param userId the user ID
     * @return list of matching tags ordered by relevance
     */
    @Query("""
        SELECT t FROM Tag t 
        WHERE t.user.id = :userId AND t.deletedAt IS NULL 
        AND (
            LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%')) OR 
            LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%'))
        )
        ORDER BY 
            CASE WHEN LOWER(t.name) = LOWER(:query) THEN 1 ELSE 2 END,
            CASE WHEN LOWER(t.name) LIKE LOWER(CONCAT(:query, '%')) THEN 1 ELSE 2 END,
            t.name ASC
        """)
    List<Tag> searchByQuery(@Param("query") String query, @Param("userId") UUID userId);

    /**
     * Finds tags by color.
     * 
     * @param color the hex color code
     * @param userId the user ID
     * @return list of tags with the specified color
     */
    @Query("SELECT t FROM Tag t WHERE t.color = :color AND t.user.id = :userId AND t.deletedAt IS NULL ORDER BY t.name ASC")
    List<Tag> findByColorAndUserId(@Param("color") String color, @Param("userId") UUID userId);

    /**
     * Finds the most recently created tags.
     * 
     * @param userId the user ID
     * @param limit maximum number of tags to return
     * @return list of recently created tags
     */
    @Query("SELECT t FROM Tag t WHERE t.user.id = :userId AND t.deletedAt IS NULL ORDER BY t.createdAt DESC LIMIT :limit")
    List<Tag> findRecentlyCreated(@Param("userId") UUID userId, @Param("limit") int limit);

    /**
     * Finds the most recently updated tags.
     * 
     * @param userId the user ID
     * @param limit maximum number of tags to return
     * @return list of recently updated tags
     */
    @Query("SELECT t FROM Tag t WHERE t.user.id = :userId AND t.deletedAt IS NULL ORDER BY t.updatedAt DESC LIMIT :limit")
    List<Tag> findRecentlyUpdated(@Param("userId") UUID userId, @Param("limit") int limit);

    // ========== Soft Delete Operations ==========

    /**
     * Finds all deleted tags for a user.
     * 
     * @param userId the user ID
     * @return list of deleted tags ordered by deletion date
     */
    @Query("SELECT t FROM Tag t WHERE t.user.id = :userId AND t.deletedAt IS NOT NULL ORDER BY t.deletedAt DESC")
    List<Tag> findDeletedByUserId(@Param("userId") UUID userId);

    /**
     * Soft deletes a tag by setting deletedAt timestamp.
     * 
     * @param id the tag ID
     * @param userId the user ID (security check)
     * @param deletedAt the deletion timestamp
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE Tag t SET t.deletedAt = :deletedAt WHERE t.id = :id AND t.user.id = :userId AND t.deletedAt IS NULL")
    int softDeleteByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId, @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * Restores a tag from trash by clearing deletedAt timestamp.
     * 
     * @param id the tag ID
     * @param userId the user ID (security check)
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE Tag t SET t.deletedAt = NULL WHERE t.id = :id AND t.user.id = :userId AND t.deletedAt IS NOT NULL")
    int restoreByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    /**
     * Permanently deletes tags that have been in trash longer than the retention period.
     * 
     * @param cutoffDate tags deleted before this date will be permanently removed
     * @return number of permanently deleted tags
     */
    @Modifying
    @Query("DELETE FROM Tag t WHERE t.deletedAt IS NOT NULL AND t.deletedAt < :cutoffDate")
    int permanentlyDeleteOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    // ========== Organization and Sorting ==========

    /**
     * Updates the sort order of a tag.
     * 
     * @param id the tag ID
     * @param userId the user ID (security check)
     * @param sortOrder the new sort order
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE Tag t SET t.sortOrder = :sortOrder WHERE t.id = :id AND t.user.id = :userId")
    int updateSortOrder(@Param("id") UUID id, @Param("userId") UUID userId, @Param("sortOrder") Integer sortOrder);

    /**
     * Finds the maximum sort order for a user's tags.
     * 
     * @param userId the user ID
     * @return the maximum sort order, or 0 if no tags exist
     */
    @Query("SELECT COALESCE(MAX(t.sortOrder), 0) FROM Tag t WHERE t.user.id = :userId AND t.deletedAt IS NULL")
    Integer findMaxSortOrderByUserId(@Param("userId") UUID userId);

    /**
     * Updates the color of a tag.
     * 
     * @param id the tag ID
     * @param userId the user ID (security check)
     * @param color the new hex color code
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE Tag t SET t.color = :color WHERE t.id = :id AND t.user.id = :userId")
    int updateColor(@Param("id") UUID id, @Param("userId") UUID userId, @Param("color") String color);

    // ========== Statistics and Analytics ==========

    /**
     * Counts active tags for a user.
     * 
     * @param userId the user ID
     * @return count of active tags
     */
    @Query("SELECT COUNT(t) FROM Tag t WHERE t.user.id = :userId AND t.deletedAt IS NULL")
    long countActiveByUserId(@Param("userId") UUID userId);

    /**
     * Counts deleted tags for a user.
     * 
     * @param userId the user ID
     * @return count of deleted tags
     */
    @Query("SELECT COUNT(t) FROM Tag t WHERE t.user.id = :userId AND t.deletedAt IS NOT NULL")
    long countDeletedByUserId(@Param("userId") UUID userId);

    /**
     * Finds the most popular colors used by a user's tags.
     * 
     * @param userId the user ID
     * @param limit maximum number of colors to return
     * @return list of color codes ordered by usage frequency
     */
    @Query("SELECT t.color FROM Tag t WHERE t.user.id = :userId AND t.deletedAt IS NULL GROUP BY t.color ORDER BY COUNT(t.color) DESC LIMIT :limit")
    List<String> findMostPopularColors(@Param("userId") UUID userId, @Param("limit") int limit);

    /**
     * Gets tag usage statistics.
     * 
     * Returns tags with their usage count (how many vault entries use each tag).
     * Note: This requires a join with vault entries which would be implemented
     * in a service layer or through a separate query.
     * 
     * @param userId the user ID
     * @return list of tags ordered by usage count
     */
    @Query("""
        SELECT t FROM Tag t 
        WHERE t.user.id = :userId AND t.deletedAt IS NULL 
        ORDER BY (
            SELECT COUNT(v) FROM VaultEntry v 
            WHERE v.user.id = :userId 
            AND v.deletedAt IS NULL 
            AND CONCAT(',', REPLACE(v.encryptedData, ' ', ''), ',') LIKE CONCAT('%,', t.id, ',%')
        ) DESC, t.name ASC
        """)
    List<Tag> findOrderedByUsage(@Param("userId") UUID userId);

    /**
     * Finds unused tags (tags not assigned to any vault entries).
     * 
     * @param userId the user ID
     * @return list of unused tags
     */
    @Query("""
        SELECT t FROM Tag t 
        WHERE t.user.id = :userId AND t.deletedAt IS NULL 
        AND NOT EXISTS (
            SELECT 1 FROM VaultEntry v 
            WHERE v.user.id = :userId 
            AND v.deletedAt IS NULL 
            AND CONCAT(',', REPLACE(v.encryptedData, ' ', ''), ',') LIKE CONCAT('%,', t.id, ',%')
        )
        ORDER BY t.createdAt DESC
        """)
    List<Tag> findUnused(@Param("userId") UUID userId);

    // ========== Bulk Operations ==========

    /**
     * Updates the sort order for multiple tags.
     * 
     * This is typically used when reordering tags in the UI.
     * 
     * @param tagIds list of tag IDs in the desired order
     * @param userId the user ID (security check)
     * @return number of affected tags
     */
    @Modifying
    @Query("""
        UPDATE Tag t SET t.sortOrder = 
        CASE 
            WHEN t.id = :tagId1 THEN 1
            WHEN t.id = :tagId2 THEN 2
            WHEN t.id = :tagId3 THEN 3
            WHEN t.id = :tagId4 THEN 4
            WHEN t.id = :tagId5 THEN 5
            ELSE t.sortOrder
        END
        WHERE t.user.id = :userId AND t.id IN (:tagId1, :tagId2, :tagId3, :tagId4, :tagId5)
        """)
    int updateSortOrderBulk(
        @Param("userId") UUID userId,
        @Param("tagId1") UUID tagId1,
        @Param("tagId2") UUID tagId2,
        @Param("tagId3") UUID tagId3,
        @Param("tagId4") UUID tagId4,
        @Param("tagId5") UUID tagId5
    );

    /**
     * Finds tags by multiple IDs for a specific user.
     * 
     * @param tagIds list of tag IDs
     * @param userId the user ID
     * @return list of tags owned by the user
     */
    @Query("SELECT t FROM Tag t WHERE t.id IN :tagIds AND t.user.id = :userId AND t.deletedAt IS NULL")
    List<Tag> findByIdsAndUserId(@Param("tagIds") List<UUID> tagIds, @Param("userId") UUID userId);

    /**
     * Validates that all provided tag IDs belong to the specified user.
     * 
     * @param tagIds list of tag IDs to validate
     * @param userId the user ID
     * @return true if all tags belong to the user, false otherwise
     */
    @Query("SELECT COUNT(t) = :expectedCount FROM Tag t WHERE t.id IN :tagIds AND t.user.id = :userId AND t.deletedAt IS NULL")
    boolean validateTagOwnership(@Param("tagIds") List<UUID> tagIds, @Param("userId") UUID userId, @Param("expectedCount") long expectedCount);

    /**
     * Default method to validate tag ownership with automatic count.
     * 
     * @param tagIds list of tag IDs to validate
     * @param userId the user ID
     * @return true if all tags belong to the user, false otherwise
     */
    default boolean validateTagOwnership(List<UUID> tagIds, UUID userId) {
        if (tagIds == null || tagIds.isEmpty()) {
            return true;
        }
        return validateTagOwnership(tagIds, userId, tagIds.size());
    }
}