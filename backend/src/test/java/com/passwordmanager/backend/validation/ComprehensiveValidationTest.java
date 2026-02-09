package com.passwordmanager.backend.validation;

import com.passwordmanager.backend.dto.*;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive tests for all validation annotations and custom validators.
 * 
 * Tests Bean Validation annotations, custom validators, and complex validation rules.
 */
class ComprehensiveValidationTest {
    
    private static Validator validator;
    
    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }
    
    // ========== LoginRequest Tests ==========
    
    @Test
    void testLoginRequest_ValidInput() {
        LoginRequest request = LoginRequest.builder()
            .email("user@example.com")
            .authKeyHash("$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIfa")
            .build();
        
        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Valid login request should have no violations");
    }
    
    @Test
    void testLoginRequest_InvalidEmail() {
        LoginRequest request = LoginRequest.builder()
            .email("not-an-email")
            .authKeyHash("$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIfa")
            .build();
        
        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("valid")),
            "Should reject invalid email");
    }
    
    @Test
    void testLoginRequest_Invalid2FACode() {
        LoginRequest request = LoginRequest.builder()
            .email("user@example.com")
            .authKeyHash("$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIfa")
            .twoFactorCode("12345") // Only 5 digits
            .build();
        
        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("6 digits")),
            "Should reject 2FA code with wrong length");
    }
    
    // ========== RegisterRequest Tests ==========
    
    @Test
    void testRegisterRequest_ValidInput() {
        RegisterRequest request = RegisterRequest.builder()
            .email("user@example.com")
            .authKeyHash("$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIfa")
            .salt(Base64.getEncoder().encodeToString("test-salt-16bytes".getBytes()))
            .iterations(100000)
            .build();
        
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Valid register request should have no violations");
    }
    
    @Test
    void testRegisterRequest_LowIterations() {
        RegisterRequest request = RegisterRequest.builder()
            .email("user@example.com")
            .authKeyHash("$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIfa")
            .salt(Base64.getEncoder().encodeToString("test-salt".getBytes()))
            .iterations(50000) // Too low
            .build();
        
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("100,000")),
            "Should reject iterations below 100,000");
    }
    
    // ========== ShareCredentialRequest Tests ==========
    
    @Test
    void testShareCredentialRequest_ValidInput() {
        // Create Base64 strings that meet minimum length requirements (16+ chars)
        String validBase64Data = Base64.getEncoder().encodeToString("test data for encryption that is long enough".getBytes());
        String validBase64Iv = Base64.getEncoder().encodeToString("initialization-vector-16".getBytes());
        String validBase64Tag = Base64.getEncoder().encodeToString("authentication-tag-16".getBytes());
        
        ShareCredentialRequest request = ShareCredentialRequest.builder()
            .credentialId(UUID.randomUUID())
            .recipientEmail("recipient@example.com")
            .permissions(Arrays.asList("READ", "WRITE"))
            .encryptedData(validBase64Data)
            .iv(validBase64Iv)
            .authTag(validBase64Tag)
            .build();
        
        Set<ConstraintViolation<ShareCredentialRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Valid share request should have no violations");
    }
    
    @Test
    void testShareCredentialRequest_InvalidEmail() {
        // Create Base64 strings that meet minimum length requirements (16+ chars)
        String validBase64Data = Base64.getEncoder().encodeToString("test data for encryption that is long enough".getBytes());
        String validBase64Iv = Base64.getEncoder().encodeToString("initialization-vector-16".getBytes());
        String validBase64Tag = Base64.getEncoder().encodeToString("authentication-tag-16".getBytes());
        
        ShareCredentialRequest request = ShareCredentialRequest.builder()
            .credentialId(UUID.randomUUID())
            .recipientEmail("not-an-email")
            .permissions(Arrays.asList("READ"))
            .encryptedData(validBase64Data)
            .iv(validBase64Iv)
            .authTag(validBase64Tag)
            .build();
        
        Set<ConstraintViolation<ShareCredentialRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("valid")),
            "Should reject invalid recipient email");
    }
    
    @Test
    void testShareCredentialRequest_NoPermissions() {
        // Create Base64 strings that meet minimum length requirements (16+ chars)
        String validBase64Data = Base64.getEncoder().encodeToString("test data for encryption that is long enough".getBytes());
        String validBase64Iv = Base64.getEncoder().encodeToString("initialization-vector-16".getBytes());
        String validBase64Tag = Base64.getEncoder().encodeToString("authentication-tag-16".getBytes());
        
        ShareCredentialRequest request = ShareCredentialRequest.builder()
            .credentialId(UUID.randomUUID())
            .recipientEmail("recipient@example.com")
            .permissions(Arrays.asList()) // Empty list
            .encryptedData(validBase64Data)
            .iv(validBase64Iv)
            .authTag(validBase64Tag)
            .build();
        
        Set<ConstraintViolation<ShareCredentialRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("permission")),
            "Should reject empty permissions list");
    }
    
    // ========== ExportRequest Tests ==========
    
    @Test
    void testExportRequest_ValidUnencrypted() {
        ExportRequest request = ExportRequest.builder()
            .format("CSV")
            .masterPasswordHash("$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIfa")
            .encrypted(false)
            .build();
        
        Set<ConstraintViolation<ExportRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Valid unencrypted export request should have no violations");
    }
    
    @Test
    void testExportRequest_ValidEncrypted() {
        ExportRequest request = ExportRequest.builder()
            .format("JSON")
            .masterPasswordHash("$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIfa")
            .encrypted(true)
            .exportPassword("strong-export-password")
            .build();
        
        Set<ConstraintViolation<ExportRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Valid encrypted export request should have no violations");
    }
    
    @Test
    void testExportRequest_EncryptedWithoutPassword() {
        ExportRequest request = ExportRequest.builder()
            .format("CSV")
            .masterPasswordHash("$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIfa")
            .encrypted(true)
            // No export password
            .build();
        
        Set<ConstraintViolation<ExportRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("password")),
            "Should reject encrypted export without password");
    }
    
    @Test
    void testExportRequest_InvalidFormat() {
        ExportRequest request = ExportRequest.builder()
            .format("XML") // Invalid format
            .masterPasswordHash("$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIfa")
            .build();
        
        Set<ConstraintViolation<ExportRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("CSV or JSON")),
            "Should reject invalid format");
    }
    
    // ========== ImportRequest Tests ==========
    
    @Test
    void testImportRequest_ValidInput() {
        Map<String, String> entry = new HashMap<>();
        entry.put("title", "Example");
        entry.put("username", "user");
        entry.put("password", "pass");
        
        ImportRequest request = ImportRequest.builder()
            .format("CSV")
            .entries(Arrays.asList(entry))
            .skipDuplicates(false)
            .build();
        
        Set<ConstraintViolation<ImportRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Valid import request should have no violations");
    }
    
    @Test
    void testImportRequest_EmptyEntries() {
        ImportRequest request = ImportRequest.builder()
            .format("CSV")
            .entries(Arrays.asList()) // Empty list
            .build();
        
        Set<ConstraintViolation<ImportRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("1 and 10000")),
            "Should reject empty entries list");
    }
    
    // ========== RecoveryRequest Tests ==========
    
    @Test
    void testRecoveryRequest_ValidInput() {
        RecoveryRequest request = RecoveryRequest.builder()
            .email("user@example.com")
            .recoveryKey("ABCDEF-123456-GHIJKL-789012-MNOPQR-345678")
            .newAuthKeyHash("$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIfa")
            .newSalt(Base64.getEncoder().encodeToString("new-salt-16bytes".getBytes()))
            .newIterations(100000)
            .build();
        
        Set<ConstraintViolation<RecoveryRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Valid recovery request should have no violations");
    }
    
    @Test
    void testRecoveryRequest_InvalidSalt() {
        RecoveryRequest request = RecoveryRequest.builder()
            .email("user@example.com")
            .recoveryKey("ABCDEF-123456-GHIJKL-789012-MNOPQR-345678")
            .newAuthKeyHash("$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIfa")
            .newSalt("not-valid-base64!@#$")
            .newIterations(100000)
            .build();
        
        Set<ConstraintViolation<RecoveryRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Base64")),
            "Should reject invalid Base64 salt");
    }
    
    // ========== UserSettingsRequest Tests ==========
    
    @Test
    void testUserSettingsRequest_ValidInput() {
        UserSettingsRequest request = UserSettingsRequest.builder()
            .sessionTimeoutMinutes(15)
            .clipboardTimeoutSeconds(60)
            .biometricEnabled(false)
            .strictSecurityMode(false)
            .theme("light")
            .language("en")
            .build();
        
        Set<ConstraintViolation<UserSettingsRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Valid settings request should have no violations");
    }
    
    @Test
    void testUserSettingsRequest_InvalidSessionTimeout() {
        UserSettingsRequest request = UserSettingsRequest.builder()
            .sessionTimeoutMinutes(0) // Too low
            .clipboardTimeoutSeconds(60)
            .biometricEnabled(false)
            .strictSecurityMode(false)
            .theme("light")
            .language("en")
            .build();
        
        Set<ConstraintViolation<UserSettingsRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("1 minute")),
            "Should reject session timeout below 1 minute");
    }
    
    @Test
    void testUserSettingsRequest_InvalidClipboardTimeout() {
        UserSettingsRequest request = UserSettingsRequest.builder()
            .sessionTimeoutMinutes(15)
            .clipboardTimeoutSeconds(400) // Too high
            .biometricEnabled(false)
            .strictSecurityMode(false)
            .theme("light")
            .language("en")
            .build();
        
        Set<ConstraintViolation<UserSettingsRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("300 seconds")),
            "Should reject clipboard timeout above 300 seconds");
    }
    
    @Test
    void testUserSettingsRequest_InvalidTheme() {
        UserSettingsRequest request = UserSettingsRequest.builder()
            .sessionTimeoutMinutes(15)
            .clipboardTimeoutSeconds(60)
            .biometricEnabled(false)
            .strictSecurityMode(false)
            .theme("rainbow") // Invalid theme
            .language("en")
            .build();
        
        Set<ConstraintViolation<UserSettingsRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("light") || v.getMessage().contains("dark")),
            "Should reject invalid theme");
    }
    
    @Test
    void testUserSettingsRequest_InvalidLanguage() {
        UserSettingsRequest request = UserSettingsRequest.builder()
            .sessionTimeoutMinutes(15)
            .clipboardTimeoutSeconds(60)
            .biometricEnabled(false)
            .strictSecurityMode(false)
            .theme("light")
            .language("english") // Invalid format
            .build();
        
        Set<ConstraintViolation<UserSettingsRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("ISO 639-1")),
            "Should reject invalid language code");
    }
    
    // ========== TwoFactorVerificationRequest Tests ==========
    
    @Test
    void testTwoFactorVerificationRequest_ValidCode() {
        TwoFactorVerificationRequest request = TwoFactorVerificationRequest.builder()
            .code("123456")
            .isBackupCode(false)
            .build();
        
        Set<ConstraintViolation<TwoFactorVerificationRequest>> violations = validator.validate(request);
        assertTrue(violations.isEmpty(), "Valid 2FA verification request should have no violations");
    }
    
    @Test
    void testTwoFactorVerificationRequest_InvalidCode() {
        TwoFactorVerificationRequest request = TwoFactorVerificationRequest.builder()
            .code("12345") // Only 5 digits
            .isBackupCode(false)
            .build();
        
        Set<ConstraintViolation<TwoFactorVerificationRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("6 digits")),
            "Should reject code with wrong length");
    }
    
    @Test
    void testTwoFactorVerificationRequest_NonNumericCode() {
        TwoFactorVerificationRequest request = TwoFactorVerificationRequest.builder()
            .code("12345a") // Contains letter
            .isBackupCode(false)
            .build();
        
        Set<ConstraintViolation<TwoFactorVerificationRequest>> violations = validator.validate(request);
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("6 digits")),
            "Should reject non-numeric code");
    }
}
