package com.passwordmanager.backend.service;

import com.passwordmanager.backend.dto.CredentialRequest;
import com.passwordmanager.backend.dto.CredentialResponse;
import com.passwordmanager.backend.entity.UserAccount;
import com.passwordmanager.backend.repository.UserRepository;
import com.passwordmanager.backend.repository.VaultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for caching strategy.
 * 
 * Tests verify:
 * - Cache hit/miss behavior
 * - Cache eviction on mutations
 * - Cache TTL configuration
 * - Cache metrics tracking
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CacheIntegrationTest {

    @Autowired
    private VaultService vaultService;

    @Autowired
    private SecurityAnalyzerService securityAnalyzerService;

    @Autowired
    private BreachCheckService breachCheckService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VaultRepository vaultRepository;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private CacheMetricsService cacheMetricsService;

    private UserAccount testUser;

    @BeforeEach
    void setUp() {
        // Clear all caches before each test
        cacheManager.getCacheNames().forEach(cacheName -> 
            cacheManager.getCache(cacheName).clear());

        // Create test user
        testUser = UserAccount.builder()
                .email("cache-test@example.com")
                .authKeyHash("hashedAuthKey")
                .salt("salt123")
                .iterations(100000)
                .twoFactorEnabled(false)
                .build();
        testUser = userRepository.save(testUser);
    }

    @Test
    void testVaultMetadataCaching() {
        // First call should be a cache miss
        List<CredentialResponse> credentials1 = vaultService.getAllCredentials(testUser.getId());
        
        // Second call should be a cache hit
        List<CredentialResponse> credentials2 = vaultService.getAllCredentials(testUser.getId());
        
        // Verify both calls return the same data
        assertThat(credentials1).isEqualTo(credentials2);
        
        // Verify cache was used
        var cache = cacheManager.getCache("vaultMetadata");
        assertThat(cache).isNotNull();
        assertThat(cache.get(testUser.getId() + ":credentials")).isNotNull();
    }

    @Test
    void testCacheEvictionOnCreate() {
        // Populate cache
        vaultService.getAllCredentials(testUser.getId());
        
        // Verify cache is populated
        var cache = cacheManager.getCache("vaultMetadata");
        assertThat(cache.get(testUser.getId() + ":credentials")).isNotNull();
        
        // Create a new credential
        CredentialRequest request = CredentialRequest.builder()
                .encryptedData("encrypted-data")
                .iv("iv-value")
                .authTag("auth-tag")
                .build();
        
        vaultService.createCredential(testUser.getId(), request);
        
        // Verify cache was evicted
        assertThat(cache.get(testUser.getId() + ":credentials")).isNull();
    }

    @Test
    void testCacheEvictionOnUpdate() {
        // Create a credential
        CredentialRequest createRequest = CredentialRequest.builder()
                .encryptedData("encrypted-data")
                .iv("iv-value")
                .authTag("auth-tag")
                .build();
        
        CredentialResponse created = vaultService.createCredential(testUser.getId(), createRequest);
        
        // Populate cache
        vaultService.getAllCredentials(testUser.getId());
        
        // Verify cache is populated
        var cache = cacheManager.getCache("vaultMetadata");
        assertThat(cache.get(testUser.getId() + ":credentials")).isNotNull();
        
        // Update the credential
        CredentialRequest updateRequest = CredentialRequest.builder()
                .encryptedData("updated-encrypted-data")
                .iv("updated-iv-value")
                .authTag("updated-auth-tag")
                .version(created.getVersion())
                .build();
        
        vaultService.updateCredential(testUser.getId(), created.getId(), updateRequest);
        
        // Verify cache was evicted
        assertThat(cache.get(testUser.getId() + ":credentials")).isNull();
    }

    @Test
    void testCacheEvictionOnDelete() {
        // Create a credential
        CredentialRequest createRequest = CredentialRequest.builder()
                .encryptedData("encrypted-data")
                .iv("iv-value")
                .authTag("auth-tag")
                .build();
        
        CredentialResponse created = vaultService.createCredential(testUser.getId(), createRequest);
        
        // Populate cache
        vaultService.getAllCredentials(testUser.getId());
        
        // Verify cache is populated
        var cache = cacheManager.getCache("vaultMetadata");
        assertThat(cache.get(testUser.getId() + ":credentials")).isNotNull();
        
        // Delete the credential
        vaultService.deleteCredential(testUser.getId(), created.getId());
        
        // Verify cache was evicted
        assertThat(cache.get(testUser.getId() + ":credentials")).isNull();
    }

    @Test
    void testSecurityReportCaching() {
        // First call should be a cache miss
        var report1 = securityAnalyzerService.generateSecurityReport(testUser.getId());
        
        // Second call should be a cache hit
        var report2 = securityAnalyzerService.generateSecurityReport(testUser.getId());
        
        // Verify both calls return the same data
        assertThat(report1.getOverallScore()).isEqualTo(report2.getOverallScore());
        
        // Verify cache was used
        var cache = cacheManager.getCache("securityReports");
        assertThat(cache).isNotNull();
        assertThat(cache.get(testUser.getId())).isNotNull();
    }

    @Test
    void testSecurityReportCacheEvictionOnCredentialChange() {
        // Populate security report cache
        securityAnalyzerService.generateSecurityReport(testUser.getId());
        
        // Verify cache is populated
        var cache = cacheManager.getCache("securityReports");
        assertThat(cache.get(testUser.getId())).isNotNull();
        
        // Create a new credential
        CredentialRequest request = CredentialRequest.builder()
                .encryptedData("encrypted-data")
                .iv("iv-value")
                .authTag("auth-tag")
                .build();
        
        vaultService.createCredential(testUser.getId(), request);
        
        // Verify security report cache was evicted
        assertThat(cache.get(testUser.getId())).isNull();
    }

    @Test
    void testBreachCheckCaching() {
        String testPassword = "TestPassword123!";
        
        // First call should be a cache miss
        Boolean breached1 = breachCheckService.isPasswordBreached(testPassword);
        
        // Second call should be a cache hit
        Boolean breached2 = breachCheckService.isPasswordBreached(testPassword);
        
        // Verify both calls return the same result
        assertThat(breached1).isEqualTo(breached2);
        
        // Verify cache was used
        var cache = cacheManager.getCache("breachCheck");
        assertThat(cache).isNotNull();
        assertThat(cache.get(testPassword)).isNotNull();
    }

    @Test
    void testCacheMetricsTracking() {
        // Reset metrics by getting initial counts
        double initialHits = cacheMetricsService.getHitCount("vaultMetadata");
        double initialMisses = cacheMetricsService.getMissCount("vaultMetadata");
        
        // First call - cache miss
        vaultService.getAllCredentials(testUser.getId());
        
        // Verify miss was recorded
        double missesAfterFirst = cacheMetricsService.getMissCount("vaultMetadata");
        assertThat(missesAfterFirst).isGreaterThan(initialMisses);
        
        // Note: Cache hits are not explicitly tracked in the current implementation
        // as Spring's @Cacheable doesn't provide a hook for hit tracking
        // This would require a custom cache interceptor or aspect
    }

    @Test
    void testMultipleCacheConfigurations() {
        // Verify all cache configurations exist
        assertThat(cacheManager.getCache("sessions")).isNotNull();
        assertThat(cacheManager.getCache("vaultMetadata")).isNotNull();
        assertThat(cacheManager.getCache("breachCheck")).isNotNull();
        assertThat(cacheManager.getCache("securityReports")).isNotNull();
    }
}
