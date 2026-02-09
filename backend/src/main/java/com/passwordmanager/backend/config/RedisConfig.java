package com.passwordmanager.backend.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Redis configuration for session management and caching.
 * Configures Redis templates and cache manager with proper serialization.
 */
@Configuration
@EnableCaching
public class RedisConfig {

    /**
     * Configures RedisTemplate with proper serialization for keys and values.
     * 
     * @param connectionFactory Redis connection factory
     * @return Configured RedisTemplate
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Use String serialization for keys
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        
        // Use JSON serialization for values
        GenericJackson2JsonRedisSerializer jsonSerializer = createJsonSerializer();
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        
        template.afterPropertiesSet();
        return template;
    }

    /**
     * Configures RedisCacheManager with multiple cache configurations for different use cases.
     * 
     * Cache configurations:
     * - sessions: 15 minutes TTL for user sessions
     * - vaultMetadata: 5 minutes TTL for vault metadata
     * - breachCheck: 24 hours TTL for breach check results
     * - securityReports: 1 hour TTL for security analysis reports
     * 
     * @param connectionFactory Redis connection factory
     * @return Configured RedisCacheManager with multiple cache configurations
     */
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Default cache configuration (5 minutes)
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                createJsonSerializer()))
                .disableCachingNullValues();

        // Session cache configuration (15 minutes)
        RedisCacheConfiguration sessionConfig = defaultConfig
                .entryTtl(Duration.ofMinutes(15));

        // Vault metadata cache configuration (5 minutes)
        RedisCacheConfiguration vaultMetadataConfig = defaultConfig
                .entryTtl(Duration.ofMinutes(5));

        // Breach check cache configuration (24 hours)
        RedisCacheConfiguration breachCheckConfig = defaultConfig
                .entryTtl(Duration.ofHours(24));

        // Security reports cache configuration (1 hour)
        RedisCacheConfiguration securityReportsConfig = defaultConfig
                .entryTtl(Duration.ofHours(1));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withCacheConfiguration("sessions", sessionConfig)
                .withCacheConfiguration("vaultMetadata", vaultMetadataConfig)
                .withCacheConfiguration("breachCheck", breachCheckConfig)
                .withCacheConfiguration("securityReports", securityReportsConfig)
                .build();
    }

    /**
     * Creates a JSON serializer with proper type handling for Redis.
     * 
     * @return Configured GenericJackson2JsonRedisSerializer
     */
    private GenericJackson2JsonRedisSerializer createJsonSerializer() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        
        // Enable polymorphic type handling for security
        objectMapper.activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder()
                        .allowIfBaseType(Object.class)
                        .build(),
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY);
        
        return new GenericJackson2JsonRedisSerializer(objectMapper);
    }

    /**
     * Configures RestTemplate for external API calls (e.g., breach check service).
     * 
     * @param builder RestTemplateBuilder
     * @return Configured RestTemplate
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }
}
