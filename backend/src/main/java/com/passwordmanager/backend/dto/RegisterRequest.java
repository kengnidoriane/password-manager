package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for user registration requests.
 * 
 * This DTO contains the information required to create a new user account
 * following zero-knowledge architecture principles.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Registration request containing user account creation data")
public class RegisterRequest {

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
     * Salt used for PBKDF2 key derivation on the client side.
     * 
     * This salt should be generated client-side and sent to the server
     * for storage. It will be used for future key derivation operations.
     */
    @NotBlank(message = "Salt is required")
    @Size(min = 16, max = 255, message = "Salt must be between 16 and 255 characters")
    @Schema(
        description = "Base64-encoded salt for PBKDF2 key derivation",
        example = "dGVzdC1zYWx0LWZvci1wYmtkZjI=",
        required = true,
        minLength = 16,
        maxLength = 255
    )
    private String salt;

    /**
     * Number of PBKDF2 iterations used for key derivation.
     * 
     * Must be at least 100,000 for security.
     */
    @NotNull(message = "Iterations count is required")
    @Min(value = 100000, message = "Iterations must be at least 100,000")
    @Schema(
        description = "Number of PBKDF2 iterations used for key derivation (minimum 100,000)",
        example = "100000",
        required = true,
        minimum = "100000"
    )
    private Integer iterations;
}