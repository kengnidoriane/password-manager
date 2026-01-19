package com.passwordmanager.backend.controller;

import com.passwordmanager.backend.dto.ShareCredentialRequest;
import com.passwordmanager.backend.dto.ShareCredentialResponse;
import com.passwordmanager.backend.dto.SharedCredentialResponse;
import com.passwordmanager.backend.entity.SharedCredential;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.service.SharingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for credential sharing operations.
 * Handles sharing credentials between users with proper encryption and access control.
 */
@RestController
@RequestMapping("/api/v1/share")
@Tag(name = "Credential Sharing", description = "Operations for sharing credentials between users")
@SecurityRequirement(name = "bearerAuth")
public class SharingController {

    private final SharingService sharingService;

    @Autowired
    public SharingController(SharingService sharingService) {
        this.sharingService = sharingService;
    }

    /**
     * Share a credential with another user.
     * The credential is encrypted with the recipient's public key.
     */
    @PostMapping("/credential")
    @Operation(summary = "Share a credential", 
               description = "Share a credential with another user using public key encryption")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Credential shared successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Credential or recipient not found"),
        @ApiResponse(responseCode = "409", description = "Credential already shared with this user")
    })
    public ResponseEntity<ShareCredentialResponse> shareCredential(
            @Valid @RequestBody ShareCredentialRequest request,
            Authentication authentication) {
        
        UUID ownerId = UUID.fromString(authentication.getName());
        
        SharedCredential sharedCredential = sharingService.shareCredential(
            ownerId,
            request.getCredentialId(),
            request.getRecipientEmail(),
            request.getPermissions(),
            request.getEncryptedData(),
            request.getIv(),
            request.getAuthTag()
        );
        
        ShareCredentialResponse response = mapToShareResponse(sharedCredential);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all credentials shared with the current user.
     */
    @GetMapping("/received")
    @Operation(summary = "Get received shared credentials", 
               description = "Get all credentials that have been shared with the current user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Shared credentials retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<List<SharedCredentialResponse>> getReceivedCredentials(
            Authentication authentication) {
        
        UUID recipientId = UUID.fromString(authentication.getName());
        
        List<SharedCredential> sharedCredentials = sharingService.getSharedCredentialsForRecipient(recipientId);
        
        List<SharedCredentialResponse> responses = sharedCredentials.stream()
            .map(this::mapToSharedResponse)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    /**
     * Get all credentials shared by the current user.
     */
    @GetMapping("/sent")
    @Operation(summary = "Get sent shared credentials", 
               description = "Get all credentials that the current user has shared with others")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Shared credentials retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<List<ShareCredentialResponse>> getSentCredentials(
            Authentication authentication) {
        
        UUID ownerId = UUID.fromString(authentication.getName());
        
        List<SharedCredential> sharedCredentials = sharingService.getSharedCredentialsByOwner(ownerId);
        
        List<ShareCredentialResponse> responses = sharedCredentials.stream()
            .map(this::mapToShareResponse)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    /**
     * Access a shared credential (triggers audit logging).
     */
    @GetMapping("/{shareId}")
    @Operation(summary = "Access a shared credential", 
               description = "Access a shared credential and log the access for audit purposes")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Shared credential accessed successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Access denied"),
        @ApiResponse(responseCode = "404", description = "Shared credential not found")
    })
    public ResponseEntity<SharedCredentialResponse> accessSharedCredential(
            @Parameter(description = "Share ID") @PathVariable UUID shareId,
            Authentication authentication) {
        
        UUID recipientId = UUID.fromString(authentication.getName());
        
        SharedCredential sharedCredential = sharingService.accessSharedCredential(recipientId, shareId);
        
        SharedCredentialResponse response = mapToSharedResponse(sharedCredential);
        return ResponseEntity.ok(response);
    }

    /**
     * Revoke access to a shared credential.
     */
    @DeleteMapping("/{shareId}")
    @Operation(summary = "Revoke credential sharing", 
               description = "Revoke access to a shared credential")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Credential sharing revoked successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Access denied - only owner can revoke"),
        @ApiResponse(responseCode = "404", description = "Shared credential not found")
    })
    public ResponseEntity<Void> revokeCredentialSharing(
            @Parameter(description = "Share ID") @PathVariable UUID shareId,
            Authentication authentication) {
        
        UUID ownerId = UUID.fromString(authentication.getName());
        
        sharingService.revokeSharing(ownerId, shareId);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Update permissions for a shared credential.
     */
    @PutMapping("/{shareId}/permissions")
    @Operation(summary = "Update sharing permissions", 
               description = "Update the permissions for a shared credential")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Permissions updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid permissions"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Access denied - only owner can update permissions"),
        @ApiResponse(responseCode = "404", description = "Shared credential not found")
    })
    public ResponseEntity<ShareCredentialResponse> updateSharingPermissions(
            @Parameter(description = "Share ID") @PathVariable UUID shareId,
            @RequestBody List<String> permissions,
            Authentication authentication) {
        
        UUID ownerId = UUID.fromString(authentication.getName());
        
        SharedCredential updatedShare = sharingService.updatePermissions(ownerId, shareId, permissions);
        
        ShareCredentialResponse response = mapToShareResponse(updatedShare);
        return ResponseEntity.ok(response);
    }

    // Helper methods to map entities to DTOs
    private ShareCredentialResponse mapToShareResponse(SharedCredential sharedCredential) {
        VaultEntry credential = sharedCredential.getVaultEntry();
        UserAccount owner = sharedCredential.getOwner();
        UserAccount recipient = sharedCredential.getRecipient();
        
        return new ShareCredentialResponse(
            sharedCredential.getId(),
            credential.getId(),
            extractCredentialTitle(credential),
            owner.getEmail(),
            recipient.getEmail(),
            sharedCredential.getPermissions(),
            sharedCredential.getCreatedAt(),
            sharedCredential.getLastAccessedAt(),
            sharedCredential.isActive()
        );
    }

    private SharedCredentialResponse mapToSharedResponse(SharedCredential sharedCredential) {
        VaultEntry credential = sharedCredential.getVaultEntry();
        UserAccount owner = sharedCredential.getOwner();
        List<String> permissions = sharedCredential.getPermissions();
        
        boolean canRead = permissions.contains("read");
        boolean canWrite = permissions.contains("write");
        
        return new SharedCredentialResponse(
            sharedCredential.getId(),
            credential.getId(),
            extractCredentialTitle(credential),
            owner.getEmail(),
            permissions,
            sharedCredential.getEncryptedData(),
            sharedCredential.getIv(),
            sharedCredential.getAuthTag(),
            sharedCredential.getCreatedAt(),
            sharedCredential.getLastAccessedAt(),
            canRead,
            canWrite
        );
    }

    private String extractCredentialTitle(VaultEntry credential) {
        // Extract title from encrypted data metadata or use a default
        // In a real implementation, this might be stored separately or extracted from metadata
        return "Shared Credential"; // Simplified for now
    }
}