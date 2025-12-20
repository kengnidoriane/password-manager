package com.passwordmanager.backend.repository;

import com.passwordmanager.backend.entity.SyncHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for SyncHistory entity operations.
 * 
 * Provides data access methods for sync history tracking,
 * including queries for monitoring and debugging sync operations.
 * 
 * Requirements: 3.5, 6.1, 6.3
 */
@Repository
public interface SyncHistoryRepository extends JpaRepository<SyncHistory, UUID> {

    /**
     * Finds sync history entries for a specific user.
     * 
     * @param userId the user ID
     * @param pageable pagination information
     * @return page of sync history entries
     */
    @Query("SELECT sh FROM SyncHistory sh WHERE sh.user.id = :userId ORDER BY sh.createdAt DESC")
    Page<SyncHistory> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Finds sync history entries for a user within a date range.
     * 
     * @param userId the user ID
     * @param startDate start of date range
     * @param endDate end of date range
     * @param pageable pagination information
     * @return page of sync history entries
     */
    @Query("SELECT sh FROM SyncHistory sh WHERE sh.user.id = :userId " +
           "AND sh.createdAt >= :startDate AND sh.createdAt <= :endDate " +
           "ORDER BY sh.createdAt DESC")
    Page<SyncHistory> findByUserIdAndDateRange(@Param("userId") UUID userId,
                                               @Param("startDate") LocalDateTime startDate,
                                               @Param("endDate") LocalDateTime endDate,
                                               Pageable pageable);

    /**
     * Finds sync history entries with conflicts for a user.
     * 
     * @param userId the user ID
     * @param pageable pagination information
     * @return page of sync history entries with conflicts
     */
    @Query("SELECT sh FROM SyncHistory sh WHERE sh.user.id = :userId " +
           "AND sh.conflictsDetected > 0 ORDER BY sh.createdAt DESC")
    Page<SyncHistory> findByUserIdWithConflicts(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Finds failed sync attempts for a user.
     * 
     * @param userId the user ID
     * @param pageable pagination information
     * @return page of failed sync history entries
     */
    @Query("SELECT sh FROM SyncHistory sh WHERE sh.user.id = :userId " +
           "AND sh.syncStatus = 'FAILED' ORDER BY sh.createdAt DESC")
    Page<SyncHistory> findFailedSyncsByUserId(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Gets the most recent sync for a user.
     * 
     * @param userId the user ID
     * @return the most recent sync history entry
     */
    @Query("SELECT sh FROM SyncHistory sh WHERE sh.user.id = :userId " +
           "ORDER BY sh.createdAt DESC LIMIT 1")
    SyncHistory findMostRecentByUserId(@Param("userId") UUID userId);

    /**
     * Gets sync statistics for a user within a date range.
     * 
     * @param userId the user ID
     * @param startDate start of date range
     * @param endDate end of date range
     * @return list of sync statistics
     */
    @Query("SELECT " +
           "COUNT(sh) as totalSyncs, " +
           "SUM(sh.entriesProcessed) as totalEntriesProcessed, " +
           "SUM(sh.conflictsDetected) as totalConflicts, " +
           "AVG(sh.syncDurationMs) as avgSyncDuration, " +
           "COUNT(CASE WHEN sh.syncStatus = 'FAILED' THEN 1 END) as failedSyncs " +
           "FROM SyncHistory sh WHERE sh.user.id = :userId " +
           "AND sh.createdAt >= :startDate AND sh.createdAt <= :endDate")
    Object[] getSyncStatistics(@Param("userId") UUID userId,
                              @Param("startDate") LocalDateTime startDate,
                              @Param("endDate") LocalDateTime endDate);

    /**
     * Finds sync history entries by sync status.
     * 
     * @param userId the user ID
     * @param status the sync status
     * @param pageable pagination information
     * @return page of sync history entries with the specified status
     */
    @Query("SELECT sh FROM SyncHistory sh WHERE sh.user.id = :userId " +
           "AND sh.syncStatus = :status ORDER BY sh.createdAt DESC")
    Page<SyncHistory> findByUserIdAndStatus(@Param("userId") UUID userId,
                                           @Param("status") SyncHistory.SyncStatus status,
                                           Pageable pageable);

    /**
     * Finds recent sync history entries for monitoring.
     * 
     * @param hours number of hours to look back
     * @return list of recent sync history entries
     */
    @Query("SELECT sh FROM SyncHistory sh WHERE sh.createdAt >= :since " +
           "ORDER BY sh.createdAt DESC")
    List<SyncHistory> findRecentSyncs(@Param("since") LocalDateTime since);

    /**
     * Counts sync operations for a user within a time period.
     * 
     * @param userId the user ID
     * @param since the start time
     * @return count of sync operations
     */
    @Query("SELECT COUNT(sh) FROM SyncHistory sh WHERE sh.user.id = :userId " +
           "AND sh.createdAt >= :since")
    long countSyncsSince(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    /**
     * Finds sync history entries with high conflict rates.
     * 
     * @param minConflicts minimum number of conflicts
     * @param pageable pagination information
     * @return page of sync history entries with high conflicts
     */
    @Query("SELECT sh FROM SyncHistory sh WHERE sh.conflictsDetected >= :minConflicts " +
           "ORDER BY sh.conflictsDetected DESC, sh.createdAt DESC")
    Page<SyncHistory> findHighConflictSyncs(@Param("minConflicts") int minConflicts, Pageable pageable);

    /**
     * Finds sync history entries with long duration.
     * 
     * @param minDurationMs minimum duration in milliseconds
     * @param pageable pagination information
     * @return page of slow sync history entries
     */
    @Query("SELECT sh FROM SyncHistory sh WHERE sh.syncDurationMs >= :minDurationMs " +
           "ORDER BY sh.syncDurationMs DESC, sh.createdAt DESC")
    Page<SyncHistory> findSlowSyncs(@Param("minDurationMs") long minDurationMs, Pageable pageable);

    /**
     * Deletes old sync history entries for cleanup.
     * 
     * @param cutoffDate entries older than this date will be deleted
     * @return number of deleted entries
     */
    @Query("DELETE FROM SyncHistory sh WHERE sh.createdAt < :cutoffDate")
    int deleteOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Gets average sync duration for a user.
     * 
     * @param userId the user ID
     * @param since start time for calculation
     * @return average sync duration in milliseconds
     */
    @Query("SELECT AVG(sh.syncDurationMs) FROM SyncHistory sh WHERE sh.user.id = :userId " +
           "AND sh.createdAt >= :since AND sh.syncStatus = 'SUCCESS'")
    Double getAverageSyncDuration(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    /**
     * Gets sync success rate for a user.
     * 
     * @param userId the user ID
     * @param since start time for calculation
     * @return success rate as a percentage (0.0 to 1.0)
     */
    @Query("SELECT " +
           "CAST(COUNT(CASE WHEN sh.syncStatus = 'SUCCESS' THEN 1 END) AS DOUBLE) / COUNT(sh) " +
           "FROM SyncHistory sh WHERE sh.user.id = :userId AND sh.createdAt >= :since")
    Double getSyncSuccessRate(@Param("userId") UUID userId, @Param("since") LocalDateTime since);
}