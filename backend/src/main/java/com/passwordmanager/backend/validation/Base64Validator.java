package com.passwordmanager.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.Base64;
import java.util.regex.Pattern;

/**
 * Validator implementation for Base64 encoded strings.
 * 
 * Validates that a string contains only valid Base64 characters and
 * optionally checks for proper padding.
 */
public class Base64Validator implements ConstraintValidator<ValidBase64, String> {
    
    private static final Pattern BASE64_PATTERN = Pattern.compile("^[A-Za-z0-9+/]*={0,2}$");
    private static final Pattern BASE64_URL_SAFE_PATTERN = Pattern.compile("^[A-Za-z0-9_-]*={0,2}$");
    
    private boolean urlSafe;
    private boolean requirePadding;
    
    @Override
    public void initialize(ValidBase64 constraintAnnotation) {
        this.urlSafe = constraintAnnotation.urlSafe();
        this.requirePadding = constraintAnnotation.requirePadding();
    }
    
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true; // Use @NotBlank for null/empty checks
        }
        
        // Check pattern
        Pattern pattern = urlSafe ? BASE64_URL_SAFE_PATTERN : BASE64_PATTERN;
        if (!pattern.matcher(value).matches()) {
            return false;
        }
        
        // Check padding if required
        if (requirePadding) {
            int length = value.length();
            if (length % 4 != 0) {
                return false;
            }
        }
        
        // Try to decode to verify it's valid Base64
        try {
            if (urlSafe) {
                Base64.getUrlDecoder().decode(value);
            } else {
                Base64.getDecoder().decode(value);
            }
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
