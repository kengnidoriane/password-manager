package com.passwordmanager.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.Arrays;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;

/**
 * Validator implementation for file upload data.
 * 
 * Validates file size and content type for Base64-encoded file data.
 */
public class FileUploadValidator implements ConstraintValidator<ValidFileUpload, String> {
    
    private long maxSize;
    private Set<String> allowedTypes;
    private boolean checkContent;
    
    // Common file signatures (magic numbers) for content validation
    private static final byte[] PDF_SIGNATURE = {0x25, 0x50, 0x44, 0x46}; // %PDF
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4E, 0x47}; // PNG
    private static final byte[] JPEG_SIGNATURE = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}; // JPEG
    private static final byte[] GIF_SIGNATURE = {0x47, 0x49, 0x46, 0x38}; // GIF8
    
    @Override
    public void initialize(ValidFileUpload constraintAnnotation) {
        this.maxSize = constraintAnnotation.maxSize();
        this.allowedTypes = new HashSet<>(Arrays.asList(constraintAnnotation.allowedTypes()));
        this.checkContent = constraintAnnotation.checkContent();
    }
    
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true; // Use @NotBlank for null/empty checks
        }
        
        try {
            // Decode Base64 to get actual file data
            byte[] fileData = Base64.getDecoder().decode(value);
            
            // Check file size
            if (fileData.length > maxSize) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate(
                    String.format("File size exceeds maximum allowed size of %d bytes", maxSize)
                ).addConstraintViolation();
                return false;
            }
            
            // Validate content if required
            if (checkContent && !allowedTypes.isEmpty()) {
                String detectedType = detectContentType(fileData);
                if (detectedType != null && !allowedTypes.contains(detectedType)) {
                    context.disableDefaultConstraintViolation();
                    context.buildConstraintViolationWithTemplate(
                        String.format("File type '%s' is not allowed. Allowed types: %s", 
                            detectedType, String.join(", ", allowedTypes))
                    ).addConstraintViolation();
                    return false;
                }
            }
            
            return true;
        } catch (IllegalArgumentException e) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Invalid Base64 encoded file data"
            ).addConstraintViolation();
            return false;
        }
    }
    
    /**
     * Detects content type based on file signature (magic numbers).
     * 
     * @param data file data bytes
     * @return detected MIME type or null if unknown
     */
    private String detectContentType(byte[] data) {
        if (data.length < 4) {
            return null;
        }
        
        if (startsWith(data, PDF_SIGNATURE)) {
            return "application/pdf";
        } else if (startsWith(data, PNG_SIGNATURE)) {
            return "image/png";
        } else if (startsWith(data, JPEG_SIGNATURE)) {
            return "image/jpeg";
        } else if (startsWith(data, GIF_SIGNATURE)) {
            return "image/gif";
        }
        
        return null;
    }
    
    /**
     * Checks if data starts with the given signature.
     */
    private boolean startsWith(byte[] data, byte[] signature) {
        if (data.length < signature.length) {
            return false;
        }
        
        for (int i = 0; i < signature.length; i++) {
            if (data[i] != signature[i]) {
                return false;
            }
        }
        
        return true;
    }
}
