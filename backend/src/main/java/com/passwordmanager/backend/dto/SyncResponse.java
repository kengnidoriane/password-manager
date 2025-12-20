package com.passwordmanager.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for vault synchronization operations.
 * 
 * This DTO contains the result of a sync operation, including
 * any conflicts detected, the new server version, and delta
 * updates to minimize bandwidth usage.
 * 
 * Requirements: 3.5, 6.1, 6.3
 */
@Schema(description = "Response from vault synchronization operation")
public class SyncResponse {

    @Schema(description = "Whether the sync was successful", example = "true")
    @JsonProperty("success")
    private boolean success;

    @Schema(description = "New server version after sync", example = "45")
    @JsonProperty("serverVersion")
    private Long serverVersion;

    @Schema(description = "Timestamp when sync was completed")
    @JsonProperty("syncedAt")
    private LocalDateTime syncedAt;

    @Schema(description = "List of conflicts detected during sync")
    @JsonProperty("conflicts")
    private List<SyncConflict> conflicts;

    @Schema(description = "Delta updates from server (changes since client's last sync)")
    @JsonProperty("deltaUpdates")
    private DeltaUpdates deltaUpdates;

    @Schema(description = "Sync statistics")
    @JsonProperty("stats")
    private SyncStats stats;

    @Schema(description = "Error message if sync failed")
    @JsonProperty("errorMessage")
    private String errorMessage;

    // Default constructor
    public SyncResponse() {}

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private SyncResponse response = new SyncResponse();

        public Builder success(boolean success) {
            response.success = success;
            return this;
        }

        public Builder serverVersion(Long serverVersion) {
            response.serverVersion = serverVersion;
            return this;
        }

        public Builder syncedAt(LocalDateTime syncedAt) {
            response.syncedAt = syncedAt;
            return this;
        }

        public Builder conflicts(List<SyncConflict> conflicts) {
            response.conflicts = conflicts;
            return this;
        }

        public Builder deltaUpdates(DeltaUpdates deltaUpdates) {
            response.deltaUpdates = deltaUpdates;
            return this;
        }

        public Builder stats(SyncStats stats) {
            response.stats = stats;
            return this;
        }

        public Builder errorMessage(String errorMessage) {
            response.errorMessage = errorMessage;
            return this;
        }

