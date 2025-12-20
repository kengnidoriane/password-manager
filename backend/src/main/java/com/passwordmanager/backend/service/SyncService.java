package com.passwordmanager.backend.service;

import com.passwordmanager.backend.dto.CredentialRequest;
import com.passwordmanager.backend.dto.CredentialResponse;
import com.passwordmanager.backend.dto.FolderRequest;
import com.passwordmanager.backend.dto.FolderResponse;
import com.passwordmanager.backend.dto.SecureNoteRequest;
import com.passwordmanager.backend.dto.SecureNoteResponse;
import com.passwordmanager.backend.dto.SyncRequest;
import com.passwordmanager.backend.dto.SyncResponse;
import com.passwordmanager.backend.dto.TagRequest;
import com.passwordmanager.backend.dto.TagResponse;
import com.passwordmanager.backend.entity.Folder;
import com.passwordmanager.backend.entity.SecureNote;
import com.passwordmanager.backend.entity.SyncHistory;
import com.passwordmanager.backend.entity.Tag;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.repository.FolderRepository;
import com.passwordmanager.backend.repository.SecureNoteRepository;
import com.passwordmanager.backend.repository.SyncHistoryRepository;
import com.passwordmanager.backend.repository.TagRepository;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Service for handling vault synchronization operations.
 * 
 * This service provides:
 * - Bidirectional sync between client and server
 * - Conflict detection based on version numbers
 * - Last-write-wins conflict resolution
 * - Delta updates to minimize bandwidth
 * - Sync history logging for audit and debugging
 * 
 * Requirements: 3.5, 6.1, 6.3
 */
@Service
@Transactional
public class SyncService {

    private static final Logger logger = LoggerFactory.getLogger(SyncService.class);

    private final VaultRepository vaultRepository;
    private final FolderRepository folderRepository;
    private final TagRepository tagRepository;
    private final SecureNoteRepository secureNoteRepository;
    private final UserRepository userRepository;
    private final SyncHistoryRepository syncHistoryRepository;
    private final VaultService vaultService;

    // Global version counter for the entire vault
    private final AtomicLong globalVersionCounter = new AtomicLong(System.currentTimeMillis());

    public SyncService(VaultRepository vaultRepository,
                      FolderRepository folderRepository,
                      TagRepository tagRepository,
                      SecureNoteRepository secureNoteRepository,
                      UserRepository userRepository,
                      SyncHistoryRepository syncHistoryRepository,
                      VaultService vaultService) {
        this.vaultRepository = vaultRepository;
        this.folderRepository = folderRepository;
        this.tagRepository = tagRepository;
        this.secureNoteRepository = secureNoteRepository;
        this.userRepository = userRepository;
        this.syncHistoryRepository = syncHistoryRepository;
        this.vaultService = vaultService;
    }

