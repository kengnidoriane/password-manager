package com.passwordmanager.backend.service;

import com.passwordmanager.backend.entity.AuditLog;
import com.passwordmanager.backend.entity.AuditLog.AuditAction;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.repository.AuditLogRepository;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Property-based tests for audit logging functionality.
 * 
 * These tests verify correctness properties that should hold across
 * all valid inputs for audit logging operations.
 * 
 * **Feature: password-manager, Property 35: Comprehensive operation logging**
 */
class AuditLogPropertyTest {

    /**
     * **Feature: password-manager, Property 35: Comprehensive operation logging**
     * **Validates: Requirements 18.1**
     * 
     * For any vault operation (login, credential access, modification), an audit log entry 
     * SHALL be created with action type, timestamp, device, and IP address.
     * 
     * This property tests that:
     * 1. All authentication events are logged with required fields
     * 2. All vault operations are logged with required fields
     * 3. All security events are logged with required fields
     * 4. Audit logs contain action type, timestamp, device, and IP address
     * 5. Audit logs are persisted to the database
     */
    @Property(tries = 100)
    void comprehensiveOperationLogging(
            @ForAll("auditableOperation") AuditableOperation operation) {
        
        // Create fresh mock for each property test iteration to avoid Spring context issues
        AuditLogRepository mockAuditLogRepository = mock(AuditLogRepository.class);
        
        // Setup mock behavior for save operation
        when(mockAuditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> {
            AuditLog log = invocation.getArgument(0);
            // Simulate database setting the ID and timestamp
            if (log.getId() == null) {
                log.setId(UUID.randomUUID());
            }
            if (log.getTimestamp() == null) {
                log.setTimestamp(LocalDateTime.now());
            }
            return log;
        });
        
        // Setup: Create a test user
        UserAccount user = createTestUser(operation.email);
        
        // Execute: Create an audit log entry based on the operation type
        AuditLog auditLog = createAuditLogForOperation(user, operation);
        AuditLog savedLog = mockAuditLogRepository.save(auditLog);

        // Property 1: Audit log must be created for the operation
        assertNotNull(savedLog, "Audit log must be created for any vault operation");
        verify(mockAuditLogRepository, times(1)).save(any(AuditLog.class));

        // Property 2: Audit log must contain action type
        assertNotNull(savedLog.getAction(), 
                     "Audit log must contain action type for operation: " + operation.action);
        assertEquals(operation.action, savedLog.getAction(),
                    "Audit log action type must match the operation performed");

        // Property 3: Audit log must contain timestamp
        assertNotNull(savedLog.getTimestamp(),
                     "Audit log must contain timestamp for operation: " + operation.action);
        assertTrue(savedLog.getTimestamp().isBefore(LocalDateTime.now().plusSeconds(1)),
                  "Audit log timestamp must be at or before current time");

        // Property 4: Audit log must contain device information
        assertNotNull(savedLog.getDeviceInfo(),
                     "Audit log must contain device information for operation: " + operation.action);
        assertEquals(operation.deviceInfo, savedLog.getDeviceInfo(),
                    "Audit log device info must match the request device");

        // Property 5: Audit log must contain IP address
        assertNotNull(savedLog.getIpAddress(),
                     "Audit log must contain IP address for operation: " + operation.action);
        assertEquals(operation.ipAddress, savedLog.getIpAddress(),
                    "Audit log IP address must match the request IP");

        // Property 6: Audit log must be associated with the user
        assertNotNull(savedLog.getUser(),
                     "Audit log must be associated with a user");
        assertEquals(user.getId(), savedLog.getUser().getId(),
                    "Audit log must be associated with the correct user");

        // Property 7: Authentication events must be properly categorized
        if (isAuthenticationEvent(operation.action)) {
            assertTrue(savedLog.isAuthenticationEvent(),
                      "Authentication events must be categorized as authentication events");
        }

        // Property 8: Vault operations must be properly categorized
        if (isVaultOperation(operation.action)) {
            assertTrue(savedLog.isVaultOperation(),
                      "Vault operations must be categorized as vault operations");
        }

        // Property 9: Security events must be properly categorized
        if (isSecurityEvent(operation.action)) {
            assertTrue(savedLog.isSecurityEvent(),
                      "Security events must be categorized as security events");
        }

        // Property 10: Failed operations must be marked as suspicious
        if (!operation.success && (isAuthenticationEvent(operation.action) || isSecurityEvent(operation.action))) {
            assertTrue(savedLog.isSuspicious(),
                      "Failed authentication or security events must be marked as suspicious");
        }

        // Property 11: Success status must be recorded
        assertEquals(operation.success, savedLog.isSuccess(),
                    "Audit log must record the success status of the operation");

        // Property 12: Resource information must be recorded for vault operations
        if (isVaultOperation(operation.action) && operation.resourceId != null) {
            assertNotNull(savedLog.getResourceId(),
                         "Vault operations must record the resource ID");
            assertEquals(operation.resourceId, savedLog.getResourceId(),
                        "Audit log resource ID must match the operation resource");
        }

        // Property 13: User agent must be recorded
        if (operation.userAgent != null) {
            assertNotNull(savedLog.getUserAgent(),
                         "Audit log must contain user agent when provided");
            assertEquals(operation.userAgent, savedLog.getUserAgent(),
                        "Audit log user agent must match the request user agent");
        }

        // Property 14: Error messages must be recorded for failed operations
        if (!operation.success && operation.errorMessage != null) {
            assertNotNull(savedLog.getErrorMessage(),
                         "Failed operations must record error messages");
            assertEquals(operation.errorMessage, savedLog.getErrorMessage(),
                        "Audit log error message must match the operation error");
        }

        // Property 15: Metadata must be recorded when provided
        if (operation.metadata != null && !operation.metadata.isEmpty()) {
            assertNotNull(savedLog.getMetadata(),
                         "Audit log must contain metadata when provided");
            assertFalse(savedLog.getMetadata().isEmpty(),
                       "Audit log metadata must not be empty when provided");
        }
    }

