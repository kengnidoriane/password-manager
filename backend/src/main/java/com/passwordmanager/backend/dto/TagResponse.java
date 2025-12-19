package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for tag operations.
 * 
 * Contains tag metadata and usage information.
 * Used in API responses for tag creation, updates, and retrieval.
 * 
 * Requirements: 7.2, 7.5
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Response object containing tag information")
public class TagResponse {

    /**
     * Unique identifier for the tag.
     */
    @Schema(
        description = "Unique identifier for the tag",
        example = "550e8400-e29b-41d4-a716-446655440000"
    )
    private UUID id;

    /**
     * Display name of the tag.
     */
    @Schema(
        description = "Display name of the tag",
        example = "Banking"
    )
    private String name;

    /**
     * Hex color code for visual representation of the tag.
     */
    @Schema(
        description = "Hex color code for visual representation",
        example = "#FF5733"
    )
    private String color;

    /**
     * Optional description of the tag's purpose or usage.
     */
    @Schema(
        description = "Optional description of the tag's purpose or usage",
        example = "For all banking and financial institution accounts"
    )
    private String description;

    /**
     * Display order for tag sorting.
     */
    @Schema(
        description = "Display order for tag sorting",
        example = "1"
    )
    private Integer sortOrder;

    /**
     * Number of vault entries that use this tag.
     */
    @Schema(
        description = "Number of vault entries that use this tag",
        example = "12"
    )
    private Long usageCount;

    /**
     * Timestamp when the tag was created.
     */
    @Schema(
        description = "Timestamp when the tag was created",
        example = "2024-01-15T10:30:00"
    )
    private LocalDateTime createdAt;

    /**
     * Timestamp when the tag was last updated.
     */
    @Schema(
        description = "Timestamp when the tag was last updated",
        example = "2024-01-20T14:45:00"
    )
    private LocalDateTime updatedAt;
}