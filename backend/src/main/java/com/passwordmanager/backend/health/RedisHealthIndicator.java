package com.passwordmanager.backend.health;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

/**
 * Custom health indicator for Redis connectivity and performance.
 * Checks Redis connection, response time, and memory usage.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RedisHealthIndicator implements HealthIndicator {

    private final RedisConnectionFactory redisConnectionFactory;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public Health health() {
        try {
            long startTime = System.currentTimeMillis();
            
            // Test basic connectivity with ping
            try (RedisConnection connection = redisConnectionFactory.getConnection()) {
                String pong = connection.ping();
                long responseTime = System.currentTimeMillis() - startTime;
                
                if ("PONG".equals(pong)) {
                    Map<String, Object> details = new HashMap<>();
                    details.put("responseTime", responseTime + "ms");
                    
                    // Get Redis server information
                    try {
                        addRedisStatistics(connection, details);
                    } catch (Exception e) {
                        log.warn("Failed to retrieve Redis statistics: {}", e.getMessage());
                        details.put("statisticsError", e.getMessage());
                    }
                    
                    // Check if response time is acceptable (< 500ms)
                    if (responseTime < 500) {
                        return Health.up()
                                .withDetails(details)
                                .build();
                    } else {
                        return Health.down()
                                .withDetail("reason", "Redis response time too high: " + responseTime + "ms")
                                .withDetails(details)
                                .build();
                    }
                } else {
                    return Health.down()
                            .withDetail("reason", "Redis ping failed, expected PONG but got: " + pong)
                            .build();
                }
            }
            
        } catch (Exception e) {
            log.error("Redis health check failed", e);
            return Health.down()
                    .withDetail("reason", "Redis connection failed")
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }

    private void addRedisStatistics(RedisConnection connection, Map<String, Object> details) {
        try {
            Properties info = connection.info();
            
            if (info != null) {
                // Redis version
                String version = info.getProperty("redis_version");
                if (version != null) {
                    details.put("version", version);
                }
                
                // Memory usage
                String usedMemory = info.getProperty("used_memory_human");
                if (usedMemory != null) {
                    details.put("usedMemory", usedMemory);
                }
                
                // Connected clients
                String connectedClients = info.getProperty("connected_clients");
                if (connectedClients != null) {
                    details.put("connectedClients", connectedClients);
                }
                
                // Uptime
                String uptimeInSeconds = info.getProperty("uptime_in_seconds");
                if (uptimeInSeconds != null) {
                    long uptime = Long.parseLong(uptimeInSeconds);
                    details.put("uptimeHours", uptime / 3600);
                }
                
                // Role (master/slave)
                String role = info.getProperty("role");
                if (role != null) {
                    details.put("role", role);
                }
            }
            
            // Test session storage functionality
            try {
                String testKey = "health-check-" + System.currentTimeMillis();
                redisTemplate.opsForValue().set(testKey, "test-value");
                String retrievedValue = (String) redisTemplate.opsForValue().get(testKey);
                redisTemplate.delete(testKey);
                
                details.put("sessionStorageTest", "test-value".equals(retrievedValue) ? "PASS" : "FAIL");
            } catch (Exception e) {
                details.put("sessionStorageTest", "FAIL - " + e.getMessage());
            }
            
        } catch (Exception e) {
            log.debug("Could not retrieve some Redis statistics: {}", e.getMessage());
            details.put("statisticsPartial", true);
        }
    }
}