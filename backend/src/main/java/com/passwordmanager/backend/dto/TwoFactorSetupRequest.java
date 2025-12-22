package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for setting up two-factor authentication.
 * 
 * Requirements: 14.1
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to setup two-factor authentication")
public class TwoFactorSetupRequest {

    /**
     * User ID for whom to setup 2FA.
     */
    @NotNull(message = "User ID is required")
    @Schema(description = "User ID", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID userId;
}