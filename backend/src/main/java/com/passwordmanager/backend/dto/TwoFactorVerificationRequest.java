package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for verifying two-factor authentication codes.
 * 
 * Requirements: 14.2, 14.4
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to verify 2FA code")
public class TwoFactorVerificationRequest {

    /**
     * TOTP code from authenticator app (6 digits).
     */
    @NotBlank(message = "2FA code is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "2FA code must be 6 digits")
    @Schema(description = "6-digit TOTP code", example = "123456")
    private String code;

    /**
     * Whether this is a backup code instead of a TOTP code.
     */
    @Schema(description = "Whether this is a backup code", example = "false")
    @Builder.Default
    private Boolean isBackupCode = false;
}