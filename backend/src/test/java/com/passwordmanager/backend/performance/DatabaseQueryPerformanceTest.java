package com.passwordmanager.backend.performance;

import com.passwordmanager.backend.BaseIntegrationTest;
import com.passwordmanager.backend.entity.AuditLog;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.repository.AuditLogRepository;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Performance tests for database queries.
 * Measures and validates query performance with proper indexing.
 */
@SpringBootTest
@ActiveProfiles("test")
public class DatabaseQueryPerformanceTest extends BaseIntegrationTest {

    @Autowired
    private VaultRepository vaultRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private UUID testUserId;
    private static final int LARGE_DATASET_SIZE = 1000;

    @BeforeEach
    public void setUp() {
        auditLogRepository.deleteAll();
        vaultRepository.deleteAll();
        userRepository.deleteAll();

        // Create test user
        UserAccount user = new UserAccount();
        user.setEmail("query-perf@example.com");
        user.setAuthKeyHash("$2a$10$test");
        user.setSalt("testsalt");
        user.setIterations(100000);
        user = userRepository.save(user);
        testUserId = user.getId();
    }

    @Test
    public void testIndexedQueryPerformance() {
        createTestCredentials(LARGE_DATASET_SIZE);

        // Clear any caches
        entityManager.clear();

        Instant start = Instant.now();
        
        // This query should use the index on user_id
        List<VaultEntry> results = vaultRepository.findByUserIdAndDeletedAtIsNull(testUserId);
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Indexed query (user_id) on " + LARGE_DATASET_SIZE + " records: " + durationMs + "ms");

        assertThat(results).hasSize(LARGE_DATASET_SIZE);
        assertThat(durationMs).isLessThan(100); // Should be very fast with index
    }

    @Test
    public void testPrimaryKeyLookupPerformance() {
        List<UUID> ids = createTestCredentials(LARGE_DATASET_SIZE);
        UUID targetId = ids.get(LARGE_DATASET_SIZE / 2);

        entityManager.clear();

        Instant start = Instant.now();
        
        var result = vaultRepository.findById(targetId);
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Primary key lookup in " + LARGE_DATASET_SIZE + " records: " + durationMs + "ms");

        assertThat(result).isPresent();
        assertThat(durationMs).isLessThan(10); // Should be extremely fast
    }

    @Test
    public void testCompositeIndexPerformance() {
        createTestCredentials(LARGE_DATASET_SIZE);

        entityManager.clear();

        Instant start = Instant.now();
        
        // This query uses composite index on (user_id, deleted_at)
        List<VaultEntry> results = vaultRepository.findByUserIdAndDeletedAtIsNull(testUserId);
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Composite index query on " + LARGE_DATASET_SIZE + " records: " + durationMs + "ms");

        assertThat(results).hasSize(LARGE_DATASET_SIZE);
        assertThat(durationMs).isLessThan(100);
    }

    @Test
    public void testAuditLogQueryPerformance() {
        // Create audit logs
        for (int i = 0; i < LARGE_DATASET_SIZE; i++) {
            AuditLog log = new AuditLog();
            log.setUserId(testUserId);
            log.setAction("TEST_ACTION");
            log.setResourceId(UUID.randomUUID());
            log.setIpAddress("192.168.1." + (i % 255));
            log.setDeviceInfo("Test Device");
            log.setSuccess(true);
            auditLogRepository.save(log);
        }

        entityManager.clear();

        Instant start = Instant.now();
        
        // Query with date range (should use index)
        LocalDateTime startDate = LocalDateTime.now().minusDays(1);
        LocalDateTime endDate = LocalDateTime.now().plusDays(1);
        List<AuditLog> results = auditLogRepository.findByUserIdAndTimestampBetween(
            testUserId, startDate, endDate
        );
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Audit log date range query on " + LARGE_DATASET_SIZE + " records: " + durationMs + "ms");

        assertThat(results).hasSize(LARGE_DATASET_SIZE);
        assertThat(durationMs).isLessThan(200);
    }

    @Test
    public void testBatchInsertPerformance() {
        Instant start = Instant.now();

        // Batch insert
        for (int i = 0; i < 500; i++) {
            VaultEntry entry = new VaultEntry();
            entry.setUserId(testUserId);
            entry.setEncryptedData("batch_data_" + i);
            entry.setIv("iv_" + i);
            entry.setAuthTag("tag_" + i);
            vaultRepository.save(entry);

            // Flush every 50 records
            if (i % 50 == 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }

        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Batch insert of 500 records: " + durationMs + "ms");
        System.out.println("Average time per insert: " + (durationMs / 500.0) + "ms");

        assertThat(durationMs).isLessThan(3000);
    }

    @Test
    public void testBatchUpdatePerformance() {
        List<UUID> ids = createTestCredentials(500);

        entityManager.clear();

        Instant start = Instant.now();

        for (int i = 0; i < ids.size(); i++) {
            VaultEntry entry = vaultRepository.findById(ids.get(i)).orElseThrow();
            entry.setEncryptedData("updated_data_" + i);
            vaultRepository.save(entry);

            if (i % 50 == 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }

        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Batch update of 500 records: " + durationMs + "ms");
        System.out.println("Average time per update: " + (durationMs / 500.0) + "ms");

        assertThat(durationMs).isLessThan(3000);
    }

    @Test
    public void testCountQueryPerformance() {
        createTestCredentials(LARGE_DATASET_SIZE);

        entityManager.clear();

        Instant start = Instant.now();
        
        long count = vaultRepository.countByUserIdAndDeletedAtIsNull(testUserId);
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        System.out.println("Count query on " + LARGE_DATASET_SIZE + " records: " + durationMs + "ms");

        assertThat(count).isEqualTo(LARGE_DATASET_SIZE);
        assertThat(durationMs).isLessThan(50); // Count should be very fast with index
    }

    @Test
    public void testQueryCacheEffectiveness() {
        createTestCredentials(LARGE_DATASET_SIZE);

        // First query (cold cache)
        entityManager.clear();
        Instant start1 = Instant.now();
        List<VaultEntry> results1 = vaultRepository.findByUserIdAndDeletedAtIsNull(testUserId);
        long duration1 = Duration.between(start1, Instant.now()).toMillis();

        // Second query (warm cache)
        Instant start2 = Instant.now();
        List<VaultEntry> results2 = vaultRepository.findByUserIdAndDeletedAtIsNull(testUserId);
        long duration2 = Duration.between(start2, Instant.now()).toMillis();

        System.out.println("Query cache effectiveness:");
        System.out.println("  First query (cold): " + duration1 + "ms");
        System.out.println("  Second query (warm): " + duration2 + "ms");
        System.out.println("  Speedup: " + (duration1 / (double) duration2) + "x");

        assertThat(results1).hasSize(LARGE_DATASET_SIZE);
        assertThat(results2).hasSize(LARGE_DATASET_SIZE);
        // Second query should be faster or similar
        assertThat(duration2).isLessThanOrEqualTo(duration1 * 2);
    }

    private List<UUID> createTestCredentials(int count) {
        List<UUID> ids = new java.util.ArrayList<>();
        for (int i = 0; i < count; i++) {
            VaultEntry entry = new VaultEntry();
            entry.setUserId(testUserId);
            entry.setEncryptedData("perf_test_data_" + i);
            entry.setIv("iv_" + i);
            entry.setAuthTag("tag_" + i);
            entry = vaultRepository.save(entry);
            ids.add(entry.getId());
        }
        return ids;
    }
}
