package com.passwordmanager.backend.repository;

import com.passwordmanager.backend.entity.SharedCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for managing shared credentials.
 * 
 * Provides data access methods for credential sharing operations
 * including creation, retrieval, and revocation of shared credentials.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
@Repository
public interface SharedCredentialRepository extends JpaRepository<SharedCredential, UUID> {

    /**
     * Find active shared credential by ID and recipient
     */
    @Query("SELECT sc FROM SharedCredential sc WHERE sc.id = :shareId AND sc.recipient.id = :recipientId AND sc.revokedAt IS NULL")
    Optional<SharedCredential> findActiveByIdAndRecipient(@Param("shareId") UUID shareId, @Param("recipientId") UUID recipientId);

    /**
     * Find active shared credential by owner, recipient, and vault entry
     */
    @Query("SELECT sc FROM SharedCredential sc WHERE sc.owner.id = :ownerId AND sc.recipient.id = :recipientId AND sc.vaultEntry.id = :vaultEntryId AND sc.revokedAt IS NULL")
    Optional<SharedCredential> findActiveByOwnerAndRecipientAndVaultEntry(
            @Param("ownerId") UUID ownerId, 
            @Param("recipientId") UUID recipientId, 
            @Param("vaultEntryId") UUID vaultEntryId);

    /**
     * Find all active credentials shared with a specific user
     */
    @Query("SELECT sc FROM SharedCredential sc WHERE sc.recipient.id = :recipientId AND sc.revokedAt IS NULL ORDER BY sc.createdAt DESC")
    List<SharedCredential> findActiveByRecipient(@Param("recipientId") UUID recipientId);

    /**
     * Find all active credentials shared by a specific user
     */
    @Query("SELECT sc FROM SharedCredential sc WHERE sc.owner.id = :ownerId AND sc.revokedAt IS NULL ORDER BY sc.createdAt DESC")
    List<SharedCredential> findActiveByOwner(@Param("ownerId") UUID ownerId);

    /**
     * Find all active shares for a specific vault entry
     */
    @Query("SELECT sc FROM SharedCredential sc WHERE sc.vaultEntry.id = :vaultEntryId AND sc.revokedAt IS NULL")
    List<SharedCredential> findActiveByVaultEntry(@Param("vaultEntryId") UUID vaultEntryId);

    /**
     * Find shared credential by ID and owner (for revocation)
     */
    @Query("SELECT sc FROM SharedCredential sc WHERE sc.id = :shareId AND sc.owner.id = :ownerId")
    Optional<SharedCredential> findByIdAndOwner(@Param("shareId") UUID shareId, @Param("ownerId") UUID ownerId);

    /**
     * Count active shares for a vault entry
     */
    @Query("SELECT COUNT(sc) FROM SharedCredential sc WHERE sc.vaultEntry.id = :vaultEntryId AND sc.revokedAt IS NULL")
    long countActiveByVaultEntry(@Param("vaultEntryId") UUID vaultEntryId);

    /**
     * Find recently accessed shared credentials for a recipient
     */
    @Query("SELECT sc FROM SharedCredential sc WHERE sc.recipient.id = :recipientId AND sc.revokedAt IS NULL AND sc.lastAccessedAt IS NOT NULL ORDER BY sc.lastAccessedAt DESC")
    List<SharedCredential> findRecentlyAccessedByRecipient(@Param("recipientId") UUID recipientId);

    /**
     * Find shared credentials that haven't been accessed for a certain period
     */
    @Query("SELECT sc FROM SharedCredential sc WHERE sc.revokedAt IS NULL AND (sc.lastAccessedAt IS NULL OR sc.lastAccessedAt < :cutoffDate)")
    List<SharedCredential> findUnusedSince(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Check if a credential is already shared with a specific user
     */
    @Query("SELECT COUNT(sc) > 0 FROM SharedCredential sc WHERE sc.owner.id = :ownerId AND sc.recipient.id = :recipientId AND sc.vaultEntry.id = :vaultEntryId AND sc.revokedAt IS NULL")
    boolean existsActiveShare(@Param("ownerId") UUID ownerId, @Param("recipientId") UUID recipientId, @Param("vaultEntryId") UUID vaultEntryId);

    /**
     * Find all shares that need to be updated when a vault entry changes
     */
    @Query("SELECT sc FROM SharedCredential sc WHERE sc.vaultEntry.id = :vaultEntryId AND sc.revokedAt IS NULL AND 'write' MEMBER OF sc.permissions")
    List<SharedCredential> findWritableSharesByVaultEntry(@Param("vaultEntryId") UUID vaultEntryId);
}