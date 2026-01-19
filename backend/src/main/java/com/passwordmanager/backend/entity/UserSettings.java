package com.passwordmanager.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing user-specific settings and preferences.
 * 
 * This entity stores configurable user preferences including security settings,
 * UI preferences, and behavioral configurations.
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */
@Entity
@Table(name = "user_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSettings {

    /**
     * Unique identifier for the user settings.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Reference to the user account these settings belong to.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @NotNull(message = "User is required")
    private UserAccount user;

    /**
     * Session inactivity timeout in minutes.
     * 
     * After this period of inactivity, the user session will expire
     * and the vault will be locked, requiring re-authentication.
     * 
     * Valid range: 1-60 minutes
     * Default: 15 minutes
     * 
     * Requirements: 19.1
     */
    @Column(name = "session_timeout_minutes", nullable = false)
    @NotNull(message = "Session timeout is required")
    @Min(value = 1, message = "Session timeout must be at least 1 minute")
    @Max(value = 60, message = "Session timeout must be at most 60 minutes")
    @Builder.Default
    private Integer sessionTimeoutMinutes = 15;

    /**
     * Clipboard auto-clear timeout in seconds.
     * 
     * After copying a password to the clipboard, it will be automatically
     * cleared after this timeout period for security.
     * 
     * Valid range: 30-300 seconds
     * Default: 60 seconds
     * 
     * Requirements: 19.3
     */
    @Column(name = "clipboard_timeout_seconds", nullable = false)
    @NotNull(message = "Clipboard timeout is required")
    @Min(value = 30, message = "Clipboard timeout must be at least 30 seconds")
    @Max(value = 300, message = "Clipboard timeout must be at most 300 seconds")
    @Builder.Default
    private Integer clipboardTimeoutSeconds = 60;

    /**
     * Whether biometric authentication is enabled.
     * 
     * When enabled, users can use fingerprint, face recognition, or other
     * biometric methods to unlock their vault instead of entering the master password.
     * 
     * Default: false
     * 
     * Requirements: 19.2
     */
    @Column(name = "biometric_enabled", nullable = false)
    @NotNull(message = "Biometric enabled flag is required")
    @Builder.Default
    private Boolean biometricEnabled = false;

    /**
     * Whether strict security mode is enabled.
     * 
     * When enabled:
     * - Clipboard access is disabled
     * - Authentication is required for every credential view
     * - Additional security restrictions are enforced
     * 
     * Default: false
     * 
     * Requirements: 19.5
     */
    @Column(name = "strict_security_mode", nullable = false)
    @NotNull(message = "Strict security mode flag is required")
    @Builder.Default
    private Boolean strictSecurityMode = false;

    /**
     * UI theme preference.
     * 
     * Valid values: 'light', 'dark', 'auto'
     * Default: 'light'
     */
    @Column(name = "theme", nullable = false, length = 20)
    @NotNull(message = "Theme is required")
    @Pattern(regexp = "^(light|dark|auto)$", message = "Theme must be 'light', 'dark', or 'auto'")
    @Builder.Default
    private String theme = "light";

    /**
     * Preferred language code.
     * 
     * ISO 639-1 language code (e.g., 'en', 'fr', 'es')
     * or language-country code (e.g., 'en-US', 'fr-CA')
     * 
     * Default: 'en'
     */
    @Column(name = "language", nullable = false, length = 10)
    @NotNull(message = "Language is required")
    @Pattern(regexp = "^[a-z]{2}(-[A-Z]{2})?$", message = "Language must be a valid ISO 639-1 code")
    @Builder.Default
    private String language = "en";

    /**
     * Timestamp when the settings were created.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the settings were last updated.
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Creates default settings for a user.
     * 
     * @param user the user account to create settings for
     * @return UserSettings with default values
     */
    public static UserSettings createDefault(UserAccount user) {
        return UserSettings.builder()
                .user(user)
                .sessionTimeoutMinutes(15)
                .clipboardTimeoutSeconds(60)
                .biometricEnabled(false)
                .strictSecurityMode(false)
                .theme("light")
                .language("en")
                .build();
    }

    /**
     * Checks if the current settings are within valid bounds.
     * 
     * @return true if all settings are valid, false otherwise
     */
    public boolean isValid() {
        return sessionTimeoutMinutes != null && sessionTimeoutMinutes >= 1 && sessionTimeoutMinutes <= 60
                && clipboardTimeoutSeconds != null && clipboardTimeoutSeconds >= 30 && clipboardTimeoutSeconds <= 300
                && biometricEnabled != null
                && strictSecurityMode != null
                && theme != null && theme.matches("^(light|dark|auto)$")
                && language != null && language.matches("^[a-z]{2}(-[A-Z]{2})?$");
    }

    /**
     * Gets the session timeout in milliseconds.
     * 
     * @return session timeout in milliseconds
     */
    public long getSessionTimeoutMillis() {
        return sessionTimeoutMinutes * 60L * 1000L;
    }

    /**
     * Gets the clipboard timeout in milliseconds.
     * 
     * @return clipboard timeout in milliseconds
     */
    public long getClipboardTimeoutMillis() {
        return clipboardTimeoutSeconds * 1000L;
    }
}