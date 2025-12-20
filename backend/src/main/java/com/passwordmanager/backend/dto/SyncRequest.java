package com.passwordmanager.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Request DTO for vault synchronization operations.
 * 
 * This DTO contains all the changes that need to be synchronized
 * from the client to the server, including version information
 * for conflict detection.
 * 
 * Requirements: 3.5, 6.1, 6.3
 */
@Schema(description = "Request for synchronizing vault changes")
public class SyncRequest {

    @Schema(description = "Client's last known sync timestamp", example = "2023-12-01T10:30:00")
    @JsonProperty("lastSyncTime")
    private LocalDateTime lastSyncTime;

    @Schema(description = "Client's current vault version", example = "42")
    @JsonProperty("clientVersion")
    @NotNull(message = "Client version is required")
    private Long clientVersion;

    @Schema(description = "List of vault entry changes to sync")
    @JsonProperty("changes")
    @Valid
    private List<VaultEntryChange> changes;

    @Schema(description = "List of vault entry IDs to delete")
    @JsonProperty("deletions")
    private List<UUID> deletions;

    @Schema(description = "List of folder changes to sync")
    @JsonProperty("folderChanges")
    @Valid
    private List<FolderChange> folderChanges;

    @Schema(description = "List of folder IDs to delete")
    @JsonProperty("folderDeletions")
    private List<UUID> folderDeletions;

    @Schema(description = "List of tag changes to sync")
    @JsonProperty("tagChanges")
    @Valid
    private List<TagChange> tagChanges;

    @Schema(description = "List of tag IDs to delete")
    @JsonProperty("tagDeletions")
    private List<UUID> tagDeletions;

    @Schema(description = "List of secure note changes to sync")
    @JsonProperty("noteChanges")
    @Valid
    private List<SecureNoteChange> noteChanges;

    @Schema(description = "List of secure note IDs to delete")
    @JsonProperty("noteDeletions")
    private List<UUID> noteDeletions;

    // Default constructor
    public SyncRequest() {}

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private SyncRequest request = new SyncRequest();

        public Builder lastSyncTime(LocalDateTime lastSyncTime) {
            request.lastSyncTime = lastSyncTime;
            return this;
        }

        public Builder clientVersion(Long clientVersion) {
            request.clientVersion = clientVersion;
            return this;
        }

        public Builder changes(List<VaultEntryChange> changes) {
            request.changes = changes;
            return this;
        }

        public Builder deletions(List<UUID> deletions) {
            request.deletions = deletions;
            return this;
        }

        public Builder folderChanges(List<FolderChange> folderChanges) {
            request.folderChanges = folderChanges;
            return this;
        }

        public Builder folderDeletions(List<UUID> folderDeletions) {
            request.folderDeletions = folderDeletions;
            return this;
        }

        public Builder tagChanges(List<TagChange> tagChanges) {
            request.tagChanges = tagChanges;
            return this;
        }

        public Builder tagDeletions(List<UUID> tagDeletions) {
            request.tagDeletions = tagDeletions;
            return this;
        }

        public Builder noteChanges(List<SecureNoteChange> noteChanges) {
            request.noteChanges = noteChanges;
            return this;
        }

        public Builder noteDeletions(List<UUID> noteDeletions) {
            request.noteDeletions = noteDeletions;
            return this;
        }

