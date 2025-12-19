package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for folder operations.
 * 
 * Contains folder metadata and hierarchy information.
 * Used in API responses for folder creation, updates, and retrieval.
 * 
 * Requirements: 7.1, 7.3, 7.4
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Response object containing folder information")
public class FolderResponse {

    /**
     * Unique identifier for the folder.
     */
    @Schema(
        description = "Unique identifier for the folder",
        example = "550e8400-e29b-41d4-a716-446655440000"
    )
    private UUID id;

    /**
     * Display name of the folder.
     */
    @Schema(
        description = "Display name of the folder",
        example = "Work Accounts"
    )
    private String name;

    /**
     * Optional description of the folder's purpose.
     */
    @Schema(
        description = "Optional description of the folder's purpose",
        example = "Contains all work-related login credentials"
    )
    private String description;

    /**
     * ID of the parent folder.
     * 
     * Null for root-level folders.
     */
    @Schema(
        description = "ID of the parent folder (null for root-level folders)",
        example = "550e8400-e29b-41d4-a716-446655440001"
    )
    private UUID parentId;

    /**
     * Display order within the parent folder.
     */
    @Schema(
        description = "Display order within the parent folder",
        example = "1"
    )
    private Integer sortOrder;

    /**
     * Nesting depth of the folder (0 for root folders).
     */
    @Schema(
        description = "Nesting depth of the folder (0 for root folders)",
        example = "2"
    )
    private Integer depth;

    /**
     * Full path from root to this folder.
     */
    @Schema(
        description = "Full path from root to this folder",
        example = "Personal/Banking/Credit Cards"
    )
    private String fullPath;

    /**
     * Number of active child folders.
     */
    @Schema(
        description = "Number of active child folders",
        example = "3"
    )
    private Long childFolderCount;

    /**
     * Number of active vault entries in this folder.
     */
    @Schema(
        description = "Number of active vault entries in this folder",
        example = "5"
    )
    private Long entryCount;

    /**
     * Whether this folder can accept new child folders.
     * 
     * False if adding a child would exceed the maximum nesting depth.
     */
    @Schema(
        description = "Whether this folder can accept new child folders",
        example = "true"
    )
    private Boolean canAddChildren;

    /**
     * Timestamp when the folder was created.
     */
    @Schema(
        description = "Timestamp when the folder was created",
        example = "2024-01-15T10:30:00"
    )
    private LocalDateTime createdAt;

    /**
     * Timestamp when the folder was last updated.
     */
    @Schema(
        description = "Timestamp when the folder was last updated",
        example = "2024-01-20T14:45:00"
    )
    private LocalDateTime updatedAt;
}