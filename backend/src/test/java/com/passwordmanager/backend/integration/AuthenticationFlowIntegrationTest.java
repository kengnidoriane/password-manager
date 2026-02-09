package com.passwordmanager.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.passwordmanager.backend.BaseIntegrationTest;
import com.passwordmanager.backend.dto.*;
import com.passwordmanager.backend.entity.Session;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.repository.SessionRepository;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.service.AuthenticationService;
import com.passwordmanager.backend.service.SessionService;
import com.passwordmanager.backend.service.TwoFactorService;
import com.passwordmanager.backend.util.JwtUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the complete authentication flow.
 * 
 * Tests cover:
 * - Complete registration flow
 * - Login with valid/invalid credentials
 * - 2FA setup and verification
 * - Session timeout and refresh
 * - Account recovery flow
 * 
 * Requirements: 1.1, 2.1, 14.1, 15.1
 */
@AutoConfigureMockMvc
@DisplayName("Authentication Flow Integration Tests")
public class AuthenticationFlowIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private SessionService sessionService;

    @Autowired
    private TwoFactorService twoFactorService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_AUTH_KEY_HASH = "hashed_auth_key_12345";
    private static final String TEST_SALT = "random_salt_12345";
    private static final int TEST_ITERATIONS = 100000;

    @BeforeEach
    void setUp() {
        // Clean up test data before each test
        userRepository.deleteAll();
        sessionRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        // Clean up test data after each test
        userRepository.deleteAll();
        sessionRepository.deleteAll();
    }

    // ========================================
    // Registration Flow Tests
    // ========================================

    @Test
    @DisplayName("Should successfully register a new user with valid credentials")
    void testCompleteRegistrationFlow() throws Exception {
        // Arrange
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(TEST_EMAIL)
                .authKeyHash(TEST_AUTH_KEY_HASH)
                .salt(TEST_SALT)
                .iterations(TEST_ITERATIONS)
                .build();

        // Act
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").exists())
                .andExpect(jsonPath("$.email").value(TEST_EMAIL))
                .andExpect(jsonPath("$.recoveryKey").exists())
                .andExpect(jsonPath("$.createdAt").exists())
                .andReturn();

        // Assert
        RegisterResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                RegisterResponse.class
        );

        assertNotNull(response.getUserId());
        assertNotNull(response.getRecoveryKey());
        assertEquals(TEST_EMAIL, response.getEmail());

        // Verify user was created in database
        UserAccount user = userRepository.findByEmail(TEST_EMAIL).orElse(null);
        assertNotNull(user);
        assertEquals(TEST_EMAIL, user.getEmail());
        assertEquals(TEST_AUTH_KEY_HASH, user.getAuthKeyHash());
        assertEquals(TEST_SALT, user.getSalt());
        assertEquals(TEST_ITERATIONS, user.getIterations());
        assertNotNull(user.getRecoveryKeyHash());
        assertFalse(user.has2FAEnabled());
    }

    @Test
    @DisplayName("Should reject registration with duplicate email")
    void testRegistrationWithDuplicateEmail() throws Exception {
        // Arrange - Create existing user
        UserAccount existingUser = UserAccount.builder()
                .email(TEST_EMAIL)
                .authKeyHash(TEST_AUTH_KEY_HASH)
                .salt(TEST_SALT)
                .iterations(TEST_ITERATIONS)
                .recoveryKeyHash(passwordEncoder.encode("recovery_key"))
                .build();
        userRepository.save(existingUser);

        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(TEST_EMAIL)
                .authKeyHash("different_hash")
                .salt("different_salt")
                .iterations(TEST_ITERATIONS)
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("registration_failed"))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("Should reject registration with invalid email format")
    void testRegistrationWithInvalidEmail() throws Exception {
        // Arrange
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email("invalid-email")
                .authKeyHash(TEST_AUTH_KEY_HASH)
                .salt(TEST_SALT)
                .iterations(TEST_ITERATIONS)
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    // ========================================
    // Login Flow Tests
    // ========================================

    @Test
    @DisplayName("Should successfully login with valid credentials")
    void testLoginWithValidCredentials() throws Exception {
        // Arrange - Create user
        UserAccount user = createTestUser(TEST_EMAIL, TEST_AUTH_KEY_HASH);

        LoginRequest loginRequest = LoginRequest.builder()
                .email(TEST_EMAIL)
                .authKeyHash(TEST_AUTH_KEY_HASH)
                .build();

        // Act
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.userId").value(user.getId().toString()))
                .andExpect(jsonPath("$.email").value(TEST_EMAIL))
                .andExpect(jsonPath("$.sessionId").exists())
                .andExpect(jsonPath("$.expiresIn").exists())
                .andReturn();

        // Assert
        LoginResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                LoginResponse.class
        );

        assertNotNull(response.getToken());
        assertNotNull(response.getSessionId());
        assertTrue(response.getExpiresIn() > 0);

        // Verify JWT token is valid
        String username = jwtUtil.extractUsername(response.getToken());
        assertEquals(TEST_EMAIL, username);
        assertFalse(jwtUtil.isTokenExpired(response.getToken()));

        // Verify session was created
        Session session = sessionRepository.findById(response.getSessionId()).orElse(null);
        assertNotNull(session);
        assertEquals(user.getId(), session.getUser().getId());
        assertTrue(session.getIsActive());
    }

    @Test
    @DisplayName("Should reject login with invalid credentials")
    void testLoginWithInvalidCredentials() throws Exception {
        // Arrange - Create user
        createTestUser(TEST_EMAIL, TEST_AUTH_KEY_HASH);

        LoginRequest loginRequest = LoginRequest.builder()
                .email(TEST_EMAIL)
                .authKeyHash("wrong_hash")
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("invalid_credentials"))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("Should reject login with non-existent email")
    void testLoginWithNonExistentEmail() throws Exception {
        // Arrange
        LoginRequest loginRequest = LoginRequest.builder()
                .email("nonexistent@example.com")
                .authKeyHash(TEST_AUTH_KEY_HASH)
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("invalid_credentials"));
    }

    @Test
    @DisplayName("Should enforce rate limiting after multiple failed login attempts")
    void testLoginRateLimiting() throws Exception {
        // Arrange - Create user
        createTestUser(TEST_EMAIL, TEST_AUTH_KEY_HASH);

        LoginRequest loginRequest = LoginRequest.builder()
                .email(TEST_EMAIL)
                .authKeyHash("wrong_hash")
                .build();

        // Act - Attempt multiple failed logins
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest))
                            .header("X-Forwarded-For", "192.168.1.1"))
                    .andExpect(status().isUnauthorized());
        }

        // Assert - Next attempt should be rate limited
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest))
                        .header("X-Forwarded-For", "192.168.1.1"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error").value("rate_limit_exceeded"));
    }

    // ========================================
    // 2FA Setup and Verification Tests
    // ========================================

    @Test
    @DisplayName("Should successfully setup 2FA for authenticated user")
    void testTwoFactorSetup() throws Exception {
        // Arrange - Create user and login
        UserAccount user = createTestUser(TEST_EMAIL, TEST_AUTH_KEY_HASH);
        String token = generateValidToken(user);

        TwoFactorSetupRequest setupRequest = TwoFactorSetupRequest.builder()
                .userId(user.getId())
                .build();

        // Act
        MvcResult result = mockMvc.perform(post("/api/v1/auth/2fa/setup")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setupRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.secret").exists())
                .andExpect(jsonPath("$.qrCodeDataUrl").exists())
                .andExpect(jsonPath("$.backupCodes").isArray())
                .andExpect(jsonPath("$.backupCodes").isNotEmpty())
                .andReturn();

        // Assert
        TwoFactorSetupResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                TwoFactorSetupResponse.class
        );

        assertNotNull(response.getSecret());
        assertNotNull(response.getQrCodeDataUrl());
        assertNotNull(response.getBackupCodes());
        assertEquals(10, response.getBackupCodes().size());

        // Verify user has 2FA secret stored
        UserAccount updatedUser = userRepository.findById(user.getId()).orElseThrow();
        assertNotNull(updatedUser.getTwoFactorSecret());
        assertFalse(updatedUser.getBackupCodes().isEmpty());
    }

    @Test
    @DisplayName("Should reject 2FA setup for unauthenticated user")
    void testTwoFactorSetupWithoutAuthentication() throws Exception {
        // Arrange
        TwoFactorSetupRequest setupRequest = TwoFactorSetupRequest.builder()
                .userId(UUID.randomUUID())
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/2fa/setup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setupRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should require 2FA code when 2FA is enabled")
    void testLoginWith2FAEnabled() throws Exception {
        // Arrange - Create user with 2FA enabled
        UserAccount user = createTestUser(TEST_EMAIL, TEST_AUTH_KEY_HASH);
        TwoFactorSetupResponse setupResponse = twoFactorService.setupTwoFactor(user.getId());
        twoFactorService.enableTwoFactor(user.getId());

        // Act - Try to login without 2FA code
        LoginRequest loginRequest = LoginRequest.builder()
                .email(TEST_EMAIL)
                .authKeyHash(TEST_AUTH_KEY_HASH)
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("two_factor_required"));
    }

    @Test
    @DisplayName("Should reject login with invalid 2FA code")
    void testLoginWithInvalid2FACode() throws Exception {
        // Arrange - Create user with 2FA enabled
        UserAccount user = createTestUser(TEST_EMAIL, TEST_AUTH_KEY_HASH);
        twoFactorService.setupTwoFactor(user.getId());
        twoFactorService.enableTwoFactor(user.getId());

        LoginRequest loginRequest = LoginRequest.builder()
                .email(TEST_EMAIL)
                .authKeyHash(TEST_AUTH_KEY_HASH)
                .twoFactorCode("000000") // Invalid code
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("invalid_two_factor_code"));
    }

    // ========================================
    // Session Timeout and Refresh Tests
    // ========================================

    @Test
    @DisplayName("Should create session with correct expiration time")
    void testSessionCreationWithTimeout() throws Exception {
        // Arrange
        UserAccount user = createTestUser(TEST_EMAIL, TEST_AUTH_KEY_HASH);
        LoginRequest loginRequest = LoginRequest.builder()
                .email(TEST_EMAIL)
                .authKeyHash(TEST_AUTH_KEY_HASH)
                .build();

        // Act
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                LoginResponse.class
        );

        // Assert
        Session session = sessionRepository.findById(response.getSessionId()).orElseThrow();
        assertNotNull(session.getExpiresAt());
        assertNotNull(session.getLastActivityAt());
        
        // Session should expire in approximately 15 minutes (default timeout)
        LocalDateTime expectedExpiration = LocalDateTime.now().plusMinutes(15);
        assertTrue(session.getExpiresAt().isAfter(LocalDateTime.now()));
        assertTrue(session.getExpiresAt().isBefore(expectedExpiration.plusMinutes(1)));
    }

    @Test
    @DisplayName("Should invalidate expired sessions")
    void testExpiredSessionInvalidation() throws Exception {
        // Arrange - Create user and session
        UserAccount user = createTestUser(TEST_EMAIL, TEST_AUTH_KEY_HASH);
        String token = generateValidToken(user);
        
        // Create session that's already expired
        Session expiredSession = Session.builder()
                .user(user)
                .sessionToken(token)
                .deviceInfo("Test Device")
                .ipAddress("127.0.0.1")
                .userAgent("Test Agent")
                .expiresAt(LocalDateTime.now().minusMinutes(1)) // Expired 1 minute ago
                .lastActivityAt(LocalDateTime.now().minusMinutes(16))
                .isActive(true)
                .build();
        sessionRepository.save(expiredSession);

        // Act - Validate expired session
        boolean isValid = sessionService.validateSession(expiredSession.getId()).isPresent();

        // Assert
        assertFalse(isValid, "Expired session should not be valid");
    }

    @Test
    @DisplayName("Should update last activity time on session refresh")
    void testSessionActivityUpdate() throws Exception {
        // Arrange - Create user and session
        UserAccount user = createTestUser(TEST_EMAIL, TEST_AUTH_KEY_HASH);
        String token = generateValidToken(user);
        
        Session session = Session.builder()
                .user(user)
                .sessionToken(token)
                .deviceInfo("Test Device")
                .ipAddress("127.0.0.1")
                .userAgent("Test Agent")
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .lastActivityAt(LocalDateTime.now().minusMinutes(5))
                .isActive(true)
                .build();
        session = sessionRepository.save(session);

        LocalDateTime originalLastActivity = session.getLastActivityAt();

        // Act - Update session activity
        Thread.sleep(100); // Small delay to ensure time difference
        boolean updated = sessionService.updateLastActivity(session.getId(), 15);

        // Assert
        assertTrue(updated);
        Session updatedSession = sessionRepository.findById(session.getId()).orElseThrow();
        assertTrue(updatedSession.getLastActivityAt().isAfter(originalLastActivity));
    }

    // ========================================
    // Account Recovery Flow Tests
    // ========================================

    @Test
    @DisplayName("Should successfully recover account with valid recovery key")
    void testAccountRecoveryWithValidKey() throws Exception {
        // Arrange - Register user and get recovery key
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(TEST_EMAIL)
                .authKeyHash(TEST_AUTH_KEY_HASH)
                .salt(TEST_SALT)
                .iterations(TEST_ITERATIONS)
                .build();

        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        RegisterResponse registerResponse = objectMapper.readValue(
                registerResult.getResponse().getContentAsString(),
                RegisterResponse.class
        );

        String recoveryKey = registerResponse.getRecoveryKey();

        // Act - Recover account with new credentials
        RecoveryRequest recoveryRequest = RecoveryRequest.builder()
                .email(TEST_EMAIL)
                .recoveryKey(recoveryKey)
                .newAuthKeyHash("new_auth_key_hash")
                .newSalt("new_salt")
                .newIterations(150000)
                .build();

        MvcResult recoveryResult = mockMvc.perform(post("/api/v1/auth/recovery")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recoveryRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.newRecoveryKey").exists())
                .andExpect(jsonPath("$.userId").exists())
                .andExpect(jsonPath("$.email").value(TEST_EMAIL))
                .andReturn();

        // Assert
        RecoveryResponse recoveryResponse = objectMapper.readValue(
                recoveryResult.getResponse().getContentAsString(),
                RecoveryResponse.class
        );

        assertTrue(recoveryResponse.getSuccess());
        assertNotNull(recoveryResponse.getNewRecoveryKey());
        assertNotEquals(recoveryKey, recoveryResponse.getNewRecoveryKey());

        // Verify user credentials were updated
        UserAccount user = userRepository.findByEmail(TEST_EMAIL).orElseThrow();
        assertEquals("new_auth_key_hash", user.getAuthKeyHash());
        assertEquals("new_salt", user.getSalt());
        assertEquals(150000, user.getIterations());

        // Verify old recovery key no longer works
        RecoveryRequest invalidRecoveryRequest = RecoveryRequest.builder()
                .email(TEST_EMAIL)
                .recoveryKey(recoveryKey) // Old recovery key
                .newAuthKeyHash("another_hash")
                .newSalt("another_salt")
                .newIterations(100000)
                .build();

        mockMvc.perform(post("/api/v1/auth/recovery")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRecoveryRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_recovery_key"));
    }

    @Test
    @DisplayName("Should reject account recovery with invalid recovery key")
    void testAccountRecoveryWithInvalidKey() throws Exception {
        // Arrange - Create user
        createTestUser(TEST_EMAIL, TEST_AUTH_KEY_HASH);

        RecoveryRequest recoveryRequest = RecoveryRequest.builder()
                .email(TEST_EMAIL)
                .recoveryKey("INVALID-RECOVERY-KEY-123456")
                .newAuthKeyHash("new_auth_key_hash")
                .newSalt("new_salt")
                .newIterations(150000)
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/recovery")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recoveryRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_recovery_key"));
    }

    @Test
    @DisplayName("Should reject account recovery for non-existent user")
    void testAccountRecoveryForNonExistentUser() throws Exception {
        // Arrange
        RecoveryRequest recoveryRequest = RecoveryRequest.builder()
                .email("nonexistent@example.com")
                .recoveryKey("SOME-RECOVERY-KEY-123456")
                .newAuthKeyHash("new_auth_key_hash")
                .newSalt("new_salt")
                .newIterations(150000)
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/recovery")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recoveryRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should enforce rate limiting for account recovery attempts")
    void testAccountRecoveryRateLimiting() throws Exception {
        // Arrange - Create user
        createTestUser(TEST_EMAIL, TEST_AUTH_KEY_HASH);

        RecoveryRequest recoveryRequest = RecoveryRequest.builder()
                .email(TEST_EMAIL)
                .recoveryKey("INVALID-KEY")
                .newAuthKeyHash("new_hash")
                .newSalt("new_salt")
                .newIterations(100000)
                .build();

        // Act - Attempt multiple recovery requests
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/v1/auth/recovery")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(recoveryRequest))
                            .header("X-Forwarded-For", "192.168.1.100"))
                    .andExpect(status().isBadRequest());
        }

        // Assert - Next attempt should be rate limited
        mockMvc.perform(post("/api/v1/auth/recovery")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recoveryRequest))
                        .header("X-Forwarded-For", "192.168.1.100"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error").value("rate_limit_exceeded"));
    }

    @Test
    @DisplayName("Should invalidate all sessions after account recovery")
    void testSessionInvalidationAfterRecovery() throws Exception {
        // Arrange - Register user and create sessions
        RegisterRequest registerRequest = RegisterRequest.builder()
                .email(TEST_EMAIL)
                .authKeyHash(TEST_AUTH_KEY_HASH)
                .salt(TEST_SALT)
                .iterations(TEST_ITERATIONS)
                .build();

        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        RegisterResponse registerResponse = objectMapper.readValue(
                registerResult.getResponse().getContentAsString(),
                RegisterResponse.class
        );

        // Login to create a session
        LoginRequest loginRequest = LoginRequest.builder()
                .email(TEST_EMAIL)
                .authKeyHash(TEST_AUTH_KEY_HASH)
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse loginResponse = objectMapper.readValue(
                loginResult.getResponse().getContentAsString(),
                LoginResponse.class
        );

        UUID sessionId = loginResponse.getSessionId();

        // Verify session exists and is active
        Session sessionBefore = sessionRepository.findById(sessionId).orElseThrow();
        assertTrue(sessionBefore.getIsActive());

        // Act - Recover account
        RecoveryRequest recoveryRequest = RecoveryRequest.builder()
                .email(TEST_EMAIL)
                .recoveryKey(registerResponse.getRecoveryKey())
                .newAuthKeyHash("new_auth_key_hash")
                .newSalt("new_salt")
                .newIterations(150000)
                .build();

        mockMvc.perform(post("/api/v1/auth/recovery")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recoveryRequest)))
                .andExpect(status().isOk());

        // Assert - Session should be invalidated
        Session sessionAfter = sessionRepository.findById(sessionId).orElseThrow();
        assertFalse(sessionAfter.getIsActive(), "Session should be invalidated after account recovery");
    }

    // ========================================
    // Helper Methods
    // ========================================

    /**
     * Creates a test user with the given email and auth key hash.
     */
    private UserAccount createTestUser(String email, String authKeyHash) {
        UserAccount user = UserAccount.builder()
                .email(email)
                .authKeyHash(authKeyHash)
                .salt(TEST_SALT)
                .iterations(TEST_ITERATIONS)
                .recoveryKeyHash(passwordEncoder.encode("recovery_key_12345"))
                .emailVerified(true)
                .twoFactorEnabled(false)
                .build();
        return userRepository.save(user);
    }

    /**
     * Generates a valid JWT token for the given user.
     */
    private String generateValidToken(UserAccount user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId().toString());
        return jwtUtil.generateToken(claims, user.getEmail());
    }
}
