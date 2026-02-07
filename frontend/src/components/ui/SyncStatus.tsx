/**
 * SyncStatus - Visual indicator of sync state
 * 
 * Shows current sync status, last sync time, pending changes,
 * and provides manual sync trigger.
 * Requirements: 6.1, 6.2, 6.3
 */

'use client';

import React, { useState, useEffect } from 'react';
import { syncService, SyncStatus as SyncStatusType } from '@/services/syncService';

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [status, setStatus] = useState<SyncStatusType>({
    isOnline: true,
    isSyncing: false,
    pendingChanges: 0,
    conflicts: []
  });
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = syncService.onStatusChange(setStatus);
    
    // Get initial status
    syncService.getSyncStatus().then(setStatus);
    
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    if (isManualSyncing || status.isSyncing || !status.isOnline) {
      return;
    }

    setIsManualSyncing(true);
    try {
      await syncService.manualSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formatLastSyncTime = (timestamp?: number): string => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
  };

  const getSyncStatusIcon = () => {
    if (!status.isOnline) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
        </svg>
      );
    }
    
    if (status.isSyncing || isManualSyncing) {
      return (
        <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    
    if (status.conflicts.length > 0) {
      return (
        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }
    
    if (status.pendingChanges > 0) {
      return (
        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    if (status.error) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  };

  const getSyncStatusText = () => {
    if (!status.isOnline) {
      return 'Offline';
    }
    
    if (status.isSyncing || isManualSyncing) {
      return 'Syncing...';
    }
    
    if (status.conflicts.length > 0) {
      return `${status.conflicts.length} conflict${status.conflicts.length > 1 ? 's' : ''}`;
    }
    
    if (status.pendingChanges > 0) {
      return `${status.pendingChanges} pending`;
    }
    
    if (status.error) {
      return 'Sync error';
    }
    
    return 'Synced';
  };

  const getSyncStatusColor = () => {
    if (!status.isOnline) return 'text-gray-500';
    if (status.isSyncing || isManualSyncing) return 'text-blue-500';
    if (status.conflicts.length > 0) return 'text-yellow-500';
    if (status.pendingChanges > 0) return 'text-orange-500';
    if (status.error) return 'text-red-500';
    return 'text-green-500';
  };

  if (!showDetails) {
    // Compact view - just icon and status
    return (
      <div 
        className={`flex items-center space-x-2 ${className}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Sync status: ${getSyncStatusText()}`}
      >
        <span aria-hidden="true">{getSyncStatusIcon()}</span>
        <span className={`text-sm ${getSyncStatusColor()}`}>
          {getSyncStatusText()}
        </span>
      </div>
    );
  }

  // Detailed view
  return (
    <section 
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}
      aria-labelledby="sync-status-heading"
    >
      <div className="flex items-center justify-between mb-3">
        <div 
          className="flex items-center space-x-2"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span aria-hidden="true">{getSyncStatusIcon()}</span>
          <h2 
            id="sync-status-heading"
            className={`font-medium ${getSyncStatusColor()}`}
          >
            {getSyncStatusText()}
          </h2>
        </div>
        
        {status.isOnline && !status.isSyncing && !isManualSyncing && (
          <button
            onClick={handleManualSync}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            disabled={status.isSyncing || isManualSyncing}
            aria-label="Manually trigger sync now"
          >
            Sync Now
          </button>
        )}
      </div>

      <dl className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex justify-between">
          <dt>Last sync:</dt>
          <dd>{formatLastSyncTime(status.lastSyncTime)}</dd>
        </div>
        
        {status.pendingChanges > 0 && (
          <div className="flex justify-between">
            <dt>Pending changes:</dt>
            <dd className="text-orange-500" aria-label={`${status.pendingChanges} pending changes`}>
              {status.pendingChanges}
            </dd>
          </div>
        )}
        
        {status.conflicts.length > 0 && (
          <div className="flex justify-between">
            <dt>Conflicts:</dt>
            <dd className="text-yellow-500" aria-label={`${status.conflicts.length} sync conflicts`}>
              {status.conflicts.length}
            </dd>
          </div>
        )}
        
        {status.error && (
          <div 
            className="text-red-500 text-xs mt-2"
            role="alert"
            aria-live="assertive"
          >
            Error: {status.error}
          </div>
        )}
        
        <div className="flex justify-between">
          <dt>Status:</dt>
          <dd className={status.isOnline ? 'text-green-500' : 'text-gray-500'}>
            {status.isOnline ? 'Online' : 'Offline'}
          </dd>
        </div>
      </dl>
    </section>
  );
};