package com.passwordmanager.backend.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * Service for tracking cache hit/miss metrics.
 * Provides counters for monitoring cache effectiveness.
 */
@Service
public class CacheMetricsService {

    private final Map<String, Counter> hitCounters = new ConcurrentHashMap<>();
    private final Map<String, Counter> missCounters = new ConcurrentHashMap<>();
    private final MeterRegistry meterRegistry;

    public CacheMetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    /**
     * Records a cache hit for the specified cache name.
     * 
     * @param cacheName Name of the cache
     */
    public void recordCacheHit(String cacheName) {
        getHitCounter(cacheName).increment();
    }

    /**
     * Records a cache miss for the specified cache name.
     * 
     * @param cacheName Name of the cache
     */
    public void recordCacheMiss(String cacheName) {
        getMissCounter(cacheName).increment();
    }

    /**
     * Gets or creates a hit counter for the specified cache.
     * 
     * @param cacheName Name of the cache
     * @return Counter for cache hits
     */
    private Counter getHitCounter(String cacheName) {
        return hitCounters.computeIfAbsent(cacheName, name ->
                Counter.builder("cache.hits")
                        .tag("cache", name)
                        .description("Number of cache hits for " + name)
                        .register(meterRegistry));
    }

    /**
     * Gets or creates a miss counter for the specified cache.
     * 
     * @param cacheName Name of the cache
     * @return Counter for cache misses
     */
    private Counter getMissCounter(String cacheName) {
        return missCounters.computeIfAbsent(cacheName, name ->
                Counter.builder("cache.misses")
                        .tag("cache", name)
                        .description("Number of cache misses for " + name)
                        .register(meterRegistry));
    }

    /**
     * Gets the total number of hits for a cache.
     * 
     * @param cacheName Name of the cache
     * @return Total hit count
     */
    public double getHitCount(String cacheName) {
        Counter counter = hitCounters.get(cacheName);
        return counter != null ? counter.count() : 0.0;
    }

    /**
     * Gets the total number of misses for a cache.
     * 
     * @param cacheName Name of the cache
     * @return Total miss count
     */
    public double getMissCount(String cacheName) {
        Counter counter = missCounters.get(cacheName);
        return counter != null ? counter.count() : 0.0;
    }

    /**
     * Calculates the hit rate for a cache.
     * 
     * @param cacheName Name of the cache
     * @return Hit rate as a percentage (0-100)
     */
    public double getHitRate(String cacheName) {
        double hits = getHitCount(cacheName);
        double misses = getMissCount(cacheName);
        double total = hits + misses;
        return total > 0 ? (hits / total) * 100 : 0.0;
    }
}
