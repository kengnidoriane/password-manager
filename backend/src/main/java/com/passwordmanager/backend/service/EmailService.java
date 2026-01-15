package com.passwordmanager.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service for sending email notifications.
 * 
 * This service handles:
 * - Account recovery notifications
 * - Security alerts
 * - Account activity notifications
 * 
 * Note: This is a simplified implementation for demonstration.
 * In production, this would integrate with an email service provider
 * like SendGrid, AWS SES, or similar.
 * 
 * Requirements: 15.4
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${app.name:Password Manager}")
    private String appName;

    @Value("${app.support-email:support@passwordmanager.com}")
    private String supportEmail;

    @Value("${email.enabled:false}")
    private boolean emailEnabled;

    /**
     * Sends an account recovery notification email.
     * 
     * This method sends an email to notify the user that their account
     * has been recovered using the backup recovery key.
     * 
     * @param userEmail the user's email address
     * @param recoveryTimestamp when the recovery occurred
     * @param clientIp the IP address from which recovery was initiated
     * @param deviceInfo information about the device used for recovery
     */
    public void sendRecoveryNotification(String userEmail, LocalDateTime recoveryTimestamp, 
                                       String clientIp, String deviceInfo) {
        logger.info("Sending recovery notification to: {}", userEmail);

        if (!emailEnabled) {
            logger.warn("Email service is disabled. Recovery notification not sent to: {}", userEmail);
            return;
        }

        try {
            String subject = String.format("[%s] Account Recovery Completed", appName);
            String body = buildRecoveryNotificationBody(userEmail, recoveryTimestamp, clientIp, deviceInfo);

            // In a real implementation, this would send the email via an email service provider
            sendEmail(userEmail, subject, body);

            logger.info("Recovery notification sent successfully to: {}", userEmail);

        } catch (Exception e) {
            logger.error("Failed to send recovery notification to {}: {}", userEmail, e.getMessage());
            // Don't throw exception - email failure shouldn't break recovery process
        }
    }

    /**
     * Sends a security alert email.
     * 
     * @param userEmail the user's email address
     * @param alertType the type of security alert
     * @param alertMessage the alert message
     * @param timestamp when the alert occurred
     */
    public void sendSecurityAlert(String userEmail, String alertType, String alertMessage, LocalDateTime timestamp) {
        logger.info("Sending security alert to: {} (type: {})", userEmail, alertType);

        if (!emailEnabled) {
            logger.warn("Email service is disabled. Security alert not sent to: {}", userEmail);
            return;
        }

        try {
            String subject = String.format("[%s] Security Alert: %s", appName, alertType);
            String body = buildSecurityAlertBody(userEmail, alertType, alertMessage, timestamp);

            sendEmail(userEmail, subject, body);

            logger.info("Security alert sent successfully to: {}", userEmail);

        } catch (Exception e) {
            logger.error("Failed to send security alert to {}: {}", userEmail, e.getMessage());
        }
    }

    /**
     * Builds the recovery notification email body.
     */
    private String buildRecoveryNotificationBody(String userEmail, LocalDateTime recoveryTimestamp, 
                                               String clientIp, String deviceInfo) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        return String.format("""
            Dear %s user,
            
            Your account has been successfully recovered using your backup recovery key.
            
            Recovery Details:
            - Date & Time: %s UTC
            - IP Address: %s
            - Device: %s
            
            If you did not initiate this recovery, please contact our support team immediately at %s.
            
            For your security:
            - A new recovery key has been generated
            - All existing sessions have been invalidated
            - Your vault data has been marked for re-encryption with your new master password
            
            Please ensure you save your new recovery key in a secure location.
            
            Best regards,
            The %s Team
            
            ---
            This is an automated security notification. Please do not reply to this email.
            If you need assistance, contact us at %s
            """, 
            appName,
            recoveryTimestamp.format(formatter),
            clientIp,
            deviceInfo,
            supportEmail,
            appName,
            supportEmail
        );
    }

    /**
     * Builds the security alert email body.
     */
    private String buildSecurityAlertBody(String userEmail, String alertType, String alertMessage, LocalDateTime timestamp) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        return String.format("""
            Dear %s user,
            
            We detected a security event on your account:
            
            Alert Type: %s
            Message: %s
            Date & Time: %s UTC
            
            If this was not you, please:
            1. Change your master password immediately
            2. Review your account activity
            3. Contact our support team at %s
            
            Best regards,
            The %s Team
            
            ---
            This is an automated security notification. Please do not reply to this email.
            If you need assistance, contact us at %s
            """, 
            appName,
            alertType,
            alertMessage,
            timestamp.format(formatter),
            supportEmail,
            appName,
            supportEmail
        );
    }

    /**
     * Sends an email (placeholder implementation).
     * 
     * In a real implementation, this would integrate with an email service provider.
     */
    private void sendEmail(String to, String subject, String body) {
        // Placeholder implementation - in production, integrate with:
        // - Spring Boot Mail Starter with SMTP
        // - AWS SES
        // - SendGrid
        // - Mailgun
        // - etc.
        
        logger.info("EMAIL SENT (simulated):");
        logger.info("To: {}", to);
        logger.info("Subject: {}", subject);
        logger.info("Body: {}", body);
        
        // Simulate email sending delay
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}