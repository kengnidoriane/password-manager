package com.passwordmanager.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for vault import operations.
 * 
 * Provides detailed summary of import results including successful imports,
 * duplicates detected, and validation errors encountered.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response containing import operation results")
public class ImportResponse {

    @Schema(description = "Number of entries successfully imported", example = "25")
    private Integer imported;

    @Schema(description = "Number of duplicate entries detected", example = "3")
    private Integer duplicates;

    @Schema(description = "Number of entries with validation errors", example = "2")
    private Integer errors;

    @Schema(description = "Total number of entries processed", example = "30")
    private Integer total;

    @Schema(description = "List of validation error messages for failed entries")
    private List<String> errorMessages;

    @Schema(description = "List of duplicate entries with details")
    private List<DuplicateEntry> duplicateEntries;

    @Schema(description = "Import operation timestamp")
    private LocalDateTime importedAt;

    @Schema(description = "Import format used", example = "CSV")
    private String format;

    @Schema(description = "Source of the import", example = "Chrome")
    private String source;

    @Schema(description = "Additional import statistics")
    private Map<String, Object> statistics;

    /**
     * Information about a duplicate entry detected during import.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Details about a duplicate entry")
    public static class DuplicateEntry {
        
        @Schema(description = "Title of the duplicate entry", example = "Gmail")
        private String title;
        
        @Schema(description = "Username of the duplicate entry", example = "user@gmail.com")
        private String username;
        
        @Schema(description = "URL of the duplicate entry", example = "https://gmail.com")
        private String url;
        
        @Schema(description = "ID of the existing entry in vault")
        private String existingEntryId;
        
        @Schema(description = "Action taken for the duplicate", example = "SKIPPED")
        private String action; // SKIPPED, MERGED, REPLACED
    }

    /**
     * Convenience method to get error count.
     */
    public List<String> getErrors() {
        return errorMessages;
    }

    /**
     * Convenience method to check if import was successful.
     */
    public boolean isSuccessful() {
        return imported != null && imported > 0;
    }

    /**
     * Convenience method to check if there were any issues.
     */
    public boolean hasIssues() {
        return (errors != null && errors > 0) || (duplicates != null && duplicates > 0);
    }
}