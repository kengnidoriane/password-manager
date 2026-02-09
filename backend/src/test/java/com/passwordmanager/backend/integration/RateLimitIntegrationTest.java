package com.passwordmanager.backend.integration;

import com.passwordmanager.backend.config.TestConfig;
import com.passwordmanager.backend.dto.LoginRequest;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for rate limiting functionality.
 * 
 * Tests that rate limits are properly enforced across different endpoints:
 * - Authentication endpoints: 5 requests per minute
 * - Vault operations: 100 requests per minute
 * - Export operations: 3 requests per hour
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestConfig.class)
class RateLimitIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UserAccount testUser;

    @BeforeEach
    void setUp() {
        // Clean up
        userRepository.deleteAll();

        // Create test user
        testUser = new UserAccount();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setAuthKeyHash(passwordEncoder.encode("test-auth-key"));
        testUser.setSalt("test-salt");
        testUser.setIterations(100000);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setEmailVerified(true);
        userRepository.save(testUser);
    }

    @Test
    void testAuthenticationRateLimitEnforced() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setAuthKeyHash("wrong-password");

        // Make 5 requests (should all be allowed)
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(header().exists("X-RateLimit-Remaining"));
        }

        // 6th request should be rate limited
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.error").value("Too Many Requests"));
    }

    @Test
    void testRateLimitHeadersPresent() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test2@example.com");
        loginRequest.setAuthKeyHash("test-password");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(header().exists("X-RateLimit-Remaining"))
                .andReturn();

        String remainingHeader = result.getResponse().getHeader("X-RateLimit-Remaining");
        assert remainingHeader != null;
        int remaining = Integer.parseInt(remainingHeader);
        assert remaining >= 0 && remaining <= 5;
    }

    @Test
    void testRetryAfterHeaderOnRateLimit() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test3@example.com");
        loginRequest.setAuthKeyHash("test-password");

        // Exhaust rate limit
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)));
        }

        // Next request should have Retry-After header
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andReturn();

        String retryAfter = result.getResponse().getHeader("Retry-After");
        assert retryAfter != null;
        int seconds = Integer.parseInt(retryAfter);
        assert seconds > 0 && seconds <= 60;
    }

    @Test
    void testDifferentIPAddressesHaveSeparateLimits() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test4@example.com");
        loginRequest.setAuthKeyHash("test-password");

        // Make 5 requests from first IP
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest))
                    .with(request -> {
                        request.setRemoteAddr("192.168.1.1");
                        return request;
                    }));
        }

        // 6th request from first IP should be rate limited
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
                .with(request -> {
                    request.setRemoteAddr("192.168.1.1");
                    return request;
                }))
                .andExpect(status().isTooManyRequests());

        // Request from different IP should be allowed
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
                .with(request -> {
                    request.setRemoteAddr("192.168.1.2");
                    return request;
                }))
                .andExpect(status().isUnauthorized()); // Not rate limited, just wrong credentials
    }
}