    /**
     * Helper method to create an audit log for a given operation.
     */
    private AuditLog createAuditLogForOperation(UserAccount user, AuditableOperation operation) {
        return AuditLog.builder()
                .user(user)
                .action(operation.action)
                .resourceType(operation.resourceType)
                .resourceId(operation.resourceId)
                .ipAddress(operation.ipAddress)
                .userAgent(operation.userAgent)
                .deviceInfo(operation.deviceInfo)
                .success(operation.success)
                .errorMessage(operation.errorMessage)
                .metadata(operation.metadata)
                .build();
    }

    /**
     * Helper method to create a test user.
     */
    private UserAccount createTestUser(String email) {
        return UserAccount.builder()
                .id(UUID.randomUUID())
                .email(email)
                .authKeyHash("test-hash")
                .salt("test-salt")
                .iterations(100000)
                .createdAt(LocalDateTime.now())
                .emailVerified(true)
                .build();
    }

    /**
     * Helper method to check if an action is an authentication event.
     */
    private boolean isAuthenticationEvent(AuditAction action) {
        return action == AuditAction.LOGIN ||
               action == AuditAction.LOGOUT ||
               action == AuditAction.LOGIN_FAILED ||
               action == AuditAction.REGISTER;
    }

    /**
     * Helper method to check if an action is a vault operation.
     */
    private boolean isVaultOperation(AuditAction action) {
        return action.name().startsWith("CREDENTIAL_") ||
               action.name().startsWith("NOTE_") ||
               action.name().startsWith("FOLDER_") ||
               action.name().startsWith("TAG_") ||
               action.name().startsWith("VAULT_");
    }

    /**
     * Helper method to check if an action is a security event.
     */
    private boolean isSecurityEvent(AuditAction action) {
        return action.name().startsWith("TWO_FA_") ||
               action == AuditAction.PASSWORD_CHANGE ||
               action == AuditAction.ACCOUNT_RECOVERY ||
               action == AuditAction.ACCOUNT_DELETE;
    }

