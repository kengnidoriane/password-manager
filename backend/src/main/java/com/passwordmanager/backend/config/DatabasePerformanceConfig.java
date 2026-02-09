package com.passwordmanager.backend.config;

import com.zaxxer.hikari.HikariDataSource;
import io.micrometer.core.instrument.MeterRegistry;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Configuration for database performance monitoring and optimization.
 * 
 * Provides:
 * - HikariCP connection pool monitoring
 * - Hibernate statistics collection
 * - Query performance metrics
 * - Scheduled statistics reporting
 * 
 * Requirements: All (performance)
 */
@Configuration
@EnableAspectJAutoProxy
@EnableScheduling
public class DatabasePerformanceConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabasePerformanceConfig.class);
    
    private final EntityManagerFactory entityManagerFactory;
    private final HikariDataSource dataSource;
    private final MeterRegistry meterRegistry;

    public DatabasePerformanceConfig(
            EntityManagerFactory entityManagerFactory,
            HikariDataSource dataSource,
            MeterRegistry meterRegistry) {
        this.entityManagerFactory = entityManagerFactory;
        this.dataSource = dataSource;
        this.meterRegistry = meterRegistry;
    }

    @PostConstruct
    public void init() {
        // Enable Hibernate statistics
        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        Statistics statistics = sessionFactory.getStatistics();
        statistics.setStatisticsEnabled(true);
        
        logger.info("Database performance monitoring initialized");
        logger.info("HikariCP pool name: {}", dataSource.getPoolName());
        logger.info("Maximum pool size: {}", dataSource.getMaximumPoolSize());
        logger.info("Minimum idle connections: {}", dataSource.getMinimumIdle());
    }


    /**
     * Scheduled task to log Hibernate statistics every 5 minutes.
     * Only runs in dev and staging profiles.
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @ConditionalOnProperty(name = "spring.profiles.active", havingValue = "dev", matchIfMissing = true)
    public void logHibernateStatistics() {
        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        Statistics stats = sessionFactory.getStatistics();
        
        if (!stats.isStatisticsEnabled()) {
            return;
        }
        
        logger.info("=== Hibernate Statistics ===");
        logger.info("Query execution count: {}", stats.getQueryExecutionCount());
        logger.info("Query cache hit count: {}", stats.getQueryCacheHitCount());
        logger.info("Query cache miss count: {}", stats.getQueryCacheMissCount());
        logger.info("Second level cache hit count: {}", stats.getSecondLevelCacheHitCount());
        logger.info("Second level cache miss count: {}", stats.getSecondLevelCacheMissCount());
        logger.info("Session open count: {}", stats.getSessionOpenCount());
        logger.info("Session close count: {}", stats.getSessionCloseCount());
        logger.info("Transaction count: {}", stats.getTransactionCount());
        logger.info("Successful transaction count: {}", stats.getSuccessfulTransactionCount());
        logger.info("Optimistic lock failure count: {}", stats.getOptimisticFailureCount());
        
        // Record metrics
        meterRegistry.gauge("hibernate.query.execution.count", stats.getQueryExecutionCount());
        meterRegistry.gauge("hibernate.query.cache.hit.count", stats.getQueryCacheHitCount());
        meterRegistry.gauge("hibernate.query.cache.miss.count", stats.getQueryCacheMissCount());
        meterRegistry.gauge("hibernate.transaction.count", stats.getTransactionCount());
    }
    
    /**
     * Scheduled task to log HikariCP pool statistics every 5 minutes.
     * Only runs in dev and staging profiles.
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @ConditionalOnProperty(name = "spring.profiles.active", havingValue = "dev", matchIfMissing = true)
    public void logHikariStatistics() {
        logger.info("=== HikariCP Pool Statistics ===");
        logger.info("Active connections: {}", dataSource.getHikariPoolMXBean().getActiveConnections());
        logger.info("Idle connections: {}", dataSource.getHikariPoolMXBean().getIdleConnections());
        logger.info("Total connections: {}", dataSource.getHikariPoolMXBean().getTotalConnections());
        logger.info("Threads awaiting connection: {}", dataSource.getHikariPoolMXBean().getThreadsAwaitingConnection());
        
        // Record metrics
        meterRegistry.gauge("hikari.connections.active", dataSource.getHikariPoolMXBean().getActiveConnections());
        meterRegistry.gauge("hikari.connections.idle", dataSource.getHikariPoolMXBean().getIdleConnections());
        meterRegistry.gauge("hikari.connections.total", dataSource.getHikariPoolMXBean().getTotalConnections());
        meterRegistry.gauge("hikari.connections.awaiting", dataSource.getHikariPoolMXBean().getThreadsAwaitingConnection());
    }
}
