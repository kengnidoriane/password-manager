package com.passwordmanager.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing sync history for audit and debugging purposes.
 * 
 * This entity tracks all sync operations performed by users,
 * including statistics and conflict information for troubleshooting
 * and monitoring sync performance.
 * 
 * Requirements: 3.5, 6.1, 6.3
 */
@Entity
@Table(name = "sync_history")
public class SyncHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(name = "client_version", nullable = false)
    private Long clientVersion;

    @Column(name = "server_version_before", nullable = false)
    private Long serverVersionBefore;

    @Column(name = "server_version_after", nullable = false)
    private Long serverVersionAfter;

    @Column(name = "sync_status", nullable = false)
    @Enumerated(EnumType.STRING)
    private SyncStatus syncStatus;

    @Column(name = "entries_processed", nullable = false)
    private int entriesProcessed;

    @Column(name = "entries_created", nullable = false)
    private int entriesCreated;

    @Column(name = "entries_updated", nullable = false)
    private int entriesUpdated;

    @Column(name = "entries_deleted", nullable = false)
    private int entriesDeleted;

    @Column(name = "folders_processed", nullable = false)
    private int foldersProcessed;

    @Column(name = "tags_processed", nullable = false)
    private int tagsProcessed;

    @Column(name = "notes_processed", nullable = false)
    private int notesProcessed;

    @Column(name = "conflicts_detected", nullable = false)
    private int conflictsDetected;

    @Column(name = "sync_duration_ms", nullable = false)
    private long syncDurationMs;

    @Column(name = "client_ip", length = 45)
    private String clientIp;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Default constructor
    public SyncHistory() {}

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private SyncHistory syncHistory = new SyncHistory();

        public Builder user(UserAccount user) {
            syncHistory.user = user;
            return this;
        }

        public Builder clientVersion(Long clientVersion) {
            syncHistory.clientVersion = clientVersion;
            return this;
        }

        public Builder serverVersionBefore(Long serverVersionBefore) {
            syncHistory.serverVersionBefore = serverVersionBefore;
            return this;
        }

        public Builder serverVersionAfter(Long serverVersionAfter) {
            syncHistory.serverVersionAfter = serverVersionAfter;
            return this;
        }

        public Builder syncStatus(SyncStatus syncStatus) {
            syncHistory.syncStatus = syncStatus;
            return this;
        }

        public Builder entriesProcessed(int entriesProcessed) {
            syncHistory.entriesProcessed = entriesProcessed;
            return this;
        }

        public Builder entriesCreated(int entriesCreated) {
            syncHistory.entriesCreated = entriesCreated;
            return this;
        }

        public Builder entriesUpdated(int entriesUpdated) {
            syncHistory.entriesUpdated = entriesUpdated;
            return this;
        }

        public Builder entriesDeleted(int entriesDeleted) {
            syncHistory.entriesDeleted = entriesDeleted;
            return this;
        }

        public Builder foldersProcessed(int foldersProcessed) {
            syncHistory.foldersProcessed = foldersProcessed;
            return this;
        }

        public Builder tagsProcessed(int tagsProcessed) {
            syncHistory.tagsProcessed = tagsProcessed;
            return this;
        }

        public Builder notesProcessed(int notesProcessed) {
            syncHistory.notesProcessed = notesProcessed;
            return this;
        }

        public Builder conflictsDetected(int conflictsDetected) {
            syncHistory.conflictsDetected = conflictsDetected;
            return this;
        }

        public Builder syncDurationMs(long syncDurationMs) {
            syncHistory.syncDurationMs = syncDurationMs;
            return this;
        }

        public Builder clientIp(String clientIp) {
            syncHistory.clientIp = clientIp;
            return this;
        }

        public Builder userAgent(String userAgent) {
            syncHistory.userAgent = userAgent;
            return this;
        }

        public Builder errorMessage(String errorMessage) {
            syncHistory.errorMessage = errorMessage;
            return this;
        }

        public SyncHistory build() {
            return syncHistory;
        }
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UserAccount getUser() {
        return user;
    }

    public void setUser(UserAccount user) {
        this.user = user;
    }

    public Long getClientVersion() {
        return clientVersion;
    }

    public void setClientVersion(Long clientVersion) {
        this.clientVersion = clientVersion;
    }

    public Long getServerVersionBefore() {
        return serverVersionBefore;
    }

    public void setServerVersionBefore(Long serverVersionBefore) {
        this.serverVersionBefore = serverVersionBefore;
    }

    public Long getServerVersionAfter() {
        return serverVersionAfter;
    }

    public void setServerVersionAfter(Long serverVersionAfter) {
        this.serverVersionAfter = serverVersionAfter;
    }

    public SyncStatus getSyncStatus() {
        return syncStatus;
    }

    public void setSyncStatus(SyncStatus syncStatus) {
        this.syncStatus = syncStatus;
    }

    public int getEntriesProcessed() {
        return entriesProcessed;
    }

    public void setEntriesProcessed(int entriesProcessed) {
        this.entriesProcessed = entriesProcessed;
    }

    public int getEntriesCreated() {
        return entriesCreated;
    }

    public void setEntriesCreated(int entriesCreated) {
        this.entriesCreated = entriesCreated;
    }

    public int getEntriesUpdated() {
        return entriesUpdated;
    }

    public void setEntriesUpdated(int entriesUpdated) {
        this.entriesUpdated = entriesUpdated;
    }

    public int getEntriesDeleted() {
        return entriesDeleted;
    }

    public void setEntriesDeleted(int entriesDeleted) {
        this.entriesDeleted = entriesDeleted;
    }

    public int getFoldersProcessed() {
        return foldersProcessed;
    }

    public void setFoldersProcessed(int foldersProcessed) {
        this.foldersProcessed = foldersProcessed;
    }

    public int getTagsProcessed() {
        return tagsProcessed;
    }

    public void setTagsProcessed(int tagsProcessed) {
        this.tagsProcessed = tagsProcessed;
    }

    public int getNotesProcessed() {
        return notesProcessed;
    }

    public void setNotesProcessed(int notesProcessed) {
        this.notesProcessed = notesProcessed;
    }

    public int getConflictsDetected() {
        return conflictsDetected;
    }

    public void setConflictsDetected(int conflictsDetected) {
        this.conflictsDetected = conflictsDetected;
    }

    public long getSyncDurationMs() {
        return syncDurationMs;
    }

    public void setSyncDurationMs(long syncDurationMs) {
        this.syncDurationMs = syncDurationMs;
    }

    public String getClientIp() {
        return clientIp;
    }

    public void setClientIp(String clientIp) {
        this.clientIp = clientIp;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Helper methods
    public boolean isSuccessful() {
        return syncStatus == SyncStatus.SUCCESS;
    }

    public int getTotalProcessed() {
        return entriesProcessed + foldersProcessed + tagsProcessed + notesProcessed;
    }

    public boolean hasConflicts() {
        return conflictsDetected > 0;
    }

    /**
     * Enumeration of sync statuses.
     */
    public enum SyncStatus {
        SUCCESS,
        PARTIAL_SUCCESS,
        FAILED,
        CONFLICT_DETECTED
    }
}