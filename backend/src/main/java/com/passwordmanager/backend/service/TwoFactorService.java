package com.passwordmanager.backend.service;

import com.passwordmanager.backend.dto.TwoFactorSetupResponse;
import com.passwordmanager.backend.entity.BackupCode;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.repository.BackupCodeRepository;
import com.passwordmanager.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import javax.imageio.ImageIO;

/**
 * Service for handling two-factor authentication operations.
 * 
 * This service manages:
 * - TOTP secret generation and validation
 * - QR code generation for authenticator apps
 * - Backup code generation and validation
 * - TOTP code replay protection
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4
 */
@Service
public class TwoFactorService {

    private static final Logger logger = LoggerFactory.getLogger(TwoFactorService.class);

    // TOTP configuration
    private static final int TOTP_PERIOD = 30; // 30 seconds
    private static final int TOTP_DIGITS = 6;
    private static final String TOTP_ALGORITHM = "HmacSHA1";
    private static final int SECRET_LENGTH = 20; // 160 bits

    // Backup code configuration
    private static final int BACKUP_CODE_COUNT = 10;
    private static final int BACKUP_CODE_LENGTH = 8;

    // Redis keys for TOTP replay protection
    private static final String USED_TOTP_KEY_PREFIX = "used_totp:";

    @Value("${app.name:Password Manager}")
    private String appName;

    @Value("${app.issuer:Password Manager}")
    private String issuer;

    private final UserRepository userRepository;
    private final BackupCodeRepository backupCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SecureRandom secureRandom;

    public TwoFactorService(UserRepository userRepository,
                           BackupCodeRepository backupCodeRepository,
                           PasswordEncoder passwordEncoder,
                           RedisTemplate<String, Object> redisTemplate) {
        this.userRepository = userRepository;
        this.backupCodeRepository = backupCodeRepository;
        this.passwordEncoder = passwordEncoder;
        this.redisTemplate = redisTemplate;
        this.secureRandom = new SecureRandom();
    }

    /**
     * Sets up two-factor authentication for a user.
     * 
     * Generates a TOTP secret, creates a QR code, and generates backup codes.
     * 
     * @param userId User ID
     * @return TwoFactorSetupResponse containing secret, QR code, and backup codes
     */
    @Transactional
    public TwoFactorSetupResponse setupTwoFactor(UUID userId) {
        logger.info("Setting up 2FA for user: {}", userId);

        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Generate TOTP secret
        String secret = generateTotpSecret();
        
        // Generate QR code
        String qrCodeDataUrl = generateQrCode(user.getEmail(), secret);
        
        // Generate backup codes
        List<String> backupCodes = generateBackupCodes();
        
        // Save secret to user (but don't enable 2FA yet - user needs to verify first)
        user.setTwoFactorSecret(secret);
        
        // Clear existing backup codes and create new ones
        user.clearBackupCodes();
        for (String code : backupCodes) {
            BackupCode backupCode = BackupCode.builder()
                    .user(user)
                    .codeHash(passwordEncoder.encode(code))
                    .used(false)
                    .build();
            user.addBackupCode(backupCode);
        }
        
        userRepository.save(user);

        logger.info("Successfully set up 2FA for user: {}", userId);

        return TwoFactorSetupResponse.builder()
                .secret(secret)
                .qrCodeDataUrl(qrCodeDataUrl)
                .backupCodes(backupCodes)
                .instructions("Scan the QR code with your authenticator app or enter the secret manually. " +
                            "Save the backup codes in a secure location - they can only be used once each.")
                .build();
    }

    /**
     * Verifies a TOTP code for a user.
     * 
     * @param userId User ID
     * @param code TOTP code to verify
     * @param isBackupCode Whether this is a backup code
     * @return true if code is valid, false otherwise
     */
    public boolean verifyTotpCode(UUID userId, String code, boolean isBackupCode) {
        logger.debug("Verifying TOTP code for user: {}", userId);

        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.has2FAEnabled()) {
            logger.warn("2FA verification attempted for user without 2FA enabled: {}", userId);
            return false;
        }

