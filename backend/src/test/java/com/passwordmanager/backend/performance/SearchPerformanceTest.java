package com.passwordmanager.backend.performance;

import com.passwordmanager.backend.BaseIntegrationTest;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Performance tests for search operations with large datasets.
 * Tests search performance with 1000+ credentials.
 */
@SpringBootTest
@ActiveProfiles("test")
public class SearchPerformanceTest extends BaseIntegrationTest {

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
        user.setEmail("search-perf@example.com");
        user.setAuthKeyHash("$2a$10$test");
        user.setSalt("testsalt");
        user.setIterations(100000);
        user = userRepository.save(user);
        testUserId = user.getId();

        // Create test data with searchable content
        createSearchableCredentials(LARGE_DATASET_SIZE);
    }

    @Test
    public void testSearchByUserIdPerformance() {
        Instant start = Instant.now();
        
        List<VaultEntry> results = vaultRepository.findByUserIdAndDeletedAtIsNull(testUserId);
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Search by userId in " + LARGE_DATASET_SIZE + " credentials: " + durationMs + "ms");

        assertThat(results).hasSize(LARGE_DATASET_SIZE);
        assertThat(durationMs).isLessThan(500); // Should be under 500ms with proper indexing
    }

    @Test
    public void testSearchByIdPerformance() {
        List<VaultEntry> allEntries = vaultRepository.findByUserIdAndDeletedAtIsNull(testUserId);
        UUID targetId = allEntries.get(LARGE_DATASET_SIZE / 2).getId();

        Instant start = Instant.now();
        
        var result = vaultRepository.findByIdAndUserId(targetId, testUserId);
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Search by ID in " + LARGE_DATASET_SIZE + " credentials: " + durationMs + "ms");

        assertThat(result).isPresent();
        assertThat(durationMs).isLessThan(50); // Should be very fast with primary key lookup
    }

    @Test
    public void testMultipleSearchesPerformance() {
        List<VaultEntry> allEntries = vaultRepository.findByUserIdAndDeletedAtIsNull(testUserId);
        
        Instant start = Instant.now();
        
        // Perform 100 searches
        int searchCount = 100;
        for (int i = 0; i < searchCount; i++) {
            UUID targetId = allEntries.get(i * (LARGE_DATASET_SIZE / searchCount)).getId();
            vaultRepository.findByIdAndUserId(targetId, testUserId);
        }
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Performed " + searchCount + " searches in " + durationMs + "ms");
        System.out.println("Average time per search: " + (durationMs / searchCount) + "ms");

        assertThat(durationMs).isLessThan(1000); // 100 searches should be under 1 second
    }

    @Test
    public void testPaginatedSearchPerformance() {
        int pageSize = 50;
        int totalPages = LARGE_DATASET_SIZE / pageSize;

        Instant start = Instant.now();
        
        // Simulate paginated retrieval
        for (int page = 0; page < totalPages; page++) {
            vaultRepository.findByUserIdAndDeletedAtIsNull(testUserId);
            // In real implementation, this would use pagination
        }
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Paginated search (" + totalPages + " pages) in " + durationMs + "ms");

        assertThat(durationMs).isLessThan(5000);
    }

    @Test
    public void testConcurrentSearchPerformance() throws InterruptedException {
        List<VaultEntry> allEntries = vaultRepository.findByUserIdAndDeletedAtIsNull(testUserId);
        
        int threadCount = 10;
        Thread[] threads = new Thread[threadCount];
        long[] durations = new long[threadCount];

        Instant start = Instant.now();

        for (int i = 0; i < threadCount; i++) {
            final int threadIndex = i;
            threads[i] = new Thread(() -> {
                Instant threadStart = Instant.now();
                
                // Each thread performs 10 searches
                for (int j = 0; j < 10; j++) {
                    UUID targetId = allEntries.get((threadIndex * 10 + j) % LARGE_DATASET_SIZE).getId();
                    vaultRepository.findByIdAndUserId(targetId, testUserId);
                }
                
                durations[threadIndex] = Duration.between(threadStart, Instant.now()).toMillis();
            });
            threads[i].start();
        }

        for (Thread thread : threads) {
            thread.join();
        }

        Duration totalDuration = Duration.between(start, Instant.now());
        long totalDurationMs = totalDuration.toMillis();

        System.out.println("Concurrent search with " + threadCount + " threads: " + totalDurationMs + "ms");
        for (int i = 0; i < threadCount; i++) {
            System.out.println("  Thread " + i + ": " + durations[i] + "ms");
        }

        assertThat(totalDurationMs).isLessThan(2000); // Should handle concurrent searches efficiently
    }

    private void createSearchableCredentials(int count) {
        for (int i = 0; i < count; i++) {
            VaultEntry entry = new VaultEntry();
            entry.setUserId(testUserId);
            entry.setEncryptedData("searchable_data_" + i + "_website_" + (i % 100));
            entry.setIv("iv_" + i);
            entry.setAuthTag("tag_" + i);
            vaultRepository.save(entry);
        }
    }
}
