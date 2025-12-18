package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Data Transfer Object for registration response.
 * 
 * This DTO contains the information returned after successful user registration,
 * including the backup recovery key that must be displayed to the user once.
 * 
 * Requirements: 1.3
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Registration response containing user ID and recovery key")
public class RegisterResponse {

    /**
     * Unique identifier of the created user account.
     */
    @Schema(
        description = "Unique identifier of the created user account",
        example = "123e4567-e89b-12d3-a456-426614174000",
        required = true
    )
    private UUID userId;

    /**
     * User's email address.
     */
    @Schema(
        description = "Email address of the registered user",
        example = "user@example.com",
        required = true
    )
    private String email;

    /**
     * Backup recovery key for account recovery.
     * 
     * This key is generated once during registration and should be displayed
     * to the user for safekeeping. It can be used to recover the account
     * if the master password is forgotten.
     */
    @Schema(
        description = "Backup recovery key for account recovery (display once to user)",
        example = "RECOVERY-KEY-ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12-3456",
        required = true
    )
    private String recoveryKey;

    /**
     * Timestamp when the account was created.
     */
    @Schema(
        description = "Timestamp when the account was created",
        example = "2024-01-15T10:30:00",
        required = true
    )
    private LocalDateTime createdAt;

    /**
     * Whether email verification is required.
     */
    @Schema(
        description = "Whether email verification is required for this account",
        example = "true",
        required = true
    )
    @Builder.Default
    private boolean emailVerificationRequired = true;
}