    /**
     * Synchronizes vault changes from client to server.
     * 
     * @param userId the user ID
     * @param request the sync request containing changes
     * @param clientIp client IP address for logging
     * @param userAgent client user agent for logging
     * @return sync response with conflicts and delta updates
     * @throws IllegalArgumentException if user not found or invalid request
     */
    public SyncResponse synchronizeVault(UUID userId, SyncRequest request, String clientIp, String userAgent) {
        long startTime = System.currentTimeMillis();
        
        logger.debug("Starting vault sync for user: {} with client version: {}", userId, request.getClientVersion());

        // Validate user exists
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Get current server version
        Long currentServerVersion = getCurrentServerVersion(userId);
        
        // Initialize sync response
        SyncResponse.Builder responseBuilder = SyncResponse.builder()
                .success(true)
                .syncedAt(LocalDateTime.now());

        // Initialize statistics
        SyncResponse.SyncStats stats = new SyncResponse.SyncStats();
        List<SyncResponse.SyncConflict> conflicts = new ArrayList<>();

        try {
            // Process vault entry changes
            if (request.getChanges() != null && !request.getChanges().isEmpty()) {
                processVaultEntryChanges(userId, request.getChanges(), conflicts, stats);
            }

            // Process vault entry deletions
            if (request.getDeletions() != null && !request.getDeletions().isEmpty()) {
                processVaultEntryDeletions(userId, request.getDeletions(), stats);
            }

            // Process folder changes
            if (request.getFolderChanges() != null && !request.getFolderChanges().isEmpty()) {
                processFolderChanges(userId, request.getFolderChanges(), conflicts, stats);
            }

            // Process folder deletions
            if (request.getFolderDeletions() != null && !request.getFolderDeletions().isEmpty()) {
                processFolderDeletions(userId, request.getFolderDeletions(), stats);
            }

            // Process tag changes
            if (request.getTagChanges() != null && !request.getTagChanges().isEmpty()) {
                processTagChanges(userId, request.getTagChanges(), conflicts, stats);
            }

            // Process tag deletions
            if (request.getTagDeletions() != null && !request.getTagDeletions().isEmpty()) {
                processTagDeletions(userId, request.getTagDeletions(), stats);
            }

            // Process secure note changes
            if (request.getNoteChanges() != null && !request.getNoteChanges().isEmpty()) {
                processSecureNoteChanges(userId, request.getNoteChanges(), conflicts, stats);
            }

            // Process secure note deletions
            if (request.getNoteDeletions() != null && !request.getNoteDeletions().isEmpty()) {
                processSecureNoteDeletions(userId, request.getNoteDeletions(), stats);
            }

            // Generate new server version
            Long newServerVersion = globalVersionCounter.incrementAndGet();

            // Get delta updates for client
            SyncResponse.DeltaUpdates deltaUpdates = generateDeltaUpdates(userId, request.getLastSyncTime());

            // Set conflict count in stats
            stats.setConflictsDetected(conflicts.size());

            // Calculate sync duration
            long syncDuration = System.currentTimeMillis() - startTime;
            stats.setSyncDurationMs(syncDuration);

            // Build response
            SyncResponse response = responseBuilder
                    .serverVersion(newServerVersion)
                    .conflicts(conflicts)
                    .deltaUpdates(deltaUpdates)
                    .stats(stats)
                    .build();

            // Log sync history
            logSyncHistory(user, request.getClientVersion(), currentServerVersion, newServerVersion,
                          stats, conflicts, clientIp, userAgent, null);

            logger.info("Completed vault sync for user: {} - processed {} items, {} conflicts, {}ms",
                       userId, stats.getTotalProcessed(), conflicts.size(), syncDuration);

            return response;

        } catch (Exception e) {
            logger.error("Error during vault sync for user: {}: {}", userId, e.getMessage(), e);

            // Calculate sync duration for failed sync
            long syncDuration = System.currentTimeMillis() - startTime;
            stats.setSyncDurationMs(syncDuration);

            // Log failed sync history
            logSyncHistory(user, request.getClientVersion(), currentServerVersion, currentServerVersion,
                          stats, conflicts, clientIp, userAgent, e.getMessage());

            return SyncResponse.builder()
                    .success(false)
                    .serverVersion(currentServerVersion)
                    .syncedAt(LocalDateTime.now())
                    .errorMessage("Sync failed: " + e.getMessage())
                    .stats(stats)
                    .build();
        }
    }

    /**
     * Processes vault entry changes (create/update operations).
     */
    private void processVaultEntryChanges(UUID userId, List<SyncRequest.VaultEntryChange> changes,
                                         List<SyncResponse.SyncConflict> conflicts,
                                         SyncResponse.SyncStats stats) {
        for (SyncRequest.VaultEntryChange change : changes) {
            try {
                switch (change.getOperation()) {
                    case CREATE:
                        createVaultEntry(userId, change, stats);
                        break;
                    case UPDATE:
                        updateVaultEntry(userId, change, conflicts, stats);
                        break;
                    default:
                        logger.warn("Unsupported vault entry operation: {}", change.getOperation());
                }
                stats.setEntriesProcessed(stats.getEntriesProcessed() + 1);
            } catch (Exception e) {
                logger.error("Error processing vault entry change {}: {}", change.getId(), e.getMessage());
            }
        }
    }

    /**
     * Creates a new vault entry from sync change.
     */
    private void createVaultEntry(UUID userId, SyncRequest.VaultEntryChange change,
                                 SyncResponse.SyncStats stats) {
        CredentialRequest request = new CredentialRequest();
        request.setEncryptedData(change.getEncryptedData());
        request.setIv(change.getIv());
        request.setAuthTag(change.getAuthTag());
        request.setFolderId(change.getFolderId());

        vaultService.createCredential(userId, request);
        stats.setEntriesCreated(stats.getEntriesCreated() + 1);
        
        logger.debug("Created vault entry {} for user: {}", change.getId(), userId);
    }

