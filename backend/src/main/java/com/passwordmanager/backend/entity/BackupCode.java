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
 * Entity representing a backup code for two-factor authentication recovery.
 * 
 * Backup codes are generated when a user enables 2FA and can be used as an alternative
 * to TOTP codes for authentication. Each code can only be used once.
 * 
 * Requirements: 14.3
 */
@Entity
@Table(name = "backup_codes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BackupCode {

    /**
     * Unique identifier for the backup code.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Reference to the user who owns this backup code.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private UserAccount user;

    /**
     * BCrypt hash of the backup code.
     * 
     * The actual backup code is never stored in plain text for security.
     * Only the hash is stored, similar to password storage.
     */
    @Column(name = "code_hash", nullable = false, length = 255)
    @NotBlank(message = "Code hash is required")
    private String codeHash;

    /**
     * Whether this backup code has been used.
     * 
     * Once a backup code is used, it cannot be used again.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean used = false;

    /**
     * Timestamp when the backup code was used.
     * 
     * Only populated when the code is used for authentication.
     */
    @Column(name = "used_at")
    private LocalDateTime usedAt;

    /**
     * Timestamp when the backup code was created.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Marks this backup code as used.
     * 
     * Should be called when the code is successfully used for authentication.
     */
    public void markAsUsed() {
        this.used = true;
        this.usedAt = LocalDateTime.now();
    }

    /**
     * Checks if this backup code is available for use.
     * 
     * @return true if the code has not been used, false otherwise
     */
    public boolean isAvailable() {
        return !Boolean.TRUE.equals(used);
    }

    /**
     * Gets the user ID associated with this backup code.
     * 
     * @return UUID of the user
     */
    public UUID getUserId() {
        return user != null ? user.getId() : null;
    }
}