package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for two-factor authentication setup.
 * 
 * Contains the TOTP secret, QR code data URL, and backup codes.
 * 
 * Requirements: 14.1, 14.3
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Response containing 2FA setup information")
public class TwoFactorSetupResponse {

    /**
     * Base32-encoded TOTP secret for manual entry.
     */
    @Schema(description = "Base32-encoded TOTP secret", example = "JBSWY3DPEHPK3PXP")
    private String secret;

    /**
     * QR code as a data URL for easy scanning with authenticator apps.
     */
    @Schema(description = "QR code data URL", example = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...")
    private String qrCodeDataUrl;

    /**
     * List of backup codes for emergency access.
     * Each code can only be used once.
     */
    @Schema(description = "List of backup codes for emergency access")
    private List<String> backupCodes;

    /**
     * Instructions for the user on how to complete 2FA setup.
     */
    @Schema(description = "Setup instructions")
    private String instructions;
}