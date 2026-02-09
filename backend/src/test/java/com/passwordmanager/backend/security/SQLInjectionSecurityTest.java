package com.passwordmanager.backend.security;

import com.passwordmanager.backend.BaseIntegrationTest;
import com.passwordmanager.backend.dto.LoginRequest;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Security tests for SQL Injection vulnerabilities.
 * Tests that malicious SQL in user input doesn't affect database queries.
 */
public class SQLInjectionSecurityTest extends BaseIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String[] SQL_INJECTION_PAYLOADS = {
        "' OR '1'='1",
        "' OR '1'='1' --",
        "' OR '1'='1' /*",
        "admin'--",
        "admin' #",
        "admin'/*",
        "' or 1=1--",
        "' or 1=1#",
        "' or 1=1/*",
        "') or '1'='1--",
        "') or ('1'='1--",
        "1' ORDER BY 1--",
        "1' ORDER BY 2--",
        "1' ORDER BY 3--",
        "1' UNION SELECT NULL--",
        "1' UNION SELECT NULL,NULL--",
        "' UNION SELECT NULL,NULL,NULL--",
        "'; DROP TABLE users--",
        "'; DELETE FROM users--",
        "'; UPDATE users SET email='hacked@evil.com'--",
        "1'; EXEC xp_cmdshell('dir')--",
        "1' AND 1=CONVERT(int, (SELECT @@version))--"
    };

    @BeforeEach
    public void setupTestUser() {
        userRepository.deleteAll();
        
        UserAccount user = new UserAccount();
        user.setEmail("test@example.com");
        user.setAuthKeyHash(passwordEncoder.encode("validHash"));
        user.setSalt("salt123");
        user.setIterations(100000);
        userRepository.save(user);
    }

    @Test
    public void testSQLInjectionInLoginEmail() throws Exception {
        for (String sqlPayload : SQL_INJECTION_PAYLOADS) {
            LoginRequest request = new LoginRequest();
            request.setEmail(sqlPayload);
            request.setAuthKeyHash("someHash");

            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());

            // Verify that the user table still exists and has correct data
            long userCount = userRepository.count();
            assertThat(userCount).isEqualTo(1);
            
            UserAccount user = userRepository.findByEmail("test@example.com").orElse(null);
            assertThat(user).isNotNull();
            assertThat(user.getEmail()).isEqualTo("test@example.com");
        }
    }

    @Test
    public void testSQLInjectionInSearchQuery() throws Exception {
        // Create a test user and authenticate
        String userId = userRepository.findByEmail("test@example.com")
                .map(u -> u.getId().toString())
                .orElse(UUID.randomUUID().toString());

        for (String sqlPayload : SQL_INJECTION_PAYLOADS) {
            mockMvc.perform(get("/api/v1/vault")
                    .param("search", sqlPayload)
                    .header("Authorization", "Bearer mock-token"))
                    .andExpect(status().isUnauthorized()); // Will fail auth, but shouldn't cause SQL error
        }
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testSQLInjectionInAuditLogFilters() throws Exception {
        for (String sqlPayload : SQL_INJECTION_PAYLOADS) {
            mockMvc.perform(get("/api/v1/audit/logs")
                    .param("action", sqlPayload)
                    .param("deviceInfo", sqlPayload))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        // Should either return 200 with empty results or 400 for invalid input
                        // Should NOT return 500 (internal server error from SQL injection)
                        assertThat(status).isIn(200, 400, 401);
                    });
        }
    }

    @Test
    public void testSQLInjectionInRegistrationEmail() throws Exception {
        for (String sqlPayload : SQL_INJECTION_PAYLOADS) {
            String requestBody = String.format(
                "{\"email\":\"%s\",\"authKeyHash\":\"hash\",\"salt\":\"salt\",\"iterations\":100000}",
                sqlPayload.replace("\"", "\\\"")
            );

            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(requestBody))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        // Should return 400 for invalid email format, not 500 for SQL error
                        assertThat(status).isIn(400, 409);
                    });

            // Verify database integrity
            long userCount = userRepository.count();
            assertThat(userCount).isEqualTo(1); // Only the original test user
        }
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testSQLInjectionInFolderName() throws Exception {
        String requestBody = String.format(
            "{\"name\":\"%s\"}",
            "' OR '1'='1".replace("\"", "\\\"")
        );

        mockMvc.perform(post("/api/v1/vault/folder")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    // Should handle gracefully, not cause SQL error
                    assertThat(status).isIn(200, 201, 400);
                });
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testSQLInjectionInTagName() throws Exception {
        String requestBody = String.format(
            "{\"name\":\"%s\",\"color\":\"#FF0000\"}",
            "'; DROP TABLE tags--".replace("\"", "\\\"")
        );

        mockMvc.perform(post("/api/v1/vault/tag")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertThat(status).isIn(200, 201, 400);
                });
    }

    @Test
    public void testParameterizedQueriesPreventInjection() {
        // Test that JPA/Hibernate uses parameterized queries
        String maliciousEmail = "' OR '1'='1' --";
        
        // This should safely return empty Optional, not execute malicious SQL
        var result = userRepository.findByEmail(maliciousEmail);
        assertThat(result).isEmpty();
        
        // Verify database integrity
        long userCount = userRepository.count();
        assertThat(userCount).isEqualTo(1);
    }

    @Test
    public void testStoredProcedureCallsAreSafe() {
        // If the application uses stored procedures, test they're called safely
        // This is a placeholder - implement if stored procedures are used
        assertThat(userRepository.count()).isEqualTo(1);
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void testOrderByClauseInjection() throws Exception {
        // Test SQL injection in ORDER BY clauses
        String[] orderByPayloads = {
            "1; DROP TABLE users--",
            "(SELECT * FROM users)",
            "CASE WHEN (1=1) THEN 1 ELSE 2 END"
        };

        for (String payload : orderByPayloads) {
            mockMvc.perform(get("/api/v1/vault")
                    .param("sort", payload))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        // Should reject invalid sort parameters
                        assertThat(status).isIn(200, 400, 401);
                    });
        }
    }
}
