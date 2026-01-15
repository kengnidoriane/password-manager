package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for account recovery operations.
 * 
 * This DTO contains the information needed to recover an account:
 * - Email address of the account to recover
 * - Recovery key provided by the user
 * - New authentication key hash derived from the new master password
 * - New salt for PBKDF2 key derivation
 * - New iteration count for PBKDF2
 * 
 * Requirements: 15.1, 15.2, 15.3
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Account recovery request")
public class RecoveryRequest {

    /**
     * Email address of the account to recover.
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Schema(description = "Email address of the account to recover", example = "user@example.com")
    private String email;

    /**
     * Recovery key provided by the user.
     * 
     * This should be the backup recovery key that was displayed to the user
     * during account creation.
     */
    @NotBlank(message = "Recovery key is required")
    @Schema(description = "Backup recovery key", example = "ABCDEF-123456-GHIJKL-789012-MNOPQR-345678-STUVWX-901234")
    private String recoveryKey;

    /**
     * New authentication key hash derived from the new master password.
     * 
     * This should be a BCrypt hash of the authentication key that was
     * derived from the new master password using PBKDF2.
     */
    @NotBlank(message = "New authentication key hash is required")
    @Schema(description = "BCrypt hash of the new authentication key derived from the new master password")
    private String newAuthKeyHash;

    /**
     * New salt for PBKDF2 key derivation.
     * 
     * This salt will be used by the client to derive encryption keys
     * from the new master password.
     */
    @NotBlank(message = "New salt is required")
    @Schema(description = "Salt for PBKDF2 key derivation with the new master password")
    private String newSalt;

    /**
     * New iteration count for PBKDF2 key derivation.
     * 
     * Must be at least 100,000 for security.
     */
    @NotNull(message = "New iterations count is required")
    @Min(value = 100000, message = "Iterations must be at least 100,000")
    @Schema(description = "Number of PBKDF2 iterations (minimum 100,000)", example = "100000")
    private Integer newIterations;
}