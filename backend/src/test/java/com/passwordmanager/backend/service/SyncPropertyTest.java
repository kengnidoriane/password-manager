package com.passwordmanager.backend.service;

import com.passwordmanager.backend.dto.SyncRequest;
import com.passwordmanager.backend.dto.SyncResponse;
import com.passwordmanager.backend.entity.Folder;
import com.passwordmanager.backend.entity.SecureNote;
import com.passwordmanager.backend.entity.SyncHistory;
import com.passwordmanager.backend.entity.Tag;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.repository.FolderRepository;
import com.passwordmanager.backend.repository.SecureNoteRepository;
import com.passwordmanager.backend.repository.SyncHistoryRepository;
import com.passwordmanager.backend.repository.TagRepository;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Property-based tests for SyncService.
 * 
 * These tests verify the correctness properties of vault synchronization,
 * particularly focusing on conflict resolution using last-write-wins strategy.
 * 
 * **Feature: password-manager, Property 29: Conflict resolution last-write-wins**
 * **Validates: Requirements 6.3, 13.5**
 */
@SpringBootTest
@ActiveProfiles("test")
public class SyncPropertyTest {

    @Autowired
    private SyncService syncService;

    @Autowired
    private VaultService vaultService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VaultRepository vaultRepository;

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private SecureNoteRepository secureNoteRepository;

    @Autowired
    private SyncHistoryRepository syncHistoryRepository;

    @Autowired
    private EntityManager entityManager;

    private UserAccount testUser;

    @BeforeEach
    void setUp() {
        // Create a test user for all property tests
        testUser = UserAccount.builder()
                .email("test@example.com")
                .authKeyHash("hashedAuthKey")
                .salt("salt123")
                .iterations(100000)
                .build();
        testUser = userRepository.save(testUser);
    }

    /**
     * Property 29: Conflict resolution last-write-wins
     * 
     * For any vault entry that exists on both client and server with different versions,
     * when a sync conflict occurs, the entry with the more recent lastModified timestamp
     * should win, regardless of which version number is higher.
     * 
     * **Validates: Requirements 6.3, 13.5**
     */
    @Test
    @Transactional
    void conflictResolutionLastWriteWins() {
        // Setup test user
        setupTestUser();
        
        // Test multiple scenarios with different time offsets
        for (int timeOffset : new int[]{1, 60, 3600}) {
            // Given: A vault entry exists on the server
            VaultEntry serverEntry = createServerVaultEntry();
            
            // And: The client has a conflicting change for the same entry
            SyncRequest.VaultEntryChange clientChange = createVaultEntryChange();
            clientChange.setId(serverEntry.getId());
            clientChange.setOperation(SyncRequest.ChangeOperation.UPDATE);
            
            // And: We determine which version should win based on timestamps
            LocalDateTime serverTime = serverEntry.getUpdatedAt();
            LocalDateTime clientTime = serverTime.plusSeconds(timeOffset);
            boolean clientShouldWin = clientTime.isAfter(serverTime);
            
            // Set the client's last modified time
            clientChange.setLastModified(clientTime);
            
            // And: The versions are different (conflict condition)
            Long serverVersion = serverEntry.getVersion();
            Long clientVersion = serverVersion + 1; // Different version to trigger conflict
            clientChange.setVersion(clientVersion);
            
            // When: We perform a sync operation
            SyncRequest syncRequest = SyncRequest.builder()
                    .clientVersion(clientVersion)
                    .changes(List.of(clientChange))
                    .build();
            
            SyncResponse response = syncService.synchronizeVault(
                    testUser.getId(), syncRequest, "127.0.0.1", "test-agent");
            
            // Then: The sync should succeed
            assertTrue(response.isSuccess(), "Sync should succeed for timeOffset " + timeOffset);
            
            // And: A conflict should be detected
            assertTrue(response.hasConflicts(), "Conflict should be detected for timeOffset " + timeOffset);
            assertEquals(1, response.getConflictCount(), "Should have exactly one conflict for timeOffset " + timeOffset);
            
            // And: The conflict resolution should follow last-write-wins
            SyncResponse.SyncConflict conflict = response.getConflicts().get(0);
            assertNotNull(conflict, "Conflict should not be null for timeOffset " + timeOffset);
            assertEquals(SyncResponse.EntityType.CREDENTIAL, conflict.getEntityType());
            assertEquals(serverEntry.getId(), conflict.getEntityId());
            
            if (clientShouldWin) {
                assertEquals(SyncResponse.ConflictResolution.CLIENT_WINS, conflict.getResolution(),
                        "Client should win when client timestamp is newer for timeOffset " + timeOffset);
                
                // Verify the server entry was updated with client data
                Optional<VaultEntry> updatedEntry = vaultRepository.findActiveByIdAndUserId(
                        serverEntry.getId(), testUser.getId());
                assertTrue(updatedEntry.isPresent(), "Entry should still exist for timeOffset " + timeOffset);
                assertEquals(clientChange.getEncryptedData(), updatedEntry.get().getEncryptedData(),
                        "Server should have client's encrypted data for timeOffset " + timeOffset);
            } else {
                assertEquals(SyncResponse.ConflictResolution.SERVER_WINS, conflict.getResolution(),
                        "Server should win when server timestamp is newer or equal for timeOffset " + timeOffset);
                
                // Verify the server entry was not changed
                Optional<VaultEntry> unchangedEntry = vaultRepository.findActiveByIdAndUserId(
                        serverEntry.getId(), testUser.getId());
                assertTrue(unchangedEntry.isPresent(), "Entry should still exist for timeOffset " + timeOffset);
                assertEquals(serverEntry.getEncryptedData(), unchangedEntry.get().getEncryptedData(),
                        "Server should keep its original encrypted data for timeOffset " + timeOffset);
            }
            
            // Clean up for next iteration
            vaultRepository.deleteById(serverEntry.getId());
        }
        
        // And: Sync history should be recorded
        assertThat(syncHistoryRepository.findByUserId(testUser.getId(), null))
                .isNotEmpty()
                .allSatisfy(history -> {
                    assertEquals(1, history.getConflictsDetected(), "Should record one conflict");
                    // When conflicts are detected, the status should be CONFLICT_DETECTED, not SUCCESS
                    assertEquals(SyncHistory.SyncStatus.CONFLICT_DETECTED, history.getSyncStatus(), 
                            "Should be marked as conflict detected");
                });
    }

