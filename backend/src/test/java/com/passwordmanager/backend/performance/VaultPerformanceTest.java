package com.passwordmanager.backend.performance;

import com.passwordmanager.backend.BaseIntegrationTest;
import com.passwordmanager.backend.dto.CredentialRequest;
import com.passwordmanager.backend.dto.CredentialResponse;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import com.passwordmanager.backend.service.VaultService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Performance tests for vault operations with large datasets.
 * Tests vault operations with 1000+ credentials to ensure acceptable performance.
 */
@SpringBootTest
@ActiveProfiles("test")
public class VaultPerformanceTest extends BaseIntegrationTest {

    @Autowired
    private VaultService vaultService;

    @Autowired
    private VaultRepository vaultRepository;

    @Autowired
    private UserRepository userRepository;

    private UUID testUserId;
    private static final int LARGE_DATASET_SIZE = 1000;
    private static final int PERFORMANCE_THRESHOLD_MS = 5000; // 5 seconds max

    @BeforeEach
    public void setUp() {
        vaultRepository.deleteAll();
        userRepository.deleteAll();

        // Create test user
        UserAccount user = new UserAccount();
        user.setEmail("perf-test@example.com");
        user.setAuthKeyHash("$2a$10$test");
        user.setSalt("testsalt");
        user.setIterations(100000);
        user = userRepository.save(user);
        testUserId = user.getId();
    }

    @Test
    public void testCreateLargeNumberOfCredentials() {
        Instant start = Instant.now();

        List<UUID> createdIds = new ArrayList<>();
        for (int i = 0; i < LARGE_DATASET_SIZE; i++) {
            CredentialRequest request = new CredentialRequest();
            request.setEncryptedData("encrypted_data_" + i);
            request.setIv("iv_" + i);
            request.setAuthTag("tag_" + i);

            CredentialResponse response = vaultService.createCredential(testUserId, request);
            createdIds.add(response.getId());
        }

        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Created " + LARGE_DATASET_SIZE + " credentials in " + durationMs + "ms");
        System.out.println("Average time per credential: " + (durationMs / LARGE_DATASET_SIZE) + "ms");

        assertThat(createdIds).hasSize(LARGE_DATASET_SIZE);
        assertThat(durationMs).isLessThan(PERFORMANCE_THRESHOLD_MS);
    }

    @Test
    public void testRetrieveLargeVault() {
        // Create test data
        createTestCredentials(LARGE_DATASET_SIZE);

        Instant start = Instant.now();
        List<CredentialResponse> credentials = vaultService.getAllCredentials(testUserId);
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Retrieved " + credentials.size() + " credentials in " + durationMs + "ms");

        assertThat(credentials).hasSize(LARGE_DATASET_SIZE);
        assertThat(durationMs).isLessThan(1000); // Should be under 1 second
    }

    @Test
    public void testUpdateCredentialsInLargeVault() {
        List<UUID> credentialIds = createTestCredentials(LARGE_DATASET_SIZE);

        Instant start = Instant.now();

        // Update 100 random credentials
        int updateCount = 100;
        for (int i = 0; i < updateCount; i++) {
            UUID credentialId = credentialIds.get(i * (LARGE_DATASET_SIZE / updateCount));
            
            CredentialRequest updateRequest = new CredentialRequest();
            updateRequest.setEncryptedData("updated_data_" + i);
            updateRequest.setIv("updated_iv_" + i);
            updateRequest.setAuthTag("updated_tag_" + i);
            updateRequest.setVersion(1L);

            vaultService.updateCredential(testUserId, credentialId, updateRequest);
        }

        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Updated " + updateCount + " credentials in vault of " + LARGE_DATASET_SIZE + " in " + durationMs + "ms");
        System.out.println("Average time per update: " + (durationMs / updateCount) + "ms");

        assertThat(durationMs).isLessThan(2000); // Should be under 2 seconds
    }

    @Test
    public void testDeleteCredentialsInLargeVault() {
        List<UUID> credentialIds = createTestCredentials(LARGE_DATASET_SIZE);

        Instant start = Instant.now();

        // Delete 100 credentials
        int deleteCount = 100;
        for (int i = 0; i < deleteCount; i++) {
            UUID credentialId = credentialIds.get(i);
            vaultService.deleteCredential(testUserId, credentialId);
        }

        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Deleted " + deleteCount + " credentials in " + durationMs + "ms");
        System.out.println("Average time per delete: " + (durationMs / deleteCount) + "ms");

        assertThat(durationMs).isLessThan(1500); // Should be under 1.5 seconds
    }

    @Test
    public void testBulkOperationsPerformance() {
        Instant start = Instant.now();

        // Create
        List<UUID> ids = createTestCredentials(500);
        long createTime = Duration.between(start, Instant.now()).toMillis();

        // Read
        Instant readStart = Instant.now();
        List<CredentialResponse> credentials = vaultService.getAllCredentials(testUserId);
        long readTime = Duration.between(readStart, Instant.now()).toMillis();

        // Update
        Instant updateStart = Instant.now();
        for (int i = 0; i < 50; i++) {
            CredentialRequest updateRequest = new CredentialRequest();
            updateRequest.setEncryptedData("bulk_update_" + i);
            updateRequest.setIv("bulk_iv_" + i);
            updateRequest.setAuthTag("bulk_tag_" + i);
            updateRequest.setVersion(1L);
            vaultService.updateCredential(testUserId, ids.get(i), updateRequest);
        }
        long updateTime = Duration.between(updateStart, Instant.now()).toMillis();

        // Delete
        Instant deleteStart = Instant.now();
        for (int i = 0; i < 50; i++) {
            vaultService.deleteCredential(testUserId, ids.get(i));
        }
        long deleteTime = Duration.between(deleteStart, Instant.now()).toMillis();

        System.out.println("Bulk operations performance:");
        System.out.println("  Create 500: " + createTime + "ms");
        System.out.println("  Read 500: " + readTime + "ms");
        System.out.println("  Update 50: " + updateTime + "ms");
        System.out.println("  Delete 50: " + deleteTime + "ms");

        assertThat(credentials).hasSize(500);
        assertThat(createTime).isLessThan(3000);
        assertThat(readTime).isLessThan(500);
        assertThat(updateTime).isLessThan(1000);
        assertThat(deleteTime).isLessThan(750);
    }

    @Test
    public void testMemoryUsageWithLargeVault() {
        Runtime runtime = Runtime.getRuntime();
        runtime.gc();
        long memoryBefore = runtime.totalMemory() - runtime.freeMemory();

        createTestCredentials(LARGE_DATASET_SIZE);
        List<CredentialResponse> credentials = vaultService.getAllCredentials(testUserId);

        runtime.gc();
        long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
        long memoryUsed = (memoryAfter - memoryBefore) / (1024 * 1024); // Convert to MB

        System.out.println("Memory used for " + LARGE_DATASET_SIZE + " credentials: " + memoryUsed + "MB");

        assertThat(credentials).hasSize(LARGE_DATASET_SIZE);
        assertThat(memoryUsed).isLessThan(100); // Should use less than 100MB
    }

    private List<UUID> createTestCredentials(int count) {
        List<UUID> ids = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            VaultEntry entry = new VaultEntry();
            entry.setUserId(testUserId);
            entry.setEncryptedData("test_encrypted_data_" + i);
            entry.setIv("test_iv_" + i);
            entry.setAuthTag("test_auth_tag_" + i);
            entry = vaultRepository.save(entry);
            ids.add(entry.getId());
        }
        return ids;
    }
}
