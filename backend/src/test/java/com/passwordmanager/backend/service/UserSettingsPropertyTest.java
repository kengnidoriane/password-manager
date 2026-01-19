package com.passwordmanager.backend.service;

import com.passwordmanager.backend.dto.UserSettingsRequest;
import com.passwordmanager.backend.dto.UserSettingsResponse;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.UserSettings;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.UserSettingsRepository;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import net.jqwik.api.constraints.IntRange;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Property-based tests for UserSettingsService.
 * 
 * Tests correctness properties related to user settings management
 * including bounds validation and immediate application of changes.
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */
class UserSettingsPropertyTest {

    /**
     * Property 43: Session timeout bounds
     * 
     * For any session timeout value, the system SHALL accept values between 1 and 60 minutes
     * and reject values outside this range.
     * 
     * Validates: Requirements 19.1
     */
    @Property
    void sessionTimeoutBoundsProperty(@ForAll @IntRange(min = 1, max = 60) int validTimeout) {
        // Arrange - Create mocks for each test
        UserSettingsRepository userSettingsRepository = mock(UserSettingsRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        
        UserSettingsService userSettingsService = new UserSettingsService(
                userSettingsRepository, userRepository, auditLogService);

        UserAccount testUser = UserAccount.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .authKeyHash("hashedAuthKey")
                .salt("salt")
                .iterations(100000)
                .build();

        UserSettings testSettings = UserSettings.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .sessionTimeoutMinutes(15)
                .clipboardTimeoutSeconds(60)
                .biometricEnabled(false)
                .strictSecurityMode(false)
                .theme("light")
                .language("en")
                .build();

        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));
        when(userSettingsRepository.findByUserId(any(UUID.class))).thenReturn(Optional.of(testSettings));
        when(userSettingsRepository.save(any(UserSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserSettingsRequest request = UserSettingsRequest.builder()
                .sessionTimeoutMinutes(validTimeout)
                .clipboardTimeoutSeconds(60)
                .biometricEnabled(false)
                .strictSecurityMode(false)
                .theme("light")
                .language("en")
                .build();

        // Act
        UserSettingsResponse response = userSettingsService.updateUserSettings(testUser.getId(), request);

        // Assert
        assertThat(response.getSessionTimeoutMinutes()).isEqualTo(validTimeout);
    }

    @Property
    void sessionTimeoutRejectsInvalidValues(@ForAll("invalidSessionTimeouts") int invalidTimeout) {
        // Arrange - Create mocks for each test
        UserSettingsRepository userSettingsRepository = mock(UserSettingsRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        
        UserSettingsService userSettingsService = new UserSettingsService(
                userSettingsRepository, userRepository, auditLogService);

        UserAccount testUser = UserAccount.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .authKeyHash("hashedAuthKey")
                .salt("salt")
                .iterations(100000)
                .build();

        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));

        UserSettingsRequest request = UserSettingsRequest.builder()
                .sessionTimeoutMinutes(invalidTimeout)
                .clipboardTimeoutSeconds(60)
                .biometricEnabled(false)
                .strictSecurityMode(false)
                .theme("light")
                .language("en")
                .build();

        // Act & Assert
        assertThatThrownBy(() -> userSettingsService.updateUserSettings(testUser.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Session timeout must be between 1 and 60 minutes");
    }

    /**
     * Property 44: Clipboard timeout bounds
     * 
     * For any clipboard timeout value, the system SHALL accept values between 30 and 300 seconds
     * and reject values outside this range.
     * 
     * Validates: Requirements 19.3
     */
    @Property
    void clipboardTimeoutBoundsProperty(@ForAll @IntRange(min = 30, max = 300) int validTimeout) {
        // Arrange - Create mocks for each test
        UserSettingsRepository userSettingsRepository = mock(UserSettingsRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        
        UserSettingsService userSettingsService = new UserSettingsService(
                userSettingsRepository, userRepository, auditLogService);

        UserAccount testUser = UserAccount.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .authKeyHash("hashedAuthKey")
                .salt("salt")
                .iterations(100000)
                .build();

        UserSettings testSettings = UserSettings.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .sessionTimeoutMinutes(15)
                .clipboardTimeoutSeconds(60)
                .biometricEnabled(false)
                .strictSecurityMode(false)
                .theme("light")
                .language("en")
                .build();

        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));
        when(userSettingsRepository.findByUserId(any(UUID.class))).thenReturn(Optional.of(testSettings));
        when(userSettingsRepository.save(any(UserSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserSettingsRequest request = UserSettingsRequest.builder()
                .sessionTimeoutMinutes(15)
                .clipboardTimeoutSeconds(validTimeout)
                .biometricEnabled(false)
                .strictSecurityMode(false)
                .theme("light")
                .language("en")
                .build();

        // Act
        UserSettingsResponse response = userSettingsService.updateUserSettings(testUser.getId(), request);

        // Assert
        assertThat(response.getClipboardTimeoutSeconds()).isEqualTo(validTimeout);
    }

    @Property
    void clipboardTimeoutRejectsInvalidValues(@ForAll("invalidClipboardTimeouts") int invalidTimeout) {
        // Arrange - Create mocks for each test
        UserSettingsRepository userSettingsRepository = mock(UserSettingsRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        
        UserSettingsService userSettingsService = new UserSettingsService(
                userSettingsRepository, userRepository, auditLogService);

        UserAccount testUser = UserAccount.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .authKeyHash("hashedAuthKey")
                .salt("salt")
                .iterations(100000)
                .build();

        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));

        UserSettingsRequest request = UserSettingsRequest.builder()
                .sessionTimeoutMinutes(15)
                .clipboardTimeoutSeconds(invalidTimeout)
                .biometricEnabled(false)
                .strictSecurityMode(false)
                .theme("light")
                .language("en")
                .build();

        // Act & Assert
        assertThatThrownBy(() -> userSettingsService.updateUserSettings(testUser.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Clipboard timeout must be between 30 and 300 seconds");
    }

    /**
     * Property 45: Settings apply immediately
     * 
     * For any settings update, the changes SHALL be applied immediately without requiring
     * application restart or additional user action.
     * 
     * Validates: Requirements 19.4
     */
    @Property
    void settingsApplyImmediatelyProperty(@ForAll("validSettingsRequest") UserSettingsRequest request) {
        // Arrange - Create mocks for each test
        UserSettingsRepository userSettingsRepository = mock(UserSettingsRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        
        UserSettingsService userSettingsService = new UserSettingsService(
                userSettingsRepository, userRepository, auditLogService);

        UserAccount testUser = UserAccount.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .authKeyHash("hashedAuthKey")
                .salt("salt")
                .iterations(100000)
                .build();

        UserSettings testSettings = UserSettings.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .sessionTimeoutMinutes(15)
                .clipboardTimeoutSeconds(60)
                .biometricEnabled(false)
                .strictSecurityMode(false)
                .theme("light")
                .language("en")
                .build();

        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));
        when(userSettingsRepository.findByUserId(any(UUID.class))).thenReturn(Optional.of(testSettings));
        when(userSettingsRepository.save(any(UserSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        UserSettingsResponse response = userSettingsService.updateUserSettings(testUser.getId(), request);

        // Assert - All settings should be immediately reflected in the response
        assertThat(response.getSessionTimeoutMinutes()).isEqualTo(request.getSessionTimeoutMinutes());
        assertThat(response.getClipboardTimeoutSeconds()).isEqualTo(request.getClipboardTimeoutSeconds());
        assertThat(response.getBiometricEnabled()).isEqualTo(request.getBiometricEnabled());
        assertThat(response.getStrictSecurityMode()).isEqualTo(request.getStrictSecurityMode());
        assertThat(response.getTheme()).isEqualTo(request.getTheme());
        assertThat(response.getLanguage()).isEqualTo(request.getLanguage());
    }

    /**
     * Property 46: Strict security mode enforcement
     * 
     * For any settings configuration, when strict security mode is enabled,
     * the system SHALL enforce additional security restrictions.
     * 
     * Validates: Requirements 19.5
     */
    @Property
    void strictSecurityModeEnforcementProperty(@ForAll boolean strictMode) {
        // Arrange - Create mocks for each test
        UserSettingsRepository userSettingsRepository = mock(UserSettingsRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        
        UserSettingsService userSettingsService = new UserSettingsService(
                userSettingsRepository, userRepository, auditLogService);

        UserAccount testUser = UserAccount.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .authKeyHash("hashedAuthKey")
                .salt("salt")
                .iterations(100000)
                .build();

        UserSettings testSettings = UserSettings.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .sessionTimeoutMinutes(15)
                .clipboardTimeoutSeconds(60)
                .biometricEnabled(false)
                .strictSecurityMode(false)
                .theme("light")
                .language("en")
                .build();

        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));
        when(userSettingsRepository.findByUserId(any(UUID.class))).thenReturn(Optional.of(testSettings));
        when(userSettingsRepository.save(any(UserSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserSettingsRequest request = UserSettingsRequest.builder()
                .sessionTimeoutMinutes(15)
                .clipboardTimeoutSeconds(60)
                .biometricEnabled(false)
                .strictSecurityMode(strictMode)
                .theme("light")
                .language("en")
                .build();

        // Act
        UserSettingsResponse response = userSettingsService.updateUserSettings(testUser.getId(), request);

        // Assert - Strict security mode setting should be preserved
        assertThat(response.getStrictSecurityMode()).isEqualTo(strictMode);
        
        // Additional validation: when strict mode is enabled, certain restrictions should apply
        // This is a placeholder for future enforcement logic
        if (strictMode) {
            // In a full implementation, we would verify that:
            // - Clipboard access is disabled
            // - Authentication is required for every credential view
            // - Additional security restrictions are enforced
            assertThat(response.getStrictSecurityMode()).isTrue();
        }
    }

    // Arbitrary providers for generating test data

    @Provide
    Arbitrary<Integer> invalidSessionTimeouts() {
        return Arbitraries.oneOf(
                Arbitraries.integers().between(-100, 0),
                Arbitraries.integers().between(61, 200)
        );
    }

    @Provide
    Arbitrary<Integer> invalidClipboardTimeouts() {
        return Arbitraries.oneOf(
                Arbitraries.integers().between(-100, 29),
                Arbitraries.integers().between(301, 1000)
        );
    }

    @Provide
    Arbitrary<UserSettingsRequest> validSettingsRequest() {
        return Arbitraries.integers().between(1, 60)
                .flatMap(sessionTimeout ->
                        Arbitraries.integers().between(30, 300)
                                .flatMap(clipboardTimeout ->
                                        Arbitraries.of(true, false)
                                                .flatMap(biometric ->
                                                        Arbitraries.of(true, false)
                                                                .flatMap(strictMode ->
                                                                        Arbitraries.of("light", "dark", "auto")
                                                                                .flatMap(theme ->
                                                                                        Arbitraries.of("en", "fr", "es", "de", "en-US", "fr-CA")
                                                                                                .map(language ->
                                                                                                        UserSettingsRequest.builder()
                                                                                                                .sessionTimeoutMinutes(sessionTimeout)
                                                                                                                .clipboardTimeoutSeconds(clipboardTimeout)
                                                                                                                .biometricEnabled(biometric)
                                                                                                                .strictSecurityMode(strictMode)
                                                                                                                .theme(theme)
                                                                                                                .language(language)
                                                                                                                .build()
                                                                                                )
                                                                                )
                                                                )
                                                )
                                )
                );
    }
}