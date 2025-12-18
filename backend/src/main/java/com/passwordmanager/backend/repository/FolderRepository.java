package com.passwordmanager.backend.repository;

import com.passwordmanager.backend.entity.Folder;
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
 * Repository interface for Folder entity operations.
 * 
 * Provides data access methods for folder management including:
 * - Hierarchical folder operations
 * - Depth validation for nesting limits
 * - Soft delete with cascade operations
 * - Folder tree navigation and organization
 * 
 * Requirements: 7.1, 7.3, 7.4
 */
@Repository
public interface FolderRepository extends JpaRepository<Folder, UUID> {

    // ========== Basic CRUD Operations ==========

    /**
     * Finds all active (non-deleted) folders for a specific user.
     * 
     * @param userId the user ID
     * @return list of active folders ordered by sort order and name
     */
    @Query("SELECT f FROM Folder f WHERE f.user.id = :userId AND f.deletedAt IS NULL ORDER BY f.sortOrder ASC, f.name ASC")
    List<Folder> findActiveByUserId(@Param("userId") UUID userId);

    /**
     * Finds a specific folder by ID and user ID (security check).
     * 
     * @param id the folder ID
     * @param userId the user ID
     * @return optional containing the folder if found and owned by user
     */
    @Query("SELECT f FROM Folder f WHERE f.id = :id AND f.user.id = :userId")
    Optional<Folder> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    /**
     * Finds an active folder by ID and user ID.
     * 
     * @param id the folder ID
     * @param userId the user ID
     * @return optional containing the active folder if found and owned by user
     */
    @Query("SELECT f FROM Folder f WHERE f.id = :id AND f.user.id = :userId AND f.deletedAt IS NULL")
    Optional<Folder> findActiveByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    /**
     * Finds a folder by name and user ID (for uniqueness checking).
     * 
     * @param name the folder name
     * @param userId the user ID
     * @return optional containing the folder if found
     */
    @Query("SELECT f FROM Folder f WHERE LOWER(f.name) = LOWER(:name) AND f.user.id = :userId AND f.deletedAt IS NULL")
    Optional<Folder> findByNameAndUserId(@Param("name") String name, @Param("userId") UUID userId);

    /**
     * Finds a folder by name within a specific parent folder.
     * 
     * @param name the folder name
     * @param parentId the parent folder ID
     * @param userId the user ID
     * @return optional containing the folder if found
     */
    @Query("SELECT f FROM Folder f WHERE LOWER(f.name) = LOWER(:name) AND f.parent.id = :parentId AND f.user.id = :userId AND f.deletedAt IS NULL")
    Optional<Folder> findByNameAndParentIdAndUserId(@Param("name") String name, @Param("parentId") UUID parentId, @Param("userId") UUID userId);

    // ========== Hierarchical Operations ==========

    /**
     * Finds all active root folders (no parent) for a user.
     * 
     * @param userId the user ID
     * @return list of root folders ordered by sort order and name
     */
    @Query("SELECT f FROM Folder f WHERE f.user.id = :userId AND f.parent IS NULL AND f.deletedAt IS NULL ORDER BY f.sortOrder ASC, f.name ASC")
    List<Folder> findActiveRootFoldersByUserId(@Param("userId") UUID userId);

    /**
     * Finds all active child folders of a specific parent.
     * 
     * @param parentId the parent folder ID
     * @param userId the user ID
     * @return list of child folders ordered by sort order and name
     */
    @Query("SELECT f FROM Folder f WHERE f.parent.id = :parentId AND f.user.id = :userId AND f.deletedAt IS NULL ORDER BY f.sortOrder ASC, f.name ASC")
    List<Folder> findActiveChildrenByParentIdAndUserId(@Param("parentId") UUID parentId, @Param("userId") UUID userId);

    /**
     * Finds all descendants of a folder (recursive).
     * 
     * Uses a recursive CTE to find all folders in the subtree.
     * 
     * @param parentId the parent folder ID
     * @param userId the user ID
     * @return list of all descendant folders
     */
    @Query(value = """
        WITH RECURSIVE folder_tree AS (
            SELECT id, name, parent_id, user_id, deleted_at, 0 as depth
            FROM folders 
            WHERE parent_id = :parentId AND user_id = :userId AND deleted_at IS NULL
            
            UNION ALL
            
            SELECT f.id, f.name, f.parent_id, f.user_id, f.deleted_at, ft.depth + 1
            FROM folders f
            INNER JOIN folder_tree ft ON f.parent_id = ft.id
            WHERE f.deleted_at IS NULL AND ft.depth < 5
        )
        SELECT id FROM folder_tree ORDER BY depth, name
        """, nativeQuery = true)
    List<UUID> findAllDescendantIds(@Param("parentId") UUID parentId, @Param("userId") UUID userId);

