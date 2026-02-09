package com.passwordmanager.backend.config;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.Duration;

/**
 * Configuration for Bucket4j rate limiting with Redis backend.
 * 
 * This configuration sets up distributed rate limiting using Redis
 * to ensure rate limits work across multiple application instances.
 * Only active in non-test profiles.
 */
@Configuration
@Profile("!test")
public class RateLimitConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    /**
     * Creates a Lettuce-based proxy manager for Bucket4j.
     * This enables distributed rate limiting across multiple application instances.
     */
    @Bean
    public LettuceBasedProxyManager<String> lettuceBasedProxyManager() {
        // Build Redis URI
        String redisUri = "redis://";
        if (redisPassword != null && !redisPassword.isEmpty()) {
            redisUri += ":" + redisPassword + "@";
        }
        redisUri += redisHost + ":" + redisPort;

        // Create Redis client
        RedisClient redisClient = RedisClient.create(redisUri);
        
        // Create connection with String keys and byte array values
        StatefulRedisConnection<String, byte[]> connection = 
            redisClient.connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));

        // Create proxy manager with expiration strategy
        return LettuceBasedProxyManager.builderFor(connection)
            .withExpirationStrategy(
                ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(
                    Duration.ofHours(1) // Buckets expire 1 hour after last refill
                )
            )
            .build();
    }
}
