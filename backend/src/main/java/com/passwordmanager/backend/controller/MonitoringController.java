package com.passwordmanager.backend.controller;

import com.passwordmanager.backend.entity.AuditLog.AuditAction;
import com.passwordmanager.backend.repository.AuditLogRepository;
import com.passwordmanager.backend.repository.SessionRepository;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for monitoring and observability endpoints.
 * Provides application-specific metrics and monitoring data.
 * 
 * Note: These endpoints are secured and should only be accessible to administrators
 * or monitoring systems with proper authentication.
 */
@RestController
@RequestMapping("/api/v1/monitoring")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Monitoring", description = "Application monitoring and metrics endpoints")
public class MonitoringController {

    private final UserRepository userRepository;
    private final VaultRepository vaultRepository;
    private final SessionRepository sessionRepository;
    private final AuditLogRepository auditLogRepository;
    private final MeterRegistry meterRegistry;

    /**
     * Get application metrics summary.
     * 
     * @return Application metrics and statistics
     */
    @GetMapping("/metrics")
    @Operation(
            summary = "Get application metrics",
            description = "Returns comprehensive application metrics including user activity, vault statistics, and system health",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Metrics retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getApplicationMetrics() {
        try {
            Map<String, Object> metrics = new HashMap<>();
            
            // User metrics
            Map<String, Object> userMetrics = new HashMap<>();
            userMetrics.put("totalUsers", userRepository.count());
            userMetrics.put("recentActiveUsers", userRepository.countByLastLoginAtAfter(LocalDateTime.now().minusDays(1)));
            userMetrics.put("weeklyActiveUsers", userRepository.countByLastLoginAtAfter(LocalDateTime.now().minusDays(7)));
            userMetrics.put("monthlyActiveUsers", userRepository.countByLastLoginAtAfter(LocalDateTime.now().minusDays(30)));
            userMetrics.put("usersWithTwoFactor", userRepository.countByTwoFactorEnabledTrue());
            metrics.put("users", userMetrics);
            
            // Vault metrics
            Map<String, Object> vaultMetrics = new HashMap<>();
            vaultMetrics.put("totalCredentials", vaultRepository.countByDeletedAtIsNull());
            vaultMetrics.put("deletedCredentials", vaultRepository.count() - vaultRepository.countByDeletedAtIsNull());
            vaultMetrics.put("recentCredentials", vaultRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(7)));
            metrics.put("vault", vaultMetrics);
            
            // Session metrics
            Map<String, Object> sessionMetrics = new HashMap<>();
            sessionMetrics.put("activeSessions", sessionRepository.countByExpiresAtAfter(LocalDateTime.now()));
            sessionMetrics.put("totalSessions", sessionRepository.count());
            sessionMetrics.put("recentSessions", sessionRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(1)));
            metrics.put("sessions", sessionMetrics);
            
            // Audit metrics
            Map<String, Object> auditMetrics = new HashMap<>();
            auditMetrics.put("totalAuditLogs", auditLogRepository.count());
            auditMetrics.put("recentAuditLogs", auditLogRepository.countByTimestampAfter(LocalDateTime.now().minusDays(1)));
            auditMetrics.put("failedLogins", auditLogRepository.countByActionAndTimestampAfter(AuditAction.LOGIN_FAILED, LocalDateTime.now().minusDays(1)));
            auditMetrics.put("successfulLogins", auditLogRepository.countByActionAndTimestampAfter(AuditAction.LOGIN, LocalDateTime.now().minusDays(1)));
            metrics.put("audit", auditMetrics);
            
            // System metrics from Micrometer
            Map<String, Object> systemMetrics = new HashMap<>();
            systemMetrics.put("jvmMemoryUsed", getMetricValue("jvm.memory.used"));
            systemMetrics.put("jvmMemoryMax", getMetricValue("jvm.memory.max"));
            systemMetrics.put("systemCpuUsage", getMetricValue("system.cpu.usage"));
            systemMetrics.put("processCpuUsage", getMetricValue("process.cpu.usage"));
            systemMetrics.put("httpRequestsTotal", getMetricValue("http.server.requests"));
            metrics.put("system", systemMetrics);
            
            metrics.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(metrics);
            
        } catch (Exception e) {
            log.error("Error retrieving application metrics", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to retrieve metrics", "timestamp", LocalDateTime.now()));
        }
    }

