package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for account recovery operations.
 * 
 * This DTO contains the result of an account recovery operation:
 * - Success status
 * - New recovery key for future use
 * - Timestamp of the recovery
 * 
 * Requirements: 15.4, 15.5
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Account recovery response")
public class RecoveryResponse {

    /**
     * Whether the recovery operation was successful.
     */
    @Schema(description = "Whether the recovery was successful", example = "true")
    private Boolean success;

    /**
     * New recovery key generated for future use.
     * 
     * The old recovery key is invalidated and this new key should be
     * displayed to the user and stored securely.
     */
    @Schema(description = "New recovery key for future use", example = "NEWKEY-123456-ABCDEF-789012-GHIJKL-345678-MNOPQR-901234")
    private String newRecoveryKey;

    /**
     * User ID of the recovered account.
     */
    @Schema(description = "User ID of the recovered account")
    private UUID userId;

    /**
     * Email address of the recovered account.
     */
    @Schema(description = "Email address of the recovered account", example = "user@example.com")
    private String email;

    /**
     * Timestamp when the recovery was completed.
     */
    @Schema(description = "Timestamp when the recovery was completed")
    private LocalDateTime recoveredAt;

    /**
     * Message describing the recovery result.
     */
    @Schema(description = "Recovery result message", example = "Account recovery successful. Please save your new recovery key.")
    private String message;
}