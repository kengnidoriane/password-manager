package com.passwordmanager.backend.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entity representing a user account in the password manager system.
 * 
 * This entity stores user authentication information following zero-knowledge architecture:
 * - The master password is NEVER stored or transmitted to the server
 * - Only the BCrypt hash of the derived authentication key is stored
 * - The salt and iteration count are stored for client-side PBKDF2 key derivation
 * 
 * Requirements: 1.1, 2.1
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAccount {

    /**
     * Unique identifier for the user account.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * User's email address, used as the username for authentication.
     * Must be unique across all users.
     */
    @Column(nullable = false, unique = true, length = 255)
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    /**
     * BCrypt hash of the derived authentication key.
     * 
     * IMPORTANT: This is NOT the master password hash.
     * The client derives an authentication key from the master password using PBKDF2,
     * and only the hash of this derived key is sent to the server.
     * 
     * This ensures zero-knowledge architecture where the server never has access
     * to the master password or encryption keys.
     */
    @Column(name = "auth_key_hash", nullable = false, length = 255)
    @NotBlank(message = "Authentication key hash is required")
    private String authKeyHash;

    /**
     * Salt used for PBKDF2 key derivation on the client side.
     * 
     * This salt is generated during registration and sent to the client
     * for deriving encryption keys from the master password.
     */
    @Column(nullable = false, length = 255)
    @NotBlank(message = "Salt is required")
    private String salt;

    /**
     * Number of PBKDF2 iterations used for key derivation.
     * 
     * Must be at least 100,000 for security.
     * Higher values provide better security but slower key derivation.
     */
    @Column(nullable = false)
    @NotNull(message = "Iterations count is required")
    @Min(value = 100000, message = "Iterations must be at least 100,000")
    private Integer iterations;

    /**
     * Whether two-factor authentication is enabled for this account.
     */
    @Column(name = "two_factor_enabled", nullable = false)
    @Builder.Default
    private Boolean twoFactorEnabled = false;

    /**
     * TOTP secret for two-factor authentication.
     * 
     * Only populated when 2FA is enabled.
     * Used to generate and validate time-based one-time passwords.
     */
    @Column(name = "two_factor_secret", length = 255)
    private String twoFactorSecret;

    /**
     * BCrypt hash of the backup recovery key.
     * 
     * The recovery key is generated during account creation and displayed once to the user.
     * It can be used to recover the account if the master password is forgotten.
     */
    @Column(name = "recovery_key_hash", length = 255)
    private String recoveryKeyHash;

    /**
     * Whether the user's email address has been verified.
     */
    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private Boolean emailVerified = false;

    /**
     * Timestamp when the account was created.
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the account was last updated.
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Timestamp of the last successful login.
     * 
     * Used for security monitoring and audit purposes.
     */
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    /**
     * Backup codes for two-factor authentication recovery.
     * 
     * These codes can be used as an alternative to TOTP codes when the user
     * cannot access their authenticator app. Each code can only be used once.
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<BackupCode> backupCodes = new ArrayList<>();

    /**
     * Updates the last login timestamp to the current time.
     * 
     * Should be called after successful authentication.
     */
    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    /**
     * Checks if two-factor authentication is enabled and configured.
     * 
     * @return true if 2FA is enabled and has a secret configured
     */
    public boolean has2FAEnabled() {
        return Boolean.TRUE.equals(twoFactorEnabled) && twoFactorSecret != null && !twoFactorSecret.isEmpty();
    }

    /**
     * Checks if the account has a recovery key configured.
     * 
     * @return true if a recovery key hash is present
     */
    public boolean hasRecoveryKey() {
        return recoveryKeyHash != null && !recoveryKeyHash.isEmpty();
    }

    /**
     * Gets the number of unused backup codes.
     * 
     * @return count of unused backup codes
     */
    public long getUnusedBackupCodeCount() {
        return backupCodes.stream()
                .filter(BackupCode::isAvailable)
                .count();
    }

    /**
     * Checks if the user has any unused backup codes available.
     * 
     * @return true if there are unused backup codes, false otherwise
     */
    public boolean hasUnusedBackupCodes() {
        return getUnusedBackupCodeCount() > 0;
    }

    /**
     * Adds a backup code to this user account.
     * 
     * @param backupCode the backup code to add
     */
    public void addBackupCode(BackupCode backupCode) {
        backupCodes.add(backupCode);
        backupCode.setUser(this);
    }

    /**
     * Removes a backup code from this user account.
     * 
     * @param backupCode the backup code to remove
     */
    public void removeBackupCode(BackupCode backupCode) {
        backupCodes.remove(backupCode);
        backupCode.setUser(null);
    }

    /**
     * Clears all backup codes for this user.
     * 
     * Used when disabling 2FA.
     */
    public void clearBackupCodes() {
        backupCodes.clear();
    }
}
