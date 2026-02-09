package com.passwordmanager.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validation annotation for file upload data.
 * 
 * Validates file size, content type, and optionally file content.
 */
@Documented
@Constraint(validatedBy = FileUploadValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidFileUpload {
    
    String message() default "Invalid file upload";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
    
    /**
     * Maximum file size in bytes.
     */
    long maxSize() default 10485760; // 10MB default
    
    /**
     * Allowed MIME types. Empty array means all types allowed.
     */
    String[] allowedTypes() default {};
    
    /**
     * Whether to validate file content matches declared MIME type.
     */
    boolean checkContent() default true;
}