    /**
     * Finds the path from root to a specific folder.
     * 
     * @param folderId the folder ID
     * @param userId the user ID
     * @return list of folder IDs from root to the specified folder
     */
    @Query(value = """
        WITH RECURSIVE folder_path AS (
            SELECT id, name, parent_id, user_id, 0 as depth
            FROM folders 
            WHERE id = :folderId AND user_id = :userId AND deleted_at IS NULL
            
            UNION ALL
            
            SELECT f.id, f.name, f.parent_id, f.user_id, fp.depth + 1
            FROM folders f
            INNER JOIN folder_path fp ON f.id = fp.parent_id
            WHERE f.deleted_at IS NULL AND fp.depth < 5
        )
        SELECT id FROM folder_path ORDER BY depth DESC
        """, nativeQuery = true)
    List<UUID> findPathToRoot(@Param("folderId") UUID folderId, @Param("userId") UUID userId);

    /**
     * Calculates the depth of a folder in the hierarchy.
     * 
     * @param folderId the folder ID
     * @param userId the user ID
     * @return the depth (0 for root folders)
     */
    @Query(value = """
        WITH RECURSIVE folder_depth AS (
            SELECT id, parent_id, 0 as depth
            FROM folders 
            WHERE id = :folderId AND user_id = :userId AND deleted_at IS NULL
            
            UNION ALL
            
            SELECT f.id, f.parent_id, fd.depth + 1
            FROM folders f
            INNER JOIN folder_depth fd ON f.id = fd.parent_id
            WHERE f.deleted_at IS NULL AND fd.depth < 5
        )
        SELECT COALESCE(MAX(depth), 0) FROM folder_depth
        """, nativeQuery = true)
    Integer calculateDepth(@Param("folderId") UUID folderId, @Param("userId") UUID userId);

    /**
     * Checks if adding a child to a folder would exceed the maximum depth.
     * 
     * @param parentId the parent folder ID
     * @param userId the user ID
     * @return true if max depth would be exceeded, false otherwise
     */
    default boolean wouldExceedMaxDepth(UUID parentId, UUID userId) {
        Integer currentDepth = calculateDepth(parentId, userId);
        return currentDepth != null && currentDepth >= Folder.MAX_NESTING_DEPTH - 1;
    }

    // ========== Soft Delete Operations ==========

    /**
     * Finds all deleted folders for a user.
     * 
     * @param userId the user ID
     * @return list of deleted folders ordered by deletion date
     */
    @Query("SELECT f FROM Folder f WHERE f.user.id = :userId AND f.deletedAt IS NOT NULL ORDER BY f.deletedAt DESC")
    List<Folder> findDeletedByUserId(@Param("userId") UUID userId);