    /**
     * Updates an existing vault entry from sync change.
     */
    private void updateVaultEntry(UUID userId, SyncRequest.VaultEntryChange change,
                                 List<SyncResponse.SyncConflict> conflicts,
                                 SyncResponse.SyncStats stats) {
        Optional<VaultEntry> existingEntry = vaultRepository.findActiveByIdAndUserId(change.getId(), userId);
        
        if (existingEntry.isEmpty()) {
            logger.warn("Vault entry {} not found for update, treating as create", change.getId());
            createVaultEntry(userId, change, stats);
            return;
        }

        VaultEntry entry = existingEntry.get();
        
        // Check for version conflict (last-write-wins)
        if (!entry.getVersion().equals(change.getVersion())) {
            // Conflict detected - apply last-write-wins based on timestamp
            boolean clientWins = change.getLastModified() != null && 
                               change.getLastModified().isAfter(entry.getUpdatedAt());
            
            SyncResponse.SyncConflict conflict = new SyncResponse.SyncConflict();
            conflict.setEntityType(SyncResponse.EntityType.CREDENTIAL);
            conflict.setEntityId(change.getId());
            conflict.setClientVersion(change.getVersion());
            conflict.setServerVersion(entry.getVersion());
            conflict.setDetectedAt(LocalDateTime.now());
            conflict.setServerData(CredentialResponse.fromEntity(entry));
            
            if (clientWins) {
                conflict.setResolution(SyncResponse.ConflictResolution.CLIENT_WINS);
                conflict.setDescription("Client version is newer, applying client changes");
                
                // Apply client changes
                CredentialRequest request = new CredentialRequest();
                request.setEncryptedData(change.getEncryptedData());
                request.setIv(change.getIv());
                request.setAuthTag(change.getAuthTag());
                request.setFolderId(change.getFolderId());
                request.setVersion(entry.getVersion()); // Use current server version
                
                try {
                    vaultService.updateCredential(userId, change.getId(), request);
                    stats.setEntriesUpdated(stats.getEntriesUpdated() + 1);
                } catch (OptimisticLockingFailureException e) {
                    logger.warn("Optimistic lock failure updating entry {}, skipping", change.getId());
                }
            } else {
                conflict.setResolution(SyncResponse.ConflictResolution.SERVER_WINS);
                conflict.setDescription("Server version is newer, keeping server changes");
            }
            
            conflicts.add(conflict);
            logger.debug("Conflict detected for vault entry {}: {}", change.getId(), conflict.getResolution());
        } else {
            // No conflict, apply update
            CredentialRequest request = new CredentialRequest();
            request.setEncryptedData(change.getEncryptedData());
            request.setIv(change.getIv());
            request.setAuthTag(change.getAuthTag());
            request.setFolderId(change.getFolderId());
            request.setVersion(change.getVersion());
            
            try {
                vaultService.updateCredential(userId, change.getId(), request);
                stats.setEntriesUpdated(stats.getEntriesUpdated() + 1);
                logger.debug("Updated vault entry {} for user: {}", change.getId(), userId);
            } catch (OptimisticLockingFailureException e) {
                logger.warn("Optimistic lock failure updating entry {}, skipping", change.getId());
            }
        }
    }

    /**
     * Processes vault entry deletions.
     */
    private void processVaultEntryDeletions(UUID userId, List<UUID> deletions,
                                           SyncResponse.SyncStats stats) {
        for (UUID entryId : deletions) {
            try {
                vaultService.deleteCredential(userId, entryId);
                stats.setEntriesDeleted(stats.getEntriesDeleted() + 1);
                logger.debug("Deleted vault entry {} for user: {}", entryId, userId);
            } catch (IllegalArgumentException e) {
                logger.warn("Vault entry {} not found for deletion: {}", entryId, e.getMessage());
            } catch (Exception e) {
                logger.error("Error deleting vault entry {}: {}", entryId, e.getMessage());
            }
        }
    }

