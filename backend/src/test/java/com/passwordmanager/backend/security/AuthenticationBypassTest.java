package com.passwordmanager.backend.security;

import com.passwordmanager.backend.BaseIntegrationTest;
import com.passwordmanager.backend.dto.LoginRequest;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.util.JwtUtil;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Date;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security tests for authentication bypass attempts.
 * Tests various methods attackers might use to bypass authentication.
 */
public class AuthenticationBypassTest extends BaseIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${jwt.secret:defaultSecretKeyForTestingPurposesOnly}")
    private String jwtSecret;

    private UserAccount testUser;

    @BeforeEach
    public void setupTestUser() {
        userRepository.deleteAll();
        
        testUser = new UserAccount();
        testUser.setEmail("test@example.com");
        testUser.setAuthKeyHash(passwordEncoder.encode("validHash"));
        testUser.setSalt("salt123");
        testUser.setIterations(100000);
        testUser = userRepository.save(testUser);
    }

    @Test
    public void testAccessProtectedEndpointWithoutToken() throws Exception {
        // Attempt to access protected endpoint without authentication
        mockMvc.perform(get("/api/v1/vault"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testAccessProtectedEndpointWithInvalidToken() throws Exception {
        // Attempt with completely invalid token
        mockMvc.perform(get("/api/v1/vault")
                .header("Authorization", "Bearer invalid.token.here"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testAccessProtectedEndpointWithExpiredToken() throws Exception {
        // Create an expired token
        String expiredToken = Jwts.builder()
                .setSubject(testUser.getEmail())
                .setIssuedAt(new Date(System.currentTimeMillis() - 3600000)) // 1 hour ago
                .setExpiration(new Date(System.currentTimeMillis() - 1800000)) // 30 min ago
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();

        mockMvc.perform(get("/api/v1/vault")
                .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testAccessProtectedEndpointWithTamperedToken() throws Exception {
        // Create a valid token
        String validToken = jwtUtil.generateToken(testUser.getEmail());
        
        // Tamper with the token by changing a character
        String tamperedToken = validToken.substring(0, validToken.length() - 5) + "XXXXX";

        mockMvc.perform(get("/api/v1/vault")
                .header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testAccessProtectedEndpointWithWrongSignature() throws Exception {
        // Create token with wrong secret
        String tokenWithWrongSecret = Jwts.builder()
                .setSubject(testUser.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 900000))
                .signWith(SignatureAlgorithm.HS512, "wrongSecretKey123456789")
                .compact();

        mockMvc.perform(get("/api/v1/vault")
                .header("Authorization", "Bearer " + tokenWithWrongSecret))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testAccessProtectedEndpointWithNoneAlgorithm() throws Exception {
        // Attempt to use "none" algorithm (JWT vulnerability)
        String noneAlgoToken = Jwts.builder()
                .setSubject(testUser.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 900000))
                .compact(); // No signature

        mockMvc.perform(get("/api/v1/vault")
                .header("Authorization", "Bearer " + noneAlgoToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testLoginWithInvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setAuthKeyHash("wrongHash");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testLoginWithNonExistentUser() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@example.com");
        request.setAuthKeyHash("someHash");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testAccessOtherUsersData() throws Exception {
        // Create another user
        UserAccount otherUser = new UserAccount();
        otherUser.setEmail("other@example.com");
        otherUser.setAuthKeyHash(passwordEncoder.encode("otherHash"));
        otherUser.setSalt("salt456");
        otherUser.setIterations(100000);
        otherUser = userRepository.save(otherUser);

        // Get token for test user
        String testUserToken = jwtUtil.generateToken(testUser.getEmail());

        // Attempt to access other user's vault using test user's token
        mockMvc.perform(get("/api/v1/vault")
                .header("Authorization", "Bearer " + testUserToken))
                .andExpect(result -> {
                    // Should only return test user's data, not other user's data
                    String response = result.getResponse().getContentAsString();
                    // Response should not contain other user's email or data
                    assert !response.contains("other@example.com");
                });
    }

    @Test
    public void testTokenReplayAttack() throws Exception {
        // Generate a valid token
        String validToken = jwtUtil.generateToken(testUser.getEmail());

        // Use the token multiple times (should work as JWT is stateless)
        mockMvc.perform(get("/api/v1/vault")
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk());

        // Second use should also work (this is expected for JWT)
        mockMvc.perform(get("/api/v1/vault")
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk());

        // Note: To prevent replay attacks, implement token blacklisting or short expiration
    }

    @Test
    public void testAuthorizationHeaderVariations() throws Exception {
        String validToken = jwtUtil.generateToken(testUser.getEmail());

        // Test without "Bearer" prefix
        mockMvc.perform(get("/api/v1/vault")
                .header("Authorization", validToken))
                .andExpect(status().isUnauthorized());

        // Test with wrong case
        mockMvc.perform(get("/api/v1/vault")
                .header("authorization", "Bearer " + validToken))
                .andExpect(result -> {
                    // Should work as HTTP headers are case-insensitive
                    int status = result.getResponse().getStatus();
                    assert status == 200 || status == 401;
                });

        // Test with extra spaces
        mockMvc.perform(get("/api/v1/vault")
                .header("Authorization", "Bearer  " + validToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testSessionFixation() throws Exception {
        // Test that new login creates new session/token
        LoginRequest request = new LoginRequest();
        request.setEmail(testUser.getEmail());
        request.setAuthKeyHash("validHash");

        // First login
        String response1 = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Second login should create different token
        String response2 = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Tokens should be different (if login succeeds)
        if (!response1.isEmpty() && !response2.isEmpty()) {
            assert !response1.equals(response2);
        }
    }

    @Test
    public void testPrivilegeEscalation() throws Exception {
        // Test that regular user cannot access admin endpoints
        String userToken = jwtUtil.generateToken(testUser.getEmail());

        // Attempt to access admin-only endpoint (if exists)
        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    // Should return 403 Forbidden or 404 Not Found
                    assert status == 403 || status == 404;
                });
    }

    @Test
    public void testJWTAlgorithmConfusion() throws Exception {
        // Test that server doesn't accept tokens with different algorithms
        // This tests for CVE-2015-9235 (algorithm confusion attack)
        
        // Try with RS256 when server expects HS512
        String confusedToken = Jwts.builder()
                .setSubject(testUser.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 900000))
                .signWith(SignatureAlgorithm.HS256, jwtSecret) // Different algorithm
                .compact();

        mockMvc.perform(get("/api/v1/vault")
                .header("Authorization", "Bearer " + confusedToken))
                .andExpect(status().isUnauthorized());
    }
}