    /**
     * Soft deletes a folder by setting deletedAt timestamp.
     * 
     * @param id the folder ID
     * @param userId the user ID (security check)
     * @param deletedAt the deletion timestamp
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE Folder f SET f.deletedAt = :deletedAt WHERE f.id = :id AND f.user.id = :userId AND f.deletedAt IS NULL")
    int softDeleteByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId, @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * Soft deletes all child folders of a parent folder (cascade delete).
     * 
     * @param parentId the parent folder ID
     * @param userId the user ID
     * @param deletedAt the deletion timestamp
     * @return number of affected folders
     */
    @Modifying
    @Query("UPDATE Folder f SET f.deletedAt = :deletedAt WHERE f.parent.id = :parentId AND f.user.id = :userId AND f.deletedAt IS NULL")
    int softDeleteChildrenByParentId(@Param("parentId") UUID parentId, @Param("userId") UUID userId, @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * Restores a folder from trash by clearing deletedAt timestamp.
     * 
     * @param id the folder ID
     * @param userId the user ID (security check)
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE Folder f SET f.deletedAt = NULL WHERE f.id = :id AND f.user.id = :userId AND f.deletedAt IS NOT NULL")
    int restoreByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    // ========== Organization and Sorting ==========

    /**
     * Updates the sort order of a folder.
     * 
     * @param id the folder ID
     * @param userId the user ID (security check)
     * @param sortOrder the new sort order
     * @return number of affected rows
     */
    @Modifying
    @Query("UPDATE Folder f SET f.sortOrder = :sortOrder WHERE f.id = :id AND f.user.id = :userId")
    int updateSortOrder(@Param("id") UUID id, @Param("userId") UUID userId, @Param("sortOrder") Integer sortOrder);

    /**
     * Finds the maximum sort order within a parent folder.
     * 
     * @param parentId the parent folder ID (null for root level)
     * @param userId the user ID
     * @return the maximum sort order, or 0 if no folders exist
     */
    @Query("SELECT COALESCE(MAX(f.sortOrder), 0) FROM Folder f WHERE f.parent.id = :parentId AND f.user.id = :userId AND f.deletedAt IS NULL")
    Integer findMaxSortOrderByParent(@Param("parentId") UUID parentId, @Param("userId") UUID userId);

    /**
     * Finds the maximum sort order at root level.
     * 
     * @param userId the user ID
     * @return the maximum sort order, or 0 if no root folders exist
     */
    @Query("SELECT COALESCE(MAX(f.sortOrder), 0) FROM Folder f WHERE f.parent IS NULL AND f.user.id = :userId AND f.deletedAt IS NULL")
    Integer findMaxSortOrderAtRoot(@Param("userId") UUID userId);

    // ========== Statistics and Validation ==========

    /**
     * Counts active folders for a user.
     * 
     * @param userId the user ID
     * @return count of active folders
     */
    @Query("SELECT COUNT(f) FROM Folder f WHERE f.user.id = :userId AND f.deletedAt IS NULL")
    long countActiveByUserId(@Param("userId") UUID userId);

    /**
     * Counts active child folders of a parent.
     * 
     * @param parentId the parent folder ID
     * @param userId the user ID
     * @return count of active child folders
     */
    @Query("SELECT COUNT(f) FROM Folder f WHERE f.parent.id = :parentId AND f.user.id = :userId AND f.deletedAt IS NULL")
    long countActiveChildrenByParentId(@Param("parentId") UUID parentId, @Param("userId") UUID userId);

    /**
     * Checks if a folder name is unique within a parent folder.
     * 
     * @param name the folder name
     * @param parentId the parent folder ID (null for root level)
     * @param userId the user ID
     * @param excludeId folder ID to exclude from check (for updates)
     * @return true if name is unique, false otherwise
     */
    @Query("SELECT COUNT(f) = 0 FROM Folder f WHERE LOWER(f.name) = LOWER(:name) AND f.parent.id = :parentId AND f.user.id = :userId AND f.deletedAt IS NULL AND f.id != :excludeId")
    boolean isNameUniqueInParent(@Param("name") String name, @Param("parentId") UUID parentId, @Param("userId") UUID userId, @Param("excludeId") UUID excludeId);

    /**
     * Checks if a folder name is unique at root level.
     * 
     * @param name the folder name
     * @param userId the user ID
     * @param excludeId folder ID to exclude from check (for updates)
     * @return true if name is unique, false otherwise
     */
    @Query("SELECT COUNT(f) = 0 FROM Folder f WHERE LOWER(f.name) = LOWER(:name) AND f.parent IS NULL AND f.user.id = :userId AND f.deletedAt IS NULL AND f.id != :excludeId")
    boolean isNameUniqueAtRoot(@Param("name") String name, @Param("userId") UUID userId, @Param("excludeId") UUID excludeId);

    /**
     * Checks if a folder has any active children or vault entries.
     * 
     * @param folderId the folder ID
     * @param userId the user ID
     * @return true if folder is empty, false otherwise
     */
    @Query("""
        SELECT (
            (SELECT COUNT(f) FROM Folder f WHERE f.parent.id = :folderId AND f.user.id = :userId AND f.deletedAt IS NULL) +
            (SELECT COUNT(v) FROM VaultEntry v WHERE v.folder.id = :folderId AND v.user.id = :userId AND v.deletedAt IS NULL)
        ) = 0
        """)
    boolean isFolderEmpty(@Param("folderId") UUID folderId, @Param("userId") UUID userId);

    /**
     * Finds folders that match a search query.
     * 
     * @param query the search query
     * @param userId the user ID
     * @return list of matching folders
     */
    @Query("SELECT f FROM Folder f WHERE f.user.id = :userId AND f.deletedAt IS NULL AND (LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(f.description) LIKE LOWER(CONCAT('%', :query, '%'))) ORDER BY f.name ASC")
    List<Folder> searchByQuery(@Param("query") String query, @Param("userId") UUID userId);
}