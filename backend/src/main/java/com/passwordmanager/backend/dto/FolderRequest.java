package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for folder operations.
 * 
 * Used for creating and updating folders in the vault hierarchy.
 * Folder names and descriptions are stored unencrypted to enable
 * efficient folder tree navigation and display.
 * 
 * Requirements: 7.1, 7.3, 7.4
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request object for folder operations")
public class FolderRequest {

    /**
     * Display name of the folder.
     * 
     * Must be unique within the parent folder (or at root level).
     */
    @NotBlank(message = "Folder name is required")
    @Size(min = 1, max = 255, message = "Folder name must be between 1 and 255 characters")
    @Schema(
        description = "Display name of the folder",
        example = "Work Accounts",
        minLength = 1,
        maxLength = 255
    )
    private String name;

    /**
     * Optional description of the folder's purpose.
     */
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    @Schema(
        description = "Optional description of the folder's purpose",
        example = "Contains all work-related login credentials",
        maxLength = 1000
    )
    private String description;

    /**
     * ID of the parent folder for hierarchical organization.
     * 
     * Null for root-level folders.
     */
    @Schema(
        description = "ID of the parent folder (null for root-level folders)",
        example = "550e8400-e29b-41d4-a716-446655440000"
    )
    private UUID parentId;

    /**
     * Display order within the parent folder.
     * 
     * Lower values appear first. If not specified, the folder
     * will be placed at the end of the current list.
     */
    @Schema(
        description = "Display order within the parent folder (lower values appear first)",
        example = "1"
    )
    private Integer sortOrder;
}