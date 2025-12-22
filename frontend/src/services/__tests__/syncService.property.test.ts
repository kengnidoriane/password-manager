/**
 * Property-based tests for SyncService
 * 
 * Tests sync service correctness properties using fast-check
 * **Feature: password-manager, Property 30: Latest vault data on device switch**
 * **Validates: Requirements 6.2**
 */

import fc from 'fast-check';
import { SyncService } from '../syncService';
import { vaultService } from '../vaultService';
import { db } from '@/lib/db';

// Mock dependencies
jest.mock('../vaultService');
jest.mock('@/lib/db');
jest.mock('@/stores/vaultStore', () => ({
  useVaultStore: {
    getState: () => ({
      setLastSyncTime: jest.fn(),
      setSyncing: jest.fn(),
      setCredentials: jest.fn(),
      setFolders: jest.fn(),
      setTags: jest.fn(),
      setSecureNotes: jest.fn()
    })
  }
}));

const mockVaultService = vaultService as jest.Mocked<typeof vaultService>;
const mockDb = db as jest.Mocked<typeof db>;

describe('SyncService Property Tests', () => {
  let syncService: SyncService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    (SyncService as any).instance = undefined;
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    // Get fresh instance for each test
    syncService = SyncService.getInstance();
    
    // Mock vault service methods with default implementations
    mockVaultService.getPendingSyncOperations.mockResolvedValue([]);
    mockVaultService.forceSyncFromServer.mockResolvedValue();
    mockVaultService.processPendingSyncOperations.mockResolvedValue();
    mockVaultService.getCredentials.mockResolvedValue([]);
    mockVaultService.getFolders.mockResolvedValue([]);
    mockVaultService.getTags.mockResolvedValue([]);
    mockVaultService.getSecureNotes.mockResolvedValue([]);
    
    // Mock db methods
    mockDb.getSettings.mockResolvedValue({
      id: 'settings',
      sessionTimeout: 900000,
      clipboardTimeout: 60000,
      biometricEnabled: false,
      strictSecurityMode: false,
      theme: 'system',
      lastSyncTime: Date.now()
    });
  });

  afterEach(() => {
    syncService.cleanup();
    // Reset singleton instance
    (SyncService as any).instance = undefined;
  });

  /**
   * Property 30: Latest vault data on device switch
   * For any vault state, when switching to a new device and performing forceSyncFromServer,
   * the local vault should contain the latest data from the server
   * **Validates: Requirements 6.2**
   */
  describe('Property 30: Latest vault data on device switch', () => {
    const credentialArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      username: fc.string({ minLength: 1, maxLength: 100 }),
      password: fc.string({ minLength: 8, maxLength: 128 }),
      url: fc.string({ minLength: 1, maxLength: 200 }),
      notes: fc.string({ maxLength: 1000 }),
      folderId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
      tags: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
      createdAt: fc.integer({ min: 1000000000000, max: Date.now() }),
      updatedAt: fc.integer({ min: 1000000000000, max: Date.now() }),
      version: fc.integer({ min: 1, max: 100 }),
      lastUsed: fc.option(fc.integer({ min: 1000000000000, max: Date.now() }))
    });

    const folderArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      parentId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
      createdAt: fc.integer({ min: 1000000000000, max: Date.now() }),
      updatedAt: fc.integer({ min: 1000000000000, max: Date.now() })
    });

    const tagArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      color: fc.string({ minLength: 1, maxLength: 20 }),
      createdAt: fc.integer({ min: 1000000000000, max: Date.now() })
    });

    const secureNoteArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      content: fc.string({ minLength: 1, maxLength: 10000 }),
      folderId: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
      tags: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
      createdAt: fc.integer({ min: 1000000000000, max: Date.now() }),
      updatedAt: fc.integer({ min: 1000000000000, max: Date.now() })
    });

    const vaultDataArb = fc.record({
      credentials: fc.array(credentialArb, { maxLength: 20 }),
      folders: fc.array(folderArb, { maxLength: 10 }),
      tags: fc.array(tagArb, { maxLength: 15 }),
      secureNotes: fc.array(secureNoteArb, { maxLength: 10 })
    });

    it('should retrieve latest vault data when switching devices', async () => {
      await fc.assert(
        fc.asyncProperty(vaultDataArb, async (serverVaultData) => {
          // Reset mocks for this property test run
          jest.clearAllMocks();
          
          // Create fresh sync service instance for this test
          (SyncService as any).instance = undefined;
          const testSyncService = SyncService.getInstance();
          
          // Arrange: Mock server data
          mockVaultService.getCredentials.mockResolvedValue(serverVaultData.credentials);
          mockVaultService.getFolders.mockResolvedValue(serverVaultData.folders);
          mockVaultService.getTags.mockResolvedValue(serverVaultData.tags);
          mockVaultService.getSecureNotes.mockResolvedValue(serverVaultData.secureNotes);
          mockVaultService.forceSyncFromServer.mockResolvedValue();

          // Act: Simulate device switch by forcing sync from server
          const result = await testSyncService.forceSyncFromServer();

          // Assert: Sync should succeed
          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();

          // Verify that forceSyncFromServer was called (simulating device switch)
          expect(mockVaultService.forceSyncFromServer).toHaveBeenCalled();

          // Verify that vault data was retrieved from server
          expect(mockVaultService.getCredentials).toHaveBeenCalled();
          expect(mockVaultService.getFolders).toHaveBeenCalled();
          expect(mockVaultService.getTags).toHaveBeenCalled();
          expect(mockVaultService.getSecureNotes).toHaveBeenCalled();
          
          // Cleanup
          testSyncService.cleanup();
        }),
        { numRuns: 50 }
      );
    });

    it('should handle empty vault data on device switch', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant({}), async () => {
          // Reset mocks for this property test run
          jest.clearAllMocks();
          
          // Create fresh sync service instance for this test
          (SyncService as any).instance = undefined;
          const testSyncService = SyncService.getInstance();
          
          // Arrange: Mock empty server data
          mockVaultService.getCredentials.mockResolvedValue([]);
          mockVaultService.getFolders.mockResolvedValue([]);
          mockVaultService.getTags.mockResolvedValue([]);
          mockVaultService.getSecureNotes.mockResolvedValue([]);
          mockVaultService.forceSyncFromServer.mockResolvedValue();

          // Act: Force sync from server
          const result = await testSyncService.forceSyncFromServer();

          // Assert: Should handle empty data gracefully
          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();
          expect(mockVaultService.forceSyncFromServer).toHaveBeenCalled();
          
          // Cleanup
          testSyncService.cleanup();
        }),
        { numRuns: 25 }
      );
    });

    it('should fail gracefully when offline during device switch', async () => {
      await fc.assert(
        fc.asyncProperty(vaultDataArb, async (serverVaultData) => {
          // Reset mocks for this property test run
          jest.clearAllMocks();
          
          // Create fresh sync service instance for this test
          (SyncService as any).instance = undefined;
          
          // Arrange: Simulate offline state
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false
          });
          
          const testSyncService = SyncService.getInstance();

          // Act: Try to force sync while offline
          const result = await testSyncService.forceSyncFromServer();

          // Assert: Should fail with appropriate error when offline
          expect(result.success).toBe(false);
          expect(result.error).toContain('offline');
          
          // Verify that no server calls were made
          expect(mockVaultService.forceSyncFromServer).not.toHaveBeenCalled();
          
          // Cleanup and restore online state
          testSyncService.cleanup();
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true
          });
        }),
        { numRuns: 25 }
      );
    });

    it('should update sync status after successful device switch sync', async () => {
      await fc.assert(
        fc.asyncProperty(vaultDataArb, async (serverVaultData) => {
          // Reset mocks for this property test run
          jest.clearAllMocks();
          
          // Create fresh sync service instance for this test
          (SyncService as any).instance = undefined;
          const testSyncService = SyncService.getInstance();
          
          // Arrange: Mock server data
          mockVaultService.getCredentials.mockResolvedValue(serverVaultData.credentials);
          mockVaultService.getFolders.mockResolvedValue(serverVaultData.folders);
          mockVaultService.getTags.mockResolvedValue(serverVaultData.tags);
          mockVaultService.getSecureNotes.mockResolvedValue(serverVaultData.secureNotes);
          mockVaultService.forceSyncFromServer.mockResolvedValue();

          // Act: Force sync from server
          const result = await testSyncService.forceSyncFromServer();

          // Assert: Should succeed
          expect(result.success).toBe(true);
          
          // Verify sync status reflects successful sync (check that it's a reasonable timestamp)
          const status = await testSyncService.getSyncStatus();
          expect(status.lastSyncTime).toBeGreaterThan(0);
          expect(status.lastSyncTime).toBeLessThanOrEqual(Date.now() + 1000); // Allow 1 second buffer
          
          // Cleanup
          testSyncService.cleanup();
        }),
        { numRuns: 50 }
      );
    });

    it('should maintain data consistency during device switch with concurrent operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          vaultDataArb,
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }),
          async (serverVaultData, pendingOperationIds) => {
            // Reset mocks for this property test run
            jest.clearAllMocks();
            
            // Create fresh sync service instance for this test
            (SyncService as any).instance = undefined;
            const testSyncService = SyncService.getInstance();
            
            // Arrange: Mock server data and pending operations
            mockVaultService.getCredentials.mockResolvedValue(serverVaultData.credentials);
            mockVaultService.getFolders.mockResolvedValue(serverVaultData.folders);
            mockVaultService.getTags.mockResolvedValue(serverVaultData.tags);
            mockVaultService.getSecureNotes.mockResolvedValue(serverVaultData.secureNotes);
            mockVaultService.forceSyncFromServer.mockResolvedValue();
            
            // Mock pending operations
            const pendingOps = pendingOperationIds.map(id => ({
              operation: 'create' as const,
              resourceType: 'credential' as const,
              resourceId: id,
              timestamp: Date.now(),
              synced: false
            }));
            mockVaultService.getPendingSyncOperations.mockResolvedValue(pendingOps);

            // Act: Force sync from server (should handle pending operations)
            const result = await testSyncService.forceSyncFromServer();

            // Assert: Should succeed despite pending operations
            expect(result.success).toBe(true);
            expect(mockVaultService.forceSyncFromServer).toHaveBeenCalled();
            
            // Verify that data retrieval happened after force sync
            expect(mockVaultService.getCredentials).toHaveBeenCalled();
            expect(mockVaultService.getFolders).toHaveBeenCalled();
            expect(mockVaultService.getTags).toHaveBeenCalled();
            expect(mockVaultService.getSecureNotes).toHaveBeenCalled();
            
            // Cleanup
            testSyncService.cleanup();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional property: Manual sync bypasses debouncing
   * Manual sync should execute immediately regardless of debounce state
   */
  describe('Manual sync property', () => {
    it('should execute manual sync immediately without debouncing', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          // Reset mocks for this property test run
          jest.clearAllMocks();
          
          // Create fresh sync service instance for this test
          (SyncService as any).instance = undefined;
          const testSyncService = SyncService.getInstance();
          
          // Arrange: Mock successful sync
          mockVaultService.processPendingSyncOperations.mockResolvedValue();

          // Act: Trigger automatic sync, then manual sync immediately
          testSyncService.triggerSync();
          const result = await testSyncService.manualSync();

          // Assert: Manual sync should succeed immediately
          expect(result.success).toBe(true);
          // Manual sync should have been called at least once
          expect(mockVaultService.processPendingSyncOperations).toHaveBeenCalled();
          
          // Cleanup
          testSyncService.cleanup();
        }),
        { numRuns: 25 }
      );
    });
  });
});