        if (isBackupCode) {
            return verifyBackupCode(user, code);
        } else {
            return verifyTotpCode(user, code);
        }
    }

    /**
     * Enables 2FA for a user after successful code verification.
     * 
     * @param userId User ID
     */
    @Transactional
    public void enableTwoFactor(UUID userId) {
        logger.info("Enabling 2FA for user: {}", userId);

        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getTwoFactorSecret() == null) {
            throw new IllegalStateException("2FA secret not set up for user");
        }

        user.setTwoFactorEnabled(true);
        userRepository.save(user);

        logger.info("Successfully enabled 2FA for user: {}", userId);
    }

    /**
     * Disables 2FA for a user.
     * 
     * @param userId User ID
     */
    @Transactional
    public void disableTwoFactor(UUID userId) {
        logger.info("Disabling 2FA for user: {}", userId);

        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        user.clearBackupCodes();
        
        userRepository.save(user);

        logger.info("Successfully disabled 2FA for user: {}", userId);
    }

    /**
     * Generates a cryptographically secure TOTP secret.
     * 
     * @return Base32-encoded secret
     */
    private String generateTotpSecret() {
        byte[] secretBytes = new byte[SECRET_LENGTH];
        secureRandom.nextBytes(secretBytes);
        return base32Encode(secretBytes);
    }

    /**
     * Generates backup codes for emergency access.
     * 
     * @return List of backup codes
     */
    private List<String> generateBackupCodes() {
        List<String> codes = new ArrayList<>();
        
        for (int i = 0; i < BACKUP_CODE_COUNT; i++) {
            StringBuilder code = new StringBuilder();
            for (int j = 0; j < BACKUP_CODE_LENGTH; j++) {
                code.append(secureRandom.nextInt(10));
            }
            codes.add(code.toString());
        }
        
        return codes;
    }

    /**
     * Generates a QR code data URL for the TOTP secret.
     * 
     * @param email User email
     * @param secret TOTP secret
     * @return QR code as data URL
     */
    private String generateQrCode(String email, String secret) {
        try {
            // Create TOTP URI
            String uri = String.format(
                "otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d",
                URLEncoder.encode(issuer, StandardCharsets.UTF_8),
                URLEncoder.encode(email, StandardCharsets.UTF_8),
                secret,
                URLEncoder.encode(issuer, StandardCharsets.UTF_8),
                TOTP_DIGITS,
                TOTP_PERIOD
            );

            // Generate QR code image
            BufferedImage qrImage = generateQrCodeImage(uri, 200, 200);
            
            // Convert to data URL
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(qrImage, "PNG", baos);
            byte[] imageBytes = baos.toByteArray();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            
            return "data:image/png;base64," + base64Image;
            
        } catch (Exception e) {
            logger.error("Failed to generate QR code for user {}: {}", email, e.getMessage());
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    /**
     * Generates a simple QR code image.
     * Note: In production, consider using a proper QR code library like ZXing.
     * 
     * @param text Text to encode
     * @param width Image width
     * @param height Image height
     * @return BufferedImage containing QR code
     */
    private BufferedImage generateQrCodeImage(String text, int width, int height) {
        // This is a placeholder implementation
        // In production, use a proper QR code library like ZXing
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();
        
        // Fill with white background
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, width, height);
        
        // Draw placeholder text
        g2d.setColor(Color.BLACK);
        g2d.drawString("QR Code Placeholder", 10, height / 2);
        g2d.drawString("Use proper QR library", 10, height / 2 + 20);
        
        g2d.dispose();
        return image;
    }

    /**
     * Verifies a TOTP code against the user's secret.
     * 
     * @param user User account
     * @param code TOTP code to verify
     * @return true if code is valid, false otherwise
     */
    private boolean verifyTotpCode(UserAccount user, String code) {
        try {
            String secret = user.getTwoFactorSecret();
            if (secret == null) {
                return false;
            }

            // Check if code was already used (replay protection)
            String usedCodeKey = USED_TOTP_KEY_PREFIX + user.getId() + ":" + code;
            if (Boolean.TRUE.equals(redisTemplate.hasKey(usedCodeKey))) {
                logger.warn("TOTP code replay attempt detected for user: {}", user.getId());
                return false;
            }

            // Get current time window
            long currentTimeWindow = Instant.now().getEpochSecond() / TOTP_PERIOD;
            
            // Check current window and previous window (to account for clock skew)
            for (int i = 0; i <= 1; i++) {
                long timeWindow = currentTimeWindow - i;
                String expectedCode = generateTotpCode(secret, timeWindow);
                
                if (code.equals(expectedCode)) {
                    // Mark code as used to prevent replay
                    redisTemplate.opsForValue().set(usedCodeKey, true, TOTP_PERIOD * 2, TimeUnit.SECONDS);
                    logger.debug("TOTP code verified successfully for user: {}", user.getId());
                    return true;
                }
            }

            logger.debug("TOTP code verification failed for user: {}", user.getId());
            return false;

        } catch (Exception e) {
            logger.error("Error verifying TOTP code for user {}: {}", user.getId(), e.getMessage());
            return false;
        }
    }

    /**
     * Verifies a backup code for a user.
     * 
     * @param user User account
     * @param code Backup code to verify
     * @return true if code is valid, false otherwise
     */
    @Transactional
    private boolean verifyBackupCode(UserAccount user, String code) {
        for (BackupCode backupCode : user.getBackupCodes()) {
            if (backupCode.isAvailable() && passwordEncoder.matches(code, backupCode.getCodeHash())) {
                // Mark backup code as used
                backupCode.markAsUsed();
                backupCodeRepository.save(backupCode);
                
                logger.info("Backup code used successfully for user: {}", user.getId());
                return true;
            }
        }
        
        logger.debug("Backup code verification failed for user: {}", user.getId());
        return false;
    }

    /**
     * Generates a TOTP code for a given secret and time window.
     * 
     * @param secret Base32-encoded secret
     * @param timeWindow Time window (epoch seconds / 30)
     * @return 6-digit TOTP code
     */
    private String generateTotpCode(String secret, long timeWindow) {
        try {
            byte[] secretBytes = base32Decode(secret);
            byte[] timeBytes = longToBytes(timeWindow);
            
            Mac mac = Mac.getInstance(TOTP_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(secretBytes, TOTP_ALGORITHM);
            mac.init(keySpec);
            
            byte[] hash = mac.doFinal(timeBytes);
            
            // Dynamic truncation
            int offset = hash[hash.length - 1] & 0x0F;
            int code = ((hash[offset] & 0x7F) << 24) |
                      ((hash[offset + 1] & 0xFF) << 16) |
                      ((hash[offset + 2] & 0xFF) << 8) |
                      (hash[offset + 3] & 0xFF);
            
            code = code % (int) Math.pow(10, TOTP_DIGITS);
            
            return String.format("%0" + TOTP_DIGITS + "d", code);
            
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Failed to generate TOTP code", e);
        }
    }

    /**
     * Encodes bytes to Base32.
     * 
     * @param bytes Bytes to encode
     * @return Base32-encoded string
     */
    private String base32Encode(byte[] bytes) {
        String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        StringBuilder result = new StringBuilder();
        
        int buffer = 0;
        int bitsLeft = 0;
        
        for (byte b : bytes) {
            buffer = (buffer << 8) | (b & 0xFF);
            bitsLeft += 8;
            
            while (bitsLeft >= 5) {
                result.append(alphabet.charAt((buffer >> (bitsLeft - 5)) & 0x1F));
                bitsLeft -= 5;
            }
        }
        
        if (bitsLeft > 0) {
            result.append(alphabet.charAt((buffer << (5 - bitsLeft)) & 0x1F));
        }
        
        return result.toString();
    }

    /**
     * Decodes Base32 string to bytes.
     * 
     * @param base32 Base32-encoded string
     * @return Decoded bytes
     */
    private byte[] base32Decode(String base32) {
        String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        base32 = base32.toUpperCase().replaceAll("[^A-Z2-7]", "");
        
        ByteArrayOutputStream result = new ByteArrayOutputStream();
        int buffer = 0;
        int bitsLeft = 0;
        
        for (char c : base32.toCharArray()) {
            int value = alphabet.indexOf(c);
            if (value < 0) continue;
            
            buffer = (buffer << 5) | value;
            bitsLeft += 5;
            
            if (bitsLeft >= 8) {
                result.write((buffer >> (bitsLeft - 8)) & 0xFF);
                bitsLeft -= 8;
            }
        }
        
        return result.toByteArray();
    }

    /**
     * Converts long to byte array (big-endian).
     * 
     * @param value Long value
     * @return Byte array
     */
    private byte[] longToBytes(long value) {
        byte[] result = new byte[8];
        for (int i = 7; i >= 0; i--) {
            result[i] = (byte) (value & 0xFF);
            value >>= 8;
        }
        return result;
    }
}