        public SyncRequest build() {
            return request;
        }
    }

    // Getters and setters
    public LocalDateTime getLastSyncTime() {
        return lastSyncTime;
    }

    public void setLastSyncTime(LocalDateTime lastSyncTime) {
        this.lastSyncTime = lastSyncTime;
    }

    public Long getClientVersion() {
        return clientVersion;
    }

    public void setClientVersion(Long clientVersion) {
        this.clientVersion = clientVersion;
    }

    public List<VaultEntryChange> getChanges() {
        return changes;
    }

    public void setChanges(List<VaultEntryChange> changes) {
        this.changes = changes;
    }

    public List<UUID> getDeletions() {
        return deletions;
    }

    public void setDeletions(List<UUID> deletions) {
        this.deletions = deletions;
    }

    public List<FolderChange> getFolderChanges() {
        return folderChanges;
    }

    public void setFolderChanges(List<FolderChange> folderChanges) {
        this.folderChanges = folderChanges;
    }

    public List<UUID> getFolderDeletions() {
        return folderDeletions;
    }

    public void setFolderDeletions(List<UUID> folderDeletions) {
        this.folderDeletions = folderDeletions;
    }

    public List<TagChange> getTagChanges() {
        return tagChanges;
    }

    public void setTagChanges(List<TagChange> tagChanges) {
        this.tagChanges = tagChanges;
    }

    public List<UUID> getTagDeletions() {
        return tagDeletions;
    }

    public void setTagDeletions(List<UUID> tagDeletions) {
        this.tagDeletions = tagDeletions;
    }

    public List<SecureNoteChange> getNoteChanges() {
        return noteChanges;
    }

    public void setNoteChanges(List<SecureNoteChange> noteChanges) {
        this.noteChanges = noteChanges;
    }

    public List<UUID> getNoteDeletions() {
        return noteDeletions;
    }

    public void setNoteDeletions(List<UUID> noteDeletions) {
        this.noteDeletions = noteDeletions;
    }

    // Helper methods
    public boolean hasChanges() {
        return (changes != null && !changes.isEmpty()) ||
               (deletions != null && !deletions.isEmpty()) ||
               (folderChanges != null && !folderChanges.isEmpty()) ||
               (folderDeletions != null && !folderDeletions.isEmpty()) ||
               (tagChanges != null && !tagChanges.isEmpty()) ||
               (tagDeletions != null && !tagDeletions.isEmpty()) ||
               (noteChanges != null && !noteChanges.isEmpty()) ||
               (noteDeletions != null && !noteDeletions.isEmpty());
    }

    public int getTotalChangeCount() {
        int count = 0;
        if (changes != null) count += changes.size();
        if (deletions != null) count += deletions.size();
        if (folderChanges != null) count += folderChanges.size();
        if (folderDeletions != null) count += folderDeletions.size();
        if (tagChanges != null) count += tagChanges.size();
        if (tagDeletions != null) count += tagDeletions.size();
        if (noteChanges != null) count += noteChanges.size();
        if (noteDeletions != null) count += noteDeletions.size();
        return count;
    }

    /**
     * Represents a change to a vault entry (credential).
     */
    @Schema(description = "A change to a vault entry")
    public static class VaultEntryChange {
        @Schema(description = "Entry ID", example = "123e4567-e89b-12d3-a456-426614174000")
        @JsonProperty("id")
        private UUID id;

        @Schema(description = "Change operation type")
        @JsonProperty("operation")
        @NotNull(message = "Operation is required")
        private ChangeOperation operation;

        @Schema(description = "Entry version", example = "5")
        @JsonProperty("version")
        private Long version;

        @Schema(description = "Encrypted entry data")
        @JsonProperty("encryptedData")
        private String encryptedData;

        @Schema(description = "Initialization vector")
        @JsonProperty("iv")
        private String iv;

        @Schema(description = "Authentication tag")
        @JsonProperty("authTag")
        private String authTag;

        @Schema(description = "Folder ID", example = "456e7890-e89b-12d3-a456-426614174000")
        @JsonProperty("folderId")
        private UUID folderId;

        @Schema(description = "Last modified timestamp")
        @JsonProperty("lastModified")
        private LocalDateTime lastModified;

        // Constructors, getters, setters
        public VaultEntryChange() {}

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }

        public ChangeOperation getOperation() { return operation; }
        public void setOperation(ChangeOperation operation) { this.operation = operation; }

        public Long getVersion() { return version; }
        public void setVersion(Long version) { this.version = version; }

        public String getEncryptedData() { return encryptedData; }
        public void setEncryptedData(String encryptedData) { this.encryptedData = encryptedData; }

        public String getIv() { return iv; }
        public void setIv(String iv) { this.iv = iv; }

        public String getAuthTag() { return authTag; }
        public void setAuthTag(String authTag) { this.authTag = authTag; }

        public UUID getFolderId() { return folderId; }
        public void setFolderId(UUID folderId) { this.folderId = folderId; }

        public LocalDateTime getLastModified() { return lastModified; }
        public void setLastModified(LocalDateTime lastModified) { this.lastModified = lastModified; }
    }

    /**
     * Represents a change to a folder.
     */
    @Schema(description = "A change to a folder")
    public static class FolderChange {
        @Schema(description = "Folder ID")
        @JsonProperty("id")
        private UUID id;

        @Schema(description = "Change operation type")
        @JsonProperty("operation")
        @NotNull(message = "Operation is required")
        private ChangeOperation operation;

        @Schema(description = "Folder name")
        @JsonProperty("name")
        private String name;

        @Schema(description = "Folder description")
        @JsonProperty("description")
        private String description;

        @Schema(description = "Parent folder ID")
        @JsonProperty("parentId")
        private UUID parentId;

        @Schema(description = "Sort order")
        @JsonProperty("sortOrder")
        private Integer sortOrder;

        @Schema(description = "Last modified timestamp")
        @JsonProperty("lastModified")
        private LocalDateTime lastModified;

        // Constructors, getters, setters
        public FolderChange() {}

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }

        public ChangeOperation getOperation() { return operation; }
        public void setOperation(ChangeOperation operation) { this.operation = operation; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public UUID getParentId() { return parentId; }
        public void setParentId(UUID parentId) { this.parentId = parentId; }

        public Integer getSortOrder() { return sortOrder; }
        public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

        public LocalDateTime getLastModified() { return lastModified; }
        public void setLastModified(LocalDateTime lastModified) { this.lastModified = lastModified; }
    }

    /**
     * Represents a change to a tag.
     */
    @Schema(description = "A change to a tag")
    public static class TagChange {
        @Schema(description = "Tag ID")
        @JsonProperty("id")
        private UUID id;

        @Schema(description = "Change operation type")
        @JsonProperty("operation")
        @NotNull(message = "Operation is required")
        private ChangeOperation operation;

        @Schema(description = "Tag name")
        @JsonProperty("name")
        private String name;

        @Schema(description = "Tag color")
        @JsonProperty("color")
        private String color;

        @Schema(description = "Tag description")
        @JsonProperty("description")
        private String description;

        @Schema(description = "Sort order")
        @JsonProperty("sortOrder")
        private Integer sortOrder;

        @Schema(description = "Last modified timestamp")
        @JsonProperty("lastModified")
        private LocalDateTime lastModified;

        // Constructors, getters, setters
        public TagChange() {}

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }

        public ChangeOperation getOperation() { return operation; }
        public void setOperation(ChangeOperation operation) { this.operation = operation; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public Integer getSortOrder() { return sortOrder; }
        public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

        public LocalDateTime getLastModified() { return lastModified; }
        public void setLastModified(LocalDateTime lastModified) { this.lastModified = lastModified; }
    }

    /**
     * Represents a change to a secure note.
     */
    @Schema(description = "A change to a secure note")
    public static class SecureNoteChange {
        @Schema(description = "Note ID")
        @JsonProperty("id")
        private UUID id;

        @Schema(description = "Change operation type")
        @JsonProperty("operation")
        @NotNull(message = "Operation is required")
        private ChangeOperation operation;

        @Schema(description = "Note version")
        @JsonProperty("version")
        private Long version;

        @Schema(description = "Note title")
        @JsonProperty("title")
        private String title;

        @Schema(description = "Encrypted content")
        @JsonProperty("encryptedContent")
        private String encryptedContent;

        @Schema(description = "Content IV")
        @JsonProperty("contentIv")
        private String contentIv;

        @Schema(description = "Content auth tag")
        @JsonProperty("contentAuthTag")
        private String contentAuthTag;

        @Schema(description = "Encrypted attachments")
        @JsonProperty("encryptedAttachments")
        private String encryptedAttachments;

        @Schema(description = "Attachments IV")
        @JsonProperty("attachmentsIv")
        private String attachmentsIv;

        @Schema(description = "Attachments auth tag")
        @JsonProperty("attachmentsAuthTag")
        private String attachmentsAuthTag;

        @Schema(description = "Folder ID")
        @JsonProperty("folderId")
        private UUID folderId;

        @Schema(description = "Last modified timestamp")
        @JsonProperty("lastModified")
        private LocalDateTime lastModified;

        // Constructors, getters, setters
        public SecureNoteChange() {}

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }

        public ChangeOperation getOperation() { return operation; }
        public void setOperation(ChangeOperation operation) { this.operation = operation; }

        public Long getVersion() { return version; }
        public void setVersion(Long version) { this.version = version; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getEncryptedContent() { return encryptedContent; }
        public void setEncryptedContent(String encryptedContent) { this.encryptedContent = encryptedContent; }

        public String getContentIv() { return contentIv; }
        public void setContentIv(String contentIv) { this.contentIv = contentIv; }

        public String getContentAuthTag() { return contentAuthTag; }
        public void setContentAuthTag(String contentAuthTag) { this.contentAuthTag = contentAuthTag; }

        public String getEncryptedAttachments() { return encryptedAttachments; }
        public void setEncryptedAttachments(String encryptedAttachments) { this.encryptedAttachments = encryptedAttachments; }

        public String getAttachmentsIv() { return attachmentsIv; }
        public void setAttachmentsIv(String attachmentsIv) { this.attachmentsIv = attachmentsIv; }

        public String getAttachmentsAuthTag() { return attachmentsAuthTag; }
        public void setAttachmentsAuthTag(String attachmentsAuthTag) { this.attachmentsAuthTag = attachmentsAuthTag; }

        public UUID getFolderId() { return folderId; }
        public void setFolderId(UUID folderId) { this.folderId = folderId; }

        public LocalDateTime getLastModified() { return lastModified; }
        public void setLastModified(LocalDateTime lastModified) { this.lastModified = lastModified; }
    }

    /**
     * Enumeration of change operations.
     */
    public enum ChangeOperation {
        @JsonProperty("CREATE")
        CREATE,
        
        @JsonProperty("UPDATE")
        UPDATE,
        
        @JsonProperty("DELETE")
        DELETE
    }
}