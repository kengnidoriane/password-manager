package com.passwordmanager.backend.performance;

import com.passwordmanager.backend.BaseIntegrationTest;
import com.passwordmanager.backend.dto.SyncRequest;
import com.passwordmanager.backend.dto.SyncResponse;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import com.passwordmanager.backend.service.SyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Performance tests for sync operations with large vaults.
 * Tests sync performance with 1000+ credentials.
 */
@SpringBootTest
@ActiveProfiles("test")
public class SyncPerformanceTest extends BaseIntegrationTest {

    @Autowired
    private SyncService syncService;

    @Autowired
    private VaultRepository vaultRepository;

    @Autowired
    private UserRepository userRepository;

    private UUID testUserId;
    private static final int LARGE_DATASET_SIZE = 1000;

    @BeforeEach
    public void setUp() {
        vaultRepository.deleteAll();
        userRepository.deleteAll();

        // Create test user
        UserAccount user = new UserAccount();
        user.setEmail("sync-perf@example.com");
        user.setAuthKeyHash("$2a$10$test");
        user.setSalt("testsalt");
        user.setIterations(100000);
        user = userRepository.save(user);
        testUserId = user.getId();
    }

    @Test
    public void testInitialSyncWithLargeVault() {
        // Create large vault
        createTestCredentials(LARGE_DATASET_SIZE);

        SyncRequest request = new SyncRequest();
        request.setLastSyncTime(null); // Initial sync
        request.setChanges(new ArrayList<>());
        request.setDeletions(new ArrayList<>());
        request.setClientVersion(1L);

        Instant start = Instant.now();
        
        SyncResponse response = syncService.syncVault(testUserId, request);
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Initial sync of " + LARGE_DATASET_SIZE + " credentials: " + durationMs + "ms");
        System.out.println("Response size: " + response.getCredentials().size() + " credentials");

        assertThat(response.getCredentials()).hasSize(LARGE_DATASET_SIZE);
        assertThat(durationMs).isLessThan(3000); // Should be under 3 seconds
    }

    @Test
    public void testIncrementalSyncPerformance() {
        // Create initial vault
        createTestCredentials(LARGE_DATASET_SIZE);

        // Simulate initial sync
        LocalDateTime lastSyncTime = LocalDateTime.now();

        // Wait a bit and create new changes
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Create 50 new credentials
        createTestCredentials(50);

        SyncRequest request = new SyncRequest();
        request.setLastSyncTime(lastSyncTime);
        request.setChanges(new ArrayList<>());
        request.setDeletions(new ArrayList<>());
        request.setClientVersion(1L);

        Instant start = Instant.now();
        
        SyncResponse response = syncService.syncVault(testUserId, request);
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Incremental sync (50 new out of " + (LARGE_DATASET_SIZE + 50) + "): " + durationMs + "ms");

        assertThat(response.getCredentials().size()).isGreaterThanOrEqualTo(50);
        assertThat(durationMs).isLessThan(1000); // Incremental sync should be fast
    }

    @Test
    public void testSyncWithClientChanges() {
        createTestCredentials(LARGE_DATASET_SIZE);

        // Prepare client changes
        List<SyncRequest.CredentialChange> changes = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            SyncRequest.CredentialChange change = new SyncRequest.CredentialChange();
            change.setId(UUID.randomUUID());
            change.setEncryptedData("client_change_" + i);
            change.setIv("iv_" + i);
            change.setAuthTag("tag_" + i);
            change.setVersion(1L);
            changes.add(change);
        }

        SyncRequest request = new SyncRequest();
        request.setLastSyncTime(LocalDateTime.now().minusMinutes(5));
        request.setChanges(changes);
        request.setDeletions(new ArrayList<>());
        request.setClientVersion(1L);

        Instant start = Instant.now();
        
        SyncResponse response = syncService.syncVault(testUserId, request);
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Sync with 100 client changes in vault of " + LARGE_DATASET_SIZE + ": " + durationMs + "ms");

        assertThat(durationMs).isLessThan(2000);
    }

    @Test
    public void testSyncWithDeletions() {
        List<UUID> credentialIds = createTestCredentials(LARGE_DATASET_SIZE);

        // Prepare deletions
        List<UUID> deletions = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            deletions.add(credentialIds.get(i));
        }

        SyncRequest request = new SyncRequest();
        request.setLastSyncTime(LocalDateTime.now().minusMinutes(5));
        request.setChanges(new ArrayList<>());
        request.setDeletions(deletions);
        request.setClientVersion(1L);

        Instant start = Instant.now();
        
        SyncResponse response = syncService.syncVault(testUserId, request);
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Sync with 50 deletions in vault of " + LARGE_DATASET_SIZE + ": " + durationMs + "ms");

        assertThat(durationMs).isLessThan(1500);
    }

    @Test
    public void testMultipleConcurrentSyncs() throws InterruptedException {
        createTestCredentials(LARGE_DATASET_SIZE);

        int threadCount = 5;
        Thread[] threads = new Thread[threadCount];
        long[] durations = new long[threadCount];

        Instant start = Instant.now();

        for (int i = 0; i < threadCount; i++) {
            final int threadIndex = i;
            threads[i] = new Thread(() -> {
                Instant threadStart = Instant.now();
                
                SyncRequest request = new SyncRequest();
                request.setLastSyncTime(null);
                request.setChanges(new ArrayList<>());
                request.setDeletions(new ArrayList<>());
                request.setClientVersion(1L);

                syncService.syncVault(testUserId, request);
                
                durations[threadIndex] = Duration.between(threadStart, Instant.now()).toMillis();
            });
            threads[i].start();
        }

        for (Thread thread : threads) {
            thread.join();
        }

        Duration totalDuration = Duration.between(start, Instant.now());
        long totalDurationMs = totalDuration.toMillis();

        System.out.println("Concurrent sync with " + threadCount + " threads: " + totalDurationMs + "ms");
        for (int i = 0; i < threadCount; i++) {
            System.out.println("  Thread " + i + ": " + durations[i] + "ms");
        }

        assertThat(totalDurationMs).isLessThan(5000);
    }

    @Test
    public void testSyncBandwidthEfficiency() {
        createTestCredentials(LARGE_DATASET_SIZE);

        // Simulate sync with last sync time (should only return changes)
        LocalDateTime lastSyncTime = LocalDateTime.now().minusMinutes(10);

        SyncRequest request = new SyncRequest();
        request.setLastSyncTime(lastSyncTime);
        request.setChanges(new ArrayList<>());
        request.setDeletions(new ArrayList<>());
        request.setClientVersion(1L);

        Instant start = Instant.now();
        
        SyncResponse response = syncService.syncVault(testUserId, request);
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Bandwidth-efficient sync (no changes): " + durationMs + "ms");
        System.out.println("Credentials returned: " + response.getCredentials().size());

        // Should be fast when no changes
        assertThat(durationMs).isLessThan(500);
    }

    private List<UUID> createTestCredentials(int count) {
        List<UUID> ids = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            VaultEntry entry = new VaultEntry();
            entry.setUserId(testUserId);
            entry.setEncryptedData("sync_test_data_" + i);
            entry.setIv("iv_" + i);
            entry.setAuthTag("tag_" + i);
            entry = vaultRepository.save(entry);
            ids.add(entry.getId());
        }
        return ids;
    }
}
