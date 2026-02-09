package com.passwordmanager.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Service for checking passwords against breach databases using k-anonymity.
 * 
 * This service uses the Have I Been Pwned API with k-anonymity to check
 * if passwords have been compromised in known data breaches without
 * revealing the full password hash.
 * 
 * Results are cached for 24 hours to minimize API calls and improve performance.
 * 
 * Requirements: 8.1
 */
@Service
public class BreachCheckService {

    private static final Logger logger = LoggerFactory.getLogger(BreachCheckService.class);
    private static final String HIBP_API_URL = "https://api.pwnedpasswords.com/range/";
    
    private final RestTemplate restTemplate;
    private final CacheMetricsService cacheMetricsService;

    public BreachCheckService(RestTemplate restTemplate, CacheMetricsService cacheMetricsService) {
        this.restTemplate = restTemplate;
        this.cacheMetricsService = cacheMetricsService;
    }

    /**
     * Checks if a password has been found in known data breaches.
     * Uses k-anonymity by only sending the first 5 characters of the SHA-1 hash.
     * Results are cached for 24 hours.
     * 
     * @param password the password to check
     * @return true if the password has been breached, false otherwise
     */
    @Cacheable(value = "breachCheck", key = "#password", unless = "#result == null")
    public Boolean isPasswordBreached(String password) {
        try {
            cacheMetricsService.recordCacheMiss("breachCheck");
            
            // Generate SHA-1 hash of the password
            String sha1Hash = generateSHA1(password);
            if (sha1Hash == null) {
                logger.error("Failed to generate SHA-1 hash for password");
                return false;
            }

            // Use k-anonymity: send only first 5 characters
            String hashPrefix = sha1Hash.substring(0, 5);
            String hashSuffix = sha1Hash.substring(5);

            // Query HIBP API
            String apiUrl = HIBP_API_URL + hashPrefix;
            logger.debug("Checking password breach status with hash prefix: {}", hashPrefix);

            String response = restTemplate.getForObject(apiUrl, String.class);
            
            if (response == null || response.isEmpty()) {
                return false;
            }

            // Check if our hash suffix appears in the response
            String[] lines = response.split("\n");
            for (String line : lines) {
                String[] parts = line.split(":");
                if (parts.length == 2 && parts[0].equalsIgnoreCase(hashSuffix)) {
                    int count = Integer.parseInt(parts[1].trim());
                    logger.info("Password found in {} breaches", count);
                    return true;
                }
            }

            return false;
        } catch (Exception e) {
            logger.error("Error checking password breach status: {}", e.getMessage());
            // Return false on error to avoid blocking user operations
            return false;
        }
    }

    /**
     * Checks if a password has been found in breaches and returns the count.
     * Uses k-anonymity for privacy.
     * Results are cached for 24 hours.
     * 
     * @param password the password to check
     * @return the number of times the password has been seen in breaches, 0 if not found
     */
    @Cacheable(value = "breachCheck", key = "'count:' + #password", unless = "#result == null")
    public Integer getBreachCount(String password) {
        try {
            cacheMetricsService.recordCacheMiss("breachCheck");
            
            // Generate SHA-1 hash of the password
            String sha1Hash = generateSHA1(password);
            if (sha1Hash == null) {
                logger.error("Failed to generate SHA-1 hash for password");
                return 0;
            }

            // Use k-anonymity: send only first 5 characters
            String hashPrefix = sha1Hash.substring(0, 5);
            String hashSuffix = sha1Hash.substring(5);

            // Query HIBP API
            String apiUrl = HIBP_API_URL + hashPrefix;
            logger.debug("Checking password breach count with hash prefix: {}", hashPrefix);

            String response = restTemplate.getForObject(apiUrl, String.class);
            
            if (response == null || response.isEmpty()) {
                return 0;
            }

            // Check if our hash suffix appears in the response
            String[] lines = response.split("\n");
            for (String line : lines) {
                String[] parts = line.split(":");
                if (parts.length == 2 && parts[0].equalsIgnoreCase(hashSuffix)) {
                    int count = Integer.parseInt(parts[1].trim());
                    logger.info("Password found in {} breaches", count);
                    return count;
                }
            }

            return 0;
        } catch (Exception e) {
            logger.error("Error checking password breach count: {}", e.getMessage());
            return 0;
        }
    }

    /**
     * Generates SHA-1 hash of a string.
     * 
     * @param input the input string
     * @return uppercase hexadecimal SHA-1 hash, or null on error
     */
    private String generateSHA1(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            
            // Convert to hexadecimal
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return hexString.toString().toUpperCase();
        } catch (NoSuchAlgorithmException e) {
            logger.error("SHA-1 algorithm not available: {}", e.getMessage());
            return null;
        }
    }
}