    /**
     * Processes folder changes.
     */
    private void processFolderChanges(UUID userId, List<SyncRequest.FolderChange> changes,
                                     List<SyncResponse.SyncConflict> conflicts,
                                     SyncResponse.SyncStats stats) {
        for (SyncRequest.FolderChange change : changes) {
            try {
                switch (change.getOperation()) {
                    case CREATE:
                        createFolder(userId, change);
                        break;
                    case UPDATE:
                        updateFolder(userId, change, conflicts);
                        break;
                    default:
                        logger.warn("Unsupported folder operation: {}", change.getOperation());
                }
                stats.setFoldersProcessed(stats.getFoldersProcessed() + 1);
            } catch (Exception e) {
                logger.error("Error processing folder change {}: {}", change.getId(), e.getMessage());
            }
        }
    }

    /**
     * Creates a new folder from sync change.
     */
    private void createFolder(UUID userId, SyncRequest.FolderChange change) {
        FolderRequest request = new FolderRequest();
        request.setName(change.getName());
        request.setDescription(change.getDescription());
        request.setParentId(change.getParentId());
        request.setSortOrder(change.getSortOrder());

        vaultService.createFolder(userId, request);
        logger.debug("Created folder {} for user: {}", change.getId(), userId);
    }

    /**
     * Updates an existing folder from sync change.
     */
    private void updateFolder(UUID userId, SyncRequest.FolderChange change,
                             List<SyncResponse.SyncConflict> conflicts) {
        Optional<Folder> existingFolder = folderRepository.findActiveByIdAndUserId(change.getId(), userId);
        
        if (existingFolder.isEmpty()) {
            logger.warn("Folder {} not found for update, treating as create", change.getId());
            createFolder(userId, change);
            return;
        }

        FolderRequest request = new FolderRequest();
        request.setName(change.getName());
        request.setDescription(change.getDescription());
        request.setParentId(change.getParentId());
        request.setSortOrder(change.getSortOrder());

        try {
            vaultService.updateFolder(userId, change.getId(), request);
            logger.debug("Updated folder {} for user: {}", change.getId(), userId);
        } catch (Exception e) {
            logger.error("Error updating folder {}: {}", change.getId(), e.getMessage());
        }
    }

    /**
     * Processes folder deletions.
     */
    private void processFolderDeletions(UUID userId, List<UUID> deletions,
                                       SyncResponse.SyncStats stats) {
        for (UUID folderId : deletions) {
            try {
                vaultService.deleteFolder(userId, folderId);
                logger.debug("Deleted folder {} for user: {}", folderId, userId);
            } catch (IllegalArgumentException e) {
                logger.warn("Folder {} not found for deletion: {}", folderId, e.getMessage());
            } catch (Exception e) {
                logger.error("Error deleting folder {}: {}", folderId, e.getMessage());
            }
        }
    }

    /**
     * Processes tag changes.
     */
    private void processTagChanges(UUID userId, List<SyncRequest.TagChange> changes,
                                  List<SyncResponse.SyncConflict> conflicts,
                                  SyncResponse.SyncStats stats) {
        for (SyncRequest.TagChange change : changes) {
            try {
                switch (change.getOperation()) {
                    case CREATE:
                        createTag(userId, change);
                        break;
                    case UPDATE:
                        updateTag(userId, change, conflicts);
                        break;
                    default:
                        logger.warn("Unsupported tag operation: {}", change.getOperation());
                }
                stats.setTagsProcessed(stats.getTagsProcessed() + 1);
            } catch (Exception e) {
                logger.error("Error processing tag change {}: {}", change.getId(), e.getMessage());
            }
        }
    }

    /**
     * Creates a new tag from sync change.
     */
    private void createTag(UUID userId, SyncRequest.TagChange change) {
        TagRequest request = new TagRequest();
        request.setName(change.getName());
        request.setColor(change.getColor());
        request.setDescription(change.getDescription());
        request.setSortOrder(change.getSortOrder());

        vaultService.createTag(userId, request);
        logger.debug("Created tag {} for user: {}", change.getId(), userId);
    }

    /**
     * Updates an existing tag from sync change.
     */
    private void updateTag(UUID userId, SyncRequest.TagChange change,
                          List<SyncResponse.SyncConflict> conflicts) {
        Optional<Tag> existingTag = tagRepository.findActiveByIdAndUserId(change.getId(), userId);
        
        if (existingTag.isEmpty()) {
            logger.warn("Tag {} not found for update, treating as create", change.getId());
            createTag(userId, change);
            return;
        }

        TagRequest request = new TagRequest();
        request.setName(change.getName());
        request.setColor(change.getColor());
        request.setDescription(change.getDescription());
        request.setSortOrder(change.getSortOrder());

        try {
            vaultService.updateTag(userId, change.getId(), request);
            logger.debug("Updated tag {} for user: {}", change.getId(), userId);
        } catch (Exception e) {
            logger.error("Error updating tag {}: {}", change.getId(), e.getMessage());
        }
    }

