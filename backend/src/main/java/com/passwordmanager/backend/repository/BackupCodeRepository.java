package com.passwordmanager.backend.repository;

import com.passwordmanager.backend.entity.BackupCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for BackupCode entity operations.
 * 
 * Provides data access methods for managing 2FA backup codes.
 * 
 * Requirements: 14.3
 */
@Repository
public interface BackupCodeRepository extends JpaRepository<BackupCode, UUID> {

    /**
     * Finds all backup codes for a specific user.
     * 
     * @param userId The user's ID
     * @return List of backup codes for the user
     */
    @Query("SELECT bc FROM BackupCode bc WHERE bc.user.id = :userId ORDER BY bc.createdAt DESC")
    List<BackupCode> findByUserId(@Param("userId") UUID userId);

    /**
     * Finds all unused backup codes for a specific user.
     * 
     * Used during authentication to check available backup codes.
     * 
     * @param userId The user's ID
     * @return List of unused backup codes for the user
     */
    @Query("SELECT bc FROM BackupCode bc WHERE bc.user.id = :userId AND bc.used = false ORDER BY bc.createdAt ASC")
    List<BackupCode> findUnusedByUserId(@Param("userId") UUID userId);

    /**
     * Finds all used backup codes for a specific user.
     * 
     * Useful for audit purposes and displaying usage history.
     * 
     * @param userId The user's ID
     * @return List of used backup codes for the user
     */
    @Query("SELECT bc FROM BackupCode bc WHERE bc.user.id = :userId AND bc.used = true ORDER BY bc.usedAt DESC")
    List<BackupCode> findUsedByUserId(@Param("userId") UUID userId);

    /**
     * Counts the number of unused backup codes for a user.
     * 
     * Used to check if the user has any remaining backup codes.
     * 
     * @param userId The user's ID
     * @return Count of unused backup codes
     */
    @Query("SELECT COUNT(bc) FROM BackupCode bc WHERE bc.user.id = :userId AND bc.used = false")
    long countUnusedByUserId(@Param("userId") UUID userId);

    /**
     * Counts the total number of backup codes for a user.
     * 
     * @param userId The user's ID
     * @return Total count of backup codes
     */
    @Query("SELECT COUNT(bc) FROM BackupCode bc WHERE bc.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);

    /**
     * Deletes all backup codes for a specific user.
     * 
     * Used when disabling 2FA or during account deletion.
     * 
     * @param userId The user's ID
     * @return Number of backup codes deleted
     */
    @Modifying
    @Query("DELETE FROM BackupCode bc WHERE bc.user.id = :userId")
    int deleteByUserId(@Param("userId") UUID userId);

    /**
     * Deletes all used backup codes for a specific user.
     * 
     * Used for cleanup to remove old used codes.
     * 
     * @param userId The user's ID
     * @return Number of used backup codes deleted
     */
    @Modifying
    @Query("DELETE FROM BackupCode bc WHERE bc.user.id = :userId AND bc.used = true")
    int deleteUsedByUserId(@Param("userId") UUID userId);

    /**
     * Finds backup codes created before a specific date.
     * 
     * Used for cleanup of old backup codes.
     * 
     * @param date The cutoff date
     * @return List of old backup codes
     */
    @Query("SELECT bc FROM BackupCode bc WHERE bc.createdAt < :date")
    List<BackupCode> findCreatedBefore(@Param("date") LocalDateTime date);

    /**
     * Deletes backup codes created before a specific date.
     * 
     * Used for periodic cleanup of old backup codes.
     * 
     * @param date The cutoff date
     * @return Number of backup codes deleted
     */
    @Modifying
    @Query("DELETE FROM BackupCode bc WHERE bc.createdAt < :date")
    int deleteCreatedBefore(@Param("date") LocalDateTime date);

    /**
     * Checks if a user has any unused backup codes.
     * 
     * @param userId The user's ID
     * @return true if the user has at least one unused backup code, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(bc) > 0 THEN true ELSE false END FROM BackupCode bc WHERE bc.user.id = :userId AND bc.used = false")
    boolean hasUnusedCodes(@Param("userId") UUID userId);
}