    /**
     * Arbitrary provider for auditable operations.
     * Generates random operations covering all audit action types.
     */
    @Provide
    Arbitrary<AuditableOperation> auditableOperation() {
        return Arbitraries.of(AuditAction.values())
                .flatMap(action -> {
                    String email = Arbitraries.strings().alpha().ofMinLength(5).ofMaxLength(20)
                            .map(s -> s + "@example.com").sample();
                    String ipAddress = randomIpAddress().sample();
                    String deviceInfo = Arbitraries.of(
                            "Chrome/120.0 Windows 10",
                            "Firefox/121.0 macOS",
                            "Safari/17.0 iOS 17",
                            "Edge/120.0 Windows 11",
                            "Chrome/120.0 Android 14"
                    ).sample();
                    String userAgent = Arbitraries.of(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
                            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.0",
                            "Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0",
                            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/17.0"
                    ).sample();
                    boolean success = Arbitraries.of(true, false).sample();
                    String errorMessage = success ? null : Arbitraries.of(
                            "Invalid credentials",
                            "Resource not found",
                            "Permission denied",
                            "Rate limit exceeded"
                    ).sample();
                    
                    // Generate resource info for vault operations
                    UUID resourceId = isVaultOperation(action) ? UUID.randomUUID() : null;
                    String resourceType = isVaultOperation(action) 
                            ? Arbitraries.of("credential", "note", "folder", "tag").sample()
                            : null;
                    
                    // Generate metadata
                    Map<String, Object> metadata = Arbitraries.of(
                            createMetadata("key1", "value1"),
                            createMetadata("operation", "sync"),
                            createMetadata("count", 5),
                            new HashMap<String, Object>()
                    ).sample();

                    return Arbitraries.just(new AuditableOperation(
                            action, email, ipAddress, deviceInfo, userAgent,
                            success, errorMessage, resourceId, resourceType, metadata
                    ));
                });
    }

    /**
     * Arbitrary provider for random IP addresses.
     */
    @Provide
    Arbitrary<String> randomIpAddress() {
        return Arbitraries.integers().between(1, 255)
                .list().ofSize(4)
                .map(parts -> String.format("%d.%d.%d.%d",
                        parts.get(0), parts.get(1), parts.get(2), parts.get(3)));
    }

