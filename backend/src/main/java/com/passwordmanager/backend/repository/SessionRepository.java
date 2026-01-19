package com.passwordmanager.backend.repository;

import com.passwordmanager.backend.entity.Session;
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
 * Repository interface for Session entity operations.
 * 
 * Provides data access methods for session management and tracking.
 * This serves as a fallback when Redis is unavailable.
 * 
 * Requirements: 2.2, 2.5
 */
@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    /**
     * Finds a session by its token.
     * 
     * Used for authentication to validate session tokens.
     * 
     * @param sessionToken The session token to search for
     * @return Optional containing the session if found, empty otherwise
     */
    Optional<Session> findBySessionToken(String sessionToken);

    /**
     * Finds an active session by its token.
     * 
     * More efficient than findBySessionToken when only active sessions are needed.
     * 
     * @param sessionToken The session token to search for
     * @return Optional containing the active session if found, empty otherwise
     */
    Optional<Session> findBySessionTokenAndIsActiveTrue(String sessionToken);

    /**
     * Finds all active sessions for a specific user.
     * 
     * Used for displaying active sessions to users and enforcing
     * maximum concurrent session limits.
     * 
     * @param userId The user's ID
     * @return List of active sessions for the user
     */
    @Query("SELECT s FROM Session s WHERE s.user.id = :userId AND s.isActive = true")
    List<Session> findActiveSessionsByUserId(@Param("userId") UUID userId);

    /**
     * Finds all sessions (active and inactive) for a specific user.
     * 
     * Used for session history and security auditing.
     * 
     * @param userId The user's ID
     * @return List of all sessions for the user
     */
    @Query("SELECT s FROM Session s WHERE s.user.id = :userId ORDER BY s.createdAt DESC")
    List<Session> findAllSessionsByUserId(@Param("userId") UUID userId);

    /**
     * Counts the number of active sessions for a user.
     * 
     * Used for enforcing maximum concurrent session limits.
     * 
     * @param userId The user's ID
     * @return Count of active sessions
     */
    @Query("SELECT COUNT(s) FROM Session s WHERE s.user.id = :userId AND s.isActive = true")
    long countActiveSessionsByUserId(@Param("userId") UUID userId);

    /**
     * Finds all expired sessions that are still marked as active.
     * 
     * Used for cleanup jobs to invalidate expired sessions.
     * 
     * @param currentTime The current timestamp
     * @return List of expired but still active sessions
     */
    @Query("SELECT s FROM Session s WHERE s.isActive = true AND s.expiresAt < :currentTime")
    List<Session> findExpiredActiveSessions(@Param("currentTime") LocalDateTime currentTime);

    /**
     * Finds sessions that have been inactive for longer than a specified duration.
     * 
     * @param inactiveThreshold The timestamp threshold for inactivity
     * @return List of inactive sessions
     */
    @Query("SELECT s FROM Session s WHERE s.isActive = true AND s.lastActivityAt < :inactiveThreshold")
    List<Session> findInactiveSessions(@Param("inactiveThreshold") LocalDateTime inactiveThreshold);

    /**
     * Invalidates all active sessions for a specific user.
     * 
     * Used when a user logs out from all devices or when security requires
     * terminating all sessions (e.g., password change, security breach).
     * 
     * @param userId The user's ID
     * @return Number of sessions invalidated
     */
    @Modifying
    @Query("UPDATE Session s SET s.isActive = false WHERE s.user.id = :userId AND s.isActive = true")
    int invalidateAllUserSessions(@Param("userId") UUID userId);

    /**
     * Invalidates a specific session by its token.
     * 
     * Used for logout functionality.
     * 
     * @param sessionToken The session token to invalidate
     * @return Number of sessions invalidated (should be 0 or 1)
     */
    @Modifying
    @Query("UPDATE Session s SET s.isActive = false WHERE s.sessionToken = :sessionToken")
    int invalidateSessionByToken(@Param("sessionToken") String sessionToken);

    /**
     * Invalidates all expired sessions.
     * 
     * Used by cleanup jobs to mark expired sessions as inactive.
     * 
     * @param currentTime The current timestamp
     * @return Number of sessions invalidated
     */
    @Modifying
    @Query("UPDATE Session s SET s.isActive = false WHERE s.isActive = true AND s.expiresAt < :currentTime")
    int invalidateExpiredSessions(@Param("currentTime") LocalDateTime currentTime);

    /**
     * Deletes inactive sessions older than a specified date.
     * 
     * Used for database cleanup to remove old session records.
     * 
     * @param date The cutoff date for deletion
     * @return Number of sessions deleted
     */
    @Modifying
    @Query("DELETE FROM Session s WHERE s.isActive = false AND s.createdAt < :date")
    int deleteInactiveSessionsOlderThan(@Param("date") LocalDateTime date);

    /**
     * Finds sessions by IP address.
     * 
     * Useful for security analysis and detecting suspicious activity.
     * 
     * @param ipAddress The IP address to search for
     * @return List of sessions from the specified IP address
     */
    List<Session> findByIpAddress(String ipAddress);

    /**
     * Finds recent sessions for a user within a time window.
     * 
     * Used for security monitoring and detecting unusual login patterns.
     * 
     * @param userId The user's ID
     * @param since The start of the time window
     * @return List of recent sessions
     */
    @Query("SELECT s FROM Session s WHERE s.user.id = :userId AND s.createdAt >= :since ORDER BY s.createdAt DESC")
    List<Session> findRecentSessionsByUserId(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    /**
     * Checks if a session exists and is valid (active and not expired).
     * 
     * @param sessionToken The session token to check
     * @param currentTime The current timestamp
     * @return true if a valid session exists, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Session s " +
           "WHERE s.sessionToken = :sessionToken AND s.isActive = true AND s.expiresAt > :currentTime")
    boolean existsValidSession(@Param("sessionToken") String sessionToken, @Param("currentTime") LocalDateTime currentTime);

    /**
     * Counts active sessions that expire after the given time.
     * 
     * Used for metrics to track currently active sessions.
     * 
     * @param currentTime The current timestamp
     * @return Count of active sessions
     */
    @Query("SELECT COUNT(s) FROM Session s WHERE s.isActive = true AND s.expiresAt > :currentTime")
    long countByExpiresAtAfter(@Param("currentTime") LocalDateTime currentTime);

    /**
     * Counts sessions created after a specific date.
     * 
     * @param date the date to search from
     * @return count of sessions created after the specified date
     */
    @Query("SELECT COUNT(s) FROM Session s WHERE s.createdAt > :date")
    long countByCreatedAtAfter(@Param("date") LocalDateTime date);
}
