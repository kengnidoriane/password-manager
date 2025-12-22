/**
 * useSync - React hook for sync service integration
 * 
 * Provides sync status, manual sync triggers, and conflict resolution
 * for React components.
 * Requirements: 6.1, 6.2, 6.3
 */

import { useState, useEffect, useCallback } from 'react';
import { syncService, SyncStatus, SyncResult, SyncConflict } from '@/services/syncService';

export interface UseSyncReturn {
  // Status
  status: SyncStatus;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime?: number;
  pendingChanges: number;
  conflicts: SyncConflict[];
  error?: string;
  
  // Actions
  manualSync: () => Promise<SyncResult>;
  forceSyncFromServer: () => Promise<SyncResult>;
  resolveConflict: (conflictId: string, useServerVersion: boolean) => Promise<void>;
  clearConflicts: () => void;
  
  // Utilities
  isSyncNeeded: () => Promise<boolean>;
  getPendingChangesCount: () => Promise<number>;
}

/**
 * Hook for sync service integration
 */
export const useSync = (): UseSyncReturn => {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingChanges: 0,
    conflicts: []
  });

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = syncService.onStatusChange(setStatus);
    
    // Get initial status
    syncService.getSyncStatus().then(setStatus);
    
    // Initialize sync service
    syncService.initialize();
    
    return () => {
      unsubscribe();
    };
  }, []);

  const manualSync = useCallback(async (): Promise<SyncResult> => {
    return syncService.manualSync();
  }, []);

  const forceSyncFromServer = useCallback(async (): Promise<SyncResult> => {
    return syncService.forceSyncFromServer();
  }, []);

  const resolveConflict = useCallback(async (conflictId: string, useServerVersion: boolean): Promise<void> => {
    return syncService.resolveConflict(conflictId, useServerVersion);
  }, []);

  const clearConflicts = useCallback((): void => {
    syncService.clearConflicts();
  }, []);

  const isSyncNeeded = useCallback(async (): Promise<boolean> => {
    return syncService.isSyncNeeded();
  }, []);

  const getPendingChangesCount = useCallback(async (): Promise<number> => {
    return syncService.getPendingChangesCount();
  }, []);

  return {
    // Status
    status,
    isOnline: status.isOnline,
    isSyncing: status.isSyncing,
    lastSyncTime: status.lastSyncTime,
    pendingChanges: status.pendingChanges,
    conflicts: status.conflicts,
    error: status.error,
    
    // Actions
    manualSync,
    forceSyncFromServer,
    resolveConflict,
    clearConflicts,
    
    // Utilities
    isSyncNeeded,
    getPendingChangesCount
  };
};