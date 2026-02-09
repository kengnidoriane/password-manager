package com.passwordmanager.backend.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standard error response structure for API errors.
 * 
 * Provides consistent error information across all API endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Standard error response")
public class ErrorResponse {
    
    @Schema(description = "Timestamp when the error occurred", example = "2023-12-01T10:30:00")
    private LocalDateTime timestamp;
    
    @Schema(description = "HTTP status code", example = "400")
    private int status;
    
    @Schema(description = "Error type", example = "Validation Failed")
    private String error;
    
    @Schema(description = "Error message", example = "Input validation failed")
    private String message;
    
    @Schema(description = "Request path that caused the error", example = "/api/v1/vault/credential")
    private String path;
    
    @Schema(description = "Field-specific validation errors")
    private Map<String, String> validationErrors;
}
