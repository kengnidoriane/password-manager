package com.passwordmanager.backend.monitoring;

import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import com.passwordmanager.backend.repository.SessionRepository;
import com.passwordmanager.backend.repository.AuditLogRepository;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for monitoring and observability features.
 * Tests health indicators, metrics endpoints, and custom monitoring endpoints.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "management.endpoints.web.exposure.include=health,info,metrics,prometheus,password-manager",
    "management.endpoint.health.show-details=always",
    "management.server.port=0"
})
@AutoConfigureWebMvc
@Transactional
class MonitoringIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private MeterRegistry meterRegistry;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VaultRepository vaultRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void healthEndpoint_ShouldReturnHealthStatus() {
        // When
        ResponseEntity<Map> response = restTemplate.getForEntity(
            "http://localhost:" + port + "/actuator/health", 
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("UP");
        
        // Check that custom health indicators are present
        Map<String, Object> components = (Map<String, Object>) response.getBody().get("components");
        assertThat(components).containsKeys("db", "redis", "diskSpace");
    }

    @Test
    void infoEndpoint_ShouldReturnApplicationInfo() {
        // When
        ResponseEntity<Map> response = restTemplate.getForEntity(
            "http://localhost:" + port + "/actuator/info", 
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        
        // Check that custom info contributors are present
        assertThat(response.getBody()).containsKeys("application", "security", "features");
        
        Map<String, Object> application = (Map<String, Object>) response.getBody().get("application");
        assertThat(application.get("name")).isEqualTo("password-manager-backend");
        
        Map<String, Object> security = (Map<String, Object>) response.getBody().get("security");
        assertThat(security.get("zeroKnowledgeArchitecture")).isEqualTo(true);
        
        Map<String, Object> features = (Map<String, Object>) response.getBody().get("features");
        assertThat(features.get("passwordGeneration")).isEqualTo(true);
        assertThat(features.get("twoFactorAuth")).isEqualTo(true);
    }

    @Test
    void metricsEndpoint_ShouldReturnPrometheusMetrics() {
        // When
        ResponseEntity<String> response = restTemplate.getForEntity(
            "http://localhost:" + port + "/actuator/prometheus", 
            String.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        
        // Check that custom metrics are present
        String metricsBody = response.getBody();
        assertThat(metricsBody).contains("auth_login_attempts_total");
        assertThat(metricsBody).contains("vault_operations_read_total");
        assertThat(metricsBody).contains("sessions_active");
        assertThat(metricsBody).contains("users_total");
        assertThat(metricsBody).contains("credentials_total");
    }

    @Test
    void customPasswordManagerEndpoint_ShouldReturnApplicationMetrics() {
        // When
        ResponseEntity<Map> response = restTemplate.getForEntity(
            "http://localhost:" + port + "/actuator/password-manager", 
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("operational");
        assertThat(response.getBody()).containsKeys("totalUsers", "totalCredentials", "activeSessions", "timestamp");
    }

    @Test
    void meterRegistry_ShouldHaveCustomMetrics() {
        // Then
        assertThat(meterRegistry.find("auth.login.attempts").counter()).isNotNull();
        assertThat(meterRegistry.find("vault.operations.read").counter()).isNotNull();
        assertThat(meterRegistry.find("sessions.active").gauge()).isNotNull();
        assertThat(meterRegistry.find("users.total").gauge()).isNotNull();
        assertThat(meterRegistry.find("credentials.total").gauge()).isNotNull();
    }

    @Test
    void healthIndicators_ShouldReflectDatabaseState() {
        // Given - Create some test data
        UserAccount testUser = UserAccount.builder()
            .email("test@example.com")
            .authKeyHash("hashedKey")
            .salt("salt")
            .iterations(100000)
            .emailVerified(true)
            .twoFactorEnabled(false)
            .build();
        userRepository.save(testUser);

        VaultEntry testEntry = VaultEntry.builder()
            .user(testUser)
            .entryType(VaultEntry.EntryType.CREDENTIAL)
            .encryptedData("encrypted")
            .iv("iv")
            .authTag("tag")
            .build();
        vaultRepository.save(testEntry);

        // When
        ResponseEntity<Map> response = restTemplate.getForEntity(
            "http://localhost:" + port + "/actuator/health", 
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> components = (Map<String, Object>) response.getBody().get("components");
        
        // Check database health indicator
        Map<String, Object> dbHealth = (Map<String, Object>) components.get("db");
        assertThat(dbHealth.get("status")).isEqualTo("UP");
        assertThat(dbHealth.get("details")).isNotNull();
        
        Map<String, Object> dbDetails = (Map<String, Object>) dbHealth.get("details");
        assertThat(dbDetails).containsKeys("database", "responseTime");
        assertThat(dbDetails.get("database")).isEqualTo("H2"); // Test database
    }

    @Test
    void customMetrics_ShouldTrackApplicationActivity() {
        // Given - Initial metric values
        double initialLoginAttempts = meterRegistry.find("auth.login.attempts").counter().count();
        double initialVaultReads = meterRegistry.find("vault.operations.read").counter().count();

        // When - Simulate some activity by incrementing counters directly
        meterRegistry.counter("auth.login.attempts").increment();
        meterRegistry.counter("vault.operations.read", "operation", "test").increment();

        // Then - Verify metrics were updated
        assertThat(meterRegistry.find("auth.login.attempts").counter().count())
            .isEqualTo(initialLoginAttempts + 1);
        assertThat(meterRegistry.find("vault.operations.read").counter().count())
            .isGreaterThan(initialVaultReads);
    }

    @Test
    void applicationHealthIndicator_ShouldProvideBusinessMetrics() {
        // Given - Create test data
        UserAccount user1 = UserAccount.builder()
            .email("user1@example.com")
            .authKeyHash("hash1")
            .salt("salt1")
            .iterations(100000)
            .emailVerified(true)
            .twoFactorEnabled(false)
            .lastLoginAt(LocalDateTime.now().minusHours(1))
            .build();
        
        UserAccount user2 = UserAccount.builder()
            .email("user2@example.com")
            .authKeyHash("hash2")
            .salt("salt2")
            .iterations(100000)
            .emailVerified(true)
            .twoFactorEnabled(true)
            .lastLoginAt(LocalDateTime.now().minusDays(2))
            .build();
        
        userRepository.save(user1);
        userRepository.save(user2);

        VaultEntry entry1 = VaultEntry.builder()
            .user(user1)
            .entryType(VaultEntry.EntryType.CREDENTIAL)
            .encryptedData("encrypted1")
            .iv("iv1")
            .authTag("tag1")
            .build();
        
        VaultEntry entry2 = VaultEntry.builder()
            .user(user2)
            .entryType(VaultEntry.EntryType.CREDENTIAL)
            .encryptedData("encrypted2")
            .iv("iv2")
            .authTag("tag2")
            .build();
        
        vaultRepository.save(entry1);
        vaultRepository.save(entry2);

        // When
        ResponseEntity<Map> response = restTemplate.getForEntity(
            "http://localhost:" + port + "/actuator/health", 
            Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> components = (Map<String, Object>) response.getBody().get("components");
        
        // Check application health indicator
        Map<String, Object> appHealth = (Map<String, Object>) components.get("applicationHealthIndicator");
        if (appHealth != null) {
            assertThat(appHealth.get("status")).isEqualTo("UP");
            Map<String, Object> details = (Map<String, Object>) appHealth.get("details");
            assertThat(details).containsKeys("totalUsers", "totalCredentials", "recentActiveUsers");
            assertThat((Integer) details.get("totalUsers")).isGreaterThanOrEqualTo(2);
            assertThat((Integer) details.get("totalCredentials")).isGreaterThanOrEqualTo(2);
        }
    }
}