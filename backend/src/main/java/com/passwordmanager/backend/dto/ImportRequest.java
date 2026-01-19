package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Request DTO for importing vault data from external sources.
 * 
 * Supports CSV formats from major password managers and browsers.
 * Each entry is validated before import to ensure data integrity.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to import vault data from external sources")
public class ImportRequest {

    @NotBlank(message = "Format is required")
    @Pattern(regexp = "^(CSV|JSON)$", message = "Format must be CSV or JSON")
    @Schema(description = "Import format (CSV or JSON)", example = "CSV", allowableValues = {"CSV", "JSON"})
    private String format;

    @NotNull(message = "Entries are required")
    @Size(min = 1, max = 10000, message = "Must have between 1 and 10000 entries")
    @Schema(description = "List of credential entries to import", example = "[{\"title\":\"Example\",\"username\":\"user\",\"password\":\"pass\",\"url\":\"https://example.com\"}]")
    private List<Map<String, String>> entries;

    @Schema(description = "Whether to skip duplicate entries", example = "false")
    @Builder.Default
    private Boolean skipDuplicates = false;

    @Schema(description = "Whether to merge duplicate entries", example = "false")
    @Builder.Default
    private Boolean mergeDuplicates = false;

    @Schema(description = "Source password manager or browser", example = "Chrome")
    private String source;

    @Schema(description = "Additional import options")
    private Map<String, String> options;
}