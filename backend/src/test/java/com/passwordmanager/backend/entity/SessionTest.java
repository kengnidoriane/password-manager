package com.passwordmanager.backend.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Session entity.
 * 
 * Tests the business logic methods and entity behavior.
 */
class SessionTest {

    private Session session;
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

        session = Session.builder()
                .id(UUID.randomUUID())
                .user(user)
                .sessionToken("test-token-123")
                .deviceInfo("Windows 10, Chrome 120")
                .ipAddress("192.168.1.1")
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .lastActivityAt(LocalDateTime.now())
                .isActive(true)
                .build();
    }

    @Test
    void testIsExpired_WhenNotExpired() {
        // Given
        session.setExpiresAt(LocalDateTime.now().plusMinutes(10));

        // When
        boolean result = session.isExpired();

        // Then
        assertFalse(result);
    }

    @Test
    void testIsExpired_WhenExpired() {
        // Given
        session.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        // When
        boolean result = session.isExpired();

        // Then
        assertTrue(result);
    }

    @Test
    void testIsValid_WhenActiveAndNotExpired() {
        // Given
        session.setIsActive(true);
        session.setExpiresAt(LocalDateTime.now().plusMinutes(10));

        // When
        boolean result = session.isValid();

        // Then
        assertTrue(result);
    }

    @Test
    void testIsValid_WhenInactive() {
        // Given
        session.setIsActive(false);
        session.setExpiresAt(LocalDateTime.now().plusMinutes(10));

        // When
        boolean result = session.isValid();

        // Then
        assertFalse(result);
    }

    @Test
    void testIsValid_WhenExpired() {
        // Given
        session.setIsActive(true);
        session.setExpiresAt(LocalDateTime.now().minusMinutes(1));

        // When
        boolean result = session.isValid();

        // Then
        assertFalse(result);
    }

    @Test
    void testUpdateActivity() {
        // Given
        LocalDateTime beforeUpdate = session.getLastActivityAt();
        LocalDateTime beforeExpiry = session.getExpiresAt();
        int timeoutMinutes = 20;

        // When
        session.updateActivity(timeoutMinutes);

        // Then
        assertTrue(session.getLastActivityAt().isAfter(beforeUpdate) || 
                   session.getLastActivityAt().isEqual(beforeUpdate));
        assertTrue(session.getExpiresAt().isAfter(beforeExpiry));
    }

    @Test
    void testInvalidate() {
        // Given
        session.setIsActive(true);

        // When
        session.invalidate();

        // Then
        assertFalse(session.getIsActive());
    }

    @Test
    void testGetUserId() {
        // When
        UUID userId = session.getUserId();

        // Then
        assertNotNull(userId);
        assertEquals(user.getId(), userId);
    }

    @Test
    void testGetUserId_WhenUserIsNull() {
        // Given
        session.setUser(null);

        // When
        UUID userId = session.getUserId();

        // Then
        assertNull(userId);
    }

    @Test
    void testBuilder() {
        // When
        Session newSession = Session.builder()
                .user(user)
                .sessionToken("token")
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build();

        // Then
        assertEquals("token", newSession.getSessionToken());
        assertTrue(newSession.getIsActive());
        assertNotNull(newSession.getLastActivityAt());
    }
}
