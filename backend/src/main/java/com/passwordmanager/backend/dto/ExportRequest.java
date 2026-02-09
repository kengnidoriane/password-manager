package com.passwordmanager.backend.dto;

import com.passwordmanager.backend.validation.ValidExportRequest;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for vault export operations.
 * 
 * This DTO contains the parameters needed to export vault data including
 * format selection, encryption options, and master password re-authentication.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ValidExportRequest
@Schema(description = "Request for exporting vault data")
public class ExportRequest {

    @NotNull(message = "Export format is required")
    @Pattern(regexp = "^(CSV|JSON)$", message = "Format must be CSV or JSON")
    @Schema(description = "Export format", example = "CSV", allowableValues = {"CSV", "JSON"})
    private String format;

    @NotBlank(message = "Master password hash is required for re-authentication")
    @Size(min = 60, max = 60, message = "Master password hash must be exactly 60 characters (BCrypt format)")
    @Schema(description = "Master password hash for re-authentication", example = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIfa")
    private String masterPasswordHash;

    @Schema(description = "Whether to encrypt the export with a user-specified password", example = "true")
    @Builder.Default
    private boolean encrypted = false;

    @Size(min = 8, max = 128, message = "Export password must be between 8 and 128 characters")
    @Schema(description = "Password for encrypting the export (required if encrypted=true, min 8 chars)", example = "export_password")
    private String exportPassword;

    @Schema(description = "Whether to include deleted items in the export", example = "false")
    @Builder.Default
    private boolean includeDeleted = false;
    
    /**
     * Validates that export password is provided when encryption is enabled.
     * 
     * @return true if validation passes, false otherwise
     */
    public boolean isValid() {
        if (encrypted && (exportPassword == null || exportPassword.trim().isEmpty())) {
            return false;
        }
        return true;
    }
}