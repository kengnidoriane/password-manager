package com.passwordmanager.backend.service;

import com.passwordmanager.backend.dto.CredentialRequest;
import com.passwordmanager.backend.dto.CredentialResponse;
import com.passwordmanager.backend.dto.FolderRequest;
import com.passwordmanager.backend.dto.FolderResponse;
import com.passwordmanager.backend.dto.TagRequest;
import com.passwordmanager.backend.dto.TagResponse;
import com.passwordmanager.backend.entity.Folder;
import com.passwordmanager.backend.entity.Tag;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.repository.FolderRepository;
import com.passwordmanager.backend.repository.TagRepository;
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
    private final TagRepository tagRepository;

    public VaultService(VaultRepository vaultRepository,
                       UserRepository userRepository,
                       FolderRepository folderRepository,
                       TagRepository tagRepository) {
        this.vaultRepository = vaultRepository;
        this.userRepository = userRepository;
        this.folderRepository = folderRepository;
        this.tagRepository = tagRepository;
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

    // ========== Folder Management ==========

    /**
     * Creates a new folder.
     * 
     * @param userId the user ID
     * @param request the folder request
     * @return the created folder response
     * @throws IllegalArgumentException if validation fails
     */
    public FolderResponse createFolder(UUID userId, FolderRequest request) {
        logger.debug("Creating folder '{}' for user: {}", request.getName(), userId);

        // Validate request
        validateFolderRequest(request, false);

        // Get user
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Validate parent folder if specified
        Folder parentFolder = null;
        if (request.getParentId() != null) {
            parentFolder = folderRepository.findActiveByIdAndUserId(request.getParentId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent folder not found: " + request.getParentId()));
            
            // Check nesting depth limit
            if (!parentFolder.canAddChildFolder()) {
                throw new IllegalArgumentException("Cannot create folder: would exceed maximum nesting depth of " + Folder.MAX_NESTING_DEPTH);
            }
        }

        // Check name uniqueness within parent
        validateFolderNameUniqueness(request.getName(), request.getParentId(), userId, null);

        // Set sort order if not specified
        Integer sortOrder = request.getSortOrder();
        if (sortOrder == null) {
            if (parentFolder != null) {
                sortOrder = folderRepository.findMaxSortOrderByParent(parentFolder.getId(), userId) + 1;
            } else {
                sortOrder = folderRepository.findMaxSortOrderAtRoot(userId) + 1;
            }
        }

        // Create folder
        Folder folder = Folder.builder()
                .user(user)
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .parent(parentFolder)
                .sortOrder(sortOrder)
                .build();

        Folder savedFolder = folderRepository.save(folder);
        
        logger.info("Created folder '{}' ({}) for user: {}", savedFolder.getName(), savedFolder.getId(), userId);
        
        return createFolderResponse(savedFolder);
    }

    /**
     * Updates an existing folder.
     * 
     * @param userId the user ID
     * @param folderId the folder ID
     * @param request the update request
     * @return the updated folder response
     * @throws IllegalArgumentException if validation fails
     */
    public FolderResponse updateFolder(UUID userId, UUID folderId, FolderRequest request) {
        logger.debug("Updating folder {} for user: {}", folderId, userId);

        // Validate request
        validateFolderRequest(request, true);

        // Get existing folder
        Folder existingFolder = folderRepository.findActiveByIdAndUserId(folderId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + folderId));

        // Validate parent folder if specified and different from current
        Folder newParentFolder = null;
        if (request.getParentId() != null) {
            if (!request.getParentId().equals(existingFolder.getParentId())) {
                newParentFolder = folderRepository.findActiveByIdAndUserId(request.getParentId(), userId)
                        .orElseThrow(() -> new IllegalArgumentException("Parent folder not found: " + request.getParentId()));
                
                // Check for circular reference
                if (wouldCreateCircularReference(folderId, request.getParentId(), userId)) {
                    throw new IllegalArgumentException("Cannot move folder: would create circular reference");
                }
                
                // Check nesting depth limit
                if (!newParentFolder.canAddChildFolder()) {
                    throw new IllegalArgumentException("Cannot move folder: would exceed maximum nesting depth of " + Folder.MAX_NESTING_DEPTH);
                }
            }
        }

        // Check name uniqueness if name changed
        if (!request.getName().trim().equalsIgnoreCase(existingFolder.getName())) {
            validateFolderNameUniqueness(request.getName(), request.getParentId(), userId, folderId);
        }

        // Update folder
        existingFolder.setName(request.getName().trim());
        existingFolder.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        if (newParentFolder != null || (request.getParentId() == null && existingFolder.getParent() != null)) {
            existingFolder.setParent(newParentFolder);
        }
        if (request.getSortOrder() != null) {
            existingFolder.setSortOrder(request.getSortOrder());
        }

        Folder updatedFolder = folderRepository.save(existingFolder);
        
        logger.info("Updated folder '{}' ({}) for user: {}", updatedFolder.getName(), folderId, userId);
        
        return createFolderResponse(updatedFolder);
    }

    /**
     * Soft deletes a folder and all its contents.
     * 
     * @param userId the user ID
     * @param folderId the folder ID
     * @throws IllegalArgumentException if folder not found
     */
    public void deleteFolder(UUID userId, UUID folderId) {
        logger.debug("Soft deleting folder {} for user: {}", folderId, userId);

        // Get existing folder
        Folder existingFolder = folderRepository.findActiveByIdAndUserId(folderId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + folderId));

        // Soft delete folder and all contents
        existingFolder.softDelete();
        folderRepository.save(existingFolder);
        
        logger.info("Soft deleted folder '{}' ({}) for user: {}", existingFolder.getName(), folderId, userId);
    }

    /**
     * Gets all folders for a user as a tree structure.
     * 
     * @param userId the user ID
     * @return list of folder responses
     */
    @Transactional(readOnly = true)
    public List<FolderResponse> getFolderTree(UUID userId) {
        logger.debug("Retrieving folder tree for user: {}", userId);

        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found: " + userId);
        }

        List<Folder> folders = folderRepository.findActiveByUserId(userId);
        
        List<FolderResponse> responses = folders.stream()
                .map(this::createFolderResponse)
                .collect(Collectors.toList());

        logger.debug("Retrieved {} folders for user: {}", responses.size(), userId);
        
        return responses;
    }

    /**
     * Gets root folders for a user.
     * 
     * @param userId the user ID
     * @return list of root folder responses
     */
    @Transactional(readOnly = true)
    public List<FolderResponse> getRootFolders(UUID userId) {
        logger.debug("Retrieving root folders for user: {}", userId);

        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found: " + userId);
        }

        List<Folder> rootFolders = folderRepository.findActiveRootFoldersByUserId(userId);
        
        List<FolderResponse> responses = rootFolders.stream()
                .map(this::createFolderResponse)
                .collect(Collectors.toList());

        logger.debug("Retrieved {} root folders for user: {}", responses.size(), userId);
        
        return responses;
    }

    // ========== Tag Management ==========

    /**
     * Creates a new tag.
     * 
     * @param userId the user ID
     * @param request the tag request
     * @return the created tag response
     * @throws IllegalArgumentException if validation fails
     */
    public TagResponse createTag(UUID userId, TagRequest request) {
        logger.debug("Creating tag '{}' for user: {}", request.getName(), userId);

        // Validate request
        validateTagRequest(request, false);

        // Get user
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Check name uniqueness
        if (!tagRepository.isNameUnique(request.getName(), userId, null)) {
            throw new IllegalArgumentException("Tag name already exists: " + request.getName());
        }

        // Set default color if not specified
        String color = request.getColor();
        if (color == null || color.trim().isEmpty()) {
            color = "#6B7280"; // Default gray color
        }

        // Set sort order if not specified
        Integer sortOrder = request.getSortOrder();
        if (sortOrder == null) {
            sortOrder = tagRepository.findMaxSortOrderByUserId(userId) + 1;
        }

        // Create tag
        Tag tag = Tag.builder()
                .user(user)
                .name(request.getName().trim())
                .color(color)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .sortOrder(sortOrder)
                .build();

        Tag savedTag = tagRepository.save(tag);
        
        logger.info("Created tag '{}' ({}) for user: {}", savedTag.getName(), savedTag.getId(), userId);
        
        return createTagResponse(savedTag);
    }

    /**
     * Updates an existing tag.
     * 
     * @param userId the user ID
     * @param tagId the tag ID
     * @param request the update request
     * @return the updated tag response
     * @throws IllegalArgumentException if validation fails
     */
    public TagResponse updateTag(UUID userId, UUID tagId, TagRequest request) {
        logger.debug("Updating tag {} for user: {}", tagId, userId);

        // Validate request
        validateTagRequest(request, true);

        // Get existing tag
        Tag existingTag = tagRepository.findActiveByIdAndUserId(tagId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + tagId));

        // Check name uniqueness if name changed
        if (!request.getName().trim().equalsIgnoreCase(existingTag.getName())) {
            if (!tagRepository.isNameUnique(request.getName(), userId, tagId)) {
                throw new IllegalArgumentException("Tag name already exists: " + request.getName());
            }
        }

        // Update tag
        existingTag.setName(request.getName().trim());
        existingTag.setColor(request.getColor() != null ? request.getColor() : existingTag.getColor());
        existingTag.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        if (request.getSortOrder() != null) {
            existingTag.setSortOrder(request.getSortOrder());
        }

        Tag updatedTag = tagRepository.save(existingTag);
        
        logger.info("Updated tag '{}' ({}) for user: {}", updatedTag.getName(), tagId, userId);
        
        return createTagResponse(updatedTag);
    }

    /**
     * Soft deletes a tag.
     * 
     * @param userId the user ID
     * @param tagId the tag ID
     * @throws IllegalArgumentException if tag not found
     */
    public void deleteTag(UUID userId, UUID tagId) {
        logger.debug("Soft deleting tag {} for user: {}", tagId, userId);

        // Get existing tag
        Tag existingTag = tagRepository.findActiveByIdAndUserId(tagId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + tagId));

        // Soft delete tag
        existingTag.softDelete();
        tagRepository.save(existingTag);
        
        logger.info("Soft deleted tag '{}' ({}) for user: {}", existingTag.getName(), tagId, userId);
    }

    /**
     * Gets all tags for a user.
     * 
     * @param userId the user ID
     * @return list of tag responses
     */
    @Transactional(readOnly = true)
    public List<TagResponse> getAllTags(UUID userId) {
        logger.debug("Retrieving all tags for user: {}", userId);

        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found: " + userId);
        }

        List<Tag> tags = tagRepository.findActiveByUserId(userId);
        
        List<TagResponse> responses = tags.stream()
                .map(this::createTagResponse)
                .collect(Collectors.toList());

        logger.debug("Retrieved {} tags for user: {}", responses.size(), userId);
        
        return responses;
    }

    /**
     * Filters credentials by tag.
     * 
     * @param userId the user ID
     * @param tagId the tag ID
     * @return list of credentials with the specified tag
     */
    @Transactional(readOnly = true)
    public List<CredentialResponse> getCredentialsByTag(UUID userId, UUID tagId) {
        logger.debug("Filtering credentials by tag {} for user: {}", tagId, userId);

        // Verify tag exists and belongs to user
        Tag tag = tagRepository.findActiveByIdAndUserId(tagId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + tagId));

        // Get all credentials for user
        List<VaultEntry> allCredentials = vaultRepository.findActiveCredentialsByUserId(userId);
        
        // Filter by tag (this is a simplified implementation - in practice, you'd want to store tag associations in a separate table)
        List<CredentialResponse> responses = allCredentials.stream()
                .filter(entry -> entry.hasTag(tagId))
                .map(CredentialResponse::fromEntity)
                .collect(Collectors.toList());

        logger.debug("Found {} credentials with tag '{}' for user: {}", responses.size(), tag.getName(), userId);
        
        return responses;
    }

    // ========== Helper Methods ==========

    /**
     * Creates a folder response from a folder entity.
     */
    private FolderResponse createFolderResponse(Folder folder) {
        return FolderResponse.builder()
                .id(folder.getId())
                .name(folder.getName())
                .description(folder.getDescription())
                .parentId(folder.getParentId())
                .sortOrder(folder.getSortOrder())
                .depth(folder.getDepth())
                .fullPath(folder.getFullPath())
                .childFolderCount(folder.getActiveChildCount())
                .entryCount(folder.getActiveEntryCount())
                .canAddChildren(folder.canAddChildFolder())
                .createdAt(folder.getCreatedAt())
                .updatedAt(folder.getUpdatedAt())
                .build();
    }

    /**
     * Creates a tag response from a tag entity.
     */
    private TagResponse createTagResponse(Tag tag) {
        // Calculate actual usage count from vault entries
        long usageCount = vaultRepository.findActiveCredentialsByUserId(tag.getUserId())
                .stream()
                .filter(entry -> entry.hasTag(tag.getId()))
                .count();
        
        return TagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .color(tag.getColor())
                .description(tag.getDescription())
                .sortOrder(tag.getSortOrder())
                .usageCount(usageCount)
                .createdAt(tag.getCreatedAt())
                .updatedAt(tag.getUpdatedAt())
                .build();
    }

    /**
     * Validates folder name uniqueness within parent.
     */
    private void validateFolderNameUniqueness(String name, UUID parentId, UUID userId, UUID excludeId) {
        boolean isUnique;
        if (parentId != null) {
            isUnique = folderRepository.isNameUniqueInParent(name, parentId, userId, excludeId != null ? excludeId : UUID.randomUUID());
        } else {
            isUnique = folderRepository.isNameUniqueAtRoot(name, userId, excludeId != null ? excludeId : UUID.randomUUID());
        }
        
        if (!isUnique) {
            throw new IllegalArgumentException("Folder name already exists in this location: " + name);
        }
    }

    /**
     * Checks if moving a folder would create a circular reference.
     */
    private boolean wouldCreateCircularReference(UUID folderId, UUID newParentId, UUID userId) {
        if (folderId.equals(newParentId)) {
            return true;
        }
        
        List<UUID> pathToRoot = folderRepository.findPathToRoot(newParentId, userId);
        return pathToRoot.contains(folderId);
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

    /**
     * Validates a folder request.
     * 
     * @param request the request to validate
     * @param isUpdate whether this is an update operation
     * @throws IllegalArgumentException if validation fails
     */
    private void validateFolderRequest(FolderRequest request, boolean isUpdate) {
        if (request == null) {
            throw new IllegalArgumentException("Folder request is required");
        }

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Folder name is required");
        }

        if (request.getName().trim().length() > 255) {
            throw new IllegalArgumentException("Folder name must not exceed 255 characters");
        }

        if (request.getDescription() != null && request.getDescription().length() > 1000) {
            throw new IllegalArgumentException("Folder description must not exceed 1000 characters");
        }
    }

    /**
     * Validates a tag request.
     * 
     * @param request the request to validate
     * @param isUpdate whether this is an update operation
     * @throws IllegalArgumentException if validation fails
     */
    private void validateTagRequest(TagRequest request, boolean isUpdate) {
        if (request == null) {
            throw new IllegalArgumentException("Tag request is required");
        }

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tag name is required");
        }

        if (request.getName().trim().length() > 100) {
            throw new IllegalArgumentException("Tag name must not exceed 100 characters");
        }

        if (request.getColor() != null && !request.getColor().matches("^#[0-9A-Fa-f]{6}$")) {
            throw new IllegalArgumentException("Color must be a valid hex color code (e.g., #FF5733)");
        }

        if (request.getDescription() != null && request.getDescription().length() > 500) {
            throw new IllegalArgumentException("Tag description must not exceed 500 characters");
        }
    }
}