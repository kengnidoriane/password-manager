package com.passwordmanager.backend.validation;

import com.passwordmanager.backend.dto.ExportRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validator implementation for ExportRequest.
 * 
 * Ensures that when encryption is enabled, an export password is provided
 * and meets minimum security requirements.
 */
public class ExportRequestValidator implements ConstraintValidator<ValidExportRequest, ExportRequest> {
    
    @Override
    public void initialize(ValidExportRequest constraintAnnotation) {
        // No initialization needed
    }
    
    @Override
    public boolean isValid(ExportRequest request, ConstraintValidatorContext context) {
        if (request == null) {
            return true; // Let @NotNull handle null checks
        }
        
        // If encryption is enabled, export password must be provided
        if (request.isEncrypted()) {
            String exportPassword = request.getExportPassword();
            
            if (exportPassword == null || exportPassword.trim().isEmpty()) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate(
                    "Export password is required when encryption is enabled"
                ).addPropertyNode("exportPassword").addConstraintViolation();
                return false;
            }
            
            // Export password must meet minimum length requirement (already validated by @Size)
            // This is just an additional check
            if (exportPassword.length() < 8) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate(
                    "Export password must be at least 8 characters"
                ).addPropertyNode("exportPassword").addConstraintViolation();
                return false;
            }
        }
        
        return true;
    }
}
