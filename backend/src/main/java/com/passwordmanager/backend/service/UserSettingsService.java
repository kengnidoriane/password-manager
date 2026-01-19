package com.passwordmanager.backend.service;

import com.passwordmanager.backend.dto.UserSettingsRequest;
import com.passwordmanager.backend.dto.UserSettingsResponse;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.UserSettings;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for managing user settings and preferences.
 * 
 * Handles CRUD operations for user settings including security preferences,
 * UI configuration, and behavioral settings.
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserSettingsService {

    private final UserSettingsRepository userSettingsRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    /**
     * Gets user settings by user ID.
     * 
     * If no settings exist, creates default settings for the user.
     * 
     * @param userId the user ID
     * @return UserSettingsResponse containing the user's settings
     * @throws IllegalArgumentException if user not found
     */
    @Transactional(readOnly = true)
    public UserSettingsResponse getUserSettings(UUID userId) {
        log.debug("Getting settings for user: {}", userId);
        
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultSettings(user));
        
        return UserSettingsResponse.fromEntity(settings);
    }

    /**
     * Updates user settings.
     * 
     * Validates the settings and applies changes immediately.
     * Logs the settings change for audit purposes.
     * 
     * @param userId the user ID
     * @param request the settings update request
     * @return UserSettingsResponse containing the updated settings
     * @throws IllegalArgumentException if user not found or settings invalid
     * 
     * Requirements: 19.4 (apply settings changes immediately)
     */
    @Transactional
    public UserSettingsResponse updateUserSettings(UUID userId, UserSettingsRequest request) {
        log.debug("Updating settings for user: {}", userId);
        
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        // Validate settings bounds
        validateSettingsRequest(request);
        
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultSettings(user));
        
        // Store previous values for audit logging
        UserSettings previousSettings = UserSettings.builder()
                .sessionTimeoutMinutes(settings.getSessionTimeoutMinutes())
                .clipboardTimeoutSeconds(settings.getClipboardTimeoutSeconds())
                .biometricEnabled(settings.getBiometricEnabled())
                .strictSecurityMode(settings.getStrictSecurityMode())
                .theme(settings.getTheme())
                .language(settings.getLanguage())
                .build();
        
        // Update settings
        settings.setSessionTimeoutMinutes(request.getSessionTimeoutMinutes());
        settings.setClipboardTimeoutSeconds(request.getClipboardTimeoutSeconds());
        settings.setBiometricEnabled(request.getBiometricEnabled());
        settings.setStrictSecurityMode(request.getStrictSecurityMode());
        settings.setTheme(request.getTheme());
        settings.setLanguage(request.getLanguage());
        
        UserSettings savedSettings = userSettingsRepository.save(settings);
        
        // Log settings change for audit
        auditLogService.logSettingsChange(userId, previousSettings, savedSettings);
        
        log.info("Updated settings for user: {}", userId);
        return UserSettingsResponse.fromEntity(savedSettings);
    }

    /**
     * Creates default settings for a user.
     * 
     * @param user the user account
     * @return UserSettings with default values
     */
    @Transactional
    public UserSettings createDefaultSettings(UserAccount user) {
        log.debug("Creating default settings for user: {}", user.getId());
        
        UserSettings settings = UserSettings.createDefault(user);
        UserSettings savedSettings = userSettingsRepository.save(settings);
        
        // Log settings creation for audit
        auditLogService.logSettingsCreation(user.getId(), savedSettings);
        
        log.info("Created default settings for user: {}", user.getId());
        return savedSettings;
    }

    /**
     * Deletes user settings.
     * 
     * @param userId the user ID
     */
    @Transactional
    public void deleteUserSettings(UUID userId) {
        log.debug("Deleting settings for user: {}", userId);
        
        userSettingsRepository.deleteByUserId(userId);
        
        // Log settings deletion for audit
        auditLogService.logSettingsDeletion(userId);
        
        log.info("Deleted settings for user: {}", userId);
    }

    /**
     * Validates a settings request to ensure all values are within acceptable bounds.
     * 
     * @param request the settings request to validate
     * @throws IllegalArgumentException if any setting is invalid
     */
    private void validateSettingsRequest(UserSettingsRequest request) {
        // Session timeout validation (1-60 minutes)
        if (request.getSessionTimeoutMinutes() == null || 
            request.getSessionTimeoutMinutes() < 1 || 
            request.getSessionTimeoutMinutes() > 60) {
            throw new IllegalArgumentException("Session timeout must be between 1 and 60 minutes");
        }
        
        // Clipboard timeout validation (30-300 seconds)
        if (request.getClipboardTimeoutSeconds() == null || 
            request.getClipboardTimeoutSeconds() < 30 || 
            request.getClipboardTimeoutSeconds() > 300) {
            throw new IllegalArgumentException("Clipboard timeout must be between 30 and 300 seconds");
        }
        
        // Boolean fields validation
        if (request.getBiometricEnabled() == null) {
            throw new IllegalArgumentException("Biometric enabled flag is required");
        }
        
        if (request.getStrictSecurityMode() == null) {
            throw new IllegalArgumentException("Strict security mode flag is required");
        }
        
        // Theme validation
        if (request.getTheme() == null || 
            !request.getTheme().matches("^(light|dark|auto)$")) {
            throw new IllegalArgumentException("Theme must be 'light', 'dark', or 'auto'");
        }
        
        // Language validation
        if (request.getLanguage() == null || 
            !request.getLanguage().matches("^[a-z]{2}(-[A-Z]{2})?$")) {
            throw new IllegalArgumentException("Language must be a valid ISO 639-1 code");
        }
    }
}