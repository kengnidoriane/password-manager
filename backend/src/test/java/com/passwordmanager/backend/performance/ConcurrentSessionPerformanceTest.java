package com.passwordmanager.backend.performance;

import com.passwordmanager.backend.BaseIntegrationTest;
import com.passwordmanager.backend.dto.LoginRequest;
import com.passwordmanager.backend.dto.LoginResponse;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.repository.SessionRepository;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.service.AuthenticationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Performance tests for concurrent user sessions.
 * Tests system behavior under concurrent load.
 */
@SpringBootTest
@ActiveProfiles("test")
public class ConcurrentSessionPerformanceTest extends BaseIntegrationTest {

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final int CONCURRENT_USERS = 50;
    private static final String TEST_PASSWORD = "TestPassword123!";

    @BeforeEach
    public void setUp() {
        sessionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    public void testConcurrentUserLogins() throws InterruptedException {
        // Create test users
        List<String> userEmails = createTestUsers(CONCURRENT_USERS);

        ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
        CountDownLatch latch = new CountDownLatch(CONCURRENT_USERS);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        List<Long> responseTimes = new ArrayList<>();

        Instant start = Instant.now();

        for (String email : userEmails) {
            executor.submit(() -> {
                try {
                    Instant requestStart = Instant.now();
                    
                    LoginRequest request = new LoginRequest();
                    request.setEmail(email);
                    request.setAuthKeyHash(passwordEncoder.encode(TEST_PASSWORD));

                    LoginResponse response = authenticationService.login(request);
                    
                    long responseTime = Duration.between(requestStart, Instant.now()).toMillis();
                    synchronized (responseTimes) {
                        responseTimes.add(responseTime);
                    }

                    if (response.getToken() != null) {
                        successCount.incrementAndGet();
                    } else {
                        failureCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        Duration totalDuration = Duration.between(start, Instant.now());
        long totalDurationMs = totalDuration.toMillis();

        double avgResponseTime = responseTimes.stream()
            .mapToLong(Long::longValue)
            .average()
            .orElse(0.0);

        long maxResponseTime = responseTimes.stream()
            .mapToLong(Long::longValue)
            .max()
            .orElse(0L);

        System.out.println("Concurrent login performance:");
        System.out.println("  Total users: " + CONCURRENT_USERS);
        System.out.println("  Successful logins: " + successCount.get());
        System.out.println("  Failed logins: " + failureCount.get());
        System.out.println("  Total time: " + totalDurationMs + "ms");
        System.out.println("  Average response time: " + avgResponseTime + "ms");
        System.out.println("  Max response time: " + maxResponseTime + "ms");

        assertThat(successCount.get()).isEqualTo(CONCURRENT_USERS);
        assertThat(failureCount.get()).isEqualTo(0);
        assertThat(avgResponseTime).isLessThan(1000.0); // Average under 1 second
        assertThat(maxResponseTime).isLessThan(3000); // Max under 3 seconds
    }

    @Test
    public void testConcurrentSessionCreation() throws InterruptedException {
        List<String> userEmails = createTestUsers(CONCURRENT_USERS);

        ExecutorService executor = Executors.newFixedThreadPool(CONCURRENT_USERS);
        CountDownLatch latch = new CountDownLatch(CONCURRENT_USERS);
        AtomicInteger successCount = new AtomicInteger(0);

        Instant start = Instant.now();

        for (String email : userEmails) {
            executor.submit(() -> {
                try {
                    LoginRequest request = new LoginRequest();
                    request.setEmail(email);
                    request.setAuthKeyHash(passwordEncoder.encode(TEST_PASSWORD));

                    authenticationService.login(request);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    // Ignore failures for this test
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        Duration totalDuration = Duration.between(start, Instant.now());
        long totalDurationMs = totalDuration.toMillis();

        long sessionCount = sessionRepository.count();

        System.out.println("Concurrent session creation:");
        System.out.println("  Sessions created: " + sessionCount);
        System.out.println("  Total time: " + totalDurationMs + "ms");
        System.out.println("  Sessions per second: " + (sessionCount * 1000.0 / totalDurationMs));

        assertThat(sessionCount).isGreaterThanOrEqualTo(CONCURRENT_USERS);
        assertThat(totalDurationMs).isLessThan(10000); // Should complete within 10 seconds
    }

    @Test
    public void testHighLoadScenario() throws InterruptedException {
        List<String> userEmails = createTestUsers(20);

        ExecutorService executor = Executors.newFixedThreadPool(20);
        CountDownLatch latch = new CountDownLatch(100); // 100 total requests
        AtomicInteger successCount = new AtomicInteger(0);

        Instant start = Instant.now();

        // Each user makes 5 login requests
        for (int i = 0; i < 100; i++) {
            String email = userEmails.get(i % 20);
            executor.submit(() -> {
                try {
                    LoginRequest request = new LoginRequest();
                    request.setEmail(email);
                    request.setAuthKeyHash(passwordEncoder.encode(TEST_PASSWORD));

                    authenticationService.login(request);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    // Ignore failures
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(60, TimeUnit.SECONDS);
        executor.shutdown();

        Duration totalDuration = Duration.between(start, Instant.now());
        long totalDurationMs = totalDuration.toMillis();

        System.out.println("High load scenario:");
        System.out.println("  Total requests: 100");
        System.out.println("  Successful: " + successCount.get());
        System.out.println("  Total time: " + totalDurationMs + "ms");
        System.out.println("  Requests per second: " + (100 * 1000.0 / totalDurationMs));

        assertThat(successCount.get()).isGreaterThan(80); // At least 80% success rate
        assertThat(totalDurationMs).isLessThan(30000); // Should complete within 30 seconds
    }

    @Test
    public void testSessionCleanupPerformance() {
        // Create many sessions
        List<String> userEmails = createTestUsers(100);

        for (String email : userEmails) {
            try {
                LoginRequest request = new LoginRequest();
                request.setEmail(email);
                request.setAuthKeyHash(passwordEncoder.encode(TEST_PASSWORD));
                authenticationService.login(request);
            } catch (Exception e) {
                // Ignore
            }
        }

        long sessionCountBefore = sessionRepository.count();

        Instant start = Instant.now();
        
        // Cleanup would happen here (if implemented)
        sessionRepository.deleteAll();
        
        Duration duration = Duration.between(start, Instant.now());
        long durationMs = duration.toMillis();

        long sessionCountAfter = sessionRepository.count();

        System.out.println("Session cleanup performance:");
        System.out.println("  Sessions before: " + sessionCountBefore);
        System.out.println("  Sessions after: " + sessionCountAfter);
        System.out.println("  Cleanup time: " + durationMs + "ms");

        assertThat(sessionCountAfter).isEqualTo(0);
        assertThat(durationMs).isLessThan(1000);
    }

    @Test
    public void testDatabaseConnectionPooling() throws InterruptedException {
        List<String> userEmails = createTestUsers(50);

        ExecutorService executor = Executors.newFixedThreadPool(50);
        CountDownLatch latch = new CountDownLatch(50);
        AtomicInteger successCount = new AtomicInteger(0);

        Instant start = Instant.now();

        for (String email : userEmails) {
            executor.submit(() -> {
                try {
                    // Simulate database-intensive operation
                    userRepository.findByEmail(email);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    // Ignore
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        Duration totalDuration = Duration.between(start, Instant.now());
        long totalDurationMs = totalDuration.toMillis();

        System.out.println("Database connection pooling test:");
        System.out.println("  Concurrent queries: 50");
        System.out.println("  Successful: " + successCount.get());
        System.out.println("  Total time: " + totalDurationMs + "ms");

        assertThat(successCount.get()).isEqualTo(50);
        assertThat(totalDurationMs).isLessThan(2000); // Should handle efficiently with pooling
    }

    private List<String> createTestUsers(int count) {
        List<String> emails = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String email = "concurrent-user-" + i + "@example.com";
            UserAccount user = new UserAccount();
            user.setEmail(email);
            user.setAuthKeyHash(passwordEncoder.encode(TEST_PASSWORD));
            user.setSalt("salt_" + i);
            user.setIterations(100000);
            userRepository.save(user);
            emails.add(email);
        }
        return emails;
    }
}