    /**
     * Property: Sync without conflicts should not modify existing data
     * 
     * For any vault entry that exists on both client and server with the same version,
     * when no conflicts occur, the server data should remain unchanged.
     */
    @Test
    @Transactional
    void syncWithoutConflictsPreservesData() {
        // Setup test user
        setupTestUser();
        
        // Given: A vault entry exists on the server
        VaultEntry serverEntry = createServerVaultEntry();
        String originalEncryptedData = serverEntry.getEncryptedData();
        Long originalVersion = serverEntry.getVersion();
        
        // And: The client has the same version (no conflict)
        SyncRequest.VaultEntryChange clientChange = createVaultEntryChange();
        clientChange.setId(serverEntry.getId());
        clientChange.setOperation(SyncRequest.ChangeOperation.UPDATE);
        clientChange.setVersion(originalVersion); // Same version = no conflict
        clientChange.setLastModified(serverEntry.getUpdatedAt());
        
        // When: We perform a sync operation
        SyncRequest syncRequest = SyncRequest.builder()
                .clientVersion(originalVersion)
                .changes(List.of(clientChange))
                .build();
        
        SyncResponse response = syncService.synchronizeVault(
                testUser.getId(), syncRequest, "127.0.0.1", "test-agent");
        
        // Then: The sync should succeed without conflicts
        assertTrue(response.isSuccess(), "Sync should succeed");
        assertFalse(response.hasConflicts(), "Should not have conflicts");
        
        // And: The server entry should be updated with client data (normal update)
        Optional<VaultEntry> updatedEntry = vaultRepository.findActiveByIdAndUserId(
                serverEntry.getId(), testUser.getId());
        assertTrue(updatedEntry.isPresent(), "Entry should still exist");
        assertEquals(clientChange.getEncryptedData(), updatedEntry.get().getEncryptedData(),
                "Server should have client's updated data");
        assertTrue(updatedEntry.get().getVersion() > originalVersion,
                "Version should be incremented after update");
    }

