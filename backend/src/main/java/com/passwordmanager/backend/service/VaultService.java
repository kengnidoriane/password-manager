package com.passwordmanager.backend.service;

import com.passwordmanager.backend.dto.CredentialRequest;
import com.passwordmanager.backend.dto.CredentialResponse;
import com.passwordmanager.backend.entity.Folder;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.repository.FolderRepository;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import jakarta.persistence.OptimisticLockException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing vault operations including credentials, secure notes, folders, and tags.
 * 
 * This service provides:
 * - CRUD operations for vault entries with user isolation
 * - Soft delete functionality with 30-day trash retention
 * - Version control for conflict resolution during sync
 * - Hierarchical folder organization
 * - Zero-knowledge architecture compliance
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
@Service
@Transactional
public class VaultService {

    private static final Logger logger = LoggerFactory.getLogger(VaultService.class);

    private final VaultRepository vaultRepository;
    private final UserRepository userRepository;
    private final FolderRepository folderRepository;

    public VaultService(VaultRepository vaultRepository,
                       UserRepository userRepository,
                       FolderRepository folderRepository) {
        this.vaultRepository = vaultRepository;
        this.userRepository = userRepository;
        this.folderRepository = folderRepository;
    }

    /**
     * Retrieves all active vault entries for a user.
     * 
     * @param userId the user ID
     * @return list of credential responses
     * @throws IllegalArgumentException if user not found
     */
    @Transactional(readOnly = true)
    public List<CredentialResponse> getAllCredentials(UUID userId) {
        logger.debug("Retrieving all credentials for user: {}", userId);

        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found: " + userId);
        }

        List<VaultEntry> entries = vaultRepository.findActiveCredentialsByUserId(userId);
        
        List<CredentialResponse> responses = entries.stream()
                .map(CredentialResponse::fromEntity)
                .collect(Collectors.toList());

        logger.debug("Retrieved {} credentials for user: {}", responses.size(), userId);
        