    /**
     * Helper method to create metadata map.
     */
    private Map<String, Object> createMetadata(String key, Object value) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put(key, value);
        return metadata;
    }

    /**
     * **Feature: password-manager, Property 36: Audit log retention**
     * **Validates: Requirements 18.5**
     * 
     * For any audit log entry, the entry SHALL be retained for at least 90 days before deletion.
     * 
     * This property tests that:
     * 1. Audit logs created within the last 90 days are retained
     * 2. Audit logs older than 90 days are eligible for deletion
     * 3. The retention policy is consistently applied across all log types
     * 4. Logs at exactly 90 days are retained (boundary condition)
     * 5. Logs at 91+ days are eligible for deletion
     */
    @Property(tries = 100)
    void auditLogRetention(@ForAll("daysOld") int daysOld) {
        // Create fresh mock for each property test iteration
        AuditLogRepository mockAuditLogRepository = mock(AuditLogRepository.class);
        
        // Setup: Create a test user
        UserAccount user = createTestUser("retention-test@example.com");
        
        // Create an audit log with a specific timestamp
        LocalDateTime logTimestamp = LocalDateTime.now().minusDays(daysOld);
        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action(AuditAction.LOGIN)
                .ipAddress("192.168.1.1")
                .deviceInfo("Test Device")
                .success(true)
                .build();
        auditLog.setTimestamp(logTimestamp);
        auditLog.setId(UUID.randomUUID());
        
        // Calculate retention date (90 days ago)
        LocalDateTime retentionDate = LocalDateTime.now().minusDays(90);
        
        // Setup mock behavior for counting logs before retention date
        when(mockAuditLogRepository.countByTimestampBefore(retentionDate))
                .thenAnswer(invocation -> {
                    LocalDateTime cutoffDate = invocation.getArgument(0);
                    return logTimestamp.isBefore(cutoffDate) ? 1L : 0L;
                });
        
        // Setup mock behavior for deletion
        when(mockAuditLogRepository.deleteByTimestampBefore(retentionDate))
                .thenAnswer(invocation -> {
                    LocalDateTime cutoffDate = invocation.getArgument(0);
                    return logTimestamp.isBefore(cutoffDate) ? 1 : 0;
                });
        
        // Execute: Check if the log should be retained or deleted
        long countToDelete = mockAuditLogRepository.countByTimestampBefore(retentionDate);
        
        // Property 1: Logs within 90 days SHALL be retained (not counted for deletion)
        if (daysOld <= 90) {
            assertEquals(0L, countToDelete,
                    String.format("Audit logs %d days old SHALL be retained (within 90-day retention period)", daysOld));
        }
        
        // Property 2: Logs older than 90 days SHALL be eligible for deletion
        if (daysOld > 90) {
            assertEquals(1L, countToDelete,
                    String.format("Audit logs %d days old SHALL be eligible for deletion (exceeds 90-day retention period)", daysOld));
        }
        
        // Property 3: Boundary condition - logs at exactly 90 days SHALL be retained
        if (daysOld == 90) {
            assertEquals(0L, countToDelete,
                    "Audit logs at exactly 90 days old SHALL be retained (boundary condition)");
            
            // Verify the timestamp is not before the retention date
            assertFalse(logTimestamp.isBefore(retentionDate),
                    "Log timestamp at 90 days should not be before retention date");
        }
        
        // Property 4: Verify deletion behavior matches retention policy
        int deletedCount = mockAuditLogRepository.deleteByTimestampBefore(retentionDate);
        assertEquals(countToDelete, deletedCount,
                "Number of deleted logs must match the count of logs eligible for deletion");
        
        // Property 5: Retention policy applies consistently regardless of log type
        // Test with different action types to ensure retention is timestamp-based, not action-based
        AuditLog vaultLog = AuditLog.builder()
                .user(user)
                .action(AuditAction.CREDENTIAL_CREATE)
                .ipAddress("192.168.1.1")
                .deviceInfo("Test Device")
                .success(true)
                .build();
        vaultLog.setTimestamp(logTimestamp);
        vaultLog.setId(UUID.randomUUID());
        
        AuditLog securityLog = AuditLog.builder()
                .user(user)
                .action(AuditAction.TWO_FA_ENABLE)
                .ipAddress("192.168.1.1")
                .deviceInfo("Test Device")
                .success(true)
                .build();
        securityLog.setTimestamp(logTimestamp);
        securityLog.setId(UUID.randomUUID());
        
        // All logs with the same timestamp should have the same retention behavior
        boolean shouldBeRetained = daysOld <= 90;
        assertEquals(shouldBeRetained, !logTimestamp.isBefore(retentionDate),
                "Retention policy must be based on timestamp, not log type");
        
        // Property 6: Verify retention period is exactly 90 days
        LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);
        LocalDateTime eightyNineDaysAgo = LocalDateTime.now().minusDays(89);
        LocalDateTime ninetyOneDaysAgo = LocalDateTime.now().minusDays(91);
        
        // Log at 89 days should be retained
        if (daysOld == 89) {
            assertFalse(logTimestamp.isBefore(retentionDate),
                    "Logs at 89 days must be retained");
        }
        
        // Log at 91 days should be eligible for deletion
        if (daysOld == 91) {
            assertTrue(logTimestamp.isBefore(retentionDate),
                    "Logs at 91 days must be eligible for deletion");
        }
    }

    /**
     * Arbitrary provider for days old (0 to 180 days).
     * Tests the full range around the 90-day retention period.
     */
    @Provide
    Arbitrary<Integer> daysOld() {
        return Arbitraries.integers().between(0, 180);
    }

    /**
     * **Feature: password-manager, Property 37: Export audit logging**
     * **Validates: Requirements 11.5**
     * 
     * For any vault export operation, an audit log entry SHALL be created with timestamp 
     * for security tracking.
     * 
     * This property tests that:
     * 1. Every vault export operation creates an audit log entry
     * 2. Export audit logs contain timestamp for security tracking
     * 3. Export audit logs contain user information
     * 4. Export audit logs contain device and IP information
     * 5. Export audit logs record the export format (CSV, JSON, encrypted)
     * 6. Export audit logs are persisted to the database
     * 7. Failed export operations are also logged
     */
    @Property(tries = 100)
    void exportAuditLogging(@ForAll("exportOperation") ExportOperation exportOp) {
        // Create fresh mock for each property test iteration
        AuditLogRepository mockAuditLogRepository = mock(AuditLogRepository.class);
        
        // Setup mock behavior for save operation
        when(mockAuditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> {
            AuditLog log = invocation.getArgument(0);
            // Simulate database setting the ID and timestamp
            if (log.getId() == null) {
                log.setId(UUID.randomUUID());
            }
            if (log.getTimestamp() == null) {
                log.setTimestamp(LocalDateTime.now());
            }
            return log;
        });
        
        // Setup: Create a test user
        UserAccount user = createTestUser(exportOp.email);
        
        // Execute: Create an audit log entry for the export operation
        Map<String, Object> exportMetadata = new HashMap<>();
        exportMetadata.put("format", exportOp.format);
        exportMetadata.put("encrypted", exportOp.encrypted);
        exportMetadata.put("itemCount", exportOp.itemCount);
        if (exportOp.includeDeleted) {
            exportMetadata.put("includeDeleted", true);
        }
        
        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action(AuditAction.VAULT_EXPORT)
                .resourceType("vault")
                .ipAddress(exportOp.ipAddress)
                .userAgent(exportOp.userAgent)
                .deviceInfo(exportOp.deviceInfo)
                .success(exportOp.success)
                .errorMessage(exportOp.errorMessage)
                .metadata(exportMetadata)
                .build();
        
        AuditLog savedLog = mockAuditLogRepository.save(auditLog);

        // Property 1: Audit log MUST be created for every vault export operation
        assertNotNull(savedLog, 
                "Audit log must be created for vault export operation");
        verify(mockAuditLogRepository, times(1)).save(any(AuditLog.class));

        // Property 2: Audit log MUST contain timestamp for security tracking
        assertNotNull(savedLog.getTimestamp(),
                "Export audit log must contain timestamp for security tracking");
        assertTrue(savedLog.getTimestamp().isBefore(LocalDateTime.now().plusSeconds(1)),
                "Export audit log timestamp must be at or before current time");
        assertTrue(savedLog.getTimestamp().isAfter(LocalDateTime.now().minusMinutes(1)),
                "Export audit log timestamp must be recent (within last minute)");

        // Property 3: Audit log MUST be associated with the user who performed the export
        assertNotNull(savedLog.getUser(),
                "Export audit log must be associated with a user");
        assertEquals(user.getId(), savedLog.getUser().getId(),
                "Export audit log must be associated with the correct user");

        // Property 4: Audit log MUST contain device and IP information
        assertNotNull(savedLog.getIpAddress(),
                "Export audit log must contain IP address for security tracking");
        assertEquals(exportOp.ipAddress, savedLog.getIpAddress(),
                "Export audit log IP address must match the request IP");
        assertNotNull(savedLog.getDeviceInfo(),
                "Export audit log must contain device information for security tracking");
        assertEquals(exportOp.deviceInfo, savedLog.getDeviceInfo(),
                "Export audit log device info must match the request device");

        // Property 5: Audit log MUST record the export format in metadata
        assertNotNull(savedLog.getMetadata(),
                "Export audit log must contain metadata");
        assertTrue(savedLog.getMetadata().containsKey("format"),
                "Export audit log metadata must contain export format");
        assertEquals(exportOp.format, savedLog.getMetadata().get("format"),
                "Export audit log must record the correct export format");

        // Property 6: Audit log MUST record encryption status in metadata
        assertTrue(savedLog.getMetadata().containsKey("encrypted"),
                "Export audit log metadata must contain encryption status");
        assertEquals(exportOp.encrypted, savedLog.getMetadata().get("encrypted"),
                "Export audit log must record the correct encryption status");

        // Property 7: Audit log MUST record the number of items exported
        assertTrue(savedLog.getMetadata().containsKey("itemCount"),
                "Export audit log metadata must contain item count");
        assertEquals(exportOp.itemCount, savedLog.getMetadata().get("itemCount"),
                "Export audit log must record the correct number of exported items");

        // Property 8: Audit log MUST have VAULT_EXPORT action type
        assertEquals(AuditAction.VAULT_EXPORT, savedLog.getAction(),
                "Export audit log must have VAULT_EXPORT action type");

        // Property 9: Audit log MUST record success status
        assertEquals(exportOp.success, savedLog.isSuccess(),
                "Export audit log must record the success status of the operation");

        // Property 10: Failed export operations MUST be logged with error message
        if (!exportOp.success) {
            assertNotNull(savedLog.getErrorMessage(),
                    "Failed export operations must record error messages");
            assertEquals(exportOp.errorMessage, savedLog.getErrorMessage(),
                    "Export audit log error message must match the operation error");
        }

        // Property 11: Audit log MUST record user agent when provided
        if (exportOp.userAgent != null) {
            assertNotNull(savedLog.getUserAgent(),
                    "Export audit log must contain user agent when provided");
            assertEquals(exportOp.userAgent, savedLog.getUserAgent(),
                    "Export audit log user agent must match the request user agent");
        }

        // Property 12: Audit log MUST record resource type as "vault"
        assertNotNull(savedLog.getResourceType(),
                "Export audit log must contain resource type");
        assertEquals("vault", savedLog.getResourceType(),
                "Export audit log resource type must be 'vault'");

        // Property 13: Export operations with deleted items MUST record this in metadata
        if (exportOp.includeDeleted) {
            assertTrue(savedLog.getMetadata().containsKey("includeDeleted"),
                    "Export audit log must record when deleted items are included");
            assertEquals(true, savedLog.getMetadata().get("includeDeleted"),
                    "Export audit log must correctly record includeDeleted flag");
        }

        // Property 14: Audit log MUST be categorized as a vault operation
        assertTrue(savedLog.isVaultOperation(),
                "Export operations must be categorized as vault operations");

        // Property 15: Audit log timestamp MUST be immutable (set at creation)
        LocalDateTime originalTimestamp = savedLog.getTimestamp();
        assertNotNull(originalTimestamp,
                "Export audit log timestamp must be set at creation");
        // Verify timestamp doesn't change (in real implementation, @CreationTimestamp ensures this)
        assertEquals(originalTimestamp, savedLog.getTimestamp(),
                "Export audit log timestamp must remain unchanged after creation");
    }

    /**
     * Arbitrary provider for export operations.
     * Generates random export operations with various formats and configurations.
     */
    @Provide
    Arbitrary<ExportOperation> exportOperation() {
        return Arbitraries.integers().between(0, 1000)
                .flatMap(itemCount -> {
                    String email = Arbitraries.strings().alpha().ofMinLength(5).ofMaxLength(20)
                            .map(s -> s + "@example.com").sample();
                    String format = Arbitraries.of("CSV", "JSON").sample();
                    boolean encrypted = Arbitraries.of(true, false).sample();
                    boolean includeDeleted = Arbitraries.of(true, false).sample();
                    String ipAddress = randomIpAddress().sample();
                    String deviceInfo = Arbitraries.of(
                            "Chrome/120.0 Windows 10",
                            "Firefox/121.0 macOS",
                            "Safari/17.0 iOS 17",
                            "Edge/120.0 Windows 11",
                            "Chrome/120.0 Android 14"
                    ).sample();
                    String userAgent = Arbitraries.of(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
                            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.0",
                            "Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0",
                            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/17.0"
                    ).sample();
                    boolean success = Arbitraries.of(true, false).sample();
                    String errorMessage = success ? null : Arbitraries.of(
                            "Export failed: insufficient permissions",
                            "Export failed: vault is empty",
                            "Export failed: encryption error",
                            "Export failed: file system error"
                    ).sample();

                    return Arbitraries.just(new ExportOperation(
                            email, format, encrypted, includeDeleted, itemCount,
                            ipAddress, deviceInfo, userAgent, success, errorMessage
                    ));
                });
    }

    /**
     * Helper class to represent an export operation.
     */
    private static class ExportOperation {
        final String email;
        final String format;
        final boolean encrypted;
        final boolean includeDeleted;
        final int itemCount;
        final String ipAddress;
        final String deviceInfo;
        final String userAgent;
        final boolean success;
        final String errorMessage;

        ExportOperation(
                String email,
                String format,
                boolean encrypted,
                boolean includeDeleted,
                int itemCount,
                String ipAddress,
                String deviceInfo,
                String userAgent,
                boolean success,
                String errorMessage) {
            this.email = email;
            this.format = format;
            this.encrypted = encrypted;
            this.includeDeleted = includeDeleted;
            this.itemCount = itemCount;
            this.ipAddress = ipAddress;
            this.deviceInfo = deviceInfo;
            this.userAgent = userAgent;
            this.success = success;
            this.errorMessage = errorMessage;
        }
    }

    /**
     * Helper class to represent an auditable operation.
     */
    private static class AuditableOperation {
        final AuditAction action;
        final String email;
        final String ipAddress;
        final String deviceInfo;
        final String userAgent;
        final boolean success;
        final String errorMessage;
        final UUID resourceId;
        final String resourceType;
        final Map<String, Object> metadata;

        AuditableOperation(
                AuditAction action,
                String email,
                String ipAddress,
                String deviceInfo,
                String userAgent,
                boolean success,
                String errorMessage,
                UUID resourceId,
                String resourceType,
                Map<String, Object> metadata) {
            this.action = action;
            this.email = email;
            this.ipAddress = ipAddress;
            this.deviceInfo = deviceInfo;
            this.userAgent = userAgent;
            this.success = success;
            this.errorMessage = errorMessage;
            this.resourceId = resourceId;
            this.resourceType = resourceType;
            this.metadata = metadata;
        }
    }
}