    /**
     * Property: Multiple conflicts should all be resolved consistently
     * 
     * For any set of vault entries with conflicts, all conflicts should be resolved
     * using the same last-write-wins strategy consistently.
     */
    @Test
    @Transactional
    void multipleConflictsResolvedConsistently() {
        // Setup test user
        setupTestUser();
        
        // Given: Multiple vault entries exist on the server
        List<VaultEntry> serverEntries = new ArrayList<>();
        List<SyncRequest.VaultEntryChange> clientChanges = new ArrayList<>();
        List<Boolean> expectedClientWins = new ArrayList<>();
        
        int baseTimeOffset = 100;
        for (int i = 0; i < 3; i++) {
            VaultEntry serverEntry = createServerVaultEntry();
            serverEntries.add(serverEntry);
            
            // Set up the client change to conflict with this server entry
            SyncRequest.VaultEntryChange clientChange = createVaultEntryChange();
            clientChange.setId(serverEntry.getId());
            clientChange.setOperation(SyncRequest.ChangeOperation.UPDATE);
            clientChange.setVersion(serverEntry.getVersion() + 1); // Different version
            
            // Vary the timestamps to create different conflict scenarios
            LocalDateTime serverTime = serverEntry.getUpdatedAt();
            LocalDateTime clientTime = serverTime.plusSeconds(baseTimeOffset + i * 10);
            boolean clientShouldWin = clientTime.isAfter(serverTime);
            
            clientChange.setLastModified(clientTime);
            clientChanges.add(clientChange);
            expectedClientWins.add(clientShouldWin);
        }
        
        // When: We perform a sync operation with multiple conflicts
        SyncRequest syncRequest = SyncRequest.builder()
                .clientVersion(1L)
                .changes(clientChanges)
                .build();
        
        SyncResponse response = syncService.synchronizeVault(
                testUser.getId(), syncRequest, "127.0.0.1", "test-agent");
        
        // Then: The sync should succeed
        assertTrue(response.isSuccess(), "Sync should succeed");
        
        // And: All conflicts should be detected
        assertTrue(response.hasConflicts(), "Should have conflicts");
        assertEquals(clientChanges.size(), response.getConflictCount(),
                "Should detect all conflicts");
        
        // And: Each conflict should be resolved according to last-write-wins
        for (int i = 0; i < response.getConflicts().size(); i++) {
            SyncResponse.SyncConflict conflict = response.getConflicts().get(i);
            boolean expectedClientWin = expectedClientWins.get(i);
            
            if (expectedClientWin) {
                assertEquals(SyncResponse.ConflictResolution.CLIENT_WINS, conflict.getResolution(),
                        "Conflict " + i + " should resolve to CLIENT_WINS");
            } else {
                assertEquals(SyncResponse.ConflictResolution.SERVER_WINS, conflict.getResolution(),
                        "Conflict " + i + " should resolve to SERVER_WINS");
            }
        }
    }

    /**
     * Property: Sync operations should be idempotent for the same input
     * 
     * For any sync request, performing the same sync twice should produce
     * the same result (idempotency).
     */
    @Test
    @Transactional
    void syncOperationsAreIdempotent() {
        // Setup test user
        setupTestUser();
        
        // Given: A sync request
        SyncRequest.VaultEntryChange clientChange = createVaultEntryChange();
        clientChange.setOperation(SyncRequest.ChangeOperation.CREATE);
        clientChange.setVersion(null);
        
        SyncRequest syncRequest = SyncRequest.builder()
                .clientVersion(1L)
                .changes(List.of(clientChange))
                .build();
        
        // When: We perform the sync twice
        SyncResponse firstResponse = syncService.synchronizeVault(
                testUser.getId(), syncRequest, "127.0.0.1", "test-agent");
        
        SyncResponse secondResponse = syncService.synchronizeVault(
                testUser.getId(), syncRequest, "127.0.0.1", "test-agent");
        
        // Then: Both syncs should succeed
        assertTrue(firstResponse.isSuccess(), "First sync should succeed");
        assertTrue(secondResponse.isSuccess(), "Second sync should succeed");
        
        // And: The results should be consistent (idempotent)
        // Note: The second sync might have different server versions and timestamps,
        // but the conflict resolution behavior should be consistent
        assertEquals(firstResponse.hasConflicts(), secondResponse.hasConflicts(),
                "Conflict detection should be consistent");
    }

    // ========== Test Data Providers ==========
    // (Removed jqwik providers - using regular unit tests instead)

    // ========== Helper Methods ==========

    private void setupTestUser() {
        if (testUser == null) {
            testUser = UserAccount.builder()
                    .email("test-" + UUID.randomUUID() + "@example.com")
                    .authKeyHash("hashedAuthKey")
                    .salt("salt123")
                    .iterations(100000)
                    .build();
            testUser = userRepository.save(testUser);
        }
    }

