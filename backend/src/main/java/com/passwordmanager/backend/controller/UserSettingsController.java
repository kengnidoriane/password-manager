package com.passwordmanager.backend.controller;

import com.passwordmanager.backend.dto.UserSettingsRequest;
import com.passwordmanager.backend.dto.UserSettingsResponse;
import com.passwordmanager.backend.service.UserSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for user settings management.
 * 
 * Provides endpoints for retrieving and updating user preferences including
 * security settings, UI configuration, and behavioral options.
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */
@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Settings", description = "User settings and preferences management")
@SecurityRequirement(name = "bearerAuth")
public class UserSettingsController {

    private final UserSettingsService userSettingsService;

    /**
     * Retrieves the current user's settings.
     * 
     * If no settings exist, returns default settings.
     * 
     * @param authentication the authenticated user
     * @return UserSettingsResponse containing the user's settings
     * 
     * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
     */
    @GetMapping
    @Operation(
        summary = "Get user settings",
        description = "Retrieves the current user's settings and preferences. " +
                     "If no settings exist, returns default settings."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Settings retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserSettingsResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - invalid or missing authentication token",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content
        )
    })
    public ResponseEntity<UserSettingsResponse> getUserSettings(
            @Parameter(hidden = true) Authentication authentication) {
        
        UUID userId = UUID.fromString(authentication.getName());
        log.debug("Getting settings for user: {}", userId);
        
        UserSettingsResponse settings = userSettingsService.getUserSettings(userId);
        
        log.info("Retrieved settings for user: {}", userId);
        return ResponseEntity.ok(settings);
    }

    /**
     * Updates the current user's settings.
     * 
     * Validates all settings values and applies changes immediately.
     * Logs the settings change for audit purposes.
     * 
     * @param authentication the authenticated user
     * @param request the settings update request
     * @return UserSettingsResponse containing the updated settings
     * 
     * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
     */
    @PutMapping
    @Operation(
        summary = "Update user settings",
        description = "Updates the current user's settings and preferences. " +
                     "All settings are validated and applied immediately. " +
                     "Changes are logged for audit purposes."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Settings updated successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserSettingsResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Bad request - invalid settings values",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized - invalid or missing authentication token",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "422",
            description = "Validation error - settings values out of bounds",
            content = @Content
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content
        )
    })
    public ResponseEntity<UserSettingsResponse> updateUserSettings(
            @Parameter(hidden = true) Authentication authentication,
            @Parameter(
                description = "Settings update request",
                required = true,
                schema = @Schema(implementation = UserSettingsRequest.class)
            )
            @Valid @RequestBody UserSettingsRequest request) {
        
        UUID userId = UUID.fromString(authentication.getName());
        log.debug("Updating settings for user: {}", userId);
        
        try {
            UserSettingsResponse updatedSettings = userSettingsService.updateUserSettings(userId, request);
            
            log.info("Updated settings for user: {}", userId);
            return ResponseEntity.ok(updatedSettings);
            
        } catch (IllegalArgumentException e) {
            log.warn("Invalid settings update request for user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}