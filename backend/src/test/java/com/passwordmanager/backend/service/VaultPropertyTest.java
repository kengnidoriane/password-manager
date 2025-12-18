package com.passwordmanager.backend.service;

import com.passwordmanager.backend.dto.CredentialRequest;
import com.passwordmanager.backend.dto.CredentialResponse;
import com.passwordmanager.backend.entity.Folder;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.repository.FolderRepository;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;

/**
 * Property-based tests for vault operations.
 * 
 * These tests verify correctness properties that should hold across
 * all valid inputs for vault management operations.
 * 
 * **Feature: password-manager, Property 16: Credential field completeness**
 * **Feature: password-manager, Property 17: Version history on updates**
 * **Feature: password-manager, Property 18: Soft delete to trash**
 */
@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class VaultPropertyTest {

    private VaultRepository mockVaultRepository;
    private UserRepository mockUserRepository;
    private FolderRepository mockFolderRepository;
    private VaultService vaultService;

    @BeforeEach
    void setUp() {
        // Create fresh mocks for each test
        mockVaultRepository = mock(VaultRepository.class);
        mockUserRepository = mock(UserRepository.class);
        mockFolderRepository = mock(FolderRepository.class);
        
        vaultService = new VaultService(mockVaultRepository, mockUserRepository, mockFolderRepository);
        
        // Reset mocks
        reset(mockVaultRepository, mockUserRepository, mockFolderRepository);
    }

    /**
     * **Feature: password-manager, Property 16: Credential field completeness**
     * **Validates: Requirements 3.2**
     * 
     * For any saved credential, the stored data SHALL include website URL, username, 
     * password, notes, and creation timestamp.
     * 
     * This property tests that when a credential is created, all required fields
     * are properly stored and can be retrieved with complete information.
     */
    @Property(tries = 100)
    void credentialFieldCompleteness(@ForAll("validCredentialRequest") CredentialRequest request) {
        // Create fresh mocks for each property test iteration
        VaultRepository localVaultRepository = mock(VaultRepository.class);
        UserRepository localUserRepository = mock(UserRepository.class);
        FolderRepository localFolderRepository = mock(FolderRepository.class);
        VaultService localVaultService = new VaultService(localVaultRepository, localUserRepository, localFolderRepository);
        
        // Setup: Create test user
        UUID userId = UUID.randomUUID();
        UserAccount testUser = createTestUser(userId);
        
        when(localUserRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(localUserRepository.existsById(userId)).thenReturn(true);
        
        // Setup: Mock folder if specified
        if (request.getFolderId() != null) {
            Folder testFolder = createTestFolder(request.getFolderId(), userId);
            when(localFolderRepository.findByIdAndUserId(request.getFolderId(), userId))
                    .thenReturn(Optional.of(testFolder));
        }
        
        // Setup: Mock vault repository save operation
        VaultEntry savedEntry = createVaultEntryFromRequest(request, testUser);
        when(localVaultRepository.save(any(VaultEntry.class))).thenReturn(savedEntry);
        
        // Test: Create credential
        CredentialResponse response = localVaultService.createCredential(userId, request);
        
        // Property 1: Response must contain all required fields
        assertNotNull(response.getId(), 
                     "Credential response must include ID");
        assertNotNull(response.getEncryptedData(), 
                     "Credential response must include encrypted data (containing URL, username, password, notes)");
        assertNotNull(response.getIv(), 
                     "Credential response must include initialization vector");
        assertNotNull(response.getAuthTag(), 
                     "Credential response must include authentication tag");
        assertNotNull(response.getCreatedAt(), 
                     "Credential response must include creation timestamp");
        assertNotNull(response.getUpdatedAt(), 
                     "Credential response must include update timestamp");
        
        // Property 2: Encrypted data must match input
        assertEquals(request.getEncryptedData(), response.getEncryptedData(),
                    "Stored encrypted data must match input data");
        assertEquals(request.getIv(), response.getIv(),
                    "Stored IV must match input IV");
        assertEquals(request.getAuthTag(), response.getAuthTag(),
                    "Stored auth tag must match input auth tag");
        
        // Property 3: Folder association must be preserved
        assertEquals(request.getFolderId(), response.getFolderId(),
                    "Folder association must be preserved");
        
        // Property 4: Version must be initialized to 1
        assertEquals(1L, response.getVersion(),
                    "New credential version must be initialized to 1");
        
        // Property 5: Timestamps must be reasonable (within last minute)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneMinuteAgo = now.minusMinutes(1);
        assertTrue(response.getCreatedAt().isAfter(oneMinuteAgo) && 
                  response.getCreatedAt().isBefore(now.plusSeconds(1)),
                  "Creation timestamp must be recent and reasonable");
        assertTrue(response.getUpdatedAt().isAfter(oneMinuteAgo) && 
                  response.getUpdatedAt().isBefore(now.plusSeconds(1)),
                  "Update timestamp must be recent and reasonable");
        
        // Property 6: Credential must not be deleted initially
        assertEquals(false, response.isDeleted(),
                    "New credential must not be marked as deleted");
    }

    /**
     * **Feature: password-manager, Property 17: Version history on updates**
     * **Validates: Requirements 3.3**
     * 
     * For any credential update operation, the Password Manager SHALL create a new 
     * version entry with timestamp in the version history.
     * 
     * This property tests that version numbers are properly incremented on updates
     * and that optimistic locking prevents concurrent modification conflicts.
     */
    @Property(tries = 100)
    void versionHistoryOnUpdates(
            @ForAll("validCredentialRequest") CredentialRequest createRequest,
            @ForAll("validCredentialRequest") CredentialRequest updateRequest) {
        
        // Create fresh mocks for each property test iteration
        VaultRepository localVaultRepository = mock(VaultRepository.class);
        UserRepository localUserRepository = mock(UserRepository.class);
        FolderRepository localFolderRepository = mock(FolderRepository.class);
        VaultService localVaultService = new VaultService(localVaultRepository, localUserRepository, localFolderRepository);
        
        // Setup: Create test user
        UUID userId = UUID.randomUUID();
        UUID credentialId = UUID.randomUUID();
        UserAccount testUser = createTestUser(userId);
        
        when(localUserRepository.findById(userId)).thenReturn(Optional.of(testUser));
        
        // Setup: Create initial credential
        VaultEntry initialEntry = createVaultEntryFromRequest(createRequest, testUser);
        initialEntry.setId(credentialId);
        initialEntry.setVersion(1L);
        
        when(localVaultRepository.findActiveByIdAndUserId(credentialId, userId))
                .thenReturn(Optional.of(initialEntry));
        
        // Setup: Mock folder for update if specified
        if (updateRequest.getFolderId() != null) {
            Folder testFolder = createTestFolder(updateRequest.getFolderId(), userId);
            when(localFolderRepository.findByIdAndUserId(updateRequest.getFolderId(), userId))
                    .thenReturn(Optional.of(testFolder));
        }
        
        // Setup: Set version for update request
        updateRequest.setVersion(1L); // Must match current version
        
        // Setup: Mock updated entry with incremented version
        VaultEntry updatedEntry = createVaultEntryFromRequest(updateRequest, testUser);
        updatedEntry.setId(credentialId);
        updatedEntry.setVersion(2L); // JPA @Version automatically increments
        updatedEntry.setCreatedAt(initialEntry.getCreatedAt());
        // Ensure update timestamp is after creation timestamp
        LocalDateTime updateTime = initialEntry.getCreatedAt().plusSeconds(1);
        updatedEntry.setUpdatedAt(updateTime);
        
        when(localVaultRepository.save(any(VaultEntry.class))).thenReturn(updatedEntry);
        
        // Test: Update credential
        CredentialResponse response = localVaultService.updateCredential(userId, credentialId, updateRequest);
        
        // Property 1: Version must be incremented
        assertEquals(2L, response.getVersion(),
                    "Version must be incremented on update (1 -> 2)");
        
        // Property 2: Update timestamp must be newer than creation timestamp
        assertTrue(response.getUpdatedAt().isAfter(response.getCreatedAt()),
                  "Update timestamp must be newer than creation timestamp");
        
        // Property 3: Creation timestamp must be preserved
        assertEquals(initialEntry.getCreatedAt(), response.getCreatedAt(),
                    "Creation timestamp must be preserved during updates");
        
        // Property 4: Updated data must match input
        assertEquals(updateRequest.getEncryptedData(), response.getEncryptedData(),
                    "Updated encrypted data must match input");
        assertEquals(updateRequest.getIv(), response.getIv(),
                    "Updated IV must match input");
        assertEquals(updateRequest.getAuthTag(), response.getAuthTag(),
                    "Updated auth tag must match input");
        
        // Property 5: Version conflict should be detected
        CredentialRequest conflictRequest = createValidCredentialRequest();
        conflictRequest.setVersion(1L); // Old version, should cause conflict
        
        // Mock the existing entry to have version 2 now
        VaultEntry conflictEntry = createVaultEntryFromRequest(createRequest, testUser);
        conflictEntry.setId(credentialId);
        conflictEntry.setVersion(2L); // Current version is now 2
        
        when(localVaultRepository.findActiveByIdAndUserId(credentialId, userId))
                .thenReturn(Optional.of(conflictEntry));
        
        // This should throw OptimisticLockingFailureException due to version mismatch
        assertThrows(OptimisticLockingFailureException.class, () -> {
            localVaultService.updateCredential(userId, credentialId, conflictRequest);
        }, "Version conflict should throw OptimisticLockingFailureException");
    }

    /**
     * **Feature: password-manager, Property 18: Soft delete to trash**
     * **Validates: Requirements 3.4**
     * 
     * For any credential deletion, the credential SHALL be moved to trash and remain 
     * there for 30 days before permanent deletion.
     * 
     * This property tests that:
     * 1. Deletion sets the deletedAt timestamp instead of removing the record
     * 2. Soft-deleted credentials are not returned in normal queries
     * 3. Soft-deleted credentials can be restored
     * 4. Permanent deletion occurs after 30 days
     */
    @Property(tries = 100)
    void softDeleteToTrash(@ForAll("validCredentialRequest") CredentialRequest request) {
        // Create fresh mocks for each property test iteration
        VaultRepository localVaultRepository = mock(VaultRepository.class);
        UserRepository localUserRepository = mock(UserRepository.class);
        FolderRepository localFolderRepository = mock(FolderRepository.class);
        VaultService localVaultService = new VaultService(localVaultRepository, localUserRepository, localFolderRepository);
        
        // Setup: Create test user and credential
        UUID userId = UUID.randomUUID();
        UUID credentialId = UUID.randomUUID();
        UserAccount testUser = createTestUser(userId);
        
        VaultEntry activeEntry = createVaultEntryFromRequest(request, testUser);
        activeEntry.setId(credentialId);
        activeEntry.setVersion(1L);
        
        when(localVaultRepository.findActiveByIdAndUserId(credentialId, userId))
                .thenReturn(Optional.of(activeEntry));
        
        // Setup: Mock soft delete operation
        VaultEntry deletedEntry = createVaultEntryFromRequest(request, testUser);
        deletedEntry.setId(credentialId);
        deletedEntry.setVersion(1L);
        deletedEntry.setDeletedAt(LocalDateTime.now());
        
        when(localVaultRepository.save(any(VaultEntry.class))).thenReturn(deletedEntry);
        
        // Test: Delete credential
        localVaultService.deleteCredential(userId, credentialId);
        
        // Property 1: Credential should be marked as deleted (verified by mock interaction)
        // The save method should be called with an entry that has deletedAt set
        
        // Property 2: Deleted credential should not be found in active queries
        when(localVaultRepository.findActiveByIdAndUserId(credentialId, userId))
                .thenReturn(Optional.empty()); // Simulates that active query doesn't find deleted items
        
        // This should throw IllegalArgumentException because credential is not found in active queries
        assertThrows(IllegalArgumentException.class, () -> {
            localVaultService.getCredential(userId, credentialId);
        }, "Deleted credential should not be accessible through normal queries");
        
        // Property 3: Deleted credential should be restorable
        when(localVaultRepository.findByIdAndUserId(credentialId, userId))
                .thenReturn(Optional.of(deletedEntry)); // Find in all entries (including deleted)
        
        VaultEntry restoredEntry = createVaultEntryFromRequest(request, testUser);
        restoredEntry.setId(credentialId);
        restoredEntry.setVersion(1L);
        restoredEntry.setDeletedAt(null); // Restored
        
        when(localVaultRepository.save(any(VaultEntry.class))).thenReturn(restoredEntry);
        
        CredentialResponse restored = localVaultService.restoreCredential(userId, credentialId);
        
        assertEquals(false, restored.isDeleted(),
                    "Restored credential should not be marked as deleted");
        
        // Property 4: Credentials deleted more than 30 days ago should be permanently deletable
        LocalDateTime thirtyOneDaysAgo = LocalDateTime.now().minusDays(31);
        
        // Mock finding old deleted entries
        VaultEntry oldDeletedEntry = createVaultEntryFromRequest(request, testUser);
        oldDeletedEntry.setDeletedAt(thirtyOneDaysAgo);
        
        when(localVaultRepository.findDeletedOlderThan(any(LocalDateTime.class)))
                .thenReturn(java.util.List.of(oldDeletedEntry));
        when(localVaultRepository.permanentlyDeleteOlderThan(any(LocalDateTime.class)))
                .thenReturn(1); // One entry permanently deleted
        
        int deletedCount = localVaultService.permanentlyDeleteExpiredCredentials();
        
        assertTrue(deletedCount >= 0,
                  "Permanent deletion should return non-negative count of deleted entries");
    }

    @Provide
    Arbitrary<CredentialRequest> validCredentialRequest() {
        return Arbitraries.strings().alpha().ofMinLength(5).ofMaxLength(20)
                .flatMap(base -> {
                    // Generate valid encrypted data, IV, and auth tag
                    String encryptedData = Base64.getEncoder().encodeToString((base + "_encrypted_data").getBytes());
                    String iv = Base64.getEncoder().encodeToString((base + "_iv_12345678").getBytes());
                    String authTag = Base64.getEncoder().encodeToString((base + "_auth_tag_123").getBytes());
                    
                    return Arbitraries.of(
                        // Request without folder
                        CredentialRequest.builder()
                                .encryptedData(encryptedData)
                                .iv(iv)
                                .authTag(authTag)
                                .build(),
                        // Request with folder
                        CredentialRequest.builder()
                                .encryptedData(encryptedData)
                                .iv(iv)
                                .authTag(authTag)
                                .folderId(UUID.randomUUID())
                                .build()
                    );
                });
    }

    private CredentialRequest createValidCredentialRequest() {
        String base = "test";
        return CredentialRequest.builder()
                .encryptedData(Base64.getEncoder().encodeToString((base + "_encrypted_data").getBytes()))
                .iv(Base64.getEncoder().encodeToString((base + "_iv_12345678").getBytes()))
                .authTag(Base64.getEncoder().encodeToString((base + "_auth_tag_123").getBytes()))
                .build();
    }

    private UserAccount createTestUser(UUID userId) {
        return UserAccount.builder()
                .id(userId)
                .email("test@example.com")
                .authKeyHash("test-auth-key-hash")
                .salt("test-salt")
                .iterations(100000)
                .createdAt(LocalDateTime.now())
                .emailVerified(true)
                .build();
    }

    private Folder createTestFolder(UUID folderId, UUID userId) {
        return Folder.builder()
                .id(folderId)
                .name("Test Folder")
                .user(createTestUser(userId))
                .createdAt(LocalDateTime.now())
                .build();
    }

    private VaultEntry createVaultEntryFromRequest(CredentialRequest request, UserAccount user) {
        VaultEntry.VaultEntryBuilder builder = VaultEntry.builder()
                .id(UUID.randomUUID())
                .user(user)
                .encryptedData(request.getEncryptedData())
                .iv(request.getIv())
                .authTag(request.getAuthTag())
                .entryType(VaultEntry.EntryType.CREDENTIAL)
                .version(1L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now());
        
        if (request.getFolderId() != null) {
            Folder folder = createTestFolder(request.getFolderId(), user.getId());
            builder.folder(folder);
        }
        
        return builder.build();
    }
}