    /**
     * Processes tag deletions.
     */
    private void processTagDeletions(UUID userId, List<UUID> deletions,
                                    SyncResponse.SyncStats stats) {
        for (UUID tagId : deletions) {
            try {
                vaultService.deleteTag(userId, tagId);
                logger.debug("Deleted tag {} for user: {}", tagId, userId);
            } catch (IllegalArgumentException e) {
                logger.warn("Tag {} not found for deletion: {}", tagId, e.getMessage());
            } catch (Exception e) {
                logger.error("Error deleting tag {}: {}", tagId, e.getMessage());
            }
        }
    }

    /**
     * Processes secure note changes.
     */
    private void processSecureNoteChanges(UUID userId, List<SyncRequest.SecureNoteChange> changes,
                                         List<SyncResponse.SyncConflict> conflicts,
                                         SyncResponse.SyncStats stats) {
        for (SyncRequest.SecureNoteChange change : changes) {
            try {
                switch (change.getOperation()) {
                    case CREATE:
                        createSecureNote(userId, change);
                        break;
                    case UPDATE:
                        updateSecureNote(userId, change, conflicts);
                        break;
                    default:
                        logger.warn("Unsupported secure note operation: {}", change.getOperation());
                }
                stats.setNotesProcessed(stats.getNotesProcessed() + 1);
            } catch (Exception e) {
                logger.error("Error processing secure note change {}: {}", change.getId(), e.getMessage());
            }
        }
    }

    /**
     * Creates a new secure note from sync change.
     */
    private void createSecureNote(UUID userId, SyncRequest.SecureNoteChange change) {
        SecureNoteRequest request = new SecureNoteRequest();
        request.setTitle(change.getTitle());
        request.setEncryptedContent(change.getEncryptedContent());
        request.setContentIv(change.getContentIv());
        request.setContentAuthTag(change.getContentAuthTag());
        request.setEncryptedAttachments(change.getEncryptedAttachments());
        request.setAttachmentsIv(change.getAttachmentsIv());
        request.setAttachmentsAuthTag(change.getAttachmentsAuthTag());
        request.setFolderId(change.getFolderId());

        vaultService.createSecureNote(userId, request);
        logger.debug("Created secure note {} for user: {}", change.getId(), userId);
    }

    /**
     * Updates an existing secure note from sync change.
     */
    private void updateSecureNote(UUID userId, SyncRequest.SecureNoteChange change,
                                 List<SyncResponse.SyncConflict> conflicts) {
        Optional<SecureNote> existingNote = secureNoteRepository.findActiveByIdAndUserId(change.getId(), userId);
        
        if (existingNote.isEmpty()) {
            logger.warn("Secure note {} not found for update, treating as create", change.getId());
            createSecureNote(userId, change);
            return;
        }

        SecureNote note = existingNote.get();
        
        // Check for version conflict (last-write-wins)
        if (!note.getVersion().equals(change.getVersion())) {
            // Conflict detected - apply last-write-wins based on timestamp
            boolean clientWins = change.getLastModified() != null && 
                               change.getLastModified().isAfter(note.getUpdatedAt());
            
            SyncResponse.SyncConflict conflict = new SyncResponse.SyncConflict();
            conflict.setEntityType(SyncResponse.EntityType.SECURE_NOTE);
            conflict.setEntityId(change.getId());
            conflict.setClientVersion(change.getVersion());
            conflict.setServerVersion(note.getVersion());
            conflict.setDetectedAt(LocalDateTime.now());
            conflict.setServerData(SecureNoteResponse.fromEntity(note));
            
            if (clientWins) {
                conflict.setResolution(SyncResponse.ConflictResolution.CLIENT_WINS);
                conflict.setDescription("Client version is newer, applying client changes");
                
                // Apply client changes
                SecureNoteRequest request = new SecureNoteRequest();
                request.setTitle(change.getTitle());
                request.setEncryptedContent(change.getEncryptedContent());
                request.setContentIv(change.getContentIv());
                request.setContentAuthTag(change.getContentAuthTag());
                request.setEncryptedAttachments(change.getEncryptedAttachments());
                request.setAttachmentsIv(change.getAttachmentsIv());
                request.setAttachmentsAuthTag(change.getAttachmentsAuthTag());
                request.setFolderId(change.getFolderId());
                request.setVersion(note.getVersion()); // Use current server version
                
                try {
                    vaultService.updateSecureNote(userId, change.getId(), request);
                } catch (OptimisticLockingFailureException e) {
                    logger.warn("Optimistic lock failure updating note {}, skipping", change.getId());
                }
            } else {
                conflict.setResolution(SyncResponse.ConflictResolution.SERVER_WINS);
                conflict.setDescription("Server version is newer, keeping server changes");
            }
            
            conflicts.add(conflict);
            logger.debug("Conflict detected for secure note {}: {}", change.getId(), conflict.getResolution());
        } else {
            // No conflict, apply update
            SecureNoteRequest request = new SecureNoteRequest();
            request.setTitle(change.getTitle());
            request.setEncryptedContent(change.getEncryptedContent());
            request.setContentIv(change.getContentIv());
            request.setContentAuthTag(change.getContentAuthTag());
            request.setEncryptedAttachments(change.getEncryptedAttachments());
            request.setAttachmentsIv(change.getAttachmentsIv());
            request.setAttachmentsAuthTag(change.getAttachmentsAuthTag());
            request.setFolderId(change.getFolderId());
            request.setVersion(change.getVersion());
            
            try {
                vaultService.updateSecureNote(userId, change.getId(), request);
                logger.debug("Updated secure note {} for user: {}", change.getId(), userId);
            } catch (OptimisticLockingFailureException e) {
                logger.warn("Optimistic lock failure updating note {}, skipping", change.getId());
            }
        }
    }

