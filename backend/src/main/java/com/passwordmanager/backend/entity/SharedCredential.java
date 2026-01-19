package com.passwordmanager.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Entity representing a credential shared between users.
 * 
 * This entity manages secure sharing of credentials using public key encryption.
 * The credential data is encrypted with the recipient's public key, ensuring
 * only the recipient can decrypt and access the shared credential.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
@Entity
@Table(name = "shared_credentials")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * User who owns and shares the credential
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private UserAccount owner;

    /**
     * User who receives the shared credential
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private UserAccount recipient;

    /**
     * Reference to the original vault entry being shared
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vault_entry_id", nullable = false)
    private VaultEntry vaultEntry;

    /**
     * Credential data encrypted with recipient's public key
     */
    @Column(name = "encrypted_data", columnDefinition = "TEXT", nullable = false)
    private String encryptedData;

    /**
     * Initialization vector for encryption
     */
    @Column(name = "iv", nullable = false)
    private String iv;

    /**
     * Authentication tag for encryption integrity
     */
    @Column(name = "auth_tag", nullable = false)
    private String authTag;

    /**
     * JSON array of permissions: read, write, share
     */
    @ElementCollection
    @CollectionTable(name = "shared_credential_permissions", 
                    joinColumns = @JoinColumn(name = "shared_credential_id"))
    @Column(name = "permission")
    private List<String> permissions;

    /**
     * Timestamp when the credential was shared
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the share was last updated
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Timestamp when sharing was revoked (NULL if still active)
     */
    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    /**
     * Last time recipient accessed this shared credential
     */
    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt;

    /**
     * Check if this shared credential is currently active (not revoked)
     */
    public boolean isActive() {
        return revokedAt == null;
    }

    /**
     * Revoke access to this shared credential
     */
    public void revoke() {
        this.revokedAt = LocalDateTime.now();
    }

    /**
     * Update the last accessed timestamp
     */
    public void updateLastAccessed() {
        this.lastAccessedAt = LocalDateTime.now();
    }

    /**
     * Check if the user has a specific permission
     */
    public boolean hasPermission(String permission) {
        return permissions != null && permissions.contains(permission);
    }
}