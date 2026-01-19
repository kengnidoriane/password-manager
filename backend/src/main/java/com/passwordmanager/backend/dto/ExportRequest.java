package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Request DTO for vault export operations.
 * 
 * This DTO contains the parameters needed to export vault data including
 * format selection, encryption options, and master password re-authentication.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
@Schema(description = "Request for exporting vault data")
public class ExportRequest {

    @NotNull(message = "Export format is required")
    @Pattern(regexp = "^(CSV|JSON)$", message = "Format must be CSV or JSON")
    @Schema(description = "Export format", example = "CSV", allowableValues = {"CSV", "JSON"})
    private String format;

    @NotBlank(message = "Master password hash is required for re-authentication")
    @Schema(description = "Master password hash for re-authentication", example = "hashed_master_password")
    private String masterPasswordHash;

    @Schema(description = "Whether to encrypt the export with a user-specified password", example = "true")
    private boolean encrypted = false;

    @Schema(description = "Password for encrypting the export (required if encrypted=true)", example = "export_password")
    private String exportPassword;

    @Schema(description = "Whether to include deleted items in the export", example = "false")
    private boolean includeDeleted = false;

    // Constructors
    public ExportRequest() {}

    public ExportRequest(String format, String masterPasswordHash) {
        this.format = format;
        this.masterPasswordHash = masterPasswordHash;
    }

    public ExportRequest(String format, String masterPasswordHash, boolean encrypted, String exportPassword) {
        this.format = format;
        this.masterPasswordHash = masterPasswordHash;
        this.encrypted = encrypted;
        this.exportPassword = exportPassword;
    }

    // Getters and Setters
    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getMasterPasswordHash() {
        return masterPasswordHash;
    }

    public void setMasterPasswordHash(String masterPasswordHash) {
        this.masterPasswordHash = masterPasswordHash;
    }

    public boolean isEncrypted() {
        return encrypted;
    }

    public void setEncrypted(boolean encrypted) {
        this.encrypted = encrypted;
    }

    public String getExportPassword() {
        return exportPassword;
    }

    public void setExportPassword(String exportPassword) {
        this.exportPassword = exportPassword;
    }

    public boolean isIncludeDeleted() {
        return includeDeleted;
    }

    public void setIncludeDeleted(boolean includeDeleted) {
        this.includeDeleted = includeDeleted;
    }

    @Override
    public String toString() {
        return "ExportRequest{" +
                "format='" + format + '\'' +
                ", encrypted=" + encrypted +
                ", includeDeleted=" + includeDeleted +
                '}';
    }
}