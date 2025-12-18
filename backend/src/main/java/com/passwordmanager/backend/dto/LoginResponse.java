package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Data Transfer Object for login response.
 * 
 * This DTO contains the JWT token and session information returned
 * after successful authentication.
 * 
 * Requirements: 2.1, 2.2
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Login response containing JWT token and session information")
public class LoginResponse {

    /**
     * JWT access token for authenticated requests.
     */
    @Schema(
        description = "JWT access token to be included in Authorization header",
        example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        required = true
    )
    private String token;

    /**
     * Token type (always "Bearer" for JWT).
     */
    @Schema(
        description = "Token type for Authorization header",
        example = "Bearer",
        required = true
    )
    @Builder.Default
    private String tokenType = "Bearer";

    /**
     * Token expiration time in seconds.
     */
    @Schema(
        description = "Token expiration time in seconds from now",
        example = "900",
        required = true
    )
    private long expiresIn;

    /**
     * User ID.
     */
    @Schema(
        description = "Unique identifier of the authenticated user",
        example = "123e4567-e89b-12d3-a456-426614174000",
        required = true
    )
    private UUID userId;

    /**
     * User's email address.
     */
    @Schema(
        description = "Email address of the authenticated user",
        example = "user@example.com",
        required = true
    )
    private String email;

    /**
     * Session ID for tracking and management.
     */
    @Schema(
        description = "Unique identifier of the created session",
        example = "987e6543-e21b-98d7-a654-426614174111",
        required = true
    )
    private UUID sessionId;

    /**
     * Whether 2FA is required for this user.
     */
    @Schema(
        description = "Indicates if two-factor authentication is enabled for this user",
        example = "false",
        required = false
    )
    @Builder.Default
    private boolean twoFactorRequired = false;
}