        return responses;
    }

    /**
     * Creates a new credential entry.
     * 
     * @param userId the user ID
     * @param request the credential request
     * @return the created credential response
     * @throws IllegalArgumentException if validation fails
     */
    public CredentialResponse createCredential(UUID userId, CredentialRequest request) {
        logger.debug("Creating credential for user: {}", userId);

        // Validate request
        validateCredentialRequest(request, false);

        // Get user
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Validate folder if specified
        Folder folder = null;
        if (request.getFolderId() != null) {
            folder = folderRepository.findByIdAndUserId(request.getFolderId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + request.getFolderId()));
        }

        // Create vault entry
        VaultEntry entry = VaultEntry.builder()
                .user(user)
                .encryptedData(request.getEncryptedData())
                .iv(request.getIv())
                .authTag(request.getAuthTag())
                .entryType(VaultEntry.EntryType.CREDENTIAL)
                .folder(folder)
                .version(1L)
                .build();

        VaultEntry savedEntry = vaultRepository.save(entry);
        
        logger.info("Created credential {} for user: {}", savedEntry.getId(), userId);
        
        return CredentialResponse.fromEntity(savedEntry);
    }

    /**
     * Updates an existing credential entry with version control.
     * 
     * @param userId the user ID
     * @param credentialId the credential ID
     * @param request the update request
     * @return the updated credential response
     * @throws IllegalArgumentException if validation fails
     * @throws OptimisticLockingFailureException if version conflict occurs
     */
    public CredentialResponse updateCredential(UUID userId, UUID credentialId, CredentialRequest request) {
        logger.debug("Updating credential {} for user: {}", credentialId, userId);

        // Validate request
        validateCredentialRequest(request, true);

        // Get existing entry
        VaultEntry existingEntry = vaultRepository.findActiveByIdAndUserId(credentialId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Credential not found: " + credentialId));

        // Check version for optimistic locking
        if (!existingEntry.getVersion().equals(request.getVersion())) {
            logger.warn("Version conflict for credential {}: expected {}, got {}", 
                       credentialId, existingEntry.getVersion(), request.getVersion());
            throw new OptimisticLockingFailureException("Version conflict - credential was modified by another process");
        }

        // Validate folder if specified
        Folder folder = null;
        if (request.getFolderId() != null) {
            folder = folderRepository.findByIdAndUserId(request.getFolderId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + request.getFolderId()));
        }

        // Update entry
        existingEntry.setEncryptedData(request.getEncryptedData());
        existingEntry.setIv(request.getIv());
        existingEntry.setAuthTag(request.getAuthTag());
        existingEntry.setFolder(folder);
        // Version will be automatically incremented by JPA @Version

        try {
            VaultEntry updatedEntry = vaultRepository.save(existingEntry);
            
            logger.info("Updated credential {} for user: {} (version {} -> {})", 
                       credentialId, userId, request.getVersion(), updatedEntry.getVersion());
            
            return CredentialResponse.fromEntity(updatedEntry);
            
        } catch (OptimisticLockException e) {
            logger.warn("Optimistic lock exception updating credential {}: {}", credentialId, e.getMessage());
            throw new OptimisticLockingFailureException("Version conflict - credential was modified by another process", e);
        }
    }

    /**
     * Soft deletes a credential entry (moves to trash).
     * 
     * @param userId the user ID
     * @param credentialId the credential ID
     * @throws IllegalArgumentException if credential not found
     */
    public void deleteCredential(UUID userId, UUID credentialId) {
        logger.debug("Soft deleting credential {} for user: {}", credentialId, userId);

        // Get existing entry
        VaultEntry existingEntry = vaultRepository.findActiveByIdAndUserId(credentialId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Credential not found: " + credentialId));

        // Soft delete
        existingEntry.softDelete();
        vaultRepository.save(existingEntry);
        
        logger.info("Soft deleted credential {} for user: {}", credentialId, userId);
    }

    /**
     * Gets a specific credential by ID.
     * 
     * @param userId the user ID
     * @param credentialId the credential ID
     * @return the credential response
     * @throws IllegalArgumentException if credential not found
     */
    @Transactional(readOnly = true)
    public CredentialResponse getCredential(UUID userId, UUID credentialId) {
        logger.debug("Retrieving credential {} for user: {}", credentialId, userId);

        VaultEntry entry = vaultRepository.findActiveByIdAndUserId(credentialId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Credential not found: " + credentialId));

        // Update last used timestamp
        entry.updateLastUsed();
        vaultRepository.save(entry);
        
        logger.debug("Retrieved credential {} for user: {}", credentialId, userId);
        
        return CredentialResponse.fromEntity(entry);
    }

    /**
     * Restores a credential from trash.
     * 
     * @param userId the user ID
     * @param credentialId the credential ID
     * @return the restored credential response
     * @throws IllegalArgumentException if credential not found in trash
     */
    public CredentialResponse restoreCredential(UUID userId, UUID credentialId) {
        logger.debug("Restoring credential {} for user: {}", credentialId, userId);

        // Find deleted entry
        VaultEntry entry = vaultRepository.findByIdAndUserId(credentialId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Credential not found: " + credentialId));

        if (!entry.isDeleted()) {
            throw new IllegalArgumentException("Credential is not deleted: " + credentialId);
        }

        // Restore entry
        entry.restore();
        VaultEntry restoredEntry = vaultRepository.save(entry);
        
        logger.info("Restored credential {} for user: {}", credentialId, userId);
        
        return CredentialResponse.fromEntity(restoredEntry);
    }

    /**
     * Gets all deleted credentials (trash) for a user.
     * 
     * @param userId the user ID
     * @return list of deleted credential responses
     */
    @Transactional(readOnly = true)
    public List<CredentialResponse> getDeletedCredentials(UUID userId) {
        logger.debug("Retrieving deleted credentials for user: {}", userId);

        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found: " + userId);
        }

        List<VaultEntry> deletedEntries = vaultRepository.findDeletedByUserId(userId);
        
        List<CredentialResponse> responses = deletedEntries.stream()
                .filter(entry -> entry.getEntryType() == VaultEntry.EntryType.CREDENTIAL)
                .map(CredentialResponse::fromEntity)
                .collect(Collectors.toList());

        logger.debug("Retrieved {} deleted credentials for user: {}", responses.size(), userId);
        
        return responses;
    }

    /**
     * Permanently deletes credentials that have been in trash longer than 30 days.
     * 
     * @return number of permanently deleted entries
     */
    @Transactional
    public int permanentlyDeleteExpiredCredentials() {
        logger.debug("Permanently deleting expired credentials");

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        int deletedCount = vaultRepository.permanentlyDeleteOlderThan(cutoffDate);
        
        logger.info("Permanently deleted {} expired credentials", deletedCount);
        
        return deletedCount;
    }

    /**
     * Updates the last used timestamp for a credential.
     * 
     * @param userId the user ID
     * @param credentialId the credential ID
     */
    public void updateLastUsed(UUID userId, UUID credentialId) {
        logger.debug("Updating last used timestamp for credential {} for user: {}", credentialId, userId);

        int updated = vaultRepository.updateLastUsed(credentialId, userId, LocalDateTime.now());
        
        if (updated == 0) {
            throw new IllegalArgumentException("Credential not found: " + credentialId);
        }
        
        logger.debug("Updated last used timestamp for credential {} for user: {}", credentialId, userId);
    }

    /**
     * Validates a credential request.
     * 
     * @param request the request to validate
     * @param isUpdate whether this is an update operation
     * @throws IllegalArgumentException if validation fails
     */
    private void validateCredentialRequest(CredentialRequest request, boolean isUpdate) {
        if (request == null) {
            throw new IllegalArgumentException("Credential request is required");
        }

        if (!request.hasValidEncryption()) {
            throw new IllegalArgumentException("Valid encryption data (encryptedData, iv, authTag) is required");
        }

        if (isUpdate && request.getVersion() == null) {
            throw new IllegalArgumentException("Version is required for update operations");
        }

        if (!isUpdate && request.getVersion() != null) {
            throw new IllegalArgumentException("Version should not be specified for create operations");
        }
    }
}