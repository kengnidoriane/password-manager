package com.passwordmanager.backend.service;

import com.passwordmanager.backend.entity.Session;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.repository.SessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Service for managing user sessions with Redis storage.
 * 
 * This service handles:
 * - Creating new sessions with TTL in Redis
 * - Validating and refreshing existing sessions
 * - Invalidating sessions on logout
 * - Session timeout enforcement
 * 
 * Requirements: 2.2, 2.5
 */
@Service
public class SessionService {

    private static final Logger logger = LoggerFactory.getLogger(SessionService.class);
    private static final String SESSION_KEY_PREFIX = "session:";
    private static final String USER_SESSIONS_KEY_PREFIX = "user_sessions:";

    private final RedisTemplate<String, Object> redisTemplate;
    private final SessionRepository sessionRepository;
    private final AuditLogService auditLogService;

    public SessionService(RedisTemplate<String, Object> redisTemplate, 
                         SessionRepository sessionRepository,
                         AuditLogService auditLogService) {
        this.redisTemplate = redisTemplate;
        this.sessionRepository = sessionRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * Creates a new session for the user.
     * 
     * @param user User entity
     * @param token JWT token
     * @param deviceInfo Device information
     * @param ipAddress Client IP address
     * @param userAgent User agent string
     * @param timeoutMinutes Session timeout in minutes
     * @return Created session
     */
    public Session createSession(UserAccount user, String token, String deviceInfo, 
                               String ipAddress, String userAgent, int timeoutMinutes) {
        try {
            // Create session entity
            Session session = Session.builder()
                    .user(user)
                    .sessionToken(token)
                    .deviceInfo(deviceInfo)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .expiresAt(LocalDateTime.now().plusMinutes(timeoutMinutes))
                    .lastActivityAt(LocalDateTime.now())
                    .isActive(true)
                    .build();

            // Save to database
            session = sessionRepository.save(session);

            // Store in Redis with TTL
            String sessionKey = SESSION_KEY_PREFIX + session.getId();
            redisTemplate.opsForValue().set(sessionKey, session, timeoutMinutes, TimeUnit.MINUTES);

            // Track user sessions for concurrent session management
            String userSessionsKey = USER_SESSIONS_KEY_PREFIX + user.getId();
            redisTemplate.opsForSet().add(userSessionsKey, session.getId().toString());
            redisTemplate.expire(userSessionsKey, timeoutMinutes, TimeUnit.MINUTES);

            logger.info("Created session {} for user {} from IP {}", 
                       session.getId(), user.getId(), ipAddress);

            // Log session creation
            auditLogService.logSessionCreated(user.getEmail(), session.getId().toString(), 
                                            ipAddress, deviceInfo);

            return session;
        } catch (Exception e) {
            logger.error("Failed to create session for user {}: {}", user.getId(), e.getMessage());
            throw new RuntimeException("Failed to create session", e);
        }
    }

    /**
     * Validates and retrieves a session by ID.
     * 
     * @param sessionId Session ID
     * @return Session if valid and not expired, empty otherwise
     */
    public Optional<Session> validateSession(UUID sessionId) {
        try {
            String sessionKey = SESSION_KEY_PREFIX + sessionId;
            Session session = (Session) redisTemplate.opsForValue().get(sessionKey);

            if (session != null && session.isValid()) {
                return Optional.of(session);
            }

            // Session not found in Redis or expired, check database
            Optional<Session> dbSession = sessionRepository.findById(sessionId);
            if (dbSession.isPresent() && dbSession.get().isValid()) {
                // Restore to Redis
                Session validSession = dbSession.get();
                long remainingMinutes = java.time.Duration.between(
                    LocalDateTime.now(), validSession.getExpiresAt()).toMinutes();
                
                if (remainingMinutes > 0) {
                    redisTemplate.opsForValue().set(sessionKey, validSession, 
                                                  remainingMinutes, TimeUnit.MINUTES);
                    return Optional.of(validSession);
                }
            }

            return Optional.empty();
        } catch (Exception e) {
            logger.error("Failed to validate session {}: {}", sessionId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Updates the last activity time for a session.
     * 
     * @param sessionId Session ID
     * @param timeoutMinutes Session timeout in minutes
     * @return true if session was updated, false otherwise
     */
    public boolean updateLastActivity(UUID sessionId, int timeoutMinutes) {
        try {
            String sessionKey = SESSION_KEY_PREFIX + sessionId;
            Session session = (Session) redisTemplate.opsForValue().get(sessionKey);

            if (session != null) {
                session.updateActivity(timeoutMinutes);

                // Update in Redis
                redisTemplate.opsForValue().set(sessionKey, session, timeoutMinutes, TimeUnit.MINUTES);

                // Update in database asynchronously
                sessionRepository.findById(sessionId).ifPresent(dbSession -> {
                    dbSession.updateActivity(timeoutMinutes);
                    sessionRepository.save(dbSession);
                });

                return true;
            }

            return false;
        } catch (Exception e) {
            logger.error("Failed to update last activity for session {}: {}", sessionId, e.getMessage());
            return false;
        }
    }

    /**
     * Invalidates a session (logout).
     * 
     * @param sessionId Session ID
     * @return true if session was invalidated, false otherwise
     */
    public boolean invalidateSession(UUID sessionId) {
        try {
            String sessionKey = SESSION_KEY_PREFIX + sessionId;
            
            // Get session to find user ID for cleanup
            Session session = (Session) redisTemplate.opsForValue().get(sessionKey);
            if (session != null) {
                String userSessionsKey = USER_SESSIONS_KEY_PREFIX + session.getUserId();
                redisTemplate.opsForSet().remove(userSessionsKey, sessionId.toString());
            }

            // Remove from Redis
            redisTemplate.delete(sessionKey);

            // Mark as inactive in database
            sessionRepository.findById(sessionId).ifPresent(dbSession -> {
                dbSession.invalidate();
                sessionRepository.save(dbSession);
            });

            logger.info("Invalidated session {}", sessionId);
            
            // Log session expiration
            if (session != null) {
                auditLogService.logSessionExpired(session.getUser().getEmail(), 
                                                sessionId.toString(), "LOGOUT");
            }
            
            return true;
        } catch (Exception e) {
            logger.error("Failed to invalidate session {}: {}", sessionId, e.getMessage());
            return false;
        }
    }

    /**
     * Invalidates all sessions for a user.
     * 
     * @param userId User ID
     * @return Number of sessions invalidated
     */
    public int invalidateAllUserSessions(UUID userId) {
        try {
            String userSessionsKey = USER_SESSIONS_KEY_PREFIX + userId;
            var sessionIds = redisTemplate.opsForSet().members(userSessionsKey);

            int invalidatedCount = 0;
            if (sessionIds != null) {
                for (Object sessionIdObj : sessionIds) {
                    UUID sessionId = UUID.fromString(sessionIdObj.toString());
                    if (invalidateSession(sessionId)) {
                        invalidatedCount++;
                    }
                }
            }

            // Clean up user sessions set
            redisTemplate.delete(userSessionsKey);

            logger.info("Invalidated {} sessions for user {}", invalidatedCount, userId);
            return invalidatedCount;
        } catch (Exception e) {
            logger.error("Failed to invalidate all sessions for user {}: {}", userId, e.getMessage());
            return 0;
        }
    }

    /**
     * Gets the number of active sessions for a user.
     * 
     * @param userId User ID
     * @return Number of active sessions
     */
    public long getActiveSessionCount(UUID userId) {
        try {
            String userSessionsKey = USER_SESSIONS_KEY_PREFIX + userId;
            Long count = redisTemplate.opsForSet().size(userSessionsKey);
            return count != null ? count : 0;
        } catch (Exception e) {
            logger.error("Failed to get active session count for user {}: {}", userId, e.getMessage());
            return 0;
        }
    }

    /**
     * Cleans up expired sessions from Redis and database.
     * This method should be called periodically by a scheduled task.
     */
    public void cleanupExpiredSessions() {
        try {
            // Find expired sessions in database
            var expiredSessions = sessionRepository.findExpiredActiveSessions(LocalDateTime.now());
            
            for (Session session : expiredSessions) {
                String sessionKey = SESSION_KEY_PREFIX + session.getId();
                redisTemplate.delete(sessionKey);
                
                String userSessionsKey = USER_SESSIONS_KEY_PREFIX + session.getUser().getId();
                redisTemplate.opsForSet().remove(userSessionsKey, session.getId().toString());
            }

            // Mark expired sessions as inactive in database
            int invalidatedCount = sessionRepository.invalidateExpiredSessions(LocalDateTime.now());

            logger.info("Cleaned up {} expired sessions", invalidatedCount);
        } catch (Exception e) {
            logger.error("Failed to cleanup expired sessions: {}", e.getMessage());
        }
    }
}