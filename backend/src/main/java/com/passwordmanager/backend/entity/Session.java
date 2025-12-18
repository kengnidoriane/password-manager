package com.passwordmanager.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a user session in the password manager system.
 * 
 * This entity provides database-backed session storage as a fallback
 * when Redis is unavailable. The primary session storage is Redis for performance.
 * 
 * Sessions track user authentication state, device information, and activity
 * for security monitoring and audit purposes.
 * 
 * Requirements: 2.2, 2.5
 */
@Entity
@Table(name = "sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    /**
     * Unique identifier for the session.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Reference to the user who owns this session.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private UserAccount user;

    /**
     * JWT token or session identifier.
     * 
     * This is the token that clients include in the Authorization header
     * for authenticated requests.
     */
    @Column(name = "session_token", nullable = false, unique = true, length = 512)
    @NotBlank(message = "Session token is required")
    private String sessionToken;

    /**
     * Parsed device information (OS, browser, device type).
     * 
     * Example: "Windows 10, Chrome 120, Desktop"
     */
    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    /**
     * IP address of the client.
     * 
     * Supports both IPv4 and IPv6 addresses.
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /**
     * Full user agent string from the client.
     * 
     * Used for detailed device fingerprinting and security analysis.
     */
    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    /**
     * Timestamp when the session was created.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Session expiration timestamp.
     * 
     * Default is 15 minutes from last activity.
     * Sessions are automatically invalidated after this time.
     */
    @Column(name = "expires_at", nullable = false)
    @NotNull(message = "Expiration time is required")
    private LocalDateTime expiresAt;

    /**
     * Last activity timestamp for session timeout tracking.
     * 
     * Updated on each authenticated request to extend the session.
     */
    @Column(name = "last_activity_at", nullable = false)
    @NotNull(message = "Last activity time is required")
    @Builder.Default
    private LocalDateTime lastActivityAt = LocalDateTime.now();

    /**
     * Whether the session is currently active.
     * 
     * Set to false after logout or when the session expires.
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Checks if the session has expired.
     * 
     * @return true if the current time is after the expiration time
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Checks if the session is valid (active and not expired).
     * 
     * @return true if the session is active and not expired
     */
    public boolean isValid() {
        return Boolean.TRUE.equals(isActive) && !isExpired();
    }

    /**
     * Updates the last activity timestamp and extends the session expiration.
     * 
     * @param timeoutMinutes Number of minutes until the session expires
     */
    public void updateActivity(int timeoutMinutes) {
        this.lastActivityAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusMinutes(timeoutMinutes);
    }

    /**
     * Invalidates the session (marks as inactive).
     * 
     * Should be called on logout or when the session is revoked.
     */
    public void invalidate() {
        this.isActive = false;
    }

    /**
     * Gets the user ID associated with this session.
     * 
     * @return UUID of the user
     */
    public UUID getUserId() {
        return user != null ? user.getId() : null;
    }
}