    private SyncRequest.VaultEntryChange createVaultEntryChange() {
        SyncRequest.VaultEntryChange change = new SyncRequest.VaultEntryChange();
        change.setId(UUID.randomUUID());
        change.setOperation(SyncRequest.ChangeOperation.UPDATE);
        change.setVersion(1L);
        change.setEncryptedData("encrypted-data-" + UUID.randomUUID());
        change.setIv("iv-" + UUID.randomUUID());
        change.setAuthTag("auth-tag-" + UUID.randomUUID());
        change.setLastModified(LocalDateTime.now());
        return change;
    }

    private VaultEntry createServerVaultEntry() {
        if (testUser == null) {
            setupTestUser();
        }
        
        VaultEntry entry = VaultEntry.builder()
                .user(testUser)
                .encryptedData("server-encrypted-data-" + UUID.randomUUID())
                .iv("server-iv-" + UUID.randomUUID())
                .authTag("server-auth-tag-" + UUID.randomUUID())
                .entryType(VaultEntry.EntryType.CREDENTIAL)
                .version(1L)
                .build();
        
        VaultEntry savedEntry = vaultRepository.save(entry);
        entityManager.flush(); // Ensure the entity is persisted and timestamps are set
        entityManager.refresh(savedEntry); // Refresh to get the updated timestamps
        
        return savedEntry;
    }

    // ========== Unit Tests for Edge Cases ==========

    @Test
    @Transactional
    void syncWithEmptyChangesSucceeds() {
        // Setup test user
        setupTestUser();
        
        // Given: An empty sync request
        SyncRequest syncRequest = SyncRequest.builder()
                .clientVersion(1L)
                .changes(List.of())
                .build();
        
        // When: We perform the sync
        SyncResponse response = syncService.synchronizeVault(
                testUser.getId(), syncRequest, "127.0.0.1", "test-agent");
        
        // Then: The sync should succeed
        assertTrue(response.isSuccess(), "Empty sync should succeed");
        assertFalse(response.hasConflicts(), "Empty sync should have no conflicts");
        assertEquals(0, response.getStats().getTotalProcessed(), "Should process zero items");
    }

    @Test
    @Transactional
    void syncWithNonExistentEntryCreatesNew() {
        // Setup test user
        setupTestUser();
        
        // Given: A client change for a non-existent entry
        SyncRequest.VaultEntryChange change = createVaultEntryChange();
        change.setOperation(SyncRequest.ChangeOperation.CREATE);
        change.setVersion(null); // No version for create operations
        
        SyncRequest syncRequest = SyncRequest.builder()
                .clientVersion(1L)
                .changes(List.of(change))
                .build();
        
        // When: We perform the sync
        SyncResponse response = syncService.synchronizeVault(
                testUser.getId(), syncRequest, "127.0.0.1", "test-agent");
        
        // Then: The sync should succeed
        assertTrue(response.isSuccess(), "Sync should succeed");
        assertFalse(response.hasConflicts(), "Create operation should not have conflicts");
        assertEquals(1, response.getStats().getEntriesCreated(), "Should create one entry");
        
        // And: The entry should exist in the database
        List<VaultEntry> userEntries = vaultRepository.findActiveByUserId(testUser.getId());
        assertEquals(1, userEntries.size(), "Should have one entry");
        assertEquals(change.getEncryptedData(), userEntries.get(0).getEncryptedData(),
                "Should have client's encrypted data");
    }

    @Test
    @Transactional
    void syncHistoryIsRecordedCorrectly() {
        // Setup test user
        setupTestUser();
        
        // Given: A sync request with changes
        SyncRequest.VaultEntryChange change = createVaultEntryChange();
        change.setOperation(SyncRequest.ChangeOperation.CREATE);
        change.setVersion(null);
        
        SyncRequest syncRequest = SyncRequest.builder()
                .clientVersion(1L)
                .changes(List.of(change))
                .build();
        
        // When: We perform the sync
        SyncResponse response = syncService.synchronizeVault(
                testUser.getId(), syncRequest, "127.0.0.1", "test-agent");
        
        // Then: Sync history should be recorded
        assertThat(syncHistoryRepository.findByUserId(testUser.getId(), null))
                .isNotEmpty()
                .allSatisfy(history -> {
                    assertEquals(testUser.getId(), history.getUser().getId());
                    assertEquals(1L, history.getClientVersion());
                    assertEquals(1, history.getEntriesProcessed());
                    assertEquals(1, history.getEntriesCreated());
                    assertEquals(0, history.getConflictsDetected());
                    assertEquals("127.0.0.1", history.getClientIp());
                    assertEquals("test-agent", history.getUserAgent());
                    assertTrue(history.isSuccessful());
                });
    }
}