/**
 * SyncService - Frontend sync service for bidirectional synchronization
 * 
 * Handles automatic sync with debouncing, manual sync triggers,
 * conflict resolution, and sync status management.
 * Requirements: 3.5, 6.1, 6.2, 6.3
 */

import { vaultService } from './vaultService';
import { db } from '@/lib/db';

export interface SyncConflict {
  resourceId: string;
  resourceType: 'credential' | 'folder' | 'tag' | 'note';
  localVersion: any;
  serverVersion: any;
  timestamp: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime?: number;
  pendingChanges: number;
  conflicts: SyncConflict[];
  error?: string;
}

export interface SyncResult {
  success: boolean;
  conflicts: SyncConflict[];
  syncedChanges: number;
  error?: string;
}

/**
 * SyncService class for managing vault synchronization
 */
export class SyncService {
  private static instance: SyncService;
  private syncTimeout: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private conflicts: SyncConflict[] = [];
  private lastError: string | undefined;
  private statusListeners: ((status: SyncStatus) => void)[] = [];

  private constructor() {
    // Initialize online status
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyStatusChange();
        // Trigger sync when coming back online
        this.triggerSync();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyStatusChange();
      });
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Subscribe to sync status changes
   */
  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of status change
   */
  private async notifyStatusChange(): Promise<void> {
    const status = await this.getSyncStatus();
    this.statusListeners.forEach(listener => listener(status));
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingOperations = await vaultService.getPendingSyncOperations();
    const settings = await db.getSettings();
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: settings.lastSyncTime,
      pendingChanges: pendingOperations.length,
      conflicts: this.conflicts,
      error: this.lastError
    };
  }

  /**
   * Trigger sync with 5-second debounce (automatic sync on vault changes)
   * Requirements: 6.1 - sync changes within 5 seconds
   */
  triggerSync(): void {
    if (!this.isOnline || this.isSyncing) {
      return;
    }

    // Clear existing timeout
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    // Set new timeout for 5-second debounce
    this.syncTimeout = setTimeout(() => {
      this.performSync();
    }, 5000);
  }

  /**
   * Manual sync trigger (immediate)
   * Requirements: 6.1 - manual sync capability
   */
  async manualSync(): Promise<SyncResult> {
    if (!this.isOnline) {
      const error = 'Cannot sync while offline';
      this.lastError = error;
      await this.notifyStatusChange();
      return {
        success: false,
        conflicts: [],
        syncedChanges: 0,
        error
      };
    }

    // Cancel any pending debounced sync
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    return this.performSync();
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        conflicts: [],
        syncedChanges: 0,
        error: 'Sync already in progress'
      };
    }

    this.isSyncing = true;
    this.lastError = undefined;
    await this.notifyStatusChange();

    try {
      // Use the existing vault service sync functionality
      await vaultService.processPendingSyncOperations();
      
      // Get updated status after sync
      const pendingOperations = await vaultService.getPendingSyncOperations();
      const settings = await db.getSettings();
      
      // Update vault store with latest sync time
      if (typeof window !== 'undefined') {
        const { useVaultStore } = await import('@/stores/vaultStore');
        const vaultStore = useVaultStore.getState();
        vaultStore.setLastSyncTime(settings.lastSyncTime || Date.now());
        vaultStore.setSyncing(false);
      }

      const result: SyncResult = {
        success: true,
        conflicts: this.conflicts,
        syncedChanges: 0, // This would be calculated based on actual synced operations
        error: undefined
      };

      this.lastError = undefined;
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      this.lastError = errorMessage;
      
      return {
        success: false,
        conflicts: [],
        syncedChanges: 0,
        error: errorMessage
      };
    } finally {
      this.isSyncing = false;
      await this.notifyStatusChange();
    }
  }

  /**
   * Force full sync from server
   * Requirements: 6.2 - download latest vault data on device switch
   */
  async forceSyncFromServer(): Promise<SyncResult> {
    if (!this.isOnline) {
      const error = 'Cannot sync while offline';
      this.lastError = error;
      await this.notifyStatusChange();
      return {
        success: false,
        conflicts: [],
        syncedChanges: 0,
        error
      };
    }

    this.isSyncing = true;
    this.lastError = undefined;
    await this.notifyStatusChange();

    try {
      await vaultService.forceSyncFromServer();
      
      // Update vault store
      if (typeof window !== 'undefined') {
        const { useVaultStore } = await import('@/stores/vaultStore');
        const vaultStore = useVaultStore.getState();
        vaultStore.setLastSyncTime(Date.now());
        vaultStore.setSyncing(false);

        // Refresh vault data in store
        await this.refreshVaultStoreData();
      }

      const result: SyncResult = {
        success: true,
        conflicts: [],
        syncedChanges: 0,
        error: undefined
      };

      this.lastError = undefined;
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Force sync failed';
      this.lastError = errorMessage;
      
      return {
        success: false,
        conflicts: [],
        syncedChanges: 0,
        error: errorMessage
      };
    } finally {
      this.isSyncing = false;
      await this.notifyStatusChange();
    }
  }

  /**
   * Resolve sync conflict using last-write-wins strategy
   * Requirements: 6.3 - conflict resolution with user notification
   */
  async resolveConflict(conflictId: string, useServerVersion: boolean): Promise<void> {
    const conflictIndex = this.conflicts.findIndex(c => 
      `${c.resourceType}-${c.resourceId}` === conflictId
    );
    
    if (conflictIndex === -1) {
      throw new Error('Conflict not found');
    }

    const conflict = this.conflicts[conflictIndex];
    
    try {
      if (useServerVersion) {
        // Apply server version to local storage
        switch (conflict.resourceType) {
          case 'credential':
            await db.credentials.put(conflict.serverVersion);
            break;
          case 'folder':
            await db.folders.put(conflict.serverVersion);
            break;
          case 'tag':
            await db.tags.put(conflict.serverVersion);
            break;
          case 'note':
            await db.secureNotes.put(conflict.serverVersion);
            break;
        }
      } else {
        // Keep local version and sync it to server
        await vaultService.addToSyncQueue(
          'update',
          conflict.resourceType,
          conflict.resourceId,
          conflict.localVersion
        );
      }

      // Remove resolved conflict
      this.conflicts.splice(conflictIndex, 1);
      await this.notifyStatusChange();

    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw new Error('Failed to resolve conflict');
    }
  }

  /**
   * Add a conflict to the conflicts list
   */
  addConflict(conflict: SyncConflict): void {
    // Check if conflict already exists
    const existingIndex = this.conflicts.findIndex(c => 
      c.resourceType === conflict.resourceType && c.resourceId === conflict.resourceId
    );
    
    if (existingIndex >= 0) {
      // Update existing conflict
      this.conflicts[existingIndex] = conflict;
    } else {
      // Add new conflict
      this.conflicts.push(conflict);
    }
    
    this.notifyStatusChange();
  }

  /**
   * Clear all conflicts
   */
  clearConflicts(): void {
    this.conflicts = [];
    this.notifyStatusChange();
  }

  /**
   * Get pending changes count
   */
  async getPendingChangesCount(): Promise<number> {
    const pendingOperations = await vaultService.getPendingSyncOperations();
    return pendingOperations.length;
  }

  /**
   * Check if sync is needed (has pending changes)
   */
  async isSyncNeeded(): Promise<boolean> {
    const pendingCount = await this.getPendingChangesCount();
    return pendingCount > 0;
  }

  /**
   * Refresh vault store data from local database
   */
  private async refreshVaultStoreData(): Promise<void> {
    if (typeof window === 'undefined') {
      return; // Skip in non-browser environments
    }
    
    try {
      const { useVaultStore } = await import('@/stores/vaultStore');
      const vaultStore = useVaultStore.getState();
      
      // Load all data from local database
      const [credentials, folders, tags, secureNotes] = await Promise.all([
        vaultService.getCredentials(),
        vaultService.getFolders(),
        vaultService.getTags(),
        vaultService.getSecureNotes()
      ]);

      // Update store
      vaultStore.setCredentials(credentials);
      vaultStore.setFolders(folders);
      vaultStore.setTags(tags);
      vaultStore.setSecureNotes(secureNotes);
      
    } catch (error) {
      console.error('Failed to refresh vault store data:', error);
    }
  }

  /**
   * Initialize sync service
   */
  async initialize(): Promise<void> {
    // Set initial online status
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    // Notify initial status
    await this.notifyStatusChange();
    
    // If online and has pending changes, trigger sync
    if (this.isOnline) {
      const hasPendingChanges = await this.isSyncNeeded();
      if (hasPendingChanges) {
        this.triggerSync();
      }
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
    
    this.statusListeners = [];
    this.conflicts = [];
    this.lastError = undefined;
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();