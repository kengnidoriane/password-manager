package com.passwordmanager.backend.dto;

import com.passwordmanager.backend.entity.UserSettings;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for user settings.
 * 
 * Contains all user preferences and configuration options.
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "User settings response")
public class UserSettingsResponse {

    /**
     * Unique identifier for the settings.
     */
    @Schema(description = "Settings ID", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;

    /**
     * Session inactivity timeout in minutes.
     * 
     * Requirements: 19.1
     */
    @Schema(description = "Session inactivity timeout in minutes", example = "15")
    private Integer sessionTimeoutMinutes;

    /**
     * Clipboard auto-clear timeout in seconds.
     * 
     * Requirements: 19.3
     */
    @Schema(description = "Clipboard auto-clear timeout in seconds", example = "60")
    private Integer clipboardTimeoutSeconds;

    /**
     * Whether biometric authentication is enabled.
     * 
     * Requirements: 19.2
     */
    @Schema(description = "Whether biometric authentication is enabled", example = "false")
    private Boolean biometricEnabled;

    /**
     * Whether strict security mode is enabled.
     * 
     * Requirements: 19.5
     */
    @Schema(description = "Whether strict security mode is enabled", example = "false")
    private Boolean strictSecurityMode;

    /**
     * UI theme preference.
     */
    @Schema(description = "UI theme preference", example = "light")
    private String theme;

    /**
     * Preferred language code.
     */
    @Schema(description = "Preferred language code", example = "en")
    private String language;

    /**
     * Timestamp when the settings were created.
     */
    @Schema(description = "Settings creation timestamp")
    private LocalDateTime createdAt;

    /**
     * Timestamp when the settings were last updated.
     */
    @Schema(description = "Settings last update timestamp")
    private LocalDateTime updatedAt;

    /**
     * Creates a response DTO from a UserSettings entity.
     * 
     * @param settings the UserSettings entity
     * @return UserSettingsResponse DTO
     */
    public static UserSettingsResponse fromEntity(UserSettings settings) {
        return UserSettingsResponse.builder()
                .id(settings.getId())
                .sessionTimeoutMinutes(settings.getSessionTimeoutMinutes())
                .clipboardTimeoutSeconds(settings.getClipboardTimeoutSeconds())
                .biometricEnabled(settings.getBiometricEnabled())
                .strictSecurityMode(settings.getStrictSecurityMode())
                .theme(settings.getTheme())
                .language(settings.getLanguage())
                .createdAt(settings.getCreatedAt())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }
}