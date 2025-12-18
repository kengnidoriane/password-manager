package com.passwordmanager.backend.repository;

import com.passwordmanager.backend.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for UserAccount entity operations.
 * 
 * Provides data access methods for user authentication and account management.
 * Uses Spring Data JPA for automatic query generation and custom queries.
 * 
 * Requirements: 1.1, 2.1
 */
@Repository
public interface UserRepository extends JpaRepository<UserAccount, UUID> {

    /**
     * Finds a user by email address.
     * 
     * Used for authentication and checking if an email is already registered.
     * 
     * @param email The email address to search for
     * @return Optional containing the user if found, empty otherwise
     */
    Optional<UserAccount> findByEmail(String email);

    /**
     * Checks if a user with the given email exists.
     * 
     * More efficient than findByEmail when only existence check is needed.
     * 
     * @param email The email address to check
     * @return true if a user with this email exists, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * Finds all users who have two-factor authentication enabled.
     * 
     * Useful for security audits and 2FA statistics.
     * 
     * @return List of users with 2FA enabled
     */
    List<UserAccount> findByTwoFactorEnabledTrue();

    /**
     * Finds all users who have verified their email address.
     * 
     * @return List of users with verified emails
     */
    List<UserAccount> findByEmailVerifiedTrue();

    /**
     * Finds all users who have not verified their email address.
     * 
     * Useful for sending reminder emails or cleanup of unverified accounts.
     * 
     * @return List of users with unverified emails
     */
    List<UserAccount> findByEmailVerifiedFalse();

    /**
     * Finds users created after a specific date.
     * 
     * Useful for analytics and reporting on user growth.
     * 
     * @param date The date to search from
     * @return List of users created after the specified date
     */
    List<UserAccount> findByCreatedAtAfter(LocalDateTime date);

    /**
     * Finds users who have logged in after a specific date.
     * 
     * Useful for identifying active users and inactive account cleanup.
     * 
     * @param date The date to search from
     * @return List of users who logged in after the specified date
     */
    List<UserAccount> findByLastLoginAtAfter(LocalDateTime date);

    /**
     * Finds users who have never logged in or haven't logged in since a specific date.
     * 
     * Useful for identifying inactive accounts for cleanup or re-engagement campaigns.
     * 
     * @param date The date threshold
     * @return List of inactive users
     */
    @Query("SELECT u FROM UserAccount u WHERE u.lastLoginAt IS NULL OR u.lastLoginAt < :date")
    List<UserAccount> findInactiveUsersSince(@Param("date") LocalDateTime date);

    /**
     * Counts the number of users with two-factor authentication enabled.
     * 
     * @return Count of users with 2FA enabled
     */
    long countByTwoFactorEnabledTrue();

    /**
     * Counts the number of users with verified email addresses.
     * 
     * @return Count of users with verified emails
     */
    long countByEmailVerifiedTrue();

    /**
     * Finds users by email domain.
     * 
     * Useful for organizational analytics or identifying corporate accounts.
     * 
     * @param domain The email domain to search for (e.g., "example.com")
     * @return List of users with emails from the specified domain
     */
    @Query("SELECT u FROM UserAccount u WHERE u.email LIKE %:domain")
    List<UserAccount> findByEmailDomain(@Param("domain") String domain);

    /**
     * Deletes users who have not verified their email within a specified time period.
     * 
     * Used for cleanup of abandoned registrations.
     * 
     * @param date The cutoff date for unverified accounts
     * @return Number of deleted accounts
     */
    @Query("DELETE FROM UserAccount u WHERE u.emailVerified = false AND u.createdAt < :date")
    int deleteUnverifiedAccountsOlderThan(@Param("date") LocalDateTime date);
}
