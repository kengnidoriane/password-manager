package com.passwordmanager.backend.service;

import com.passwordmanager.backend.entity.SharedCredential;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.repository.SharedCredentialRepository;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing credential sharing operations.
 * 
 * Handles secure sharing of credentials between users using public key encryption.
 * Provides functionality for sharing, accessing, and revoking shared credentials.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SharingService {

    private final SharedCredentialRepository sharedCredentialRepository;
    private final UserRepository userRepository;
    private final VaultRepository vaultRepository;
    private final AuditLogService auditLogService;

    /**
     * Share a credential with another user
     * 
     * @param ownerId ID of the user sharing the credential
     * @param recipientId ID of the user receiving the shared credential
     * @param vaultEntryId ID of the credential to share
     * @param encryptedData Credential data encrypted with recipient's public key
     * @param iv Initialization vector for encryption
     * @param authTag Authentication tag for encryption integrity
     * @param permissions List of permissions (read, write, share)
     * @return The created SharedCredential
     */
    public SharedCredential shareCredential(UUID ownerId, UUID recipientId, UUID vaultEntryId,
                                          String encryptedData, String iv, String authTag,
                                          List<String> permissions) {
        log.info("Sharing credential {} from user {} to user {}", vaultEntryId, ownerId, recipientId);

        // Validate users exist
        UserAccount owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Owner not found"));
        UserAccount recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new IllegalArgumentException("Recipient not found"));

        // Validate vault entry exists and belongs to owner
        VaultEntry vaultEntry = vaultRepository.findActiveByIdAndUserId(vaultEntryId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Credential not found or not owned by user"));

        // Check if already shared with this user
        if (sharedCredentialRepository.existsActiveShare(ownerId, recipientId, vaultEntryId)) {
            throw new IllegalArgumentException("Credential is already shared with this user");
        }

        // Validate permissions
        validatePermissions(permissions);

        // Create shared credential
        SharedCredential sharedCredential = SharedCredential.builder()
                .owner(owner)
                .recipient(recipient)
                .vaultEntry(vaultEntry)
                .encryptedData(encryptedData)
                .iv(iv)
                .authTag(authTag)
                .permissions(permissions)
                .build();

        SharedCredential saved = sharedCredentialRepository.save(sharedCredential);

        // Log the sharing action
        auditLogService.logShareCreated(ownerId, recipientId, vaultEntryId, saved.getId());

        log.info("Successfully shared credential {} with user {}", vaultEntryId, recipientId);
        return saved;
    }

    /**
     * Access a shared credential (for recipients)
     * 
     * @param recipientId ID of the user accessing the shared credential
     * @param shareId ID of the shared credential
     * @return The shared credential with updated access timestamp
     */
    @Transactional
    public SharedCredential accessSharedCredential(UUID recipientId, UUID shareId) {
        log.debug("User {} accessing shared credential {}", recipientId, shareId);

        SharedCredential sharedCredential = sharedCredentialRepository.findActiveByIdAndRecipient(shareId, recipientId)
                .orElseThrow(() -> new IllegalArgumentException("Shared credential not found or access denied"));

        // Update last accessed timestamp
        sharedCredential.updateLastAccessed();
        SharedCredential updated = sharedCredentialRepository.save(sharedCredential);

        // Log the access
        auditLogService.logShareAccess(recipientId, shareId, sharedCredential.getVaultEntry().getId());

        log.debug("Successfully accessed shared credential {}", shareId);
        return updated;
    }

    /**
     * Revoke access to a shared credential
     * 
     * @param ownerId ID of the owner revoking access
     * @param shareId ID of the shared credential to revoke
     */
    public void revokeSharedCredential(UUID ownerId, UUID shareId) {
        log.info("User {} revoking shared credential {}", ownerId, shareId);

        SharedCredential sharedCredential = sharedCredentialRepository.findByIdAndOwner(shareId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Shared credential not found or not owned by user"));

        if (!sharedCredential.isActive()) {
            throw new IllegalArgumentException("Shared credential is already revoked");
        }

        // Revoke the share
        sharedCredential.revoke();
        sharedCredentialRepository.save(sharedCredential);

        // Log the revocation
        auditLogService.logShareRevoked(ownerId, sharedCredential.getRecipient().getId(), 
                                       sharedCredential.getVaultEntry().getId(), shareId);

        log.info("Successfully revoked shared credential {}", shareId);
    }

    /**
     * Get all credentials shared with a user
     * 
     * @param recipientId ID of the recipient user
     * @return List of shared credentials
     */
    @Transactional(readOnly = true)
    public List<SharedCredential> getSharedWithMe(UUID recipientId) {
        log.debug("Getting credentials shared with user {}", recipientId);
        return sharedCredentialRepository.findActiveByRecipient(recipientId);
    }

    /**
     * Get all credentials shared by a user
     * 
     * @param ownerId ID of the owner user
     * @return List of shared credentials
     */
    @Transactional(readOnly = true)
    public List<SharedCredential> getSharedByMe(UUID ownerId) {
        log.debug("Getting credentials shared by user {}", ownerId);
        return sharedCredentialRepository.findActiveByOwner(ownerId);
    }

    /**
     * Get all active shares for a specific vault entry
     * 
     * @param vaultEntryId ID of the vault entry
     * @return List of shared credentials
     */
    @Transactional(readOnly = true)
    public List<SharedCredential> getSharesForCredential(UUID vaultEntryId) {
        return sharedCredentialRepository.findActiveByVaultEntry(vaultEntryId);
    }

    /**
     * Update shared credentials when the original credential is modified
     * This is called when a credential with write permissions is updated
     * 
     * @param vaultEntryId ID of the updated vault entry
     * @param newEncryptedData New encrypted data for each recipient
     */
    public void updateSharedCredentials(UUID vaultEntryId, String newEncryptedData) {
        log.info("Updating shared credentials for vault entry {}", vaultEntryId);

        List<SharedCredential> writableShares = sharedCredentialRepository.findWritableSharesByVaultEntry(vaultEntryId);
        
        for (SharedCredential share : writableShares) {
            // In a real implementation, you would re-encrypt the data with each recipient's public key
            // For now, we'll just update the timestamp to indicate the share needs attention
            share.setUpdatedAt(LocalDateTime.now());
            sharedCredentialRepository.save(share);
            
            // Log the update
            auditLogService.logShareUpdated(share.getOwner().getId(), share.getRecipient().getId(), 
                                          vaultEntryId, share.getId());
        }

        log.info("Updated {} shared credentials for vault entry {}", writableShares.size(), vaultEntryId);
    }

    /**
     * Share a credential with another user by email
     * 
     * @param ownerId ID of the user sharing the credential
     * @param credentialId ID of the credential to share
     * @param recipientEmail Email of the user receiving the shared credential
     * @param permissions List of permissions (read, write, share)
     * @param encryptedData Credential data encrypted with recipient's public key
     * @param iv Initialization vector for encryption
     * @param authTag Authentication tag for encryption integrity
     * @return The created SharedCredential
     */
    public SharedCredential shareCredential(UUID ownerId, UUID credentialId, String recipientEmail,
                                          List<String> permissions, String encryptedData, 
                                          String iv, String authTag) {
        log.info("Sharing credential {} from user {} to {}", credentialId, ownerId, recipientEmail);

        // Find recipient by email
        UserAccount recipient = userRepository.findByEmail(recipientEmail)
                .orElseThrow(() -> new IllegalArgumentException("Recipient not found: " + recipientEmail));

        return shareCredential(ownerId, recipient.getId(), credentialId, encryptedData, iv, authTag, permissions);
    }

    /**
     * Get all credentials shared with a user (alias for getSharedWithMe)
     */
    public List<SharedCredential> getSharedCredentialsForRecipient(UUID recipientId) {
        return getSharedWithMe(recipientId);
    }

    /**
     * Get all credentials shared by a user (alias for getSharedByMe)
     */
    public List<SharedCredential> getSharedCredentialsByOwner(UUID ownerId) {
        return getSharedByMe(ownerId);
    }

    /**
     * Revoke sharing (alias for revokeSharedCredential)
     */
    public void revokeSharing(UUID ownerId, UUID shareId) {
        revokeSharedCredential(ownerId, shareId);
    }

    /**
     * Update permissions for a shared credential
     * 
     * @param ownerId ID of the owner updating permissions
     * @param shareId ID of the shared credential
     * @param permissions New list of permissions
     * @return Updated SharedCredential
     */
    public SharedCredential updatePermissions(UUID ownerId, UUID shareId, List<String> permissions) {
        log.info("User {} updating permissions for shared credential {}", ownerId, shareId);

        SharedCredential sharedCredential = sharedCredentialRepository.findByIdAndOwner(shareId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Shared credential not found or not owned by user"));

        if (!sharedCredential.isActive()) {
            throw new IllegalArgumentException("Cannot update permissions for revoked share");
        }

        // Validate permissions
        validatePermissions(permissions);

        // Update permissions
        sharedCredential.setPermissions(permissions);
        sharedCredential.setUpdatedAt(LocalDateTime.now());
        SharedCredential updated = sharedCredentialRepository.save(sharedCredential);

        // Log the permission update
        auditLogService.logShareUpdated(ownerId, sharedCredential.getRecipient().getId(), 
                                       sharedCredential.getVaultEntry().getId(), shareId);

        log.info("Successfully updated permissions for shared credential {}", shareId);
        return updated;
    }

    /**
     * Clean up unused shared credentials
     * Revokes shares that haven't been accessed for a specified period
     * 
     * @param unusedDays Number of days of inactivity before considering a share unused
     * @return Number of shares revoked
     */
    public int cleanupUnusedShares(int unusedDays) {
        log.info("Cleaning up shared credentials unused for {} days", unusedDays);

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(unusedDays);
        List<SharedCredential> unusedShares = sharedCredentialRepository.findUnusedSince(cutoffDate);

        int revokedCount = 0;
        for (SharedCredential share : unusedShares) {
            share.revoke();
            sharedCredentialRepository.save(share);
            
            // Log the cleanup revocation
            auditLogService.logShareRevoked(share.getOwner().getId(), share.getRecipient().getId(),
                                          share.getVaultEntry().getId(), share.getId());
            revokedCount++;
        }

        log.info("Revoked {} unused shared credentials", revokedCount);
        return revokedCount;
    }

    /**
     * Validate that the provided permissions are valid
     */
    private void validatePermissions(List<String> permissions) {
        if (permissions == null || permissions.isEmpty()) {
            throw new IllegalArgumentException("At least one permission must be specified");
        }

        List<String> validPermissions = List.of("read", "write", "share");
        for (String permission : permissions) {
            if (!validPermissions.contains(permission)) {
                throw new IllegalArgumentException("Invalid permission: " + permission);
            }
        }
    }
}