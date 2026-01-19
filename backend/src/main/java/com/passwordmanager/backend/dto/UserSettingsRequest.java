package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating user settings.
 * 
 * Contains all configurable user preferences including security settings,
 * UI preferences, and behavioral configurations.
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to update user settings")
public class UserSettingsRequest {

    /**
     * Session inactivity timeout in minutes.
     * 
     * Valid range: 1-60 minutes
     * 
     * Requirements: 19.1
     */
    @Schema(description = "Session inactivity timeout in minutes", 
            minimum = "1", maximum = "60", example = "15")
    @NotNull(message = "Session timeout is required")
    @Min(value = 1, message = "Session timeout must be at least 1 minute")
    @Max(value = 60, message = "Session timeout must be at most 60 minutes")
    private Integer sessionTimeoutMinutes;

    /**
     * Clipboard auto-clear timeout in seconds.
     * 
     * Valid range: 30-300 seconds
     * 
     * Requirements: 19.3
     */
    @Schema(description = "Clipboard auto-clear timeout in seconds", 
            minimum = "30", maximum = "300", example = "60")
    @NotNull(message = "Clipboard timeout is required")
    @Min(value = 30, message = "Clipboard timeout must be at least 30 seconds")
    @Max(value = 300, message = "Clipboard timeout must be at most 300 seconds")
    private Integer clipboardTimeoutSeconds;

    /**
     * Whether biometric authentication is enabled.
     * 
     * Requirements: 19.2
     */
    @Schema(description = "Whether biometric authentication is enabled", example = "false")
    @NotNull(message = "Biometric enabled flag is required")
    private Boolean biometricEnabled;

    /**
     * Whether strict security mode is enabled.
     * 
     * Requirements: 19.5
     */
    @Schema(description = "Whether strict security mode is enabled", example = "false")
    @NotNull(message = "Strict security mode flag is required")
    private Boolean strictSecurityMode;

    /**
     * UI theme preference.
     * 
     * Valid values: 'light', 'dark', 'auto'
     */
    @Schema(description = "UI theme preference", 
            allowableValues = {"light", "dark", "auto"}, example = "light")
    @NotNull(message = "Theme is required")
    @Pattern(regexp = "^(light|dark|auto)$", message = "Theme must be 'light', 'dark', or 'auto'")
    private String theme;

    /**
     * Preferred language code.
     * 
     * ISO 639-1 language code (e.g., 'en', 'fr', 'es')
     * or language-country code (e.g., 'en-US', 'fr-CA')
     */
    @Schema(description = "Preferred language code (ISO 639-1)", 
            pattern = "^[a-z]{2}(-[A-Z]{2})?$", example = "en")
    @NotNull(message = "Language is required")
    @Pattern(regexp = "^[a-z]{2}(-[A-Z]{2})?$", message = "Language must be a valid ISO 639-1 code")
    private String language;
}