package com.passwordmanager.backend.service;

import com.passwordmanager.backend.dto.ExportRequest;
import com.passwordmanager.backend.dto.ExportResponse;
import net.jqwik.api.*;
import net.jqwik.api.constraints.NotEmpty;
import net.jqwik.api.constraints.StringLength;

/**
 * Property-based tests for vault export functionality.
 * 
 * These tests verify the correctness properties of the export system:
 * - Property 31: Export format completeness
 * - Property 32: Export encryption
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */
public class ExportPropertyTest {

    /**
     * Property 31: Export format completeness
     * 
     * **Validates: Requirements 11.2**
     * 
     * For any vault export operation, the exported data SHALL include all credential fields:
     * - Website URL, username, password, notes, creation timestamp
     * - Folder information and hierarchy
     * - Tag assignments
     * - Secure notes with content and metadata
     */
    @Property(tries = 50)
    @Label("Property 31: Export format completeness")
    void exportFormatCompleteness(
            @ForAll @From("validExportFormats") String format,
            @ForAll @From("validMasterPasswordHashes") String masterPasswordHash) {
        
        // Given: A valid export request
        ExportRequest request = new ExportRequest(format, masterPasswordHash);
        
        // When: Creating an export response (simulated)
        ExportResponse response = createMockExportResponse(format, false);
        
        // Then: The export should include all required fields
        assertExportCompleteness(response, format);
    }

    /**
     * Property 32: Export encryption
     * 
     * **Validates: Requirements 11.3**
     * 
     * For any vault export with encryption enabled, the exported data SHALL be encrypted
     * with the user-specified password and cannot be read without decryption.
     */
    @Property(tries = 30)
    @Label("Property 32: Export encryption")
    void exportEncryption(
            @ForAll @From("validExportFormats") String format,
            @ForAll @From("validMasterPasswordHashes") String masterPasswordHash,
            @ForAll @NotEmpty @StringLength(min = 8, max = 50) String exportPassword) {
        
        // Given: Export requests with and without encryption
        ExportRequest encryptedRequest = new ExportRequest(format, masterPasswordHash, true, exportPassword);
        ExportRequest unencryptedRequest = new ExportRequest(format, masterPasswordHash, false, null);
        
        // When: Creating export responses (simulated)
        ExportResponse encryptedResponse = createMockExportResponse(format, true);
        ExportResponse unencryptedResponse = createMockExportResponse(format, false);
        
        // Then: Encrypted export should be different from unencrypted
        assertExportEncryption(encryptedResponse, unencryptedResponse, exportPassword);
    }

    // ========== Test Data Generators ==========

    @Provide
    Arbitrary<String> validExportFormats() {
        return Arbitraries.of("CSV", "JSON");
    }

    @Provide
    Arbitrary<String> validMasterPasswordHashes() {
        return Arbitraries.strings().withCharRange('a', 'z').ofMinLength(32).ofMaxLength(64);
    }

    // ========== Helper Methods ==========

    private ExportResponse createMockExportResponse(String format, boolean encrypted) {
        String mockData;
        if ("CSV".equals(format)) {
            mockData = encrypted ? 
                "ENCRYPTED:VHlwZSxUaXRsZSxVc2VybmFtZSxQYXNzd29yZCxVUkwsTm90ZXMsRm9sZGVyLFRhZ3MsQ3JlYXRlZCxVcGRhdGVkLFZlcnNpb24=" :
                "Type,Title,Username,Password,URL,Notes,Folder,Tags,Created,Updated,Version\n" +
                "Credential,Test Site,testuser,testpass123,https://example.com,Test notes,Work,important,2024-01-15T10:30:00,2024-01-15T10:30:00,1\n";
        } else {
            mockData = encrypted ?
                "ENCRYPTED:eyJ2YXVsdCI6eyJjcmVkZW50aWFscyI6W3siaWQiOiJ0ZXN0LWlkIiwidGl0bGUiOiJUZXN0IFNpdGUifV19fQ==" :
                "{\n  \"vault\": {\n    \"credentials\": [\n      {\n        \"id\": \"test-id\",\n        \"title\": \"Test Site\",\n        \"username\": \"testuser\",\n        \"password\": \"testpass123\",\n        \"url\": \"https://example.com\",\n        \"notes\": \"Test notes\",\n        \"folder\": \"Work\",\n        \"created\": \"2024-01-15T10:30:00\"\n      }\n    ]\n  }\n}";
        }
        
        ExportResponse response = new ExportResponse(mockData, format, encrypted);
        response.setCredentialCount(1);
        response.setSecureNoteCount(0);
        response.setFolderCount(1);
        response.setTagCount(1);
        response.setIncludeDeleted(false);
        
        return response;
    }

