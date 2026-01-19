package com.passwordmanager.backend.health;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Custom health indicator for database connectivity and performance.
 * Checks database connection, response time, and basic statistics.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseHealthIndicator implements HealthIndicator {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public Health health() {
        try {
            long startTime = System.currentTimeMillis();
            
            // Test basic connectivity
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            
            long responseTime = System.currentTimeMillis() - startTime;
            
            if (result != null && result == 1) {
                Map<String, Object> details = new HashMap<>();
                details.put("database", "PostgreSQL");
                details.put("responseTime", responseTime + "ms");
                
                // Get additional database statistics
                try {
                    addDatabaseStatistics(details);
                } catch (Exception e) {
                    log.warn("Failed to retrieve database statistics: {}", e.getMessage());
                    details.put("statisticsError", e.getMessage());
                }
                
                // Check if response time is acceptable (< 1000ms)
                if (responseTime < 1000) {
                    return Health.up()
                            .withDetails(details)
                            .build();
                } else {
                    return Health.down()
                            .withDetail("reason", "Database response time too high: " + responseTime + "ms")
                            .withDetails(details)
                            .build();
                }
            } else {
                return Health.down()
                        .withDetail("reason", "Database connectivity test failed")
                        .build();
            }
            
        } catch (DataAccessException e) {
            log.error("Database health check failed", e);
            return Health.down()
                    .withDetail("reason", "Database connection failed")
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }

    private void addDatabaseStatistics(Map<String, Object> details) {
        try {
            // Get database version
            String version = jdbcTemplate.queryForObject(
                    "SELECT version()", String.class);
            if (version != null) {
                details.put("version", version.split(" ")[1]); // Extract version number
            }
            
            // Get connection count
            Integer connections = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM pg_stat_activity", Integer.class);
            details.put("activeConnections", connections);
            
            // Get database size (in MB)
            Long dbSize = jdbcTemplate.queryForObject(
                    "SELECT pg_database_size(current_database()) / 1024 / 1024", Long.class);
            details.put("databaseSizeMB", dbSize);
            
            // Check if we can access main tables
            Integer userCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM users", Integer.class);
            details.put("totalUsers", userCount);
            
            Integer vaultEntryCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM vault_entries WHERE deleted_at IS NULL", Integer.class);
            details.put("totalCredentials", vaultEntryCount);
            
        } catch (Exception e) {
            log.debug("Could not retrieve some database statistics: {}", e.getMessage());
            details.put("statisticsPartial", true);
        }
    }
}