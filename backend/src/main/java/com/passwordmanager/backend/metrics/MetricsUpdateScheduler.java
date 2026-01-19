package com.passwordmanager.backend.metrics;

import com.passwordmanager.backend.repository.SessionRepository;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Scheduled task to update gauge metrics periodically.
 * Updates metrics like active sessions, total users, and total credentials.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MetricsUpdateScheduler {

    private final CustomMetricsService metricsService;
    private final UserRepository userRepository;
    private final VaultRepository vaultRepository;
    private final SessionRepository sessionRepository;

    /**
     * Updates gauge metrics every 30 seconds
     */
    @Scheduled(fixedRate = 30000) // 30 seconds
    public void updateGaugeMetrics() {
        try {
            // Update active sessions count
            long activeSessions = sessionRepository.countByExpiresAtAfter(LocalDateTime.now());
            metricsService.updateActiveSessionsCount(activeSessions);

            // Update total users count
            long totalUsers = userRepository.count();
            metricsService.updateTotalUsersCount(totalUsers);

            // Update total credentials count
            long totalCredentials = vaultRepository.countByDeletedAtIsNull();
            metricsService.updateTotalCredentialsCount(totalCredentials);

            log.debug("Updated gauge metrics - Active sessions: {}, Total users: {}, Total credentials: {}", 
                     activeSessions, totalUsers, totalCredentials);

        } catch (Exception e) {
            log.error("Error updating gauge metrics", e);
        }
    }
}