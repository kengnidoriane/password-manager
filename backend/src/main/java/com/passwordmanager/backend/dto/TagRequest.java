package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for tag operations.
 * 
 * Used for creating and updating tags for categorizing vault entries.
 * Tag names and colors are stored unencrypted to enable efficient
 * filtering and display without requiring decryption.
 * 
 * Requirements: 7.2, 7.5
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request object for tag operations")
public class TagRequest {

    /**
     * Display name of the tag.
     * 
     * Must be unique per user to avoid confusion.
     */
    @NotBlank(message = "Tag name is required")
    @Size(min = 1, max = 100, message = "Tag name must be between 1 and 100 characters")
    @Schema(
        description = "Display name of the tag",
        example = "Banking",
        minLength = 1,
        maxLength = 100
    )
    private String name;

    /**
     * Hex color code for visual representation of the tag.
     * 
     * Must be a valid 6-digit hex color code (e.g., "#FF5733").
     */
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a valid hex color code (e.g., #FF5733)")
    @Schema(
        description = "Hex color code for visual representation",
        example = "#FF5733",
        pattern = "^#[0-9A-Fa-f]{6}$"
    )
    private String color;

    /**
     * Optional description of the tag's purpose or usage.
     */
    @Size(max = 500, message = "Description must not exceed 500 characters")
    @Schema(
        description = "Optional description of the tag's purpose or usage",
        example = "For all banking and financial institution accounts",
        maxLength = 500
    )
    private String description;

    /**
     * Display order for tag sorting.
     * 
     * Lower values appear first. If not specified, the tag
     * will be placed at the end of the current list.
     */
    @Schema(
        description = "Display order for tag sorting (lower values appear first)",
        example = "1"
    )
    private Integer sortOrder;
}