package com.passwordmanager.backend.controller;

import com.passwordmanager.backend.dto.CredentialRequest;
import com.passwordmanager.backend.dto.CredentialResponse;
import com.passwordmanager.backend.service.VaultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for vault operations including credential management.
 * 
 * This controller handles:
 * - CRUD operations for encrypted credentials
 * - Soft delete functionality with trash management
 * - Version control for conflict resolution
 * - User authorization and access control
 * 
 * All operations maintain zero-knowledge architecture where the server
 * never has access to unencrypted credential data.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
@RestController
@RequestMapping("/api/v1/vault")
@Tag(name = "Vault", description = "Encrypted credential and vault management")
@SecurityRequirement(name = "bearerAuth")
public class VaultController {

    private static final Logger logger = LoggerFactory.getLogger(VaultController.class);

    private final VaultService vaultService;

    public VaultController(VaultService vaultService) {
        this.vaultService = vaultService;
    }

    /**
     * Retrieves all active credentials for the authenticated user.
     * 
     * Returns all non-deleted credentials in the user's vault.
     * The credentials are returned as encrypted blobs that can only
     * be decrypted client-side with the user's master key.
     * 
     * @param request HTTP request for logging purposes
     * @return List of encrypted credential responses
     */
    @GetMapping
    @Operation(
        summary = "Retrieve all vault credentials",
        description = "Gets all active (non-deleted) credentials for the authenticated user. " +
                     "Returns encrypted data that can only be decrypted client-side with the master key."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Credentials retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = CredentialResponse.class))
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - invalid or expired token",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(schema = @Schema(implementation = Map.class))
        )
    })
    public ResponseEntity<?> getAllCredentials(HttpServletRequest request) {
        try {
            UUID userId = getCurrentUserId();
            String clientIp = getClientIpAddress(request);
            
            logger.debug("Retrieving all credentials for user: {} from IP: {}", userId, clientIp);
            
            List<CredentialResponse> credentials = vaultService.getAllCredentials(userId);
            
            logger.info("Retrieved {} credentials for user: {} from IP: {}", 
                       credentials.size(), userId, clientIp);
            
            return ResponseEntity.ok(credentials);
            
        } catch (Exception e) {
            logger.error("Error retrieving credentials: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "retrieval_failed");
            errorResponse.put("message", "Failed to retrieve credentials");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Creates a new encrypted credential entry.
     * 
     * The credential data must be encrypted client-side using AES-256-GCM
     * before being sent to the server. The server stores only the encrypted
     * blob and cannot access the actual credential information.
     * 
     * @param request The encrypted credential data
     * @param httpRequest HTTP request for logging purposes
     * @return The created credential with metadata
     */
    @PostMapping("/credential")
    @Operation(
        summary = "Create a new credential",
        description = "Creates a new encrypted credential entry in the vault. " +
                     "The credential data must be encrypted client-side using AES-256-GCM."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Credential created successfully",
            content = @Content(schema = @Schema(implementation = CredentialResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request data",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - invalid or expired token",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(schema = @Schema(implementation = Map.class))
        )
    })
    public ResponseEntity<?> createCredential(
            @Valid @RequestBody CredentialRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId();
            String clientIp = getClientIpAddress(httpRequest);
            
            logger.debug("Creating credential for user: {} from IP: {}", userId, clientIp);
            
            CredentialResponse response = vaultService.createCredential(userId, request);
            
            logger.info("Created credential {} for user: {} from IP: {}", 
                       response.getId(), userId, clientIp);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid credential creation request: {}", e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "invalid_request");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            
        } catch (Exception e) {
            logger.error("Error creating credential: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "creation_failed");
            errorResponse.put("message", "Failed to create credential");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Updates an existing credential with version control.
     * 
     * Uses optimistic locking to prevent conflicts when multiple devices
     * attempt to update the same credential simultaneously. The version
     * number must match the current version of the credential.
     * 
     * @param credentialId The ID of the credential to update
     * @param request The updated encrypted credential data
     * @param httpRequest HTTP request for logging purposes
     * @return The updated credential with new version number
     */
    @PutMapping("/credential/{id}")
    @Operation(
        summary = "Update an existing credential",
        description = "Updates an encrypted credential with version control to prevent conflicts. " +
                     "The version number must match the current credential version."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Credential updated successfully",
            content = @Content(schema = @Schema(implementation = CredentialResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request data",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Credential not found",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "409",
            description = "Version conflict - credential was modified by another process",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - invalid or expired token",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(schema = @Schema(implementation = Map.class))
        )
    })
    public ResponseEntity<?> updateCredential(
            @Parameter(description = "Credential ID", required = true)
            @PathVariable("id") UUID credentialId,
            @Valid @RequestBody CredentialRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId();
            String clientIp = getClientIpAddress(httpRequest);
            
            logger.debug("Updating credential {} for user: {} from IP: {}", 
                        credentialId, userId, clientIp);
            
            CredentialResponse response = vaultService.updateCredential(userId, credentialId, request);
            
            logger.info("Updated credential {} for user: {} from IP: {} (version {})", 
                       credentialId, userId, clientIp, response.getVersion());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid credential update request for {}: {}", credentialId, e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "invalid_request");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            
        } catch (OptimisticLockingFailureException e) {
            logger.warn("Version conflict updating credential {}: {}", credentialId, e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "version_conflict");
            errorResponse.put("message", "Credential was modified by another process. Please refresh and try again.");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
            
        } catch (Exception e) {
            logger.error("Error updating credential {}: {}", credentialId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "update_failed");
            errorResponse.put("message", "Failed to update credential");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Soft deletes a credential (moves to trash).
     * 
     * The credential is not permanently deleted but moved to trash
     * where it remains for 30 days before automatic permanent deletion.
     * Users can restore credentials from trash during this period.
     * 
     * @param credentialId The ID of the credential to delete
     * @param httpRequest HTTP request for logging purposes
     * @return Success message with deletion timestamp
     */
    @DeleteMapping("/credential/{id}")
    @Operation(
        summary = "Delete a credential (move to trash)",
        description = "Soft deletes a credential by moving it to trash. " +
                     "The credential can be restored within 30 days before permanent deletion."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Credential moved to trash successfully",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Credential not found",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - invalid or expired token",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(schema = @Schema(implementation = Map.class))
        )
    })
    public ResponseEntity<?> deleteCredential(
            @Parameter(description = "Credential ID", required = true)
            @PathVariable("id") UUID credentialId,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId();
            String clientIp = getClientIpAddress(httpRequest);
            
            logger.debug("Deleting credential {} for user: {} from IP: {}", 
                        credentialId, userId, clientIp);
            
            vaultService.deleteCredential(userId, credentialId);
            
            logger.info("Deleted credential {} for user: {} from IP: {}", 
                       credentialId, userId, clientIp);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Credential moved to trash successfully");
            response.put("credentialId", credentialId);
            response.put("deletedAt", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Credential not found for deletion {}: {}", credentialId, e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "not_found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            
        } catch (Exception e) {
            logger.error("Error deleting credential {}: {}", credentialId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "deletion_failed");
            errorResponse.put("message", "Failed to delete credential");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Gets the current authenticated user's ID from the security context.
     * 
     * @return The user ID
     * @throws IllegalStateException if no authenticated user found
     */
    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found");
        }
        
        // The principal should be a UserDetails object with the user ID as the username
        String userIdString = authentication.getName();
        
        try {
            return UUID.fromString(userIdString);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Invalid user ID format: " + userIdString);
        }
    }

    /**
     * Extracts the client IP address from the HTTP request.
     * 
     * @param request HTTP request
     * @return Client IP address
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Take the first IP in case of multiple proxies
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}