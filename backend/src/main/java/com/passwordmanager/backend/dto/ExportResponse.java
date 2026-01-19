package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * Response DTO for vault export operations.
 * 
 * This DTO contains the exported vault data and metadata about the export operation.
 * The data is either encrypted or unencrypted based on the request parameters.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
@Schema(description = "Response containing exported vault data")
public class ExportResponse {

    @Schema(description = "Exported data in the requested format", example = "CSV or JSON data")
    private String data;

    @Schema(description = "Export format used", example = "CSV")
    private String format;

    @Schema(description = "Whether the export data is encrypted", example = "true")
    private boolean encrypted;

    @Schema(description = "Number of credentials exported", example = "25")
    private int credentialCount;

    @Schema(description = "Number of secure notes exported", example = "5")
    private int secureNoteCount;

    @Schema(description = "Number of folders exported", example = "8")
    private int folderCount;

    @Schema(description = "Number of tags exported", example = "12")
    private int tagCount;

    @Schema(description = "Whether deleted items were included", example = "false")
    private boolean includeDeleted;

    @Schema(description = "Timestamp when the export was created", example = "2024-01-15T10:30:00")
    private LocalDateTime exportedAt;

    @Schema(description = "Size of the exported data in bytes", example = "1024")
    private long dataSize;

    // Constructors
    public ExportResponse() {
        this.exportedAt = LocalDateTime.now();
    }

    public ExportResponse(String data, String format, boolean encrypted) {
        this();
        this.data = data;
        this.format = format;
        this.encrypted = encrypted;
        this.dataSize = data != null ? data.getBytes().length : 0;
    }

    // Getters and Setters
    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
        this.dataSize = data != null ? data.getBytes().length : 0;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public boolean isEncrypted() {
        return encrypted;
    }

    public void setEncrypted(boolean encrypted) {
        this.encrypted = encrypted;
    }

    public int getCredentialCount() {
        return credentialCount;
    }

    public void setCredentialCount(int credentialCount) {
        this.credentialCount = credentialCount;
    }

    public int getSecureNoteCount() {
        return secureNoteCount;
    }

    public void setSecureNoteCount(int secureNoteCount) {
        this.secureNoteCount = secureNoteCount;
    }

    public int getFolderCount() {
        return folderCount;
    }

    public void setFolderCount(int folderCount) {
        this.folderCount = folderCount;
    }

    public int getTagCount() {
        return tagCount;
    }

    public void setTagCount(int tagCount) {
        this.tagCount = tagCount;
    }

    public boolean isIncludeDeleted() {
        return includeDeleted;
    }

    public void setIncludeDeleted(boolean includeDeleted) {
        this.includeDeleted = includeDeleted;
    }

    public LocalDateTime getExportedAt() {
        return exportedAt;
    }

    public void setExportedAt(LocalDateTime exportedAt) {
        this.exportedAt = exportedAt;
    }

    public long getDataSize() {
        return dataSize;
    }

    public void setDataSize(long dataSize) {
        this.dataSize = dataSize;
    }

    @Override
    public String toString() {
        return "ExportResponse{" +
                "format='" + format + '\'' +
                ", encrypted=" + encrypted +
                ", credentialCount=" + credentialCount +
                ", secureNoteCount=" + secureNoteCount +
                ", folderCount=" + folderCount +
                ", tagCount=" + tagCount +
                ", includeDeleted=" + includeDeleted +
                ", exportedAt=" + exportedAt +
                ", dataSize=" + dataSize +
                '}';
    }
}