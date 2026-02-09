# Caching Strategy

This document describes the caching implementation for the Password Manager backend application.

## Overview

The application uses Redis as a distributed cache to improve performance and reduce database load. Multiple cache configurations are implemented with different TTL (Time To Live) values based on data volatility and access patterns.

## Cache Configurations

### 1. Sessions Cache
- **Cache Name**: `sessions`
- **TTL**: 15 minutes
- **Purpose**: Stores user session data
- **Implementation**: Managed directly by SessionService using RedisTemplate
- **Eviction**: Automatic on session timeout or manual logout

### 2. Vault Metadata Cache
- **Cache Name**: `vaultMetadata`
- **TTL**: 5 minutes
- **Purpose**: Caches vault credential lists and metadata
- **Implementation**: Spring Cache abstraction with `@Cacheable` annotation
- **Eviction**: Automatic on credential create/update/delete operations
- **Cache Key**: `{userId}:credentials`

### 3. Breach Check Cache
- **Cache Name**: `breachCheck`
- **TTL**: 24 hours
- **Purpose**: Caches password breach check results from Have I Been Pwned API
- **Implementation**: Spring Cache abstraction with `@Cacheable` annotation
- **Eviction**: Automatic after 24 hours
- **Cache Key**: Password string (for boolean check) or `count:{password}` (for count)
- **Note**: Uses k-anonymity protocol - only SHA-1 hash prefix is sent to API

### 4. Security Reports Cache
- **Cache Name**: `securityReports`
- **TTL**: 1 hour
- **Purpose**: Caches security analysis reports for user vaults
- **Implementation**: Spring Cache abstraction with `@Cacheable` annotation
- **Eviction**: Automatic on credential changes or after 1 hour
- **Cache Key**: `{userId}`

## Cache Invalidation Strategy

### Automatic Invalidation
- **Vault Metadata**: Evicted on any credential create, update, or delete operation
- **Security Reports**: Evicted on any credential create, update, or delete operation
- **Breach Check**: No manual eviction - relies on 24-hour TTL
- **Sessions**: Evicted on logout or session timeout

### Manual Invalidation
Cache can be manually cleared through:
- Application restart
- Redis CLI commands
- Future admin API endpoints (if implemented)

## Cache Metrics

The application tracks cache performance metrics using `CacheMetricsService`:

### Tracked Metrics
- **Cache Hits**: Number of successful cache retrievals
- **Cache Misses**: Number of cache misses requiring database/API calls
- **Hit Rate**: Percentage of requests served from cache

### Accessing Metrics
Metrics are exposed through:
- **Endpoint**: `GET /api/v1/monitoring/cache`
- **Authentication**: Requires admin role
- **Response Format**:
```json
{
  "vaultMetadata": {
    "hits": 150,
    "misses": 50,
    "hitRate": "75.00%"
  },
  "breachCheck": {
    "hits": 200,
    "misses": 25,
    "hitRate": "88.89%"
  },
  "securityReports": {
    "hits": 80,
    "misses": 20,
    "hitRate": "80.00%"
  },
  "timestamp": "2024-01-15T10:30:00"
}
```

## Implementation Details

### Spring Cache Configuration
Located in `RedisConfig.java`:
```java
@Bean
public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
    // Multiple cache configurations with different TTLs
    return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withCacheConfiguration("sessions", sessionConfig)
            .withCacheConfiguration("vaultMetadata", vaultMetadataConfig)
            .withCacheConfiguration("breachCheck", breachCheckConfig)
            .withCacheConfiguration("securityReports", securityReportsConfig)
            .build();
}
```

### Cache Annotations

#### @Cacheable
Used for read operations:
```java
@Cacheable(value = "vaultMetadata", key = "#userId + ':credentials'")
public List<CredentialResponse> getAllCredentials(UUID userId) {
    // Method implementation
}
```

#### @CacheEvict
Used for write operations:
```java
@CacheEvict(value = "vaultMetadata", key = "#userId + ':credentials'")
public void deleteCredential(UUID userId, UUID credentialId) {
    // Method implementation
}
```

