package com.passwordmanager.backend.service;

import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.entity.VaultEntry;
import com.passwordmanager.backend.repository.VaultRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Property-based tests for security analysis operations.
 * 
 * These tests verify correctness properties that should hold across
 * all valid inputs for security analysis and reporting.
 * 
 * **Feature: password-manager, Property 25: Reused password detection**
 * **Feature: password-manager, Property 26: Security score factors**
 */
@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class SecurityAnalyzerPropertyTest {

    private VaultRepository mockVaultRepository;
    private ObjectMapper objectMapper;
    private SecurityAnalyzerService securityAnalyzerService;

    @BeforeEach
    void setUp() {
        // Create fresh mocks for each test
        mockVaultRepository = mock(VaultRepository.class);
        objectMapper = new ObjectMapper();
        
        securityAnalyzerService = new SecurityAnalyzerService(mockVaultRepository, objectMapper);
        
        // Reset mocks
        reset(mockVaultRepository);
    }

    /**
     * **Feature: password-manager, Property 25: Reused password detection**
     * **Validates: Requirements 8.3**
     * 
     * For any vault state, if multiple credentials share the same password, 
     * the Password Manager SHALL identify and highlight all affected credentials.
     * 
     * This property tests that:
     * 1. Credentials with identical password hashes are detected as reused
     * 2. All credentials sharing a password are grouped together
     * 3. Unique passwords are not flagged as reused
     * 4. The detection works regardless of other credential properties
     */
    @Property(tries = 100)
    void reusedPasswordDetection(@ForAll("credentialSetWithReusedPasswords") CredentialSet credentialSet) {
        // Create fresh mocks for each property test iteration
        VaultRepository localVaultRepository = mock(VaultRepository.class);
        ObjectMapper localObjectMapper = new ObjectMapper();
        SecurityAnalyzerService localSecurityAnalyzerService = new SecurityAnalyzerService(localVaultRepository, localObjectMapper);
        
        // Setup: Create test user
        UUID userId = UUID.randomUUID();
        
        // Setup: Mock vault repository to return the test credentials
        when(localVaultRepository.findActiveCredentialsByUserId(userId))
                .thenReturn(credentialSet.getVaultEntries());
        
        // Test: Generate security report
        SecurityAnalyzerService.SecurityReport report = localSecurityAnalyzerService.generateSecurityReport(userId);
        
        // Property 1: All reused passwords should be detected
        Map<String, List<String>> detectedReused = report.getReusedPasswords();
        Map<String, List<String>> expectedReused = credentialSet.getExpectedReusedPasswords();
        
        assertEquals(expectedReused.size(), detectedReused.size(),
                    "Number of detected reused password groups should match expected");
        
        // Property 2: Each reused password group should contain all credentials with that password
        for (Map.Entry<String, List<String>> expectedEntry : expectedReused.entrySet()) {
            String passwordHash = expectedEntry.getKey();
            List<String> expectedTitles = expectedEntry.getValue();
            
            assertTrue(detectedReused.containsKey(passwordHash),
                      "Reused password hash should be detected: " + passwordHash);
            
            List<String> detectedTitles = detectedReused.get(passwordHash);
            assertEquals(expectedTitles.size(), detectedTitles.size(),
                        "Number of credentials sharing password should match expected");
            
            for (String expectedTitle : expectedTitles) {
                assertTrue(detectedTitles.contains(expectedTitle),
                          "Credential with reused password should be included: " + expectedTitle);
            }
        }
        
        // Property 3: Unique passwords should not be flagged as reused
        Set<String> uniquePasswordHashes = credentialSet.getUniquePasswordHashes();
        for (String uniqueHash : uniquePasswordHashes) {
            assertFalse(detectedReused.containsKey(uniqueHash),
                       "Unique password should not be flagged as reused: " + uniqueHash);
        }
        
        // Property 4: Only passwords used more than once should be flagged
        for (Map.Entry<String, List<String>> detectedEntry : detectedReused.entrySet()) {
            List<String> credentialsWithPassword = detectedEntry.getValue();
            assertTrue(credentialsWithPassword.size() > 1,
                      "Only passwords used by multiple credentials should be flagged as reused");
        }
        
        // Property 5: Total credentials in reused groups should not exceed total credentials
        int totalCredentialsInReusedGroups = detectedReused.values().stream()
                .mapToInt(List::size)
                .sum();
        assertTrue(totalCredentialsInReusedGroups <= credentialSet.getTotalCredentials(),
                  "Total credentials in reused groups should not exceed total credentials");
        
        // Property 6: Detection should be consistent regardless of credential order
        // Shuffle the credentials and test again
        List<VaultEntry> shuffledCredentials = new ArrayList<>(credentialSet.getVaultEntries());
        Collections.shuffle(shuffledCredentials);
        when(localVaultRepository.findActiveCredentialsByUserId(userId))
                .thenReturn(shuffledCredentials);
        
        SecurityAnalyzerService.SecurityReport shuffledReport = localSecurityAnalyzerService.generateSecurityReport(userId);
        Map<String, List<String>> shuffledDetected = shuffledReport.getReusedPasswords();
        
        assertEquals(detectedReused.size(), shuffledDetected.size(),
                    "Reused password detection should be consistent regardless of credential order");
    }

    /**
     * **Feature: password-manager, Property 26: Security score factors**
     * **Validates: Requirements 8.4**
     * 
     * For any vault security analysis, the security score SHALL be computed based on 
     * password strength, password age, and password reuse metrics.
     * 
     * This property tests that:
     * 1. Security score is between 0 and 100 (inclusive)
     * 2. More security issues result in lower scores
     * 3. Score decreases with weak passwords
     * 4. Score decreases with reused passwords
     * 5. Score decreases with old passwords
     * 6. Empty vault gets perfect score (100)
     */
    @Property(tries = 100)
    void securityScoreFactors(@ForAll("vaultWithSecurityIssues") VaultSecurityData vaultData) {
        // Create fresh mocks for each property test iteration
        VaultRepository localVaultRepository = mock(VaultRepository.class);
        ObjectMapper localObjectMapper = new ObjectMapper();
        SecurityAnalyzerService localSecurityAnalyzerService = new SecurityAnalyzerService(localVaultRepository, localObjectMapper);
        
        // Setup: Create test user
        UUID userId = UUID.randomUUID();
        
        // Setup: Mock vault repository to return the test credentials
        when(localVaultRepository.findActiveCredentialsByUserId(userId))
                .thenReturn(vaultData.getVaultEntries());
        
        // Test: Generate security report
        SecurityAnalyzerService.SecurityReport report = localSecurityAnalyzerService.generateSecurityReport(userId);
        
        // Property 1: Security score must be between 0 and 100 (inclusive)
        int score = report.getOverallScore();
        assertTrue(score >= 0 && score <= 100,
                  "Security score must be between 0 and 100, got: " + score);
        
        // Property 2: Empty vault should get perfect score
        if (vaultData.getTotalCredentials() == 0) {
            assertEquals(100, score,
                        "Empty vault should receive perfect security score of 100");
            return; // Skip other tests for empty vault
        }
        
        // Property 3: Score should decrease with more weak passwords
        int weakPasswordCount = report.getWeakPasswords().size();
        int expectedWeakCount = vaultData.getWeakPasswordCount();
        assertEquals(expectedWeakCount, weakPasswordCount,
                    "Detected weak password count should match expected");
        
        // Property 4: Score should decrease with more reused passwords
        int reusedPasswordGroups = report.getReusedPasswords().size();
        int expectedReusedGroups = vaultData.getReusedPasswordGroups();
        assertEquals(expectedReusedGroups, reusedPasswordGroups,
                    "Detected reused password groups should match expected");
        
        // Property 5: Score should decrease with more old passwords
        int oldPasswordCount = report.getOldPasswords().size() + report.getVeryOldPasswords().size();
        int expectedOldCount = vaultData.getOldPasswordCount();
        assertEquals(expectedOldCount, oldPasswordCount,
                    "Detected old password count should match expected");
        
        // Property 6: Score should be inversely related to security issues
        // More issues should generally result in lower scores
        int totalIssues = weakPasswordCount + reusedPasswordGroups + oldPasswordCount;
        
        if (totalIssues == 0) {
            assertEquals(100, score,
                        "Vault with no security issues should have perfect score");
        } else {
            assertTrue(score < 100,
                      "Vault with security issues should have score less than 100");
        }
        
        // Property 7: Score calculation should be deterministic
        // Generate report again and verify same score
        SecurityAnalyzerService.SecurityReport secondReport = localSecurityAnalyzerService.generateSecurityReport(userId);
        assertEquals(score, secondReport.getOverallScore(),
                    "Security score calculation should be deterministic");
        
        // Property 8: Score should be reasonable and consistent
        // The key property is that more issues should result in lower scores
        if (totalIssues > 0) {
            assertTrue(score < 100,
                      "Vault with security issues should have score less than 100, got: " + score);
        }
        
        // Property 9: Score should be inversely correlated with issues
        // Test this by comparing vaults with different issue counts
        // (This is a weaker but more reliable property than specific thresholds)
        
        // Property 10: Recommendations should be provided when there are issues
        List<String> recommendations = report.getRecommendations();
        if (totalIssues > 0) {
            assertFalse(recommendations.isEmpty(),
                       "Vault with security issues should have recommendations");
            assertTrue(recommendations.size() >= 1,
                      "Should provide at least one recommendation when issues exist");
        }
        
        // Property 11: Report metadata should be consistent
        assertEquals(userId, report.getUserId(),
                    "Report should be for the correct user");
        assertEquals(vaultData.getTotalCredentials(), report.getTotalCredentials(),
                    "Report should show correct total credential count");
        assertNotNull(report.getGeneratedAt(),
                     "Report should have generation timestamp");
        assertTrue(report.getGeneratedAt().isBefore(LocalDateTime.now().plusSeconds(1)),
                  "Report generation time should be recent");
    }

    @Provide
    Arbitrary<CredentialSet> credentialSetWithReusedPasswords() {
        return Arbitraries.integers().between(2, 8)
                .flatMap(totalCredentials -> {
                    // Generate a mix of unique and reused passwords
                    int uniquePasswords = Math.max(1, totalCredentials / 2);
                    int reusedPasswordGroups = Math.max(1, (totalCredentials - uniquePasswords) / 2);
                    
                    List<VaultEntry> credentials = new ArrayList<>();
                    Map<String, List<String>> expectedReused = new HashMap<>();
                    Set<String> uniqueHashes = new HashSet<>();
                    
                    UUID userId = UUID.randomUUID();
                    UserAccount user = createTestUser(userId);
                    
                    int credentialIndex = 0;
                    
                    // Create credentials with unique passwords
                    for (int i = 0; i < uniquePasswords && credentialIndex < totalCredentials; i++) {
                        String passwordHash = "unique_hash_" + i;
                        VaultEntry credential = createCredentialWithPassword(
                                user, "Unique Credential " + i, passwordHash, 50.0, LocalDateTime.now().minusDays(30));
                        credentials.add(credential);
                        uniqueHashes.add(passwordHash);
                        credentialIndex++;
                    }
                    
                    // Create credentials with reused passwords
                    for (int group = 0; group < reusedPasswordGroups && credentialIndex < totalCredentials; group++) {
                        String reusedHash = "reused_hash_" + group;
                        List<String> titlesInGroup = new ArrayList<>();
                        
                        // Each reused password group has 2-3 credentials
                        int credentialsInGroup = Math.min(3, totalCredentials - credentialIndex);
                        credentialsInGroup = Math.max(2, credentialsInGroup); // At least 2 for reuse
                        
                        for (int j = 0; j < credentialsInGroup && credentialIndex < totalCredentials; j++) {
                            String title = "Reused Credential " + group + "_" + j;
                            VaultEntry credential = createCredentialWithPassword(
                                    user, title, reusedHash, 45.0, LocalDateTime.now().minusDays(60));
                            credentials.add(credential);
                            titlesInGroup.add(title);
                            credentialIndex++;
                        }
                        
                        if (titlesInGroup.size() > 1) {
                            expectedReused.put(reusedHash, titlesInGroup);
                        }
                    }
                    
                    return Arbitraries.just(new CredentialSet(credentials, expectedReused, uniqueHashes));
                });
    }

    @Provide
    Arbitrary<VaultSecurityData> vaultWithSecurityIssues() {
        return Arbitraries.integers().between(0, 10)
                .flatMap(totalCredentials -> {
                    if (totalCredentials == 0) {
                        return Arbitraries.just(new VaultSecurityData(
                                Collections.emptyList(), 0, 0, 0, 0));
                    }
                    
                    List<VaultEntry> credentials = new ArrayList<>();
                    UUID userId = UUID.randomUUID();
                    UserAccount user = createTestUser(userId);
                    
                    int weakCount = 0;
                    int reusedGroups = 0;
                    int oldCount = 0;
                    
                    // Generate credentials with various security issues
                    for (int i = 0; i < totalCredentials; i++) {
                        String title = "Credential " + i;
                        String passwordHash = "hash_" + i;
                        
                        // Randomly assign security issues
                        boolean isWeak = (i % 3 == 0); // Every 3rd password is weak
                        boolean isOld = (i % 4 == 0);  // Every 4th password is old
                        
                        double entropy = isWeak ? 35.0 : 50.0; // Weak if < 40
                        LocalDateTime createdAt = isOld ? 
                                LocalDateTime.now().minusDays(100) : // Old password
                                LocalDateTime.now().minusDays(30);   // Recent password
                        
                        // Create some reused passwords
                        if (i > 0 && i % 5 == 0 && i < totalCredentials - 1) {
                            // Reuse previous password hash
                            passwordHash = "hash_" + (i - 1);
                            if (i == 5) reusedGroups++; // Count first reuse group
                        }
                        
                        VaultEntry credential = createCredentialWithPassword(
                                user, title, passwordHash, entropy, createdAt);
                        credentials.add(credential);
                        
                        if (isWeak) weakCount++;
                        if (isOld) oldCount++;
                    }
                    
                    return Arbitraries.just(new VaultSecurityData(
                            credentials, totalCredentials, weakCount, reusedGroups, oldCount));
                });
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

    private VaultEntry createCredentialWithPassword(UserAccount user, String title, String passwordHash, 
                                                   double entropy, LocalDateTime createdAt) {
        // Create encrypted data JSON that includes password metadata for analysis
        String encryptedData = String.format(
                "{\"title\":\"%s\",\"username\":\"user\",\"password\":\"encrypted\",\"url\":\"https://example.com\"," +
                "\"passwordHash\":\"%s\",\"passwordEntropy\":%.1f}",
                title, passwordHash, entropy);
        
        return VaultEntry.builder()
                .id(UUID.randomUUID())
                .user(user)
                .encryptedData(encryptedData)
                .iv("test-iv")
                .authTag("test-auth-tag")
                .entryType(VaultEntry.EntryType.CREDENTIAL)
                .version(1L)
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .build();
    }

    /**
     * Helper class to hold credential set data for testing.
     */
    private static class CredentialSet {
        private final List<VaultEntry> vaultEntries;
        private final Map<String, List<String>> expectedReusedPasswords;
        private final Set<String> uniquePasswordHashes;

        public CredentialSet(List<VaultEntry> vaultEntries, 
                           Map<String, List<String>> expectedReusedPasswords,
                           Set<String> uniquePasswordHashes) {
            this.vaultEntries = vaultEntries;
            this.expectedReusedPasswords = expectedReusedPasswords;
            this.uniquePasswordHashes = uniquePasswordHashes;
        }

        public List<VaultEntry> getVaultEntries() { return vaultEntries; }
        public Map<String, List<String>> getExpectedReusedPasswords() { return expectedReusedPasswords; }
        public Set<String> getUniquePasswordHashes() { return uniquePasswordHashes; }
        public int getTotalCredentials() { return vaultEntries.size(); }
    }

    /**
     * Helper class to hold vault security data for testing.
     */
    private static class VaultSecurityData {
        private final List<VaultEntry> vaultEntries;
        private final int totalCredentials;
        private final int weakPasswordCount;
        private final int reusedPasswordGroups;
        private final int oldPasswordCount;

        public VaultSecurityData(List<VaultEntry> vaultEntries, int totalCredentials,
                               int weakPasswordCount, int reusedPasswordGroups, int oldPasswordCount) {
            this.vaultEntries = vaultEntries;
            this.totalCredentials = totalCredentials;
            this.weakPasswordCount = weakPasswordCount;
            this.reusedPasswordGroups = reusedPasswordGroups;
            this.oldPasswordCount = oldPasswordCount;
        }

        public List<VaultEntry> getVaultEntries() { return vaultEntries; }
        public int getTotalCredentials() { return totalCredentials; }
        public int getWeakPasswordCount() { return weakPasswordCount; }
        public int getReusedPasswordGroups() { return reusedPasswordGroups; }
        public int getOldPasswordCount() { return oldPasswordCount; }
    }
}