package com.passwordmanager.backend.controller;

import com.passwordmanager.backend.dto.CredentialRequest;
import com.passwordmanager.backend.dto.CredentialResponse;
import com.passwordmanager.backend.dto.FolderRequest;
import com.passwordmanager.backend.dto.FolderResponse;
import com.passwordmanager.backend.dto.TagRequest;
import com.passwordmanager.backend.dto.TagResponse;
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

    // ========== Folder Management Endpoints ==========

    /**
     * Creates a new folder for organizing vault entries.
     * 
     * @param request The folder creation request
     * @param httpRequest HTTP request for logging purposes
     * @return The created folder with metadata
     */
    @PostMapping("/folder")
    @Operation(
        summary = "Create a new folder",
        description = "Creates a new folder for organizing vault entries. " +
                     "Validates nesting depth limits and name uniqueness within parent folder."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Folder created successfully",
            content = @Content(schema = @Schema(implementation = FolderResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request data or nesting depth exceeded",
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
    public ResponseEntity<?> createFolder(
            @Valid @RequestBody FolderRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId();
            String clientIp = getClientIpAddress(httpRequest);
            
            logger.debug("Creating folder '{}' for user: {} from IP: {}", request.getName(), userId, clientIp);
            
            FolderResponse response = vaultService.createFolder(userId, request);
            
            logger.info("Created folder '{}' ({}) for user: {} from IP: {}", 
                       response.getName(), response.getId(), userId, clientIp);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid folder creation request: {}", e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "invalid_request");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            
        } catch (Exception e) {
            logger.error("Error creating folder: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "creation_failed");
            errorResponse.put("message", "Failed to create folder");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Updates an existing folder.
     * 
     * @param folderId The ID of the folder to update
     * @param request The updated folder data
     * @param httpRequest HTTP request for logging purposes
     * @return The updated folder with metadata
     */
    @PutMapping("/folder/{id}")
    @Operation(
        summary = "Update an existing folder",
        description = "Updates an existing folder. Validates nesting depth limits and prevents circular references."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Folder updated successfully",
            content = @Content(schema = @Schema(implementation = FolderResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request data or would create circular reference",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Folder not found",
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
    public ResponseEntity<?> updateFolder(
            @Parameter(description = "Folder ID", required = true)
            @PathVariable("id") UUID folderId,
            @Valid @RequestBody FolderRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId();
            String clientIp = getClientIpAddress(httpRequest);
            
            logger.debug("Updating folder {} for user: {} from IP: {}", folderId, userId, clientIp);
            
            FolderResponse response = vaultService.updateFolder(userId, folderId, request);
            
            logger.info("Updated folder '{}' ({}) for user: {} from IP: {}", 
                       response.getName(), folderId, userId, clientIp);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid folder update request for {}: {}", folderId, e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "invalid_request");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            
        } catch (Exception e) {
            logger.error("Error updating folder {}: {}", folderId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "update_failed");
            errorResponse.put("message", "Failed to update folder");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Soft deletes a folder and all its contents.
     * 
     * @param folderId The ID of the folder to delete
     * @param httpRequest HTTP request for logging purposes
     * @return Success message with deletion timestamp
     */
    @DeleteMapping("/folder/{id}")
    @Operation(
        summary = "Delete a folder (move to trash)",
        description = "Soft deletes a folder and all its contents by moving them to trash. " +
                     "The folder and contents can be restored within 30 days before permanent deletion."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Folder moved to trash successfully",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Folder not found",
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
    public ResponseEntity<?> deleteFolder(
            @Parameter(description = "Folder ID", required = true)
            @PathVariable("id") UUID folderId,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId();
            String clientIp = getClientIpAddress(httpRequest);
            
            logger.debug("Deleting folder {} for user: {} from IP: {}", folderId, userId, clientIp);
            
            vaultService.deleteFolder(userId, folderId);
            
            logger.info("Deleted folder {} for user: {} from IP: {}", folderId, userId, clientIp);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Folder moved to trash successfully");
            response.put("folderId", folderId);
            response.put("deletedAt", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Folder not found for deletion {}: {}", folderId, e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "not_found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            
        } catch (Exception e) {
            logger.error("Error deleting folder {}: {}", folderId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "deletion_failed");
            errorResponse.put("message", "Failed to delete folder");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Retrieves the folder tree for the authenticated user.
     * 
     * @param httpRequest HTTP request for logging purposes
     * @return List of folders organized in tree structure
     */
    @GetMapping("/folders")
    @Operation(
        summary = "Retrieve folder tree",
        description = "Gets all active folders for the authenticated user organized in a tree structure."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Folder tree retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = FolderResponse.class))
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
    public ResponseEntity<?> getFolderTree(HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId();
            String clientIp = getClientIpAddress(httpRequest);
            
            logger.debug("Retrieving folder tree for user: {} from IP: {}", userId, clientIp);
            
            List<FolderResponse> folders = vaultService.getFolderTree(userId);
            
            logger.info("Retrieved {} folders for user: {} from IP: {}", 
                       folders.size(), userId, clientIp);
            
            return ResponseEntity.ok(folders);
            
        } catch (Exception e) {
            logger.error("Error retrieving folder tree: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "retrieval_failed");
            errorResponse.put("message", "Failed to retrieve folder tree");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ========== Tag Management Endpoints ==========

    /**
     * Creates a new tag for categorizing vault entries.
     * 
     * @param request The tag creation request
     * @param httpRequest HTTP request for logging purposes
     * @return The created tag with metadata
     */
    @PostMapping("/tag")
    @Operation(
        summary = "Create a new tag",
        description = "Creates a new tag for categorizing vault entries. " +
                     "Tag names must be unique per user."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Tag created successfully",
            content = @Content(schema = @Schema(implementation = TagResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request data or tag name already exists",
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
    public ResponseEntity<?> createTag(
            @Valid @RequestBody TagRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId();
            String clientIp = getClientIpAddress(httpRequest);
            
            logger.debug("Creating tag '{}' for user: {} from IP: {}", request.getName(), userId, clientIp);
            
            TagResponse response = vaultService.createTag(userId, request);
            
            logger.info("Created tag '{}' ({}) for user: {} from IP: {}", 
                       response.getName(), response.getId(), userId, clientIp);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid tag creation request: {}", e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "invalid_request");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            
        } catch (Exception e) {
            logger.error("Error creating tag: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "creation_failed");
            errorResponse.put("message", "Failed to create tag");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Updates an existing tag.
     * 
     * @param tagId The ID of the tag to update
     * @param request The updated tag data
     * @param httpRequest HTTP request for logging purposes
     * @return The updated tag with metadata
     */
    @PutMapping("/tag/{id}")
    @Operation(
        summary = "Update an existing tag",
        description = "Updates an existing tag. Tag names must remain unique per user."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Tag updated successfully",
            content = @Content(schema = @Schema(implementation = TagResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request data or tag name already exists",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Tag not found",
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
    public ResponseEntity<?> updateTag(
            @Parameter(description = "Tag ID", required = true)
            @PathVariable("id") UUID tagId,
            @Valid @RequestBody TagRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId();
            String clientIp = getClientIpAddress(httpRequest);
            
            logger.debug("Updating tag {} for user: {} from IP: {}", tagId, userId, clientIp);
            
            TagResponse response = vaultService.updateTag(userId, tagId, request);
            
            logger.info("Updated tag '{}' ({}) for user: {} from IP: {}", 
                       response.getName(), tagId, userId, clientIp);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid tag update request for {}: {}", tagId, e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "invalid_request");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            
        } catch (Exception e) {
            logger.error("Error updating tag {}: {}", tagId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "update_failed");
            errorResponse.put("message", "Failed to update tag");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Soft deletes a tag.
     * 
     * @param tagId The ID of the tag to delete
     * @param httpRequest HTTP request for logging purposes
     * @return Success message with deletion timestamp
     */
    @DeleteMapping("/tag/{id}")
    @Operation(
        summary = "Delete a tag (move to trash)",
        description = "Soft deletes a tag by moving it to trash. " +
                     "The tag is removed from all vault entries and can be restored within 30 days."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Tag moved to trash successfully",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Tag not found",
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
    public ResponseEntity<?> deleteTag(
            @Parameter(description = "Tag ID", required = true)
            @PathVariable("id") UUID tagId,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId();
            String clientIp = getClientIpAddress(httpRequest);
            
            logger.debug("Deleting tag {} for user: {} from IP: {}", tagId, userId, clientIp);
            
            vaultService.deleteTag(userId, tagId);
            
            logger.info("Deleted tag {} for user: {} from IP: {}", tagId, userId, clientIp);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Tag moved to trash successfully");
            response.put("tagId", tagId);
            response.put("deletedAt", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Tag not found for deletion {}: {}", tagId, e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "not_found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            
        } catch (Exception e) {
            logger.error("Error deleting tag {}: {}", tagId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "deletion_failed");
            errorResponse.put("message", "Failed to delete tag");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Retrieves all tags for the authenticated user.
     * 
     * @param httpRequest HTTP request for logging purposes
     * @return List of tags
     */
    @GetMapping("/tags")
    @Operation(
        summary = "Retrieve all tags",
        description = "Gets all active tags for the authenticated user."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Tags retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = TagResponse.class))
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
    public ResponseEntity<?> getAllTags(HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId();
            String clientIp = getClientIpAddress(httpRequest);
            
            logger.debug("Retrieving all tags for user: {} from IP: {}", userId, clientIp);
            
            List<TagResponse> tags = vaultService.getAllTags(userId);
            
            logger.info("Retrieved {} tags for user: {} from IP: {}", 
                       tags.size(), userId, clientIp);
            
            return ResponseEntity.ok(tags);
            
        } catch (Exception e) {
            logger.error("Error retrieving tags: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "retrieval_failed");
            errorResponse.put("message", "Failed to retrieve tags");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Filters credentials by a specific tag.
     * 
     * @param tagId The ID of the tag to filter by
     * @param httpRequest HTTP request for logging purposes
     * @return List of credentials with the specified tag
     */
    @GetMapping("/credentials/tag/{tagId}")
    @Operation(
        summary = "Filter credentials by tag",
        description = "Gets all credentials that have the specified tag assigned."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Filtered credentials retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = CredentialResponse.class))
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Tag not found",
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
    public ResponseEntity<?> getCredentialsByTag(
            @Parameter(description = "Tag ID", required = true)
            @PathVariable UUID tagId,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId();
            String clientIp = getClientIpAddress(httpRequest);
            
            logger.debug("Filtering credentials by tag {} for user: {} from IP: {}", tagId, userId, clientIp);
            
            List<CredentialResponse> credentials = vaultService.getCredentialsByTag(userId, tagId);
            
            logger.info("Retrieved {} credentials with tag {} for user: {} from IP: {}", 
                       credentials.size(), tagId, userId, clientIp);
            
            return ResponseEntity.ok(credentials);
            
        } catch (IllegalArgumentException e) {
            logger.warn("Tag not found for filtering {}: {}", tagId, e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "not_found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            
        } catch (Exception e) {
            logger.error("Error filtering credentials by tag {}: {}", tagId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "retrieval_failed");
            errorResponse.put("message", "Failed to filter credentials by tag");
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}