    /**
     * Processes secure note deletions.
     */
    private void processSecureNoteDeletions(UUID userId, List<UUID> deletions,
                                           SyncResponse.SyncStats stats) {
        for (UUID noteId : deletions) {
            try {
                vaultService.deleteSecureNote(userId, noteId);
                logger.debug("Deleted secure note {} for user: {}", noteId, userId);
            } catch (IllegalArgumentException e) {
                logger.warn("Secure note {} not found for deletion: {}", noteId, e.getMessage());
            } catch (Exception e) {
                logger.error("Error deleting secure note {}: {}", noteId, e.getMessage());
            }
        }
    }

    /**
     * Generates delta updates for the client based on their last sync time.
     */
    private SyncResponse.DeltaUpdates generateDeltaUpdates(UUID userId, LocalDateTime lastSyncTime) {
        SyncResponse.DeltaUpdates deltaUpdates = new SyncResponse.DeltaUpdates();

        if (lastSyncTime == null) {
            // First sync - return all data
            deltaUpdates.setUpdatedEntries(vaultService.getAllCredentials(userId));
            deltaUpdates.setUpdatedFolders(vaultService.getFolderTree(userId));
            deltaUpdates.setUpdatedTags(vaultService.getAllTags(userId));
            deltaUpdates.setUpdatedNotes(vaultService.getAllSecureNotes(userId));
        } else {
            // Delta sync - return only changes since last sync
            deltaUpdates.setUpdatedEntries(getUpdatedCredentialsSince(userId, lastSyncTime));
            deltaUpdates.setDeletedEntryIds(getDeletedCredentialIdsSince(userId, lastSyncTime));
            deltaUpdates.setUpdatedFolders(getUpdatedFoldersSince(userId, lastSyncTime));
            deltaUpdates.setDeletedFolderIds(getDeletedFolderIdsSince(userId, lastSyncTime));
            deltaUpdates.setUpdatedTags(getUpdatedTagsSince(userId, lastSyncTime));
            deltaUpdates.setDeletedTagIds(getDeletedTagIdsSince(userId, lastSyncTime));
            deltaUpdates.setUpdatedNotes(getUpdatedNotesSince(userId, lastSyncTime));
            deltaUpdates.setDeletedNoteIds(getDeletedNoteIdsSince(userId, lastSyncTime));
        }

        return deltaUpdates;
    }