        public SyncResponse build() {
            return response;
        }
    }

    // Getters and setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public Long getServerVersion() {
        return serverVersion;
    }

    public void setServerVersion(Long serverVersion) {
        this.serverVersion = serverVersion;
    }

    public LocalDateTime getSyncedAt() {
        return syncedAt;
    }

    public void setSyncedAt(LocalDateTime syncedAt) {
        this.syncedAt = syncedAt;
    }

    public List<SyncConflict> getConflicts() {
        return conflicts;
    }

    public void setConflicts(List<SyncConflict> conflicts) {
        this.conflicts = conflicts;
    }

    public DeltaUpdates getDeltaUpdates() {
        return deltaUpdates;
    }

    public void setDeltaUpdates(DeltaUpdates deltaUpdates) {
        this.deltaUpdates = deltaUpdates;
    }

    public SyncStats getStats() {
        return stats;
    }

    public void setStats(SyncStats stats) {
        this.stats = stats;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    // Helper methods
    public boolean hasConflicts() {
        return conflicts != null && !conflicts.isEmpty();
    }

    public int getConflictCount() {
        return conflicts != null ? conflicts.size() : 0;
    }

    /**
     * Represents a sync conflict between client and server versions.
     */
    @Schema(description = "A synchronization conflict")
    public static class SyncConflict {
        @Schema(description = "Type of entity in conflict")
        @JsonProperty("entityType")
        private EntityType entityType;

        @Schema(description = "ID of the conflicted entity")
        @JsonProperty("entityId")
        private UUID entityId;

        @Schema(description = "Client version")
        @JsonProperty("clientVersion")
        private Long clientVersion;

        @Schema(description = "Server version")
        @JsonProperty("serverVersion")
        private Long serverVersion;

        @Schema(description = "Conflict resolution strategy applied")
        @JsonProperty("resolution")
        private ConflictResolution resolution;

        @Schema(description = "Timestamp when conflict was detected")
        @JsonProperty("detectedAt")
        private LocalDateTime detectedAt;

        @Schema(description = "Server's version of the entity (for client to compare)")
        @JsonProperty("serverData")
        private Object serverData;

        @Schema(description = "Description of the conflict")
        @JsonProperty("description")
        private String description;

        // Constructors, getters, setters
        public SyncConflict() {}

        public EntityType getEntityType() { return entityType; }
        public void setEntityType(EntityType entityType) { this.entityType = entityType; }

        public UUID getEntityId() { return entityId; }
        public void setEntityId(UUID entityId) { this.entityId = entityId; }

        public Long getClientVersion() { return clientVersion; }
        public void setClientVersion(Long clientVersion) { this.clientVersion = clientVersion; }

        public Long getServerVersion() { return serverVersion; }
        public void setServerVersion(Long serverVersion) { this.serverVersion = serverVersion; }

        public ConflictResolution getResolution() { return resolution; }
        public void setResolution(ConflictResolution resolution) { this.resolution = resolution; }

        public LocalDateTime getDetectedAt() { return detectedAt; }
        public void setDetectedAt(LocalDateTime detectedAt) { this.detectedAt = detectedAt; }

        public Object getServerData() { return serverData; }
        public void setServerData(Object serverData) { this.serverData = serverData; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    /**
     * Delta updates from server to minimize bandwidth.
     */
    @Schema(description = "Delta updates from server")
    public static class DeltaUpdates {
        @Schema(description = "Updated vault entries since client's last sync")
        @JsonProperty("updatedEntries")
        private List<CredentialResponse> updatedEntries;

        @Schema(description = "Deleted vault entry IDs since client's last sync")
        @JsonProperty("deletedEntryIds")
        private List<UUID> deletedEntryIds;

        @Schema(description = "Updated folders since client's last sync")
        @JsonProperty("updatedFolders")
        private List<FolderResponse> updatedFolders;

        @Schema(description = "Deleted folder IDs since client's last sync")
        @JsonProperty("deletedFolderIds")
        private List<UUID> deletedFolderIds;

        @Schema(description = "Updated tags since client's last sync")
        @JsonProperty("updatedTags")
        private List<TagResponse> updatedTags;

        @Schema(description = "Deleted tag IDs since client's last sync")
        @JsonProperty("deletedTagIds")
        private List<UUID> deletedTagIds;

        @Schema(description = "Updated secure notes since client's last sync")
        @JsonProperty("updatedNotes")
        private List<SecureNoteResponse> updatedNotes;

        @Schema(description = "Deleted secure note IDs since client's last sync")
        @JsonProperty("deletedNoteIds")
        private List<UUID> deletedNoteIds;

        // Constructors, getters, setters
        public DeltaUpdates() {}

        public List<CredentialResponse> getUpdatedEntries() { return updatedEntries; }
        public void setUpdatedEntries(List<CredentialResponse> updatedEntries) { this.updatedEntries = updatedEntries; }

        public List<UUID> getDeletedEntryIds() { return deletedEntryIds; }
        public void setDeletedEntryIds(List<UUID> deletedEntryIds) { this.deletedEntryIds = deletedEntryIds; }

        public List<FolderResponse> getUpdatedFolders() { return updatedFolders; }
        public void setUpdatedFolders(List<FolderResponse> updatedFolders) { this.updatedFolders = updatedFolders; }

        public List<UUID> getDeletedFolderIds() { return deletedFolderIds; }
        public void setDeletedFolderIds(List<UUID> deletedFolderIds) { this.deletedFolderIds = deletedFolderIds; }

        public List<TagResponse> getUpdatedTags() { return updatedTags; }
        public void setUpdatedTags(List<TagResponse> updatedTags) { this.updatedTags = updatedTags; }

        public List<UUID> getDeletedTagIds() { return deletedTagIds; }
        public void setDeletedTagIds(List<UUID> deletedTagIds) { this.deletedTagIds = deletedTagIds; }

        public List<SecureNoteResponse> getUpdatedNotes() { return updatedNotes; }
        public void setUpdatedNotes(List<SecureNoteResponse> updatedNotes) { this.updatedNotes = updatedNotes; }

        public List<UUID> getDeletedNoteIds() { return deletedNoteIds; }
        public void setDeletedNoteIds(List<UUID> deletedNoteIds) { this.deletedNoteIds = deletedNoteIds; }

        public boolean hasUpdates() {
            return (updatedEntries != null && !updatedEntries.isEmpty()) ||
                   (deletedEntryIds != null && !deletedEntryIds.isEmpty()) ||
                   (updatedFolders != null && !updatedFolders.isEmpty()) ||
                   (deletedFolderIds != null && !deletedFolderIds.isEmpty()) ||
                   (updatedTags != null && !updatedTags.isEmpty()) ||
                   (deletedTagIds != null && !deletedTagIds.isEmpty()) ||
                   (updatedNotes != null && !updatedNotes.isEmpty()) ||
                   (deletedNoteIds != null && !deletedNoteIds.isEmpty());
        }
    }

    /**
     * Synchronization statistics.
     */
    @Schema(description = "Synchronization statistics")
    public static class SyncStats {
        @Schema(description = "Number of entries processed")
        @JsonProperty("entriesProcessed")
        private int entriesProcessed;

        @Schema(description = "Number of entries created")
        @JsonProperty("entriesCreated")
        private int entriesCreated;

        @Schema(description = "Number of entries updated")
        @JsonProperty("entriesUpdated")
        private int entriesUpdated;

        @Schema(description = "Number of entries deleted")
        @JsonProperty("entriesDeleted")
        private int entriesDeleted;

        @Schema(description = "Number of folders processed")
        @JsonProperty("foldersProcessed")
        private int foldersProcessed;

        @Schema(description = "Number of tags processed")
        @JsonProperty("tagsProcessed")
        private int tagsProcessed;

        @Schema(description = "Number of notes processed")
        @JsonProperty("notesProcessed")
        private int notesProcessed;

        @Schema(description = "Number of conflicts detected")
        @JsonProperty("conflictsDetected")
        private int conflictsDetected;

        @Schema(description = "Sync duration in milliseconds")
        @JsonProperty("syncDurationMs")
        private long syncDurationMs;

        // Constructors, getters, setters
        public SyncStats() {}

        public int getEntriesProcessed() { return entriesProcessed; }
        public void setEntriesProcessed(int entriesProcessed) { this.entriesProcessed = entriesProcessed; }

        public int getEntriesCreated() { return entriesCreated; }
        public void setEntriesCreated(int entriesCreated) { this.entriesCreated = entriesCreated; }

        public int getEntriesUpdated() { return entriesUpdated; }
        public void setEntriesUpdated(int entriesUpdated) { this.entriesUpdated = entriesUpdated; }

        public int getEntriesDeleted() { return entriesDeleted; }
        public void setEntriesDeleted(int entriesDeleted) { this.entriesDeleted = entriesDeleted; }

        public int getFoldersProcessed() { return foldersProcessed; }
        public void setFoldersProcessed(int foldersProcessed) { this.foldersProcessed = foldersProcessed; }

        public int getTagsProcessed() { return tagsProcessed; }
        public void setTagsProcessed(int tagsProcessed) { this.tagsProcessed = tagsProcessed; }

        public int getNotesProcessed() { return notesProcessed; }
        public void setNotesProcessed(int notesProcessed) { this.notesProcessed = notesProcessed; }

        public int getConflictsDetected() { return conflictsDetected; }
        public void setConflictsDetected(int conflictsDetected) { this.conflictsDetected = conflictsDetected; }

        public long getSyncDurationMs() { return syncDurationMs; }
        public void setSyncDurationMs(long syncDurationMs) { this.syncDurationMs = syncDurationMs; }

        public int getTotalProcessed() {
            return entriesProcessed + foldersProcessed + tagsProcessed + notesProcessed;
        }
    }

    /**
     * Types of entities that can be synchronized.
     */
    public enum EntityType {
        @JsonProperty("CREDENTIAL")
        CREDENTIAL,
        
        @JsonProperty("FOLDER")
        FOLDER,
        
        @JsonProperty("TAG")
        TAG,
        
        @JsonProperty("SECURE_NOTE")
        SECURE_NOTE
    }

    /**
     * Conflict resolution strategies.
     */
    public enum ConflictResolution {
        @JsonProperty("SERVER_WINS")
        SERVER_WINS,
        
        @JsonProperty("CLIENT_WINS")
        CLIENT_WINS,
        
        @JsonProperty("LAST_WRITE_WINS")
        LAST_WRITE_WINS,
        
        @JsonProperty("MANUAL_RESOLUTION_REQUIRED")
        MANUAL_RESOLUTION_REQUIRED
    }
}