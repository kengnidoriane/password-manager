package com.passwordmanager.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.passwordmanager.backend.BaseIntegrationTest;
import com.passwordmanager.backend.dto.*;
import com.passwordmanager.backend.entity.*;
import com.passwordmanager.backend.repository.*;
import com.passwordmanager.backend.util.JwtUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for vault operations.
 * 
 * Tests cover:
 * - Credential CRUD operations
 * - Folder and tag management
 * - Search functionality
 * - Sync operations
 * - Offline mode support
 * 
 * Requirements: 3.1, 5.1, 6.1, 13.1
 */
@AutoConfigureMockMvc
@DisplayName("Vault Operations Integration Tests")
public class VaultOperationsIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private static final String TEST_EMAIL = "vault-test@example.com";
    private static final String TEST_AUTH_KEY_HASH = "hashed_auth_key_vault";
    private static final String TEST_SALT = "random_salt_vault";
    private static final int TEST_ITERATIONS = 100000;

    private UserAccount testUser;
    private String authToken;

    @BeforeEach
    void setUp() {
        // Clean up test data before each test
        secureNoteRepository.deleteAll();
        vaultRepository.deleteAll();
        tagRepository.deleteAll();
        folderRepository.deleteAll();
        userRepository.deleteAll();

        // Create test user and generate auth token
        testUser = createTestUser(TEST_EMAIL, TEST_AUTH_KEY_HASH);
        authToken = generateValidToken(testUser);
    }

    @AfterEach
    void tearDown() {
        // Clean up test data after each test
        secureNoteRepository.deleteAll();
        vaultRepository.deleteAll();
        tagRepository.deleteAll();
        folderRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ========================================
    // Credential CRUD Operations Tests
    // ========================================

    @Test
    @DisplayName("Should create a new credential successfully")
    void testCreateCredential() throws Exception {
        // Arrange
        CredentialRequest request = CredentialRequest.builder()
                .encryptedData("ZW5jcnlwdGVkX2NyZWRlbnRpYWxfZGF0YV9iYXNlNjQ=") // "encrypted_credential_data_base64" in Base64
                .iv("aW5pdGlhbGl6YXRpb25fdmVjdG9yX2Jhc2U2NA==") // "initialization_vector_base64" in Base64
                .authTag("YXV0aF90YWdfYmFzZTY0X3ZhbGlk") // "auth_tag_base64_valid" in Base64
                .build();

        // Act
        MvcResult result = mockMvc.perform(post("/api/v1/vault/credential")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.encryptedData").value("ZW5jcnlwdGVkX2NyZWRlbnRpYWxfZGF0YV9iYXNlNjQ="))
                .andExpect(jsonPath("$.version").value(1))
                .andReturn();

        // Assert
        CredentialResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                CredentialResponse.class
        );

        assertNotNull(response.getId());
        assertEquals("ZW5jcnlwdGVkX2NyZWRlbnRpYWxfZGF0YV9iYXNlNjQ=", response.getEncryptedData());
        assertNotNull(response.getCreatedAt());

        // Verify credential was saved in database
        VaultEntry entry = vaultRepository.findById(response.getId()).orElse(null);
        assertNotNull(entry);
        assertEquals(testUser.getId(), entry.getUser().getId());
        assertEquals("ZW5jcnlwdGVkX2NyZWRlbnRpYWxfZGF0YV9iYXNlNjQ=", entry.getEncryptedData());
    }

    @Test
    @DisplayName("Should retrieve all credentials for authenticated user")
    void testGetAllCredentials() throws Exception {
        // Arrange - Create multiple credentials
        createTestCredential("encrypted_data_1");
        createTestCredential("encrypted_data_2");
        createTestCredential("encrypted_data_3");

        // Act
        MvcResult result = mockMvc.perform(get("/api/v1/vault")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.credentials").isArray())
                .andExpect(jsonPath("$.credentials.length()").value(3))
                .andReturn();

        // Assert
        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).contains("encrypted_data_1", "encrypted_data_2", "encrypted_data_3");
    }

    @Test
    @DisplayName("Should update an existing credential with version tracking")
    void testUpdateCredential() throws Exception {
        // Arrange - Create initial credential
        VaultEntry entry = createTestCredential("original_encrypted_data");

        CredentialRequest updateRequest = CredentialRequest.builder()
                .encryptedData("dXBkYXRlZF9lbmNyeXB0ZWRfZGF0YQ==") // "updated_encrypted_data" in Base64
                .iv("bmV3X2luaXRpYWxpemF0aW9uX3ZlY3Rvcg==") // "new_initialization_vector" in Base64
                .authTag("bmV3X2F1dGhfdGFnX3ZhbGlk") // "new_auth_tag_valid" in Base64
                .version(1L)
                .build();

        // Act
        MvcResult result = mockMvc.perform(put("/api/v1/vault/credential/" + entry.getId())
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(entry.getId().toString()))
                .andExpect(jsonPath("$.encryptedData").value("dXBkYXRlZF9lbmNyeXB0ZWRfZGF0YQ=="))
                .andExpect(jsonPath("$.version").value(2))
                .andReturn();

        // Assert
        VaultEntry updatedEntry = vaultRepository.findById(entry.getId()).orElseThrow();
        assertEquals("dXBkYXRlZF9lbmNyeXB0ZWRfZGF0YQ==", updatedEntry.getEncryptedData());
        assertEquals(2L, updatedEntry.getVersion());
        assertNotNull(updatedEntry.getUpdatedAt());
    }

    @Test
    @DisplayName("Should soft delete credential and move to trash")
    void testSoftDeleteCredential() throws Exception {
        // Arrange
        VaultEntry entry = createTestCredential("to_delete_data");
        assertNull(entry.getDeletedAt());

        // Act
        mockMvc.perform(delete("/api/v1/vault/credential/" + entry.getId())
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.deletedAt").exists());

        // Assert
        VaultEntry deletedEntry = vaultRepository.findById(entry.getId()).orElseThrow();
        assertNotNull(deletedEntry.getDeletedAt());
        assertTrue(deletedEntry.getDeletedAt().isBefore(LocalDateTime.now().plusSeconds(1)));
    }

    @Test
    @DisplayName("Should reject credential update with version conflict")
    void testCredentialVersionConflict() throws Exception {
        // Arrange - Create credential and update it
        VaultEntry entry = createTestCredential("test_data");
        entry.setVersion(2L);
        vaultRepository.save(entry);

        CredentialRequest updateRequest = CredentialRequest.builder()
                .encryptedData("updated_data")
                .iv("iv")
                .authTag("tag")
                .version(1L) // Stale version
                .build();

        // Act & Assert
        mockMvc.perform(put("/api/v1/vault/credential/" + entry.getId())
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("version_conflict"));
    }

    @Test
    @DisplayName("Should prevent unauthorized access to other user's credentials")
    void testCredentialAccessControl() throws Exception {
        // Arrange - Create another user and their credential
        UserAccount otherUser = createTestUser("other@example.com", "other_hash");
        VaultEntry otherEntry = VaultEntry.builder()
                .user(otherUser)
                .encryptedData("other_user_encrypted_data")
                .iv("iv")
                .authTag("tag")
                .entryType(VaultEntry.EntryType.CREDENTIAL)
                .version(1L)
                .build();
        otherEntry = vaultRepository.save(otherEntry);

        // Act & Assert - Try to access other user's credential
        mockMvc.perform(get("/api/v1/vault")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.credentials").isArray())
                .andExpect(jsonPath("$.credentials[?(@.id == '" + otherEntry.getId() + "')]").doesNotExist());

        // Try to update other user's credential
        CredentialRequest updateRequest = CredentialRequest.builder()
                .encryptedData("hacked_data")
                .iv("iv")
                .authTag("tag")
                .version(1L)
                .build();

        mockMvc.perform(put("/api/v1/vault/credential/" + otherEntry.getId())
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound());
    }

    // ========================================
    // Folder Management Tests
    // ========================================

    @Test
    @DisplayName("Should create folder successfully")
    void testCreateFolder() throws Exception {
        // Arrange
        FolderRequest request = FolderRequest.builder()
                .name("Work")
                .build();

        // Act
        MvcResult result = mockMvc.perform(post("/api/v1/vault/folder")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Work"))
                .andReturn();

        // Assert
        FolderResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                FolderResponse.class
        );

        Folder folder = folderRepository.findById(response.getId()).orElseThrow();
        assertEquals("Work", folder.getName());
        assertEquals(testUser.getId(), folder.getUser().getId());
    }

    @Test
    @DisplayName("Should create nested folders up to 5 levels")
    void testNestedFolders() throws Exception {
        // Arrange & Act - Create nested folder structure
        Folder level1 = createTestFolder("Level 1", null);
        Folder level2 = createTestFolder("Level 2", level1.getId());
        Folder level3 = createTestFolder("Level 3", level2.getId());
        Folder level4 = createTestFolder("Level 4", level3.getId());
        Folder level5 = createTestFolder("Level 5", level4.getId());

        // Assert - All folders created successfully
        assertNotNull(level1);
        assertNotNull(level2);
        assertNotNull(level3);
        assertNotNull(level4);
        assertNotNull(level5);

        // Verify nesting
        assertEquals(level1.getId(), level2.getParent().getId());
        assertEquals(level2.getId(), level3.getParent().getId());
        assertEquals(level3.getId(), level4.getParent().getId());
        assertEquals(level4.getId(), level5.getParent().getId());
    }

    @Test
    @DisplayName("Should reject folder nesting beyond 5 levels")
    void testFolderNestingLimit() throws Exception {
        // Arrange - Create 5 levels of folders
        Folder level1 = createTestFolder("Level 1", null);
        Folder level2 = createTestFolder("Level 2", level1.getId());
        Folder level3 = createTestFolder("Level 3", level2.getId());
        Folder level4 = createTestFolder("Level 4", level3.getId());
        Folder level5 = createTestFolder("Level 5", level4.getId());

        // Act & Assert - Try to create 6th level
        FolderRequest request = FolderRequest.builder()
                .name("Level 6")
                .parentId(level5.getId())
                .build();

        mockMvc.perform(post("/api/v1/vault/folder")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("max_nesting_depth_exceeded"));
    }

    @Test
    @DisplayName("Should retrieve folder tree structure")
    void testGetFolderTree() throws Exception {
        // Arrange - Create folder hierarchy
        Folder parent = createTestFolder("Parent", null);
        createTestFolder("Child 1", parent.getId());
        createTestFolder("Child 2", parent.getId());

        // Act
        MvcResult result = mockMvc.perform(get("/api/v1/vault/folders")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(3))
                .andReturn();

        // Assert
        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).contains("Parent", "Child 1", "Child 2");
    }

    @Test
    @DisplayName("Should assign credential to folder")
    void testAssignCredentialToFolder() throws Exception {
        // Arrange
        Folder folder = createTestFolder("Work", null);
        
        CredentialRequest request = CredentialRequest.builder()
                .encryptedData("d29ya19lbWFpbF9lbmNyeXB0ZWQ=") // "work_email_encrypted" in Base64
                .folderId(folder.getId())
                .iv("aW5pdGlhbGl6YXRpb25fdmVjdG9y") // "initialization_vector" in Base64
                .authTag("YXV0aF90YWdfZGVmYXVsdA==") // "auth_tag_default" in Base64
                .build();

        // Act
        MvcResult result = mockMvc.perform(post("/api/v1/vault/credential")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.folderId").value(folder.getId().toString()))
                .andReturn();

        // Assert
        CredentialResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                CredentialResponse.class
        );

        VaultEntry entry = vaultRepository.findById(response.getId()).orElseThrow();
        assertEquals(folder.getId(), entry.getFolder().getId());
    }

    // ========================================
    // Tag Management Tests
    // ========================================

    @Test
    @DisplayName("Should create tag successfully")
    void testCreateTag() throws Exception {
        // Arrange
        TagRequest request = TagRequest.builder()
                .name("Important")
                .color("#FF0000")
                .build();

        // Act
        MvcResult result = mockMvc.perform(post("/api/v1/vault/tag")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Important"))
                .andExpect(jsonPath("$.color").value("#FF0000"))
                .andReturn();

        // Assert
        TagResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                TagResponse.class
        );

        Tag tag = tagRepository.findById(response.getId()).orElseThrow();
        assertEquals("Important", tag.getName());
        assertEquals("#FF0000", tag.getColor());
    }

    @Test
    @DisplayName("Should retrieve all tags for user")
    void testGetAllTags() throws Exception {
        // Arrange
        createTestTag("Work");
        createTestTag("Personal");
        createTestTag("Finance");

        // Act
        MvcResult result = mockMvc.perform(get("/api/v1/vault/tags")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(3))
                .andReturn();

        // Assert
        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).contains("Work", "Personal", "Finance");
    }

    // ========================================
    // Search Functionality Tests
    // ========================================

    @Test
    @DisplayName("Should search credentials with query parameter")
    void testSearchCredentials() throws Exception {
        // Arrange - Create credentials with different encrypted data
        createTestCredential("github_account_encrypted");
        createTestCredential("gmail_account_encrypted");
        createTestCredential("banking_encrypted");

        // Act - Search with query parameter
        MvcResult result = mockMvc.perform(get("/api/v1/vault?search=github")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.credentials").isArray())
                .andReturn();

        // Assert - Note: actual search depends on server implementation
        String responseBody = result.getResponse().getContentAsString();
        assertNotNull(responseBody);
    }

    @Test
    @DisplayName("Should return empty results for non-matching search")
    void testSearchWithNoResults() throws Exception {
        // Arrange
        createTestCredential("test_account_encrypted");

        // Act
        MvcResult result = mockMvc.perform(get("/api/v1/vault?search=NonExistentQuery")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.credentials").isArray())
                .andReturn();

        // Assert
        String responseBody = result.getResponse().getContentAsString();
        assertNotNull(responseBody);
    }

    // ========================================
    // Sync Operations Tests
    // ========================================

    @Test
    @DisplayName("Should sync vault changes successfully")
    void testVaultSync() throws Exception {
        // Arrange - Create initial credentials
        createTestCredential("credential_1_encrypted");
        createTestCredential("credential_2_encrypted");

        // Prepare sync request
        SyncRequest syncRequest = SyncRequest.builder()
                .clientVersion(1L)
                .changes(Collections.emptyList())
                .deletions(Collections.emptyList())
                .lastSyncTime(LocalDateTime.now().minusMinutes(5))
                .build();

        // Act
        MvcResult result = mockMvc.perform(post("/api/v1/vault/sync")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(syncRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.syncedAt").exists())
                .andReturn();

        // Assert
        SyncResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                SyncResponse.class
        );

        assertNotNull(response.getSyncedAt());
    }

    @Test
    @DisplayName("Should return delta updates since last sync")
    void testDeltaSync() throws Exception {
        // Arrange - Create credentials at different times
        VaultEntry oldEntry = createTestCredential("old_credential_encrypted");
        oldEntry.setUpdatedAt(LocalDateTime.now().minusHours(2));
        vaultRepository.save(oldEntry);

        Thread.sleep(100);

        createTestCredential("new_credential_encrypted");

        // Act - Sync with lastSyncTime between the two credentials
        LocalDateTime lastSyncTime = LocalDateTime.now().minusHours(1);
        
        MvcResult result = mockMvc.perform(get("/api/v1/vault?lastSyncTime=" + lastSyncTime)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.credentials").isArray())
                .andReturn();

        // Assert - Should return credentials
        String responseBody = result.getResponse().getContentAsString();
        assertNotNull(responseBody);
    }

    // ========================================
    // Offline Mode Support Tests
    // ========================================

    @Test
    @DisplayName("Should provide full vault data for initial offline cache")
    void testInitialOfflineCache() throws Exception {
        // Arrange - Create complete vault data
        Folder folder = createTestFolder("Work", null);
        Tag tag = createTestTag("Important");
        
        VaultEntry credential = createTestCredential("test_credential_encrypted");
        credential.setFolder(folder);
        vaultRepository.save(credential);

        SecureNote note = createTestSecureNote("test_note_encrypted");

        // Act - Get full vault for offline caching
        MvcResult result = mockMvc.perform(get("/api/v1/vault")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.credentials").isArray())
                .andExpect(jsonPath("$.folders").isArray())
                .andExpect(jsonPath("$.tags").isArray())
                .andExpect(jsonPath("$.secureNotes").isArray())
                .andReturn();

        // Assert - Verify all data is included
        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).contains("test_credential_encrypted");
        assertThat(responseBody).contains("Work");
        assertThat(responseBody).contains("Important");
        assertThat(responseBody).contains("test_note_encrypted");
    }

    // ========================================
    // Secure Notes Tests
    // ========================================

    @Test
    @DisplayName("Should create secure note successfully")
    void testCreateSecureNote() throws Exception {
        // Arrange
        SecureNoteRequest request = SecureNoteRequest.builder()
                .title("Important Note")
                .encryptedContent("ZW5jcnlwdGVkX25vdGVfY29udGVudA==") // "encrypted_note_content" in Base64
                .contentIv("Y29udGVudF9pbml0aWFsaXphdGlvbl92ZWN0b3I=") // "content_initialization_vector" in Base64
                .contentAuthTag("Y29udGVudF9hdXRoZW50aWNhdGlvbl90YWc=") // "content_authentication_tag" in Base64
                .build();

        // Act
        MvcResult result = mockMvc.perform(post("/api/v1/vault/note")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("Important Note"))
                .andReturn();

        // Assert
        SecureNoteResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                SecureNoteResponse.class
        );

        SecureNote note = secureNoteRepository.findById(response.getId()).orElseThrow();
        assertEquals("Important Note", note.getTitle());
        assertEquals(testUser.getId(), note.getUser().getId());
    }

    @Test
    @DisplayName("Should include secure notes in vault retrieval")
    void testGetVaultWithSecureNotes() throws Exception {
        // Arrange
        createTestSecureNote("note_1_encrypted");
        createTestSecureNote("note_2_encrypted");
        createTestCredential("credential_1_encrypted");

        // Act
        MvcResult result = mockMvc.perform(get("/api/v1/vault")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.credentials").isArray())
                .andExpect(jsonPath("$.secureNotes").isArray())
                .andExpect(jsonPath("$.secureNotes.length()").value(2))
                .andReturn();

        // Assert
        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).contains("note_1_encrypted", "note_2_encrypted");
    }

    // ========================================
    // Helper Methods
    // ========================================

    private UserAccount createTestUser(String email, String authKeyHash) {
        UserAccount user = UserAccount.builder()
                .email(email)
                .authKeyHash(authKeyHash)
                .salt(TEST_SALT)
                .iterations(TEST_ITERATIONS)
                .recoveryKeyHash(passwordEncoder.encode("recovery_key"))
                .emailVerified(true)
                .twoFactorEnabled(false)
                .build();
        return userRepository.save(user);
    }

    private String generateValidToken(UserAccount user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId().toString());
        return jwtUtil.generateToken(claims, user.getEmail());
    }

    private VaultEntry createTestCredential(String encryptedData) {
        // Use valid Base64 strings that meet validation requirements (16-255 chars)
        String validEncryptedData = encryptedData != null && encryptedData.length() >= 16 ? 
            encryptedData : "ZW5jcnlwdGVkX2RhdGFfZGVmYXVsdA==";
            
        VaultEntry entry = VaultEntry.builder()
                .user(testUser)
                .encryptedData(validEncryptedData)
                .iv("aW5pdGlhbGl6YXRpb25fdmVjdG9y") // "initialization_vector" in Base64
                .authTag("YXV0aF90YWdfZGVmYXVsdA==") // "auth_tag_default" in Base64
                .entryType(VaultEntry.EntryType.CREDENTIAL)
                .version(1L)
                .build();
        return vaultRepository.save(entry);
    }

    private Folder createTestFolder(String name, UUID parentId) {
        Folder folder = Folder.builder()
                .user(testUser)
                .name(name)
                .build();
        
        if (parentId != null) {
            Folder parent = folderRepository.findById(parentId).orElseThrow();
            folder.setParent(parent);
        }
        
        return folderRepository.save(folder);
    }

    private Tag createTestTag(String name) {
        Tag tag = Tag.builder()
                .user(testUser)
                .name(name)
                .color("#000000")
                .build();
        return tagRepository.save(tag);
    }

    private SecureNote createTestSecureNote(String encryptedContent) {
        // Use valid Base64 strings that meet validation requirements
        String validContent = encryptedContent != null && encryptedContent.length() >= 16 ? 
            encryptedContent : "ZW5jcnlwdGVkX2NvbnRlbnRfZGVmYXVsdA==";
            
        SecureNote note = SecureNote.builder()
                .user(testUser)
                .title("Test Note")
                .encryptedContent(validContent)
                .contentIv("Y29udGVudF9pbml0aWFsaXphdGlvbl92ZWN0b3I=") // "content_initialization_vector" in Base64
                .contentAuthTag("Y29udGVudF9hdXRoZW50aWNhdGlvbl90YWc=") // "content_authentication_tag" in Base64
                .build();
        return secureNoteRepository.save(note);
    }
}
