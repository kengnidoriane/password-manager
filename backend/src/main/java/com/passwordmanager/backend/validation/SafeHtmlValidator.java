package com.passwordmanager.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Validator implementation for safe HTML content.
 * 
 * Checks for dangerous HTML tags and attributes that could be used for XSS attacks.
 */
public class SafeHtmlValidator implements ConstraintValidator<SafeHtml, String> {
    
    private boolean allowHtml;
    
    // Patterns for detecting dangerous content
    private static final Pattern SCRIPT_TAG = Pattern.compile(
        "<script[^>]*>", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern IFRAME_TAG = Pattern.compile(
        "<iframe[^>]*>", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern OBJECT_TAG = Pattern.compile(
        "<object[^>]*>", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern EMBED_TAG = Pattern.compile(
        "<embed[^>]*>", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern ON_EVENT = Pattern.compile(
        "\\s*on\\w+\\s*=", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern JAVASCRIPT_PROTOCOL = Pattern.compile(
        "javascript:", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern STYLE_TAG = Pattern.compile(
        "<style[^>]*>", 
        Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern HTML_TAG = Pattern.compile(
        "<[^>]+>", 
        Pattern.CASE_INSENSITIVE
    );
    
    @Override
    public void initialize(SafeHtml constraintAnnotation) {
        this.allowHtml = constraintAnnotation.allowHtml();
    }
    
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true; // Use @NotBlank for null/empty checks
        }
        
        // If HTML is not allowed, check for any HTML tags
        if (!allowHtml) {
            if (HTML_TAG.matcher(value).find()) {
                // Use default constraint violation (will use annotation's message)
                return false;
            }
            return true;
        }
        
        // Check for dangerous tags and attributes
        if (SCRIPT_TAG.matcher(value).find()) {
            // Use default constraint violation (will use annotation's message)
            return false;
        }
        
        if (IFRAME_TAG.matcher(value).find()) {
            // Use default constraint violation (will use annotation's message)
            return false;
        }
        
        if (OBJECT_TAG.matcher(value).find()) {
            // Use default constraint violation (will use annotation's message)
            return false;
        }
        
        if (EMBED_TAG.matcher(value).find()) {
            // Use default constraint violation (will use annotation's message)
            return false;
        }
        
        if (STYLE_TAG.matcher(value).find()) {
            // Use default constraint violation (will use annotation's message)
            return false;
        }
        
        if (ON_EVENT.matcher(value).find()) {
            // Use default constraint violation (will use annotation's message)
            return false;
        }
        
        if (JAVASCRIPT_PROTOCOL.matcher(value).find()) {
            // Use default constraint violation (will use annotation's message)
            return false;
        }
        
        return true;
    }
}
