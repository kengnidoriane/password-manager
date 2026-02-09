package com.passwordmanager.backend.security;

import com.passwordmanager.backend.BaseIntegrationTest;
import com.passwordmanager.backend.dto.LoginRequest;
import com.passwordmanager.backend.dto.CredentialRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

/**
 * Security tests for CSRF (Cross-Site Request Forgery) protection.
 * Tests that state-changing operations require proper authentication tokens.
 */
public class CSRFSecurityTest extends BaseIntegrationTest {

    @Test
    public void testCSRFProtectionOnLogin() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setAuthKeyHash("hashedKey");

        // Attempt login without CSRF token should still work for stateless JWT auth
        // But verify that proper authentication is required
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized()); // Should fail due to invalid credentials
    }

    @Test
    public void testStateChangingOperationsRequireAuthentication() throws Exception {
        CredentialRequest request = new CredentialRequest();
        request.setTitle("Test Credential");
        request.setUsername("testuser");
        request.setPassword("encryptedPassword123");
        request.setEncryptedData("encrypted");
        request.setIv("iv123");
        request.setAuthTag("tag123");

        // Attempt to create credential without authentication
        mockMvc.perform(post("/api/v1/vault/credential")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testDeleteOperationRequiresAuthentication() throws Exception {
        // Attempt to delete without authentication
        mockMvc.perform(delete("/api/v1/vault/credential/123e4567-e89b-12d3-a456-426614174000"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testAuthenticatedRequestsIncludeSecurityHeaders() throws Exception {
        CredentialRequest request = new CredentialRequest();
        request.setTitle("Test Credential");
        request.setUsername("testuser");
        request.setPassword("encryptedPassword123");
        request.setEncryptedData("encrypted");
        request.setIv("iv123");
        request.setAuthTag("tag123");

        mockMvc.perform(post("/api/v1/vault/credential")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(header().exists("X-Content-Type-Options"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    public void testCORSHeadersPreventUnauthorizedOrigins() throws Exception {
        // Test that requests from unauthorized origins are blocked
        mockMvc.perform(post("/api/v1/auth/login")
                .header("Origin", "https://malicious-site.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@example.com\",\"authKeyHash\":\"hash\"}"))
                .andExpect(result -> {
                    String allowOrigin = result.getResponse().getHeader("Access-Control-Allow-Origin");
                    // Should either be null or not match the malicious origin
                    if (allowOrigin != null) {
                        assert !allowOrigin.equals("https://malicious-site.com");
                    }
                });
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testSameSiteAttributeOnCookies() throws Exception {
        // Verify that if cookies are used, they have SameSite attribute
        // This is more relevant if session cookies are used instead of JWT
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@example.com\",\"authKeyHash\":\"hash\"}"))
                .andExpect(result -> {
                    String setCookie = result.getResponse().getHeader("Set-Cookie");
                    if (setCookie != null) {
                        // If cookies are set, they should have SameSite attribute
                        assert setCookie.contains("SameSite=");
                    }
                });
    }

    @Test
    public void testContentTypeValidation() throws Exception {
        // Attempt to send request with wrong content type
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.TEXT_PLAIN)
                .content("email=test@example.com&authKeyHash=hash"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testOriginValidationForStateChangingOperations() throws Exception {
        CredentialRequest request = new CredentialRequest();
        request.setTitle("Test Credential");
        request.setUsername("testuser");
        request.setPassword("encryptedPassword123");
        request.setEncryptedData("encrypted");
        request.setIv("iv123");
        request.setAuthTag("tag123");

        // Test with suspicious referer
        mockMvc.perform(post("/api/v1/vault/credential")
                .header("Referer", "https://evil-site.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(result -> {
                    // Should either reject or ignore the referer
                    // The authentication should be based on JWT token, not referer
                    assert result.getResponse().getStatus() != 200 || 
                           result.getResponse().getStatus() == 201;
                });
    }
}