    /**
     * Get security-related metrics.
     * 
     * @return Security metrics and alerts
     */
    @GetMapping("/security")
    @Operation(
            summary = "Get security metrics",
            description = "Returns security-related metrics including failed login attempts, suspicious activities, and security alerts",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Security metrics retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSecurityMetrics() {
        try {
            Map<String, Object> securityMetrics = new HashMap<>();
            
            LocalDateTime last24Hours = LocalDateTime.now().minusDays(1);
            LocalDateTime lastWeek = LocalDateTime.now().minusDays(7);
            
            // Authentication security metrics
            Map<String, Object> authMetrics = new HashMap<>();
            authMetrics.put("failedLogins24h", auditLogRepository.countByActionAndTimestampAfter(AuditAction.LOGIN_FAILED, last24Hours));
            authMetrics.put("failedLoginsWeek", auditLogRepository.countByActionAndTimestampAfter(AuditAction.LOGIN_FAILED, lastWeek));
            authMetrics.put("successfulLogins24h", auditLogRepository.countByActionAndTimestampAfter(AuditAction.LOGIN, last24Hours));
            authMetrics.put("accountLockouts24h", auditLogRepository.countByActionAndTimestampAfter(AuditAction.LOGIN_FAILED, last24Hours));
            authMetrics.put("recoveryAttempts24h", auditLogRepository.countByActionAndTimestampAfter(AuditAction.ACCOUNT_RECOVERY, last24Hours));
            securityMetrics.put("authentication", authMetrics);
            
            // Vault security metrics
            Map<String, Object> vaultSecurityMetrics = new HashMap<>();
            vaultSecurityMetrics.put("vaultAccess24h", auditLogRepository.countByActionAndTimestampAfter(AuditAction.CREDENTIAL_READ, last24Hours));
            vaultSecurityMetrics.put("credentialExports24h", auditLogRepository.countByActionAndTimestampAfter(AuditAction.VAULT_EXPORT, last24Hours));
            vaultSecurityMetrics.put("credentialImports24h", auditLogRepository.countByActionAndTimestampAfter(AuditAction.VAULT_IMPORT, last24Hours));
            vaultSecurityMetrics.put("suspiciousActivities24h", auditLogRepository.countByActionAndTimestampAfter(AuditAction.LOGIN_FAILED, last24Hours));
            securityMetrics.put("vault", vaultSecurityMetrics);
            
            // System security metrics
            Map<String, Object> systemSecurityMetrics = new HashMap<>();
            systemSecurityMetrics.put("rateLimitHits", getMetricValue("auth.rate.limit.hits"));
            systemSecurityMetrics.put("invalidTokens", getMetricValue("auth.invalid.tokens"));
            systemSecurityMetrics.put("corsViolations", getMetricValue("security.cors.violations"));
            securityMetrics.put("system", systemSecurityMetrics);
            
            securityMetrics.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(securityMetrics);
            
        } catch (Exception e) {
            log.error("Error retrieving security metrics", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to retrieve security metrics", "timestamp", LocalDateTime.now()));
        }
    }

    /**
     * Get performance metrics.
     * 
     * @return Performance metrics and statistics
     */
    @GetMapping("/performance")
    @Operation(
            summary = "Get performance metrics",
            description = "Returns performance-related metrics including response times, throughput, and resource utilization",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Performance metrics retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - Authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getPerformanceMetrics() {
        try {
            Map<String, Object> performanceMetrics = new HashMap<>();
            
            // HTTP performance metrics
            Map<String, Object> httpMetrics = new HashMap<>();
            httpMetrics.put("requestsPerSecond", getMetricValue("http.server.requests.rate"));
            httpMetrics.put("averageResponseTime", getMetricValue("http.server.requests.mean"));
            httpMetrics.put("p95ResponseTime", getMetricValue("http.server.requests.percentile.95"));
            httpMetrics.put("p99ResponseTime", getMetricValue("http.server.requests.percentile.99"));
            performanceMetrics.put("http", httpMetrics);
            
            // Database performance metrics
            Map<String, Object> dbMetrics = new HashMap<>();
            dbMetrics.put("connectionPoolActive", getMetricValue("hikaricp.connections.active"));
            dbMetrics.put("connectionPoolIdle", getMetricValue("hikaricp.connections.idle"));
            dbMetrics.put("connectionPoolMax", getMetricValue("hikaricp.connections.max"));
            dbMetrics.put("connectionPoolMin", getMetricValue("hikaricp.connections.min"));
            dbMetrics.put("connectionAcquisitionTime", getMetricValue("hikaricp.connections.acquire"));
            performanceMetrics.put("database", dbMetrics);
            
            // Cache performance metrics
            Map<String, Object> cacheMetrics = new HashMap<>();
            cacheMetrics.put("redisConnections", getMetricValue("lettuce.command.completion"));
            cacheMetrics.put("cacheHitRate", getMetricValue("cache.gets.hit.rate"));
            cacheMetrics.put("cacheMissRate", getMetricValue("cache.gets.miss.rate"));
            performanceMetrics.put("cache", cacheMetrics);
            
            // JVM performance metrics
            Map<String, Object> jvmMetrics = new HashMap<>();
            jvmMetrics.put("heapUsed", getMetricValue("jvm.memory.used.heap"));
            jvmMetrics.put("heapMax", getMetricValue("jvm.memory.max.heap"));
            jvmMetrics.put("nonHeapUsed", getMetricValue("jvm.memory.used.nonheap"));
            jvmMetrics.put("gcPauseTime", getMetricValue("jvm.gc.pause.mean"));
            jvmMetrics.put("threadsActive", getMetricValue("jvm.threads.live"));
            performanceMetrics.put("jvm", jvmMetrics);
            
            performanceMetrics.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(performanceMetrics);
            
        } catch (Exception e) {
            log.error("Error retrieving performance metrics", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to retrieve performance metrics", "timestamp", LocalDateTime.now()));
        }
    }

    /**
     * Helper method to safely get metric values from MeterRegistry.
     * 
     * @param metricName Name of the metric
     * @return Metric value or null if not found
     */
    private Double getMetricValue(String metricName) {
        try {
            return meterRegistry.get(metricName).gauge().value();
        } catch (Exception e) {
            try {
                return meterRegistry.get(metricName).counter().count();
            } catch (Exception e2) {
                try {
                    return meterRegistry.get(metricName).timer().mean(java.util.concurrent.TimeUnit.MILLISECONDS);
                } catch (Exception e3) {
                    log.debug("Metric not found or not accessible: {}", metricName);
                    return null;
                }
            }
        }
    }
}

/**
 * Custom Actuator endpoint for application-specific monitoring data.
 * This endpoint is automatically exposed through Spring Boot Actuator.
 */
@Endpoint(id = "password-manager")
class PasswordManagerEndpoint {

    private final UserRepository userRepository;
    private final VaultRepository vaultRepository;
    private final SessionRepository sessionRepository;

    public PasswordManagerEndpoint(UserRepository userRepository,
                                 VaultRepository vaultRepository,
                                 SessionRepository sessionRepository) {
        this.userRepository = userRepository;
        this.vaultRepository = vaultRepository;
        this.sessionRepository = sessionRepository;
    }

    @ReadOperation
    public Map<String, Object> passwordManagerInfo() {
        Map<String, Object> info = new HashMap<>();
        
        try {
            info.put("totalUsers", userRepository.count());
            info.put("totalCredentials", vaultRepository.countByDeletedAtIsNull());
            info.put("activeSessions", sessionRepository.countByExpiresAtAfter(LocalDateTime.now()));
            info.put("status", "operational");
            info.put("timestamp", LocalDateTime.now());
        } catch (Exception e) {
            info.put("status", "error");
            info.put("error", e.getMessage());
            info.put("timestamp", LocalDateTime.now());
        }
        
        return info;
    }
}