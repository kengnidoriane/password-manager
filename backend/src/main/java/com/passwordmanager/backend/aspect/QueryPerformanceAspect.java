package com.passwordmanager.backend.aspect;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Aspect for monitoring query performance and logging slow queries.
 * 
 * Logs warnings for queries that exceed performance thresholds:
 * - Queries > 500ms: WARNING
 * - Queries > 1000ms: ERROR
 * 
 * Also records metrics for all repository method executions.
 * 
 * Requirements: All (performance monitoring)
 */
@Aspect
@Component
public class QueryPerformanceAspect {

    private static final Logger logger = LoggerFactory.getLogger(QueryPerformanceAspect.class);
    
    private static final long SLOW_QUERY_THRESHOLD_MS = 500;
    private static final long VERY_SLOW_QUERY_THRESHOLD_MS = 1000;
    
    private final MeterRegistry meterRegistry;

    public QueryPerformanceAspect(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    /**
     * Monitor all repository method executions for performance.
     */
    @Around("execution(* com.passwordmanager.backend.repository..*(..))")
    public Object monitorQueryPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().toShortString();
        long startTime = System.nanoTime();
        
        Timer.Sample sample = Timer.start(meterRegistry);
        
        try {
            Object result = joinPoint.proceed();
            
            long executionTime = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startTime);
            
            // Record metrics
            sample.stop(Timer.builder("repository.query.duration")
                    .tag("method", methodName)
                    .tag("repository", getRepositoryName(joinPoint))
                    .register(meterRegistry));

            
            // Log slow queries
            if (executionTime >= VERY_SLOW_QUERY_THRESHOLD_MS) {
                logger.error("VERY SLOW QUERY detected: {} took {}ms", methodName, executionTime);
            } else if (executionTime >= SLOW_QUERY_THRESHOLD_MS) {
                logger.warn("SLOW QUERY detected: {} took {}ms", methodName, executionTime);
            } else {
                logger.debug("Query executed: {} took {}ms", methodName, executionTime);
            }
            
            return result;
            
        } catch (Throwable throwable) {
            sample.stop(Timer.builder("repository.query.duration")
                    .tag("method", methodName)
                    .tag("repository", getRepositoryName(joinPoint))
                    .tag("exception", throwable.getClass().getSimpleName())
                    .register(meterRegistry));
            
            logger.error("Query failed: {} - {}", methodName, throwable.getMessage());
            throw throwable;
        }
    }
    
    /**
     * Extract repository name from join point.
     */
    private String getRepositoryName(ProceedingJoinPoint joinPoint) {
        String className = joinPoint.getSignature().getDeclaringTypeName();
        int lastDot = className.lastIndexOf('.');
        return lastDot >= 0 ? className.substring(lastDot + 1) : className;
    }
}
