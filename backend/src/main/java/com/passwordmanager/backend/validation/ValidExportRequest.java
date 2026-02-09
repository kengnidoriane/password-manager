package com.passwordmanager.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validation annotation for ExportRequest to ensure consistency between
 * encrypted flag and exportPassword field.
 * 
 * When encrypted=true, exportPassword must be provided and meet minimum requirements.
 */
@Documented
@Constraint(validatedBy = ExportRequestValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidExportRequest {
    
    String message() default "Export password is required when encryption is enabled";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}
