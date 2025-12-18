package com.passwordmanager.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Service for advanced rate limiting using Redis.
 * 
 * This service provides Redis-based rate limiting for:
 * - Authentication attempts
 * - Registration attempts
 * - API endpoints
 * 
 * Requirements: 2.4
 */
@Service
public class RateLimitingService {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitingService.class);

    private final RedisTemplate<String, Object> redisTemplate;
    private final AuditLogService auditLogService;

    // Rate limiting configurations
    private static final int LOGIN_ATTEMPTS_PER_MINUTE = 5;
    private static final int LOGIN_ATTEMPTS_PER_HOUR = 20;
    private static final int REGISTRATION_ATTEMPTS_PER_HOUR = 3;
    private static final int API_REQUESTS_PER_MINUTE = 100;

    // Redis key prefixes
    private static final String LOGIN_RATE_LIMIT_PREFIX = "rate_limit:login:";
    private static final String REGISTRATION_RATE_LIMIT_PREFIX = "rate_limit:registration:";
    private static final String API_RATE_LIMIT_PREFIX = "rate_limit:api:";

    public RateLimitingService(RedisTemplate<String, Object> redisTemplate,
                              AuditLogService auditLogService) {
        this.redisTemplate = redisTemplate;
        this.auditLogService = auditLogService;
        logger.info("Redis-based rate limiting service initialized successfully");
    }

    /**
     * Checks if login attempt is allowed for the given email and IP combination.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @return true if allowed, false if rate limited
     */
    public boolean isLoginAttemptAllowed(String email, String ipAddress) {
        String minuteKey = LOGIN_RATE_LIMIT_PREFIX + "minute:" + email + ":" + ipAddress;
        String hourKey = LOGIN_RATE_LIMIT_PREFIX + "hour:" + email + ":" + ipAddress;
        
        try {
            // Check minute-based rate limit
            Integer minuteAttempts = (Integer) redisTemplate.opsForValue().get(minuteKey);
            if (minuteAttempts != null && minuteAttempts >= LOGIN_ATTEMPTS_PER_MINUTE) {
                long remainingTime = redisTemplate.getExpire(minuteKey, TimeUnit.SECONDS);
                auditLogService.logRateLimitExceeded(email, ipAddress, "LOGIN_MINUTE", remainingTime);
                logger.warn("Login minute rate limit exceeded for {} from {} - remaining time: {}s", 
                           email, ipAddress, remainingTime);
                return false;
            }
            
            // Check hour-based rate limit
            Integer hourAttempts = (Integer) redisTemplate.opsForValue().get(hourKey);
            if (hourAttempts != null && hourAttempts >= LOGIN_ATTEMPTS_PER_HOUR) {
                long remainingTime = redisTemplate.getExpire(hourKey, TimeUnit.SECONDS);
                auditLogService.logRateLimitExceeded(email, ipAddress, "LOGIN_HOUR", remainingTime);
                logger.warn("Login hour rate limit exceeded for {} from {} - remaining time: {}s", 
                           email, ipAddress, remainingTime);
                return false;
            }
            
            // Increment counters
            redisTemplate.opsForValue().increment(minuteKey);
            redisTemplate.expire(minuteKey, 1, TimeUnit.MINUTES);
            
            redisTemplate.opsForValue().increment(hourKey);
            redisTemplate.expire(hourKey, 1, TimeUnit.HOURS);
            
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to check login rate limit for {} from {}: {}", 
                        email, ipAddress, e.getMessage());
            return true; // Fail open for availability
        }
    }

    /**
     * Checks if registration attempt is allowed for the given IP address.
     * 
     * @param ipAddress Client IP address
     * @return true if allowed, false if rate limited
     */
    public boolean isRegistrationAttemptAllowed(String ipAddress) {
        String hourKey = REGISTRATION_RATE_LIMIT_PREFIX + "hour:" + ipAddress;
        
        try {
            Integer hourAttempts = (Integer) redisTemplate.opsForValue().get(hourKey);
            if (hourAttempts != null && hourAttempts >= REGISTRATION_ATTEMPTS_PER_HOUR) {
                long remainingTime = redisTemplate.getExpire(hourKey, TimeUnit.SECONDS);
                auditLogService.logRateLimitExceeded(null, ipAddress, "REGISTRATION", remainingTime);
                logger.warn("Registration rate limit exceeded from {} - remaining time: {}s", 
                           ipAddress, remainingTime);
                return false;
            }
            
            // Increment counter
            redisTemplate.opsForValue().increment(hourKey);
            redisTemplate.expire(hourKey, 1, TimeUnit.HOURS);
            
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to check registration rate limit for IP {}: {}", 
                        ipAddress, e.getMessage());
            return true; // Fail open for availability
        }
    }

    /**
     * Checks if API request is allowed for the given user and IP combination.
     * 
     * @param userId User ID (can be null for unauthenticated requests)
     * @param ipAddress Client IP address
     * @return true if allowed, false if rate limited
     */
    public boolean isApiRequestAllowed(String userId, String ipAddress) {
        String minuteKey = API_RATE_LIMIT_PREFIX + "minute:" + (userId != null ? userId : "anonymous") + ":" + ipAddress;
        
        try {
            Integer minuteAttempts = (Integer) redisTemplate.opsForValue().get(minuteKey);
            if (minuteAttempts != null && minuteAttempts >= API_REQUESTS_PER_MINUTE) {
                long remainingTime = redisTemplate.getExpire(minuteKey, TimeUnit.SECONDS);
                auditLogService.logRateLimitExceeded(userId, ipAddress, "API", remainingTime);
                logger.warn("API rate limit exceeded for {} from {} - remaining time: {}s", 
                           userId != null ? userId : "anonymous", ipAddress, remainingTime);
                return false;
            }
            
            // Increment counter
            redisTemplate.opsForValue().increment(minuteKey);
            redisTemplate.expire(minuteKey, 1, TimeUnit.MINUTES);
            
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to check API rate limit for {} from {}: {}", 
                        userId != null ? userId : "anonymous", ipAddress, e.getMessage());
            return true; // Fail open for availability
        }
    }

    /**
     * Gets the remaining time until rate limit resets for login attempts.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @return Remaining time in seconds
     */
    public long getLoginRateLimitResetTime(String email, String ipAddress) {
        String minuteKey = LOGIN_RATE_LIMIT_PREFIX + "minute:" + email + ":" + ipAddress;
        String hourKey = LOGIN_RATE_LIMIT_PREFIX + "hour:" + email + ":" + ipAddress;
        
        try {
            // Check which limit is active and return the longer remaining time
            long minuteRemaining = redisTemplate.getExpire(minuteKey, TimeUnit.SECONDS);
            long hourRemaining = redisTemplate.getExpire(hourKey, TimeUnit.SECONDS);
            
            return Math.max(minuteRemaining, hourRemaining);
        } catch (Exception e) {
            logger.error("Failed to get login rate limit reset time for {} from {}: {}", 
                        email, ipAddress, e.getMessage());
            return 0;
        }
    }

    /**
     * Manually resets rate limiting for a specific key (admin function).
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @param limitType Type of limit to reset (LOGIN, REGISTRATION, API)
     */
    public void resetRateLimit(String email, String ipAddress, String limitType) {
        try {
            switch (limitType.toUpperCase()) {
                case "LOGIN":
                    String loginMinuteKey = LOGIN_RATE_LIMIT_PREFIX + "minute:" + email + ":" + ipAddress;
                    String loginHourKey = LOGIN_RATE_LIMIT_PREFIX + "hour:" + email + ":" + ipAddress;
                    redisTemplate.delete(loginMinuteKey);
                    redisTemplate.delete(loginHourKey);
                    break;
                case "REGISTRATION":
                    String registrationKey = REGISTRATION_RATE_LIMIT_PREFIX + "hour:" + ipAddress;
                    redisTemplate.delete(registrationKey);
                    break;
                case "API":
                    String apiKey = API_RATE_LIMIT_PREFIX + "minute:" + (email != null ? email : "anonymous") + ":" + ipAddress;
                    redisTemplate.delete(apiKey);
                    break;
                default:
                    throw new IllegalArgumentException("Invalid limit type: " + limitType);
            }
            
            logger.info("Rate limit reset for {} - email: {}, IP: {}", limitType, email, ipAddress);
            
        } catch (Exception e) {
            logger.error("Failed to reset rate limit for {} from {} (type: {}): {}", 
                        email, ipAddress, limitType, e.getMessage());
        }
    }
}