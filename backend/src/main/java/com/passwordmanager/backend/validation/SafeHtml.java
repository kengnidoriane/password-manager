package com.passwordmanager.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validation annotation to ensure HTML content is safe (no XSS vulnerabilities).
 * 
 * This validator checks for dangerous HTML tags and attributes that could
 * be used for XSS attacks.
 */
@Documented
@Constraint(validatedBy = SafeHtmlValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface SafeHtml {
    
    String message() default "HTML content contains potentially dangerous elements";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
    
    /**
     * Whether to allow any HTML tags at all.
     * If false, only plain text is allowed.
     */
    boolean allowHtml() default true;
}
