package com.passwordmanager.backend.config;

import io.github.bucket4j.distributed.proxy.ProxyManager;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

import static org.mockito.Mockito.mock;

/**
 * Test configuration that provides mock beans for Redis and rate limiting.
 * This allows tests to run without requiring actual Redis or Bucket4j infrastructure.
 */
@TestConfiguration
public class TestConfig {

    /**
     * Provides a mock RedisConnectionFactory for tests.
     * This prevents tests from trying to connect to a real Redis instance.
     */
    @Bean
    @Primary
    public RedisConnectionFactory redisConnectionFactory() {
        return mock(RedisConnectionFactory.class);
    }

    /**
     * Provides a mock RedisTemplate for tests.
     * This prevents tests from requiring actual Redis operations.
     */
    @Bean
    @Primary
    public org.springframework.data.redis.core.RedisTemplate<String, Object> redisTemplate() {
        return mock(org.springframework.data.redis.core.RedisTemplate.class);
    }

    /**
     * Provides a mock ProxyManager for Bucket4j rate limiting in tests.
     * This prevents tests from requiring actual distributed rate limiting infrastructure.
     */
    @Bean
    @Primary
    public ProxyManager<String> proxyManager() {
        return mock(ProxyManager.class);
    }

    /**
     * Provides a simple in-memory cache manager for tests.
     * Uses ConcurrentMapCacheManager for simple test caching.
     */
    @Bean
    @Primary
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager();
    }

    /**
     * Provides a RestTemplate for tests.
     * Configured with reasonable timeouts for external API calls.
     */
    @Bean
    @Primary
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }
}
