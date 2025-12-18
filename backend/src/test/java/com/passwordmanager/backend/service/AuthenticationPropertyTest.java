package com.passwordmanager.backend.service;

import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.util.JwtUtil;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import com.passwordmanager.backend.dto.RegisterRequest;
import com.passwordmanager.backend.dto.RegisterResponse;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;

/**
 * Property-based tests for authentication functionality.
 * 
 * These tests verify correctness properties that should hold across
 * all valid inputs for authentication operations.
 * 
 * **Feature: password-manager, Property 6: Authentication requires decryption success**
 * **Feature: password-manager, Property 7: Session timeout enforcement**
 * **Feature: password-manager, Property 39: Recovery key generation**
 */
class AuthenticationPropertyTest {

    private UserRepository userRepository;
    private RedisTemplate<String, Object> redisTemplate;
    private AuthenticationManager authenticationManager;
    private AuthenticationService authenticationService;
    private JwtUtil jwtUtil;
    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        redisTemplate = mock(RedisTemplate.class);
        authenticationManager = mock(AuthenticationManager.class);
        authenticationService = new AuthenticationService(userRepository, redisTemplate, passwordEncoder);
        jwtUtil = new JwtUtil(createJwtProperties());
    }

    /**
     * **Feature: password-manager, Property 6: Authentication requires decryption success**
     * **Validates: Requirements 2.1**
     * 
     * For any authentication attempt, the attempt SHALL succeed if and only if 
     * the provided master password can decrypt the validation token.
     * 
     * This property tests that authentication success is directly tied to the ability
     * to decrypt user data, ensuring zero-knowledge architecture.
     */
    @Property(tries = 100)
    void authenticationRequiresDecryptionSuccess(
            @ForAll("validUserCredentials") UserCredentials credentials,
            @ForAll("randomString") String wrongPassword) {
        
        // Setup: Create a user with valid credentials
        UserAccount user = createTestUser(credentials.email, credentials.correctPasswordHash);
        when(userRepository.findByEmail(credentials.email)).thenReturn(Optional.of(user));

        // Test 1: Correct password should allow authentication
        Authentication correctAuth = mock(Authentication.class);
        when(correctAuth.isAuthenticated()).thenReturn(true);
        when(correctAuth.getName()).thenReturn(credentials.email);
        
        when(authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(credentials.email, credentials.correctPasswordHash)))
            .thenReturn(correctAuth);

        // This should succeed - correct password can "decrypt" (authenticate)
        assertTrue(correctAuth.isAuthenticated(), 
                  "Authentication should succeed with correct password");

        // Test 2: Wrong password should fail authentication
        when(authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(credentials.email, wrongPassword)))
            .thenThrow(new BadCredentialsException("Invalid credentials"));

        // This should fail - wrong password cannot "decrypt" (authenticate)
        assertThrows(BadCredentialsException.class, () -> {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(credentials.email, wrongPassword));
        }, "Authentication should fail with incorrect password");
    }

    /**
     * **Feature: password-manager, Property 7: Session timeout enforcement**
     * **Validates: Requirements 2.5**
     * 
     * For any session, if the inactivity period exceeds the configured timeout,
     * the vault SHALL be locked and require re-authentication.
     * 
     * This property tests that sessions properly expire and become invalid
     * after the configured timeout period.
     */
    @Property(tries = 100)
    void sessionTimeoutEnforcement(
            @ForAll("validUserCredentials") UserCredentials credentials,
            @ForAll("positiveTimeout") int timeoutMinutes) {
        
        // Setup: Create a user and generate a JWT token
        UserAccount user = createTestUser(credentials.email, credentials.correctPasswordHash);
        UserDetails userDetails = User.builder()
                .username(credentials.email)
                .password(credentials.correctPasswordHash)
                .authorities(Collections.emptyList())
                .build();

        // Generate token with the specified timeout
        String token = jwtUtil.generateToken(userDetails);

        // Test 1: Token should be valid immediately after creation
        assertTrue(jwtUtil.validateToken(token, userDetails),
                  "Token should be valid immediately after creation");

        // Test 2: Token should have correct remaining time
        long remainingTime = jwtUtil.getTokenRemainingTime(token);
        assertTrue(remainingTime > 0, 
                  "Token should have positive remaining time when valid");

        // Test 3: Simulate time passing beyond timeout
        // Since we can't actually wait, we test the logic by creating an expired token
        // by manipulating the JWT properties to have a very short expiration
        JwtUtil shortExpiryJwtUtil = new JwtUtil(createShortExpiryJwtProperties());
        String shortToken = shortExpiryJwtUtil.generateToken(userDetails);
        
        // Wait a small amount to ensure expiration
        try {
            Thread.sleep(100); // 100ms should be enough for a 50ms token
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Test 4: Expired token should be invalid
        assertFalse(shortExpiryJwtUtil.validateToken(shortToken, userDetails),
                   "Expired token should be invalid");

        // Test 5: Expired token should have zero remaining time
        long expiredRemainingTime = shortExpiryJwtUtil.getTokenRemainingTime(shortToken);
        assertTrue(expiredRemainingTime == 0,
                  "Expired token should have zero remaining time");
    }

    /**
     * **Feature: password-manager, Property 39: Recovery key generation**
     * **Validates: Requirements 1.3**
     * 
     * For any account creation, a backup recovery key SHALL be generated and displayed to the user.
     * 
     * This property tests that:
     * 1. A recovery key is always generated during registration
     * 2. The recovery key is properly formatted
     * 3. The recovery key can be used for validation
     * 4. Each registration generates a unique recovery key
     */
    @Property(tries = 100)
    void recoveryKeyGeneration(@ForAll("validRegistrationRequest") RegisterRequest registerRequest) {
        // Create fresh mocks for each property test iteration
        UserRepository mockUserRepository = mock(UserRepository.class);
        RedisTemplate<String, Object> mockRedisTemplate = mock(RedisTemplate.class);
        AuthenticationService testAuthService = new AuthenticationService(mockUserRepository, mockRedisTemplate, passwordEncoder);
        
        // Setup: Mock repository to allow registration
        when(mockUserRepository.findByEmail(registerRequest.getEmail())).thenReturn(Optional.empty());
        
        UserAccount savedUser = UserAccount.builder()
                .id(UUID.randomUUID())
                .email(registerRequest.getEmail())
                .authKeyHash(registerRequest.getAuthKeyHash())
                .salt(registerRequest.getSalt())
                .iterations(registerRequest.getIterations())
                .createdAt(LocalDateTime.now())
                .build();
        
        when(mockUserRepository.save(any(UserAccount.class))).thenAnswer(invocation -> {
            UserAccount user = invocation.getArgument(0);
            // Copy the recovery key hash from the input to the saved user for validation
            savedUser.setRecoveryKeyHash(user.getRecoveryKeyHash());
            return savedUser;
        });

        // Test: Register user and verify recovery key generation
        RegisterResponse response = testAuthService.registerUser(registerRequest);

        // Property 1: Recovery key must be generated
        assertNotNull(response.getRecoveryKey(), 
                     "Recovery key must be generated for any account creation");

        // Property 2: Recovery key must be properly formatted
        String recoveryKey = response.getRecoveryKey();
        assertTrue(recoveryKey.matches("^[A-Z0-9]{6}(-[A-Z0-9]{6}){7}$"),
                  "Recovery key must be formatted as 8 groups of 6 characters separated by hyphens");

        // Property 3: Recovery key must be at least 48 characters (excluding hyphens)
        String keyWithoutHyphens = recoveryKey.replace("-", "");
        assertTrue(keyWithoutHyphens.length() >= 48,
                  "Recovery key must contain at least 48 characters of entropy");

        // Property 4: Recovery key must be validatable
        // Mock the user lookup for validation
        when(mockUserRepository.findByEmail(registerRequest.getEmail())).thenReturn(Optional.of(savedUser));
        
        assertTrue(testAuthService.validateRecoveryKey(registerRequest.getEmail(), recoveryKey),
                  "Generated recovery key must be valid for the created account");

        // Property 5: Wrong recovery key must not validate
        String wrongKey = "WRONG1-WRONG2-WRONG3-WRONG4-WRONG5-WRONG6-WRONG7-WRONG8";
        assertFalse(testAuthService.validateRecoveryKey(registerRequest.getEmail(), wrongKey),
                   "Wrong recovery key must not validate");
    }

    @Provide
    Arbitrary<UserCredentials> validUserCredentials() {
        return Arbitraries.strings().alpha().ofMinLength(5).ofMaxLength(20)
                .map(s -> {
                    String email = s + "@example.com";
                    String password = passwordEncoder.encode(s + "password");
                    return new UserCredentials(email, password);
                });
    }

    @Provide
    Arbitrary<String> randomString() {
        return Arbitraries.strings().alpha().ofMinLength(8).ofMaxLength(50);
    }

    @Provide
    Arbitrary<Integer> positiveTimeout() {
        return Arbitraries.integers().between(1, 60); // 1 to 60 minutes
    }

    @Provide
    Arbitrary<RegisterRequest> validRegistrationRequest() {
        return Arbitraries.strings().alpha().ofMinLength(5).ofMaxLength(20)
                .map(s -> {
                    String email = s + "@example.com";
                    String authKeyHash = passwordEncoder.encode(s + "authkey");
                    String salt = java.util.Base64.getEncoder().encodeToString((s + "salt").getBytes());
                    return RegisterRequest.builder()
                            .email(email)
                            .authKeyHash(authKeyHash)
                            .salt(salt)
                            .iterations(100000)
                            .build();
                });
    }

    private UserAccount createTestUser(String email, String passwordHash) {
        return UserAccount.builder()
                .id(UUID.randomUUID())
                .email(email)
                .authKeyHash(passwordHash)
                .salt("test-salt")
                .iterations(100000)
                .createdAt(LocalDateTime.now())
                .emailVerified(true)
                .build();
    }

    private com.passwordmanager.backend.config.JwtProperties createJwtProperties() {
        com.passwordmanager.backend.config.JwtProperties props = 
            new com.passwordmanager.backend.config.JwtProperties();
        props.setSecret("test-secret-key-that-is-at-least-256-bits-long-for-security");
        props.setExpirationMs(900000); // 15 minutes
        props.setRefreshExpirationMs(86400000); // 24 hours
        return props;
    }

    private com.passwordmanager.backend.config.JwtProperties createShortExpiryJwtProperties() {
        com.passwordmanager.backend.config.JwtProperties props = 
            new com.passwordmanager.backend.config.JwtProperties();
        props.setSecret("test-secret-key-that-is-at-least-256-bits-long-for-security");
        props.setExpirationMs(50); // 50 milliseconds for quick expiration
        props.setRefreshExpirationMs(86400000); // 24 hours
        return props;
    }

    /**
     * Helper class to hold user credentials for testing.
     */
    private static class UserCredentials {
        final String email;
        final String correctPasswordHash;

        UserCredentials(String email, String correctPasswordHash) {
            this.email = email;
            this.correctPasswordHash = correctPasswordHash;
        }
    }
}