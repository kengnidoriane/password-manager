package com.passwordmanager.backend.validation;

import com.passwordmanager.backend.dto.CredentialRequest;
import com.passwordmanager.backend.dto.FolderRequest;
import com.passwordmanager.backend.dto.SecureNoteRequest;
import com.passwordmanager.backend.dto.TagRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Base64;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for custom validation annotations and validators.
 */
class ValidationTest {
    
    private static Validator validator;
    
    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }
    
    @Test
    void testValidBase64_ValidInput() {
        String validBase64 = Base64.getEncoder().encodeToString("test data".getBytes());
        
        CredentialRequest request = CredentialRequest.builder()
            .encryptedData(validBase64)
            .iv(validBase64)
            .authTag(validBase64)
            .build();
        
        Set<ConstraintViolation<CredentialRequest>> violations = validator.validate(request);
        
        // Should have no violations for Base64 fields
        violations.forEach(v -> {
            assertFalse(v.getMessage().contains("Base64"), 
                "Should not have Base64 validation errors: " + v.getMessage());
        });
    }
    
    @Test
    void testValidBase64_InvalidInput() {
        CredentialRequest request = CredentialRequest.builder()
            .encryptedData("not-valid-base64!@#$%")
            .iv("also-invalid!@#")
            .authTag("invalid-too!@#")
            .build();
        
        Set<ConstraintViolation<CredentialRequest>> violations = validator.validate(request);
        
        // Should have violations for invalid Base64
        assertTrue(violations.stream().anyMatch(v -> 
            v.getMessage().contains("Base64")), 
            "Should have Base64 validation errors");
    }
    
    @Test
    void testSafeHtml_NoHtmlAllowed() {
        FolderRequest request = FolderRequest.builder()
            .name("<script>alert('xss')</script>Folder")
            .build();
        
        Set<ConstraintViolation<FolderRequest>> violations = validator.validate(request);
        
        assertTrue(violations.stream().anyMatch(v -> 
            v.getMessage().contains("HTML")), 
            "Should reject HTML in folder name");
    }
    
    @Test
    void testSafeHtml_DangerousContent() {
        TagRequest request = TagRequest.builder()
            .name("Safe Tag")
            .description("<iframe src='evil.com'></iframe>")
            .color("#FF5733")
            .build();
        
        Set<ConstraintViolation<TagRequest>> violations = validator.validate(request);
        
        assertTrue(violations.stream().anyMatch(v -> 
            v.getMessage().contains("dangerous") || v.getMessage().contains("Iframe")), 
            "Should reject dangerous HTML with iframe tag");
    }
    
    @Test
    void testSafeHtml_EventHandlers() {
        TagRequest request = TagRequest.builder()
            .name("Safe Tag")
            .description("<div onclick='alert(1)'>Click me</div>")
            .color("#FF5733")
            .build();
        
        Set<ConstraintViolation<TagRequest>> violations = validator.validate(request);
        
        assertTrue(violations.stream().anyMatch(v -> 
            v.getMessage().contains("dangerous") || v.getMessage().contains("Event handler")), 
            "Should reject event handlers");
    }
    
    @Test
    void testSafeHtml_JavaScriptProtocol() {
        TagRequest request = TagRequest.builder()
            .name("Safe Tag")
            .description("<a href='javascript:alert(1)'>Click</a>")
            .color("#FF5733")
            .build();
        
        Set<ConstraintViolation<TagRequest>> violations = validator.validate(request);
        
        assertTrue(violations.stream().anyMatch(v -> 
            v.getMessage().contains("dangerous") || v.getMessage().contains("JavaScript")), 
            "Should reject javascript: protocol");
    }
    
    @Test
    void testFileUpload_SizeLimit() {
        // Create a large Base64 string (> 10MB)
        byte[] largeData = new byte[11 * 1024 * 1024]; // 11MB
        String largeBase64 = Base64.getEncoder().encodeToString(largeData);
        
        SecureNoteRequest request = SecureNoteRequest.builder()
            .title("Test Note")
            .encryptedContent(Base64.getEncoder().encodeToString("content".getBytes()))
            .contentIv(Base64.getEncoder().encodeToString("iv".getBytes()))
            .contentAuthTag(Base64.getEncoder().encodeToString("tag".getBytes()))
            .encryptedAttachments(largeBase64)
            .attachmentsIv(Base64.getEncoder().encodeToString("iv".getBytes()))
            .attachmentsAuthTag(Base64.getEncoder().encodeToString("tag".getBytes()))
            .attachmentsSize(11L * 1024 * 1024)
            .attachmentCount(1)
            .build();
        
        Set<ConstraintViolation<SecureNoteRequest>> violations = validator.validate(request);
        
        assertTrue(violations.stream().anyMatch(v -> 
            v.getMessage().contains("10MB") || v.getMessage().contains("size")), 
            "Should reject files larger than 10MB");
    }
    
    @Test
    void testAttachmentSizeValidation() {
        SecureNoteRequest request = SecureNoteRequest.builder()
            .title("Test Note")
            .encryptedContent(Base64.getEncoder().encodeToString("content".getBytes()))
            .contentIv(Base64.getEncoder().encodeToString("iv".getBytes()))
            .contentAuthTag(Base64.getEncoder().encodeToString("tag".getBytes()))
            .attachmentsSize(11L * 1024 * 1024) // 11MB - exceeds limit
            .build();
        
        Set<ConstraintViolation<SecureNoteRequest>> violations = validator.validate(request);
        
        assertTrue(violations.stream().anyMatch(v -> 
            v.getMessage().contains("10MB")), 
            "Should reject attachment size > 10MB");
    }
    
    @Test
    void testAttachmentCountValidation() {
        SecureNoteRequest request = SecureNoteRequest.builder()
            .title("Test Note")
            .encryptedContent(Base64.getEncoder().encodeToString("content".getBytes()))
            .contentIv(Base64.getEncoder().encodeToString("iv".getBytes()))
            .contentAuthTag(Base64.getEncoder().encodeToString("tag".getBytes()))
            .attachmentCount(101) // Exceeds limit of 100
            .build();
        
        Set<ConstraintViolation<SecureNoteRequest>> violations = validator.validate(request);
        
        assertTrue(violations.stream().anyMatch(v -> 
            v.getMessage().contains("100")), 
            "Should reject more than 100 attachments");
    }
    
    @Test
    void testValidInput_NoViolations() {
        String validBase64 = Base64.getEncoder().encodeToString("test data".getBytes());
        
        CredentialRequest request = CredentialRequest.builder()
            .encryptedData(validBase64)
            .iv(validBase64)
            .authTag(validBase64)
            .build();
        
        // Only validate Base64 fields, not @NotBlank
        Set<ConstraintViolation<CredentialRequest>> violations = validator.validate(request);
        
        // Filter out NotBlank violations, we're only testing Base64 validation
        long base64Violations = violations.stream()
            .filter(v -> v.getMessage().contains("Base64"))
            .count();
        
        assertEquals(0, base64Violations, "Valid Base64 should have no violations");
    }
}
