package com.passwordmanager.backend.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for UserAccount entity.
 * 
 * Tests the business logic methods and entity behavior.
 */
class UserAccountTest {

    private UserAccount userAccount;

    @BeforeEach
    void setUp() {
        userAccount = UserAccount.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .authKeyHash("$2a$12$hashedAuthKey")
                .salt("randomSalt123")
                .iterations(100000)
                .twoFactorEnabled(false)
                .emailVerified(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testUpdateLastLogin() {
        // Given
        assertNull(userAccount.getLastLoginAt());

        // When
        userAccount.updateLastLogin();

        // Then
        assertNotNull(userAccount.getLastLoginAt());
        assertTrue(userAccount.getLastLoginAt().isBefore(LocalDateTime.now().plusSeconds(1)));
    }

    @Test
    void testHas2FAEnabled_WhenDisabled() {
        // Given
        userAccount.setTwoFactorEnabled(false);
        userAccount.setTwoFactorSecret(null);

        // When
        boolean result = userAccount.has2FAEnabled();

        // Then
        assertFalse(result);
    }

    @Test
    void testHas2FAEnabled_WhenEnabledWithSecret() {
        // Given
        userAccount.setTwoFactorEnabled(true);
        userAccount.setTwoFactorSecret("JBSWY3DPEHPK3PXP");

        // When
        boolean result = userAccount.has2FAEnabled();

        // Then
        assertTrue(result);
    }

    @Test
    void testHas2FAEnabled_WhenEnabledButNoSecret() {
        // Given
        userAccount.setTwoFactorEnabled(true);
        userAccount.setTwoFactorSecret(null);

        // When
        boolean result = userAccount.has2FAEnabled();

        // Then
        assertFalse(result);
    }

    @Test
    void testHas2FAEnabled_WhenEnabledButEmptySecret() {
        // Given
        userAccount.setTwoFactorEnabled(true);
        userAccount.setTwoFactorSecret("");

        // When
        boolean result = userAccount.has2FAEnabled();

        // Then
        assertFalse(result);
    }

    @Test
    void testHasRecoveryKey_WhenPresent() {
        // Given
        userAccount.setRecoveryKeyHash("$2a$12$hashedRecoveryKey");

        // When
        boolean result = userAccount.hasRecoveryKey();

        // Then
        assertTrue(result);
    }

    @Test
    void testHasRecoveryKey_WhenNull() {
        // Given
        userAccount.setRecoveryKeyHash(null);

        // When
        boolean result = userAccount.hasRecoveryKey();

        // Then
        assertFalse(result);
    }

    @Test
    void testHasRecoveryKey_WhenEmpty() {
        // Given
        userAccount.setRecoveryKeyHash("");

        // When
        boolean result = userAccount.hasRecoveryKey();

        // Then
        assertFalse(result);
    }

    @Test
    void testBuilder() {
        // When
        UserAccount account = UserAccount.builder()
                .email("builder@example.com")
                .authKeyHash("hash")
                .salt("salt")
                .iterations(150000)
                .build();

        // Then
        assertEquals("builder@example.com", account.getEmail());
        assertEquals("hash", account.getAuthKeyHash());
        assertEquals("salt", account.getSalt());
        assertEquals(150000, account.getIterations());
        assertFalse(account.getTwoFactorEnabled());
        assertFalse(account.getEmailVerified());
    }

    @Test
    void testGetUnusedBackupCodeCount_WhenNoBackupCodes() {
        // When
        long count = userAccount.getUnusedBackupCodeCount();

        // Then
        assertEquals(0, count);
    }

    @Test
    void testGetUnusedBackupCodeCount_WithUnusedCodes() {
        // Given
        BackupCode code1 = BackupCode.builder()
                .codeHash("hash1")
                .used(false)
                .build();
        BackupCode code2 = BackupCode.builder()
                .codeHash("hash2")
                .used(false)
                .build();
        userAccount.addBackupCode(code1);
        userAccount.addBackupCode(code2);

        // When
        long count = userAccount.getUnusedBackupCodeCount();

        // Then
        assertEquals(2, count);
    }

    @Test
    void testGetUnusedBackupCodeCount_WithMixedCodes() {
        // Given
        BackupCode code1 = BackupCode.builder()
                .codeHash("hash1")
                .used(false)
                .build();
        BackupCode code2 = BackupCode.builder()
                .codeHash("hash2")
                .used(true)
                .build();
        userAccount.addBackupCode(code1);
        userAccount.addBackupCode(code2);

        // When
        long count = userAccount.getUnusedBackupCodeCount();

        // Then
        assertEquals(1, count);
    }

    @Test
    void testHasUnusedBackupCodes_WhenNoBackupCodes() {
        // When
        boolean result = userAccount.hasUnusedBackupCodes();

        // Then
        assertFalse(result);
    }

    @Test
    void testHasUnusedBackupCodes_WithUnusedCodes() {
        // Given
        BackupCode code = BackupCode.builder()
                .codeHash("hash")
                .used(false)
                .build();
        userAccount.addBackupCode(code);

        // When
        boolean result = userAccount.hasUnusedBackupCodes();

        // Then
        assertTrue(result);
    }

    @Test
    void testAddBackupCode() {
        // Given
        BackupCode code = BackupCode.builder()
                .codeHash("hash")
                .build();

        // When
        userAccount.addBackupCode(code);

        // Then
        assertEquals(1, userAccount.getBackupCodes().size());
        assertEquals(userAccount, code.getUser());
    }

    @Test
    void testRemoveBackupCode() {
        // Given
        BackupCode code = BackupCode.builder()
                .codeHash("hash")
                .build();
        userAccount.addBackupCode(code);

        // When
        userAccount.removeBackupCode(code);

        // Then
        assertEquals(0, userAccount.getBackupCodes().size());
        assertNull(code.getUser());
    }

    @Test
    void testClearBackupCodes() {
        // Given
        BackupCode code1 = BackupCode.builder()
                .codeHash("hash1")
                .build();
        BackupCode code2 = BackupCode.builder()
                .codeHash("hash2")
                .build();
        userAccount.addBackupCode(code1);
        userAccount.addBackupCode(code2);

        // When
        userAccount.clearBackupCodes();

        // Then
        assertEquals(0, userAccount.getBackupCodes().size());
    }
}
