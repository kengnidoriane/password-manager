package com.passwordmanager.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validation annotation to ensure a string is valid Base64 encoded data.
 * 
 * This validator checks that the string contains only valid Base64 characters
 * and has proper padding if required.
 */
@Documented
@Constraint(validatedBy = Base64Validator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidBase64 {
    
    String message() default "Must be valid Base64 encoded data";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
    
    /**
     * Whether to allow URL-safe Base64 encoding (using - and _ instead of + and /).
     */
    boolean urlSafe() default false;
    
    /**
     * Whether padding (=) is required.
     */
    boolean requirePadding() default false;
}
