package com.passwordmanager.backend.service;

import com.passwordmanager.backend.dto.RecoveryRequest;
import com.passwordmanager.backend.dto.RecoveryResponse;
import com.passwordmanager.backend.dto.RegisterRequest;
import com.passwordmanager.backend.dto.RegisterResponse;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.filter.CorrelationIdFilter;
import com.passwordmanager.backend.metrics.CustomMetricsService;
import com.passwordmanager.backend.repository.UserRepository;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Service for handling authentication business logic.
 * 
 * This service manages:
 * - Rate limiting for failed login attempts
 * - User lookup and validation
 * - Login attempt tracking
 * - Account lockout logic
 * 
 * Requirements: 2.1, 2.4
 */
@Service
public class AuthenticationService {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationService.class);
    
    // Redis keys for rate limiting
    private static final String FAILED_ATTEMPTS_KEY_PREFIX = "failed_attempts:";
    private static final String LOCKOUT_KEY_PREFIX = "lockout:";
    private static final String REGISTRATION_ATTEMPTS_KEY_PREFIX = "registration_attempts:";
    
    // Rate limiting configuration
    private static final int MAX_FAILED_ATTEMPTS = 3;
    private static final int INITIAL_LOCKOUT_SECONDS = 30;
    private static final int LOCKOUT_MULTIPLIER = 2;
    private static final int MAX_LOCKOUT_SECONDS = 3600; // 1 hour

    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom;
    private final AuditLogService auditLogService;
    private final VaultService vaultService;
    private final EmailService emailService;
    private final SessionService sessionService;
    private final CustomMetricsService metricsService;

    public AuthenticationService(UserRepository userRepository,
                               RedisTemplate<String, Object> redisTemplate,
                               PasswordEncoder passwordEncoder,
                               AuditLogService auditLogService,
                               VaultService vaultService,
                               EmailService emailService,
                               SessionService sessionService,
                               CustomMetricsService metricsService) {
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
        this.passwordEncoder = passwordEncoder;
        this.secureRandom = new SecureRandom();
        this.auditLogService = auditLogService;
        this.vaultService = vaultService;
        this.emailService = emailService;
        this.sessionService = sessionService;
        this.metricsService = metricsService;
    }

    /**
     * Checks if login is allowed for the given email and IP address.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @return true if login is allowed, false if rate limited
     */
    public boolean isLoginAllowed(String email, String ipAddress) {
        String lockoutKey = LOCKOUT_KEY_PREFIX + email + ":" + ipAddress;
        
        // Check if currently locked out
        Boolean isLockedOut = redisTemplate.hasKey(lockoutKey);
        if (Boolean.TRUE.equals(isLockedOut)) {
            logger.debug("Login blocked for {} from {} - currently locked out", email, ipAddress);
            return false;
        }

        return true;
    }

    /**
     * Records a failed login attempt and applies rate limiting if necessary.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @param userAgent User agent string
     * @param reason Failure reason
     */
    public void recordFailedLogin(String email, String ipAddress, String userAgent, String reason) {
        // Record metrics
        metricsService.recordLoginAttempt();
        metricsService.recordLoginFailure(reason);
        
        String attemptsKey = FAILED_ATTEMPTS_KEY_PREFIX + email + ":" + ipAddress;
        String lockoutKey = LOCKOUT_KEY_PREFIX + email + ":" + ipAddress;

        try {
            // Increment failed attempts counter
            Long attempts = redisTemplate.opsForValue().increment(attemptsKey);
            
            if (attempts == null) {
                attempts = 1L;
            }

            // Set expiration for attempts counter (reset after 1 hour)
            redisTemplate.expire(attemptsKey, 1, TimeUnit.HOURS);

            logger.warn("Failed login attempt {} for {} from {}", attempts, email, ipAddress);

            // Log failed authentication attempt
            auditLogService.logFailedAuthentication(email, ipAddress, userAgent, reason);

            // Check if we need to apply lockout
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                // Calculate lockout duration with exponential backoff
                long lockoutAttempts = attempts - MAX_FAILED_ATTEMPTS + 1;
                int lockoutSeconds = (int) Math.min(
                    INITIAL_LOCKOUT_SECONDS * Math.pow(LOCKOUT_MULTIPLIER, lockoutAttempts - 1),
                    MAX_LOCKOUT_SECONDS
                );

                // Apply lockout
                redisTemplate.opsForValue().set(lockoutKey, attempts, lockoutSeconds, TimeUnit.SECONDS);
                
                logger.warn("Account locked out for {} seconds after {} failed attempts for {} from {}", 
                           lockoutSeconds, attempts, email, ipAddress);

                // Log account lockout
                auditLogService.logAccountLockout(email, ipAddress, attempts.intValue(), lockoutSeconds);
            }

        } catch (Exception e) {
            logger.error("Failed to record failed login attempt for {} from {}: {}", 
                        email, ipAddress, e.getMessage());
        }
    }

    /**
     * Records a successful login and clears any failed attempt counters.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @param userAgent User agent string
     */
    public void recordSuccessfulLogin(String email, String ipAddress, String userAgent) {
        // Record metrics
        metricsService.recordLoginAttempt();
        metricsService.recordLoginSuccess();
        
        String attemptsKey = FAILED_ATTEMPTS_KEY_PREFIX + email + ":" + ipAddress;
        String lockoutKey = LOCKOUT_KEY_PREFIX + email + ":" + ipAddress;

        try {
            // Clear failed attempts and lockout
            redisTemplate.delete(attemptsKey);
            redisTemplate.delete(lockoutKey);

            logger.info("Successful login for {} from {} - cleared rate limiting counters", 
                       email, ipAddress);

            // Log successful authentication
            auditLogService.logSuccessfulAuthentication(email, ipAddress, userAgent);

        } catch (Exception e) {
            logger.error("Failed to clear rate limiting counters for {} from {}: {}", 
                        email, ipAddress, e.getMessage());
        }
    }

    /**
     * Gets a user by email address.
     * 
     * @param email User email
     * @return UserAccount entity
     * @throws UsernameNotFoundException if user not found
     */
    public UserAccount getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    /**
     * Updates the user's last login timestamp.
     * 
     * @param userId User ID
     */
    public void updateLastLogin(UUID userId) {
        try {
            userRepository.findById(userId).ifPresent(user -> {
                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);
                logger.debug("Updated last login timestamp for user {}", userId);
            });
        } catch (Exception e) {
            logger.error("Failed to update last login timestamp for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Gets the number of failed login attempts for an email/IP combination.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @return Number of failed attempts
     */
    public int getFailedAttempts(String email, String ipAddress) {
        String attemptsKey = FAILED_ATTEMPTS_KEY_PREFIX + email + ":" + ipAddress;
        
        try {
            Integer attempts = (Integer) redisTemplate.opsForValue().get(attemptsKey);
            return attempts != null ? attempts : 0;
        } catch (Exception e) {
            logger.error("Failed to get failed attempts count for {} from {}: {}", 
                        email, ipAddress, e.getMessage());
            return 0;
        }
    }

    /**
     * Gets the remaining lockout time in seconds.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     * @return Remaining lockout time in seconds, 0 if not locked out
     */
    public long getRemainingLockoutTime(String email, String ipAddress) {
        String lockoutKey = LOCKOUT_KEY_PREFIX + email + ":" + ipAddress;
        
        try {
            Long ttl = redisTemplate.getExpire(lockoutKey, TimeUnit.SECONDS);
            return ttl != null && ttl > 0 ? ttl : 0;
        } catch (Exception e) {
            logger.error("Failed to get remaining lockout time for {} from {}: {}", 
                        email, ipAddress, e.getMessage());
            return 0;
        }
    }

    /**
     * Manually clears rate limiting for an email/IP combination.
     * This should only be used by administrators.
     * 
     * @param email User email
     * @param ipAddress Client IP address
     */
    public void clearRateLimiting(String email, String ipAddress) {
        String attemptsKey = FAILED_ATTEMPTS_KEY_PREFIX + email + ":" + ipAddress;
        String lockoutKey = LOCKOUT_KEY_PREFIX + email + ":" + ipAddress;

        try {
            redisTemplate.delete(attemptsKey);
            redisTemplate.delete(lockoutKey);
            
            logger.info("Manually cleared rate limiting for {} from {}", email, ipAddress);
        } catch (Exception e) {
            logger.error("Failed to clear rate limiting for {} from {}: {}", 
                        email, ipAddress, e.getMessage());
        }
    }

    /**
     * Registers a new user account with the provided credentials.
     * 
     * This method:
     * - Validates that the email is not already registered
     * - Creates a new user account with the provided authentication key hash
     * - Generates a backup recovery key for account recovery
     * - Stores the recovery key hash (not the key itself)
     * 
     * @param registerRequest Registration request containing user credentials
     * @return RegisterResponse containing user ID and recovery key
     * @throws IllegalArgumentException if email is already registered
     */
    public RegisterResponse registerUser(RegisterRequest registerRequest) {
        Timer.Sample sample = metricsService.startAuthenticationTimer();
        logger.info("Attempting to register new user with email: {}", registerRequest.getEmail());

        try {
            // Check if email is already registered
            if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
                logger.warn("Registration attempt with existing email: {}", registerRequest.getEmail());
                throw new IllegalArgumentException("Email is already registered");
            }

            // Generate backup recovery key
            String recoveryKey = generateRecoveryKey();
            String recoveryKeyHash = passwordEncoder.encode(recoveryKey);

            // Create new user account
            UserAccount user = UserAccount.builder()
                    .email(registerRequest.getEmail())
                    .authKeyHash(registerRequest.getAuthKeyHash())
                    .salt(registerRequest.getSalt())
                    .iterations(registerRequest.getIterations())
                    .recoveryKeyHash(recoveryKeyHash)
                    .emailVerified(false)
                    .twoFactorEnabled(false)
                    .build();

            // Save user to database
            UserAccount savedUser = userRepository.save(user);

            logger.info("Successfully registered new user with ID: {} and email: {}", 
                       savedUser.getId(), savedUser.getEmail());

            // Record metrics
            metricsService.recordRegistration();
            metricsService.recordAuthenticationTime(sample, "registration");

            // Return response with recovery key (displayed once)
            return RegisterResponse.builder()
                    .userId(savedUser.getId())
                    .email(savedUser.getEmail())
                    .recoveryKey(recoveryKey)
                    .createdAt(savedUser.getCreatedAt())
                    .emailVerificationRequired(true)
                    .build();

        } catch (DataIntegrityViolationException e) {
            logger.error("Database constraint violation during registration for email: {} - {}", 
                        registerRequest.getEmail(), e.getMessage());
            throw new IllegalArgumentException("Email is already registered");
        } catch (Exception e) {
            logger.error("Unexpected error during registration for email: {} - {}", 
                        registerRequest.getEmail(), e.getMessage(), e);
            throw new RuntimeException("Registration failed due to internal error");
        }
    }

    /**
     * Generates a cryptographically secure backup recovery key.
     * 
     * The recovery key is a 48-character string consisting of 8 groups of 6 characters
     * separated by hyphens for readability (e.g., ABCDEF-123456-GHIJKL-789012-...).
     * 
     * @return Generated recovery key
     */
    private String generateRecoveryKey() {
        // Generate 36 random bytes (288 bits of entropy)
        byte[] randomBytes = new byte[36];
        secureRandom.nextBytes(randomBytes);

        // Encode to Base32 for human readability (no ambiguous characters)
        String base32 = Base64.getEncoder().encodeToString(randomBytes)
                .replace('+', '2')
                .replace('/', '3')
                .replace('=', '4')
                .toUpperCase();

        // Take first 48 characters and format as 8 groups of 6
        StringBuilder recoveryKey = new StringBuilder();
        for (int i = 0; i < 48; i += 6) {
            if (i > 0) {
                recoveryKey.append("-");
            }
            recoveryKey.append(base32, i, Math.min(i + 6, base32.length()));
        }

        return recoveryKey.toString();
    }

    /**
     * Validates a recovery key against the stored hash.
     * 
     * @param email User email
     * @param recoveryKey Recovery key to validate
     * @return true if recovery key is valid, false otherwise
     */
    public boolean validateRecoveryKey(String email, String recoveryKey) {
        try {
            UserAccount user = getUserByEmail(email);
            if (user.getRecoveryKeyHash() == null) {
                logger.warn("No recovery key hash found for user: {}", email);
                return false;
            }

            boolean isValid = passwordEncoder.matches(recoveryKey, user.getRecoveryKeyHash());
            logger.info("Recovery key validation for user {}: {}", email, isValid ? "SUCCESS" : "FAILED");
            return isValid;

        } catch (UsernameNotFoundException e) {
            logger.warn("Recovery key validation attempted for non-existent user: {}", email);
            return false;
        } catch (Exception e) {
            logger.error("Error validating recovery key for user {}: {}", email, e.getMessage());
            return false;
        }
    }

    /**
     * Checks if registration is allowed from the given IP address.
     * 
     * Implements rate limiting to prevent abuse:
     * - Maximum 5 registration attempts per IP per hour
     * 
     * @param ipAddress Client IP address
     * @return true if registration is allowed, false if rate limited
     */
    public boolean isRegistrationAllowed(String ipAddress) {
        String rateLimitKey = REGISTRATION_ATTEMPTS_KEY_PREFIX + ipAddress;
        
        try {
            Integer attempts = (Integer) redisTemplate.opsForValue().get(rateLimitKey);
            int currentAttempts = attempts != null ? attempts : 0;
            
            // Allow up to 5 registration attempts per hour per IP
            return currentAttempts < 5;
            
        } catch (Exception e) {
            logger.error("Failed to check registration rate limit for IP {}: {}", ipAddress, e.getMessage());
            // Allow registration if we can't check rate limit (fail open for availability)
            return true;
        }
    }

    /**
     * Records a registration attempt for rate limiting purposes.
     * 
     * @param ipAddress Client IP address
     */
    public void recordRegistrationAttempt(String ipAddress) {
        String rateLimitKey = REGISTRATION_ATTEMPTS_KEY_PREFIX + ipAddress;
        
        try {
            // Increment counter and set 1-hour expiration
            redisTemplate.opsForValue().increment(rateLimitKey);
            redisTemplate.expire(rateLimitKey, 1, TimeUnit.HOURS);
            
            logger.debug("Recorded registration attempt from IP: {}", ipAddress);
            
        } catch (Exception e) {
            logger.error("Failed to record registration attempt for IP {}: {}", ipAddress, e.getMessage());
        }
    }

    /**
     * Recovers an account using the backup recovery key and sets new credentials.
     * 
     * This method:
     * - Validates the recovery key against the stored hash
     * - Updates the user's authentication credentials with new master password
     * - Re-encrypts the vault with keys derived from the new master password
     * - Generates a new recovery key and invalidates the old one
     * - Invalidates all existing sessions for security
     * - Sends email notification about the recovery
     * - Logs the recovery event for audit purposes
     * 
     * @param recoveryRequest Recovery request containing new credentials
     * @return RecoveryResponse containing new recovery key and success info
     * @throws IllegalArgumentException if recovery key is invalid or user not found
     */
    public RecoveryResponse recoverAccount(RecoveryRequest recoveryRequest) {
        return recoverAccount(recoveryRequest, null, null);
    }

    /**
     * Recovers an account with additional context for audit logging and notifications.
     * 
     * @param recoveryRequest Recovery request containing new credentials
     * @param clientIp Client IP address for audit logging
     * @param deviceInfo Device information for audit logging
     * @return RecoveryResponse containing new recovery key and success info
     * @throws IllegalArgumentException if recovery key is invalid or user not found
     */
    public RecoveryResponse recoverAccount(RecoveryRequest recoveryRequest, String clientIp, String deviceInfo) {
        logger.info("Attempting account recovery for user: {}", recoveryRequest.getEmail());

        try {
            // Get user and validate recovery key (already validated in controller, but double-check)
            UserAccount user = getUserByEmail(recoveryRequest.getEmail());
            
            if (!validateRecoveryKey(recoveryRequest.getEmail(), recoveryRequest.getRecoveryKey())) {
                logger.warn("Invalid recovery key during account recovery for user: {}", recoveryRequest.getEmail());
                throw new IllegalArgumentException("Invalid recovery key");
            }

            LocalDateTime recoveryTime = LocalDateTime.now();

            // Generate new recovery key
            String newRecoveryKey = generateRecoveryKey();
            String newRecoveryKeyHash = passwordEncoder.encode(newRecoveryKey);

            // Update user credentials
            user.setAuthKeyHash(recoveryRequest.getNewAuthKeyHash());
            user.setSalt(recoveryRequest.getNewSalt());
            user.setIterations(recoveryRequest.getNewIterations());
            user.setRecoveryKeyHash(newRecoveryKeyHash);

            // Save updated user
            UserAccount updatedUser = userRepository.save(user);

            // 1. Trigger vault re-encryption with new master password
            try {
                vaultService.markVaultForReEncryption(updatedUser.getId());
                logger.info("Vault marked for re-encryption for user: {}", updatedUser.getId());
            } catch (Exception e) {
                logger.error("Failed to mark vault for re-encryption for user {}: {}", updatedUser.getId(), e.getMessage());
                // Continue with recovery even if vault marking fails
            }

            // 2. Invalidate all existing sessions for security
            try {
                sessionService.invalidateAllUserSessions(updatedUser.getId());
                logger.info("All sessions invalidated for user: {}", updatedUser.getId());
            } catch (Exception e) {
                logger.error("Failed to invalidate sessions for user {}: {}", updatedUser.getId(), e.getMessage());
                // Continue with recovery even if session invalidation fails
            }

            // 3. Send email notification about the recovery
            try {
                String safeClientIp = clientIp != null ? clientIp : "Unknown";
                String safeDeviceInfo = deviceInfo != null ? deviceInfo : "Unknown Device";
                emailService.sendRecoveryNotification(updatedUser.getEmail(), recoveryTime, safeClientIp, safeDeviceInfo);
                logger.info("Recovery notification sent to user: {}", updatedUser.getEmail());
            } catch (Exception e) {
                logger.error("Failed to send recovery notification to user {}: {}", updatedUser.getEmail(), e.getMessage());
                // Continue with recovery even if email fails
            }

            logger.info("Account recovery completed successfully for user: {} (ID: {})", 
                       updatedUser.getEmail(), updatedUser.getId());

            // Return response with new recovery key
            return RecoveryResponse.builder()
                    .success(true)
                    .newRecoveryKey(newRecoveryKey)
                    .userId(updatedUser.getId())
                    .email(updatedUser.getEmail())
                    .recoveredAt(recoveryTime)
                    .message("Account recovery successful. Please save your new recovery key securely.")
                    .build();

        } catch (UsernameNotFoundException e) {
            logger.warn("Account recovery attempted for non-existent user: {}", recoveryRequest.getEmail());
            throw new IllegalArgumentException("User not found");
        } catch (Exception e) {
            logger.error("Error during account recovery for user {}: {}", recoveryRequest.getEmail(), e.getMessage());
            throw new RuntimeException("Account recovery failed due to internal error");
        }
    }

    /**
     * Checks if account recovery is allowed from the given IP address.
     * 
     * Implements rate limiting to prevent abuse:
     * - Maximum 3 recovery attempts per IP per hour
     * 
     * @param ipAddress Client IP address
     * @return true if recovery is allowed, false if rate limited
     */
    public boolean isRecoveryAllowed(String ipAddress) {
        String rateLimitKey = "recovery_attempts:" + ipAddress;
        
        try {
            Integer attempts = (Integer) redisTemplate.opsForValue().get(rateLimitKey);
            int currentAttempts = attempts != null ? attempts : 0;
            
            // Allow up to 3 recovery attempts per hour per IP
            return currentAttempts < 3;
            
        } catch (Exception e) {
            logger.error("Failed to check recovery rate limit for IP {}: {}", ipAddress, e.getMessage());
            // Allow recovery if we can't check rate limit (fail open for availability)
            return true;
        }
    }

    /**
     * Records a recovery attempt for rate limiting purposes.
     * 
     * @param ipAddress Client IP address
     */
    public void recordRecoveryAttempt(String ipAddress) {
        String rateLimitKey = "recovery_attempts:" + ipAddress;
        
        try {
            // Increment counter and set 1-hour expiration
            redisTemplate.opsForValue().increment(rateLimitKey);
            redisTemplate.expire(rateLimitKey, 1, TimeUnit.HOURS);
            
            logger.debug("Recorded recovery attempt from IP: {}", ipAddress);
            
        } catch (Exception e) {
            logger.error("Failed to record recovery attempt for IP {}: {}", ipAddress, e.getMessage());
        }
    }
}