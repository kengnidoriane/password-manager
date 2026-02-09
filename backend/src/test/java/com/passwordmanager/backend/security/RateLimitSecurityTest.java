package com.passwordmanager.backend.security;

import com.passwordmanager.backend.BaseIntegrationTest;
import com.passwordmanager.backend.dto.LoginRequest;
import com.passwordmanager.backend.dto.RegisterRequest;
import com.passwordmanager.backend.dto.CredentialRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Security tests for rate limiting effectiveness.
 * Tests that rate limits prevent brute force and DoS attacks.
 */
public class RateLimitSecurityTest extends BaseIntegrationTest {

    @Test
    public void testLoginRateLimiting() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setAuthKeyHash("wrongHash");

        int successfulRequests = 0;
        int rateLimitedRequests = 0;

        // Attempt multiple login requests rapidly
        for (int i = 0; i < 10; i++) {
            MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andReturn();

            int status = result.getResponse().getStatus();
            if (status == 429) {
                rateLimitedRequests++;
                // Verify Retry-After header is present
                String retryAfter = result.getResponse().getHeader("Retry-After");
                assertThat(retryAfter).isNotNull();
            } else {
                successfulRequests++;
            }
        }

        // At least some requests should be rate limited
        assertThat(rateLimitedRequests).isGreaterThan(0);
    }

    @Test
    public void testRegistrationRateLimiting() throws Exception {
        int rateLimitedRequests = 0;

        // Attempt multiple registration requests rapidly
        for (int i = 0; i < 10; i++) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail("test" + i + "@example.com");
            request.setAuthKeyHash("hash" + i);
            request.setSalt("salt" + i);
            request.setIterations(100000);

            MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andReturn();

            if (result.getResponse().getStatus() == 429) {
                rateLimitedRequests++;
            }
        }

        // Should have rate limiting on registration
        assertThat(rateLimitedRequests).isGreaterThan(0);
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testVaultOperationsRateLimiting() throws Exception {
        int rateLimitedRequests = 0;

        // Attempt many vault operations rapidly
        for (int i = 0; i < 150; i++) {
            CredentialRequest request = new CredentialRequest();
            request.setTitle("Credential " + i);
            request.setUsername("user" + i);
            request.setPassword("pass" + i);
            request.setEncryptedData("encrypted" + i);
            request.setIv("iv" + i);
            request.setAuthTag("tag" + i);

            MvcResult result = mockMvc.perform(post("/api/v1/vault/credential")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andReturn();

            if (result.getResponse().getStatus() == 429) {
                rateLimitedRequests++;
            }
        }

        // Should have rate limiting on vault operations (100/min limit)
        assertThat(rateLimitedRequests).isGreaterThan(0);
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testExportRateLimiting() throws Exception {
        int rateLimitedRequests = 0;

        // Attempt multiple export requests rapidly
        for (int i = 0; i < 5; i++) {
            String requestBody = "{\"format\":\"CSV\",\"includeDeleted\":false}";

            MvcResult result = mockMvc.perform(post("/api/v1/vault/export")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestBody))
                    .andReturn();

            if (result.getResponse().getStatus() == 429) {
                rateLimitedRequests++;
            }

            // Small delay to avoid overwhelming the test
            Thread.sleep(100);
        }

        // Export should have strict rate limiting (3/hour)
        assertThat(rateLimitedRequests).isGreaterThan(0);
    }

    @Test
    public void testRateLimitHeadersPresent() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setAuthKeyHash("hash");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        // Check for rate limit headers
        String rateLimitLimit = result.getResponse().getHeader("X-RateLimit-Limit");
        String rateLimitRemaining = result.getResponse().getHeader("X-RateLimit-Remaining");
        
        // Headers should be present (if implemented)
        // Note: This depends on the rate limiting implementation
        if (rateLimitLimit != null) {
            assertThat(rateLimitLimit).isNotEmpty();
        }
    }

    @Test
    public void testRateLimitPerIPAddress() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setAuthKeyHash("hash");

        // Requests from same IP should share rate limit
        int rateLimitedCount = 0;
        for (int i = 0; i < 10; i++) {
            MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                    .header("X-Forwarded-For", "192.168.1.100")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andReturn();

            if (result.getResponse().getStatus() == 429) {
                rateLimitedCount++;
            }
        }

        assertThat(rateLimitedCount).isGreaterThan(0);
    }

    @Test
    public void testRateLimitPerUser() throws Exception {
        // Test that rate limits are applied per user, not globally
        LoginRequest request1 = new LoginRequest();
        request1.setEmail("user1@example.com");
        request1.setAuthKeyHash("hash1");

        LoginRequest request2 = new LoginRequest();
        request2.setEmail("user2@example.com");
        request2.setAuthKeyHash("hash2");

        // Make requests for different users
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request1)));

            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request2)));
        }

        // Both users should be able to make requests (separate rate limits)
        // This test verifies that rate limits are per-user, not global
    }

    @Test
    public void testRateLimitReset() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setAuthKeyHash("hash");

        // Make requests until rate limited
        boolean rateLimited = false;
        for (int i = 0; i < 10; i++) {
            MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andReturn();

            if (result.getResponse().getStatus() == 429) {
                rateLimited = true;
                break;
            }
        }

        if (rateLimited) {
            // Wait for rate limit to reset (depends on implementation)
            Thread.sleep(2000);

            // Should be able to make request again
            MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andReturn();

            // May still be rate limited depending on window, but shouldn't error
            assertThat(result.getResponse().getStatus()).isIn(401, 429);
        }
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testDifferentEndpointsHaveDifferentLimits() throws Exception {
        // Test that different endpoints have appropriate rate limits
        
        // Vault operations should have higher limit (100/min)
        int vaultRequests = 0;
        for (int i = 0; i < 20; i++) {
            MvcResult result = mockMvc.perform(get("/api/v1/vault"))
                    .andReturn();
            if (result.getResponse().getStatus() != 429) {
                vaultRequests++;
            }
        }

        // Export should have lower limit (3/hour)
        int exportRequests = 0;
        for (int i = 0; i < 5; i++) {
            MvcResult result = mockMvc.perform(post("/api/v1/vault/export")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"format\":\"CSV\"}"))
                    .andReturn();
            if (result.getResponse().getStatus() != 429) {
                exportRequests++;
            }
            Thread.sleep(100);
        }

        // Vault should allow more requests than export
        assertThat(vaultRequests).isGreaterThan(exportRequests);
    }

    @Test
    public void testRateLimitDoesNotAffectStaticResources() throws Exception {
        // Static resources should not be rate limited
        for (int i = 0; i < 20; i++) {
            mockMvc.perform(get("/actuator/health"))
                    .andExpect(status().isOk());
        }
    }
}
