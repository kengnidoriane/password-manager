package com.passwordmanager.backend.health;

import com.passwordmanager.backend.metrics.CustomMetricsService;
import com.passwordmanager.backend.repository.SessionRepository;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Custom health indicator for application-specific metrics and business logic health.
 * Monitors active sessions, user activity, and vault operations.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ApplicationHealthIndicator implements HealthIndicator {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final VaultRepository vaultRepository;
    private final CustomMetricsService customMetricsService;

    @Override
    public Health health() {
        try {
            Map<String, Object> details = new HashMap<>();
            
            // Check active sessions
            long activeSessions = sessionRepository.countByExpiresAtAfter(LocalDateTime.now());
            details.put("activeSessions", activeSessions);
            
            // Update metrics
            customMetricsService.updateActiveSessionsCount(activeSessions);
            
            // Check total users
            long totalUsers = userRepository.count();
            details.put("totalUsers", totalUsers);
            customMetricsService.updateTotalUsersCount(totalUsers);
            
            // Check total credentials (non-deleted)
            long totalCredentials = vaultRepository.countByDeletedAtIsNull();
            details.put("totalCredentials", totalCredentials);
            customMetricsService.updateTotalCredentialsCount(totalCredentials);
            
            // Check recent activity (users who logged in within last 24 hours)
            LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
            long recentActiveUsers = userRepository.countByLastLoginAtAfter(yesterday);
            details.put("recentActiveUsers", recentActiveUsers);
            
            // Calculate activity ratio
            double activityRatio = totalUsers > 0 ? (double) recentActiveUsers / totalUsers : 0.0;
            details.put("activityRatio", String.format("%.2f%%", activityRatio * 100));
            
            // Check for any concerning metrics
            boolean isHealthy = true;
            StringBuilder healthIssues = new StringBuilder();
            
            // Too many active sessions might indicate a problem
            if (activeSessions > 1000) {
                isHealthy = false;
                healthIssues.append("High number of active sessions (").append(activeSessions).append("); ");
            }
            
            // Very low activity might indicate an issue
            if (totalUsers > 10 && activityRatio < 0.01) { // Less than 1% activity
                healthIssues.append("Very low user activity (").append(String.format("%.2f%%", activityRatio * 100)).append("); ");
            }
            
            details.put("timestamp", LocalDateTime.now().toString());
            
            if (isHealthy) {
                return Health.up()
                        .withDetails(details)
                        .build();
            } else {
                return Health.down()
                        .withDetail("reason", healthIssues.toString().trim())
                        .withDetails(details)
                        .build();
            }
            
        } catch (Exception e) {
            log.error("Application health check failed", e);
            return Health.down()
                    .withDetail("reason", "Failed to retrieve application metrics")
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}