#### @Caching
Used for multiple cache operations:
```java
@Caching(evict = {
    @CacheEvict(value = "vaultMetadata", key = "#userId + ':credentials'"),
    @CacheEvict(value = "securityReports", key = "#userId")
})
public CredentialResponse createCredential(UUID userId, CredentialRequest request) {
    // Method implementation
}
```

## Performance Benefits

### Expected Improvements
- **Vault Operations**: 5-10x faster for repeated credential list retrievals
- **Security Reports**: 10-20x faster for repeated security analysis
- **Breach Checks**: 100x+ faster for repeated password checks (avoids external API calls)
- **Database Load**: 50-70% reduction in read queries

### Trade-offs
- **Memory Usage**: Increased Redis memory consumption
- **Cache Consistency**: Potential for stale data within TTL window
- **Complexity**: Additional layer requiring monitoring and maintenance

## Monitoring and Troubleshooting

### Health Checks
Redis health is monitored through Spring Boot Actuator:
- **Endpoint**: `/actuator/health`
- **Component**: `redis`

### Common Issues

#### Cache Not Working
1. Check Redis connection: `redis-cli ping`
2. Verify cache configuration in application.yml
3. Check logs for cache-related errors
4. Verify `@EnableCaching` is present in configuration

#### Stale Data
1. Verify cache eviction is working correctly
2. Check TTL configuration
3. Consider reducing TTL for frequently changing data
4. Manually clear cache if needed

#### High Memory Usage
1. Monitor Redis memory: `redis-cli info memory`
2. Adjust TTL values to reduce retention
3. Implement cache size limits if needed
4. Consider eviction policies (LRU, LFU)

## Future Enhancements

### Potential Improvements
1. **Cache Warming**: Pre-populate cache on application startup
2. **Distributed Locking**: Prevent cache stampede on high-traffic operations
3. **Cache Compression**: Reduce memory usage for large cached objects
4. **Adaptive TTL**: Adjust TTL based on access patterns
5. **Cache Partitioning**: Separate hot and cold data
6. **Multi-level Caching**: Add local in-memory cache layer

### Monitoring Enhancements
1. **Grafana Dashboards**: Visualize cache metrics over time
2. **Alerting**: Alert on low hit rates or high miss rates
3. **Cache Size Tracking**: Monitor memory usage per cache
4. **Eviction Rate Tracking**: Track how often entries are evicted

## Configuration

### Application Properties
```yaml
spring:
  cache:
    type: redis
    redis:
      time-to-live: 300000  # Default 5 minutes
      cache-null-values: false
  
  data:
    redis:
      host: ${SPRING_REDIS_HOST:localhost}
      port: ${SPRING_REDIS_PORT:6379}
      password: ${SPRING_REDIS_PASSWORD:}
      timeout: 60000ms
```

### Environment Variables
- `SPRING_REDIS_HOST`: Redis server hostname
- `SPRING_REDIS_PORT`: Redis server port
- `SPRING_REDIS_PASSWORD`: Redis authentication password

## Testing

### Integration Tests
Cache behavior is tested in `CacheIntegrationTest.java`:
- Cache hit/miss verification
- Cache eviction on mutations
- Cache metrics tracking
- Multiple cache configuration validation

### Manual Testing
1. **Test Cache Hit**:
   ```bash
   # First call - cache miss
   curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/vault
   
   # Second call - cache hit (should be faster)
   curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/vault
   ```

2. **Test Cache Eviction**:
   ```bash
   # Populate cache
   curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/vault
   
   # Create credential (should evict cache)
   curl -X POST -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"encryptedData":"...","iv":"...","authTag":"..."}' \
        http://localhost:8080/api/v1/vault/credential
   
   # Next call should be cache miss
   curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/vault
   ```

3. **Check Cache Metrics**:
   ```bash
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
        http://localhost:8080/api/v1/monitoring/cache
   ```

## References

- [Spring Cache Abstraction](https://docs.spring.io/spring-framework/docs/current/reference/html/integration.html#cache)
- [Redis Caching Best Practices](https://redis.io/docs/manual/patterns/caching/)
- [Spring Data Redis](https://spring.io/projects/spring-data-redis)
