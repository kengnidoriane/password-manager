/**
 * ConflictResolver - UI for resolving sync conflicts
 * 
 * Displays sync conflicts and allows users to choose between
 * local and server versions using last-write-wins strategy.
 * Requirements: 6.3
 */

'use client';

import React, { useState, useEffect } from 'react';
import { syncService, SyncConflict } from '@/services/syncService';

interface ConflictResolverProps {
  className?: string;
  onConflictResolved?: (conflictId: string) => void;
}

export const ConflictResolver: React.FC<ConflictResolverProps> = ({ 
  className = '',
  onConflictResolved
}) => {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [resolvingConflicts, setResolvingConflicts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Subscribe to sync status changes to get conflicts
    const unsubscribe = syncService.onStatusChange((status) => {
      setConflicts(status.conflicts);
    });
    
    // Get initial conflicts
    syncService.getSyncStatus().then((status) => {
      setConflicts(status.conflicts);
    });
    
    return unsubscribe;
  }, []);

  const handleResolveConflict = async (conflict: SyncConflict, useServerVersion: boolean) => {
    const conflictId = `${conflict.resourceType}-${conflict.resourceId}`;
    
    if (resolvingConflicts.has(conflictId)) {
      return;
    }

    setResolvingConflicts(prev => new Set(prev).add(conflictId));

    try {
      await syncService.resolveConflict(conflictId, useServerVersion);
      onConflictResolved?.(conflictId);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      // TODO: Show error notification
    } finally {
      setResolvingConflicts(prev => {
        const newSet = new Set(prev);
        newSet.delete(conflictId);
        return newSet;
      });
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getResourceTypeLabel = (resourceType: string): string => {
    switch (resourceType) {
      case 'credential': return 'Credential';
      case 'folder': return 'Folder';
      case 'tag': return 'Tag';
      case 'note': return 'Secure Note';
      default: return resourceType;
    }
  };

  const getResourceTitle = (conflict: SyncConflict): string => {
    const local = conflict.localVersion;
    const server = conflict.serverVersion;
    
    // Try to get a meaningful title from the resource
    return local?.title || local?.name || server?.title || server?.name || conflict.resourceId;
  };

  const getVersionInfo = (version: any): { updatedAt?: number, version?: number } => {
    return {
      updatedAt: version?.updatedAt,
      version: version?.version
    };
  };

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center mb-4">
        <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
          Sync Conflicts Detected
        </h3>
      </div>
      
      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
        The following items have conflicts between your local changes and server changes. 
        Choose which version to keep:
      </p>

      <div className="space-y-4">
        {conflicts.map((conflict) => {
          const conflictId = `${conflict.resourceType}-${conflict.resourceId}`;
          const isResolving = resolvingConflicts.has(conflictId);
          const localInfo = getVersionInfo(conflict.localVersion);
          const serverInfo = getVersionInfo(conflict.serverVersion);

          return (
            <div key={conflictId} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {getResourceTypeLabel(conflict.resourceType)}: {getResourceTitle(conflict)}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Conflict detected at {formatTimestamp(conflict.timestamp)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Local Version */}
                <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-blue-800 dark:text-blue-200">
                      Your Local Version
                    </h5>
                    {localInfo.version && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        v{localInfo.version}
                      </span>
                    )}
                  </div>
                  {localInfo.updatedAt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Modified: {formatTimestamp(localInfo.updatedAt)}
                    </p>
                  )}
                  <button
                    onClick={() => handleResolveConflict(conflict, false)}
                    disabled={isResolving}
                    className="mt-2 w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isResolving ? 'Resolving...' : 'Keep Local Version'}
                  </button>
                </div>

                {/* Server Version */}
                <div className="border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-green-800 dark:text-green-200">
                      Server Version
                    </h5>
                    {serverInfo.version && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        v{serverInfo.version}
                      </span>
                    )}
                  </div>
                  {serverInfo.updatedAt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Modified: {formatTimestamp(serverInfo.updatedAt)}
                    </p>
                  )}
                  <button
                    onClick={() => handleResolveConflict(conflict, true)}
                    disabled={isResolving}
                    className="mt-2 w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isResolving ? 'Resolving...' : 'Keep Server Version'}
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded p-2">
                <strong>Note:</strong> This uses a last-write-wins strategy. The version you choose will overwrite the other. 
                Consider the modification times above when making your decision.
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-yellow-700 dark:text-yellow-300">
        <strong>Tip:</strong> Conflicts typically occur when the same item is modified on multiple devices. 
        Choose the version with the most recent changes or the one you want to keep.
      </div>
    </div>
  );
};