    /**
     * Gets credentials updated since the specified time.
     */
    private List<CredentialResponse> getUpdatedCredentialsSince(UUID userId, LocalDateTime since) {
        List<VaultEntry> entries = vaultRepository.findActiveCredentialsByUserIdUpdatedSince(userId, since);
        return entries.stream()
                .map(CredentialResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets IDs of credentials deleted since the specified time.
     */
    private List<UUID> getDeletedCredentialIdsSince(UUID userId, LocalDateTime since) {
        return vaultRepository.findDeletedCredentialIdsByUserIdSince(userId, since);
    }

    /**
     * Gets folders updated since the specified time.
     */
    private List<FolderResponse> getUpdatedFoldersSince(UUID userId, LocalDateTime since) {
        List<Folder> folders = folderRepository.findActiveByUserIdUpdatedSince(userId, since);
        return folders.stream()
                .map(folder -> FolderResponse.builder()
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
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Gets IDs of folders deleted since the specified time.
     */
    private List<UUID> getDeletedFolderIdsSince(UUID userId, LocalDateTime since) {
        return folderRepository.findDeletedFolderIdsByUserIdSince(userId, since);
    }

    /**
     * Gets tags updated since the specified time.
     */
    private List<TagResponse> getUpdatedTagsSince(UUID userId, LocalDateTime since) {
        List<Tag> tags = tagRepository.findActiveByUserIdUpdatedSince(userId, since);
        return tags.stream()
                .map(tag -> TagResponse.builder()
                        .id(tag.getId())
                        .name(tag.getName())
                        .color(tag.getColor())
                        .description(tag.getDescription())
                        .sortOrder(tag.getSortOrder())
                        .usageCount(0L) // Would need to calculate actual usage
                        .createdAt(tag.getCreatedAt())
                        .updatedAt(tag.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Gets IDs of tags deleted since the specified time.
     */
    private List<UUID> getDeletedTagIdsSince(UUID userId, LocalDateTime since) {
        return tagRepository.findDeletedTagIdsByUserIdSince(userId, since);
    }

    /**
     * Gets secure notes updated since the specified time.
     */
    private List<SecureNoteResponse> getUpdatedNotesSince(UUID userId, LocalDateTime since) {
        List<SecureNote> notes = secureNoteRepository.findActiveByUserIdUpdatedSince(userId, since);
        return notes.stream()
                .map(SecureNoteResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Gets IDs of secure notes deleted since the specified time.
     */
    private List<UUID> getDeletedNoteIdsSince(UUID userId, LocalDateTime since) {
        return secureNoteRepository.findDeletedNoteIdsByUserIdSince(userId, since);
    }

    /**
     * Gets the current server version for a user's vault.
     */
    private Long getCurrentServerVersion(UUID userId) {
        // For simplicity, we'll use the global version counter
        // In a real implementation, you might want per-user version tracking
        return globalVersionCounter.get();
    }

    /**
     * Logs sync history for audit and debugging purposes.
     */
    private void logSyncHistory(UserAccount user, Long clientVersion, Long serverVersionBefore,
                               Long serverVersionAfter, SyncResponse.SyncStats stats,
                               List<SyncResponse.SyncConflict> conflicts, String clientIp,
                               String userAgent, String errorMessage) {
        SyncHistory.SyncStatus status;
        if (errorMessage != null) {
            status = SyncHistory.SyncStatus.FAILED;
        } else if (!conflicts.isEmpty()) {
            status = SyncHistory.SyncStatus.CONFLICT_DETECTED;
        } else {
            status = SyncHistory.SyncStatus.SUCCESS;
        }

        SyncHistory syncHistory = SyncHistory.builder()
                .user(user)
                .clientVersion(clientVersion)
                .serverVersionBefore(serverVersionBefore)
                .serverVersionAfter(serverVersionAfter)
                .syncStatus(status)
                .entriesProcessed(stats.getEntriesProcessed())
                .entriesCreated(stats.getEntriesCreated())
                .entriesUpdated(stats.getEntriesUpdated())
                .entriesDeleted(stats.getEntriesDeleted())
                .foldersProcessed(stats.getFoldersProcessed())
                .tagsProcessed(stats.getTagsProcessed())
                .notesProcessed(stats.getNotesProcessed())
                .conflictsDetected(stats.getConflictsDetected())
                .syncDurationMs(stats.getSyncDurationMs())
                .clientIp(clientIp)
                .userAgent(userAgent)
                .errorMessage(errorMessage)
                .build();

        syncHistoryRepository.save(syncHistory);
        
        logger.debug("Logged sync history for user: {} with status: {}", user.getId(), status);
    }
}