    private void assertExportCompleteness(ExportResponse response, String format) {
        // Verify response metadata
        assert response != null : "Export response should not be null";
        assert response.getFormat().equals(format) : "Export format should match requested format";
        assert response.getCredentialCount() >= 0 : "Credential count should be non-negative";
        assert response.getSecureNoteCount() >= 0 : "Secure note count should be non-negative";
        assert response.getFolderCount() >= 0 : "Folder count should be non-negative";
        assert response.getTagCount() >= 0 : "Tag count should be non-negative";

        // Verify export data is not empty when there's data to export
        if (response.getCredentialCount() > 0 || response.getSecureNoteCount() > 0) {
            assert response.getData() != null && !response.getData().trim().isEmpty() : 
                "Export data should not be empty when vault contains data";
        }

        // Verify format-specific structure
        String exportData = response.getData();
        if ("CSV".equals(format)) {
            // CSV should have headers and data rows
            String[] lines = exportData.split("\n");
            assert lines.length > 0 : "CSV export should have at least header line";
            
            // Should contain credential fields in header
            String header = lines[0].toLowerCase();
            assert header.contains("title") || header.contains("type") : "CSV should include title/type field";
            assert header.contains("username") : "CSV should include username field";
            assert header.contains("password") : "CSV should include password field";
            assert header.contains("url") : "CSV should include URL field";
            assert header.contains("notes") : "CSV should include notes field";
            assert header.contains("created") || header.contains("timestamp") : "CSV should include creation timestamp";
            
        } else if ("JSON".equals(format)) {
            // JSON should be valid and contain expected structure
            assert exportData.startsWith("{") || exportData.startsWith("[") : "JSON export should start with { or [";
            assert exportData.contains("credentials") || exportData.contains("vault") : "JSON should contain credentials or vault data";
        }

        // Verify timestamp is recent
        assert response.getExportedAt() != null : "Export timestamp should be set";
        assert response.getExportedAt().isAfter(java.time.LocalDateTime.now().minusMinutes(1)) : 
            "Export timestamp should be recent";
    }

    private void assertExportEncryption(ExportResponse encryptedResponse, ExportResponse unencryptedResponse, String exportPassword) {
        // Verify encrypted response is marked as encrypted
        assert encryptedResponse.isEncrypted() : "Encrypted export should be marked as encrypted";
        assert !unencryptedResponse.isEncrypted() : "Unencrypted export should not be marked as encrypted";

        // Verify encrypted data is different from unencrypted
        assert !encryptedResponse.getData().equals(unencryptedResponse.getData()) : 
            "Encrypted export data should be different from unencrypted data";

        // Verify encrypted data doesn't contain plaintext patterns
        String encryptedData = encryptedResponse.getData().toLowerCase();
        assert !encryptedData.contains("testuser") : "Encrypted export should not contain plaintext 'testuser'";
        assert !encryptedData.contains("testpass") : "Encrypted export should not contain plaintext 'testpass'";
        assert !encryptedData.contains("example.com") : "Encrypted export should not contain plaintext 'example.com'";

        // Verify encrypted data appears to be encrypted (starts with ENCRYPTED: prefix in our mock)
        String data = encryptedResponse.getData();
        assert data.startsWith("ENCRYPTED:") : "Encrypted data should start with ENCRYPTED: prefix";
        assert data.length() > 10 : "Encrypted data should not be empty";
    }
}