package com.passwordmanager.backend.repository;

import com.passwordmanager.backend.entity.AuditLog;
import com.passwordmanager.backend.entity.AuditLog.AuditAction;
import com.passwordmanager.backend.entity.UserAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for AuditLog entity.
 * 
 * Provides data access methods for audit log entries including:
 * - Querying logs by user, action type, date range
 * - Finding suspicious activities
 * - Implementing log retention policy (90 days)
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /**
     * Find all audit logs for a specific user with pagination.
     * 
     * @param user User account
     * @param pageable Pagination parameters
     * @return Page of audit logs
     */
    Page<AuditLog> findByUserOrderByTimestampDesc(UserAccount user, Pageable pageable);

    /**
     * Find audit logs for a user within a date range.
     * 
     * @param user User account
     * @param startDate Start of date range
     * @param endDate End of date range
     * @param pageable Pagination parameters
     * @return Page of audit logs
     */
    Page<AuditLog> findByUserAndTimestampBetweenOrderByTimestampDesc(
            UserAccount user, 
            LocalDateTime startDate, 
            LocalDateTime endDate, 
            Pageable pageable
    );

    /**
     * Find audit logs for a user filtered by action type.
     * 
     * @param user User account
     * @param action Action type
     * @param pageable Pagination parameters
     * @return Page of audit logs
     */
    Page<AuditLog> findByUserAndActionOrderByTimestampDesc(
            UserAccount user, 
            AuditAction action, 
            Pageable pageable
    );

    /**
     * Find audit logs for a user filtered by action type and date range.
     * 
     * @param user User account
     * @param action Action type
     * @param startDate Start of date range
     * @param endDate End of date range
     * @param pageable Pagination parameters
     * @return Page of audit logs
     */
    Page<AuditLog> findByUserAndActionAndTimestampBetweenOrderByTimestampDesc(
            UserAccount user,
            AuditAction action,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * Find suspicious activities (failed operations) for a user.
     * 
     * @param user User account
     * @param pageable Pagination parameters
     * @return Page of suspicious audit logs
     */
    Page<AuditLog> findByUserAndSuccessFalseOrderByTimestampDesc(
            UserAccount user, 
            Pageable pageable
    );

    /**
     * Find failed authentication attempts for a user.
     * 
     * @param user User account
     * @param action Action type (LOGIN_FAILED)
     * @param pageable Pagination parameters
     * @return Page of failed authentication logs
     */
    Page<AuditLog> findByUserAndActionAndSuccessFalseOrderByTimestampDesc(
            UserAccount user,
            AuditAction action,
            Pageable pageable
    );

    /**
     * Find audit logs by IP address (for detecting unusual locations).
     * 
     * @param user User account
     * @param ipAddress IP address
     * @param pageable Pagination parameters
     * @return Page of audit logs
     */
    Page<AuditLog> findByUserAndIpAddressOrderByTimestampDesc(
            UserAccount user,
            String ipAddress,
            Pageable pageable
    );

    /**
     * Find audit logs for a specific resource.
     * 
     * @param resourceType Type of resource
     * @param resourceId ID of resource
     * @param pageable Pagination parameters
     * @return Page of audit logs
     */
    Page<AuditLog> findByResourceTypeAndResourceIdOrderByTimestampDesc(
            String resourceType,
            UUID resourceId,
            Pageable pageable
    );

    /**
     * Count failed authentication attempts for a user within a time window.
     * 
     * @param user User account
     * @param action Action type (LOGIN_FAILED)
     * @param since Start of time window
     * @return Count of failed attempts
     */
    long countByUserAndActionAndTimestampAfter(
            UserAccount user,
            AuditAction action,
            LocalDateTime since
    );

    /**
     * Find recent export operations for a user (for security monitoring).
     * 
     * @param user User account
     * @param actions List of export actions
     * @param since Start of time window
     * @return List of export audit logs
     */
    List<AuditLog> findByUserAndActionInAndTimestampAfterOrderByTimestampDesc(
            UserAccount user,
            List<AuditAction> actions,
            LocalDateTime since
    );

    /**
     * Delete audit logs older than the retention period (90 days).
     * This method implements the log retention policy.
     * 
     * @param retentionDate Date before which logs should be deleted
     * @return Number of deleted logs
     */
    @Modifying
    @Query("DELETE FROM AuditLog a WHERE a.timestamp < :retentionDate")
    int deleteByTimestampBefore(@Param("retentionDate") LocalDateTime retentionDate);

    /**
     * Count audit logs older than the retention period.
     * 
     * @param retentionDate Date before which logs should be counted
     * @return Number of logs to be deleted
     */
    long countByTimestampBefore(LocalDateTime retentionDate);

    /**
     * Find all distinct IP addresses used by a user.
     * 
     * @param user User account
     * @return List of distinct IP addresses
     */
    @Query("SELECT DISTINCT a.ipAddress FROM AuditLog a WHERE a.user = :user AND a.ipAddress IS NOT NULL ORDER BY a.ipAddress")
    List<String> findDistinctIpAddressesByUser(@Param("user") UserAccount user);

    /**
     * Find all distinct device info used by a user.
     * 
     * @param user User account
     * @return List of distinct device info
     */
    @Query("SELECT DISTINCT a.deviceInfo FROM AuditLog a WHERE a.user = :user AND a.deviceInfo IS NOT NULL ORDER BY a.deviceInfo")
    List<String> findDistinctDeviceInfoByUser(@Param("user") UserAccount user);

    /**
     * Check if a user has any suspicious activity in the last N hours.
     * 
     * @param user User account
     * @param since Start of time window
     * @return True if suspicious activity exists
     */
    boolean existsByUserAndSuccessFalseAndTimestampAfter(UserAccount user, LocalDateTime since);
}
