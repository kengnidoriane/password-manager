package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for user login requests.
 * 
 * This DTO contains the credentials required for user authentication.
 * The authKeyHash should be derived from the master password using PBKDF2
 * on the client side before transmission.
 * 
 * Requirements: 2.1
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Login request containing user credentials")
public class LoginRequest {

    /**
     * User's email address (used as username).
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    @Schema(
        description = "User's email address",
        example = "user@example.com",
        required = true
    )
    private String email;

    /**
     * Authentication key hash derived from the master password.
     * 
     * This is NOT the master password itself, but a hash derived using PBKDF2
     * with the user's salt and iteration count. The master password never
     * leaves the client device.
     */
    @NotBlank(message = "Authentication key hash is required")
    @Size(min = 60, max = 60, message = "Authentication key hash must be exactly 60 characters (BCrypt format)")
    @Schema(
        description = "BCrypt hash of the authentication key derived from master password using PBKDF2",
        example = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIfa",
        required = true,
        minLength = 60,
        maxLength = 60
    )
    private String authKeyHash;

    /**
     * Optional two-factor authentication code.
     * 
     * Required if the user has 2FA enabled on their account.
     */
    @Size(min = 6, max = 6, message = "2FA code must be exactly 6 digits")
    @Schema(
        description = "Six-digit TOTP code from authenticator app (required if 2FA is enabled)",
        example = "123456",
        required = false,
        minLength = 6,
        maxLength = 6
    )
    private String twoFactorCode;
}