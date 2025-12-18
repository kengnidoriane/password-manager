package com.passwordmanager.backend.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for BackupCode entity.
 * 
 * Tests the business logic methods and entity behavior.
 */
class BackupCodeTest {

    private BackupCode backupCode;
    private UserAccount user;

    @BeforeEach
    void setUp() {
        user = UserAccount.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .authKeyHash("hash")
                .salt("salt")
                .iterations(100000)
                .build();

        backupCode = BackupCode.builder()
                .id(UUID.randomUUID())
                .user(user)
                .codeHash("$2a$12$hashedBackupCode")
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testMarkAsUsed() {
        // Given
        assertFalse(backupCode.getUsed());
        assertNull(backupCode.getUsedAt());

        // When
        backupCode.markAsUsed();

        // Then
        assertTrue(backupCode.getUsed());
        assertNotNull(backupCode.getUsedAt());
        assertTrue(backupCode.getUsedAt().isBefore(LocalDateTime.now().plusSeconds(1)));
    }

    @Test
    void testIsAvailable_WhenUnused() {
        // Given
        backupCode.setUsed(false);

        // When
        boolean result = backupCode.isAvailable();

        // Then
        assertTrue(result);
    }

    @Test
    void testIsAvailable_WhenUsed() {
        // Given
        backupCode.setUsed(true);

        // When
        boolean result = backupCode.isAvailable();

        // Then
        assertFalse(result);
    }

    @Test
    void testIsAvailable_WhenUsedIsNull() {
        // Given
        backupCode.setUsed(null);

        // When
        boolean result = backupCode.isAvailable();

        // Then
        assertTrue(result);
    }

    @Test
    void testGetUserId() {
        // When
        UUID userId = backupCode.getUserId();

        // Then
        assertNotNull(userId);
        assertEquals(user.getId(), userId);
    }

    @Test
    void testGetUserId_WhenUserIsNull() {
        // Given
        backupCode.setUser(null);

        // When
        UUID userId = backupCode.getUserId();

        // Then
        assertNull(userId);
    }

    @Test
    void testBuilder() {
        // When
        BackupCode newBackupCode = BackupCode.builder()
                .user(user)
                .codeHash("hash")
                .build();

        // Then
        assertEquals("hash", newBackupCode.getCodeHash());
        assertFalse(newBackupCode.getUsed());
        assertEquals(user, newBackupCode.getUser());
    }

    @Test
    void testDefaultValues() {
        // When
        BackupCode newBackupCode = new BackupCode();

        // Then
        assertFalse(newBackupCode.getUsed());
        assertNull(newBackupCode.getUsedAt());
    }
}