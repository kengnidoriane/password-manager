'use client';

/**
 * SharedWithMe Component
 * 
 * Displays credentials that have been shared with the current user.
 * Includes decryption, access tracking, and sync status.
 */

import { useState, useEffect, useCallback } from 'react';
import { SharedCredentialResponse, sharingService } from '@/services/sharingService';
import { CryptoService } from '@/lib/crypto';
import { useClipboard } from '@/hooks/useClipboard';
import { useAuthStore } from '@/stores/authStore';

interface DecryptedCredential {
  shareId: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  ownerEmail: string;
  permissions: string[];
  sharedAt: string;
  lastAccessedAt?: string;
  canRead: boolean;
  canWrite: boolean;
}

interface SharedWithMeProps {
  onError?: (error: string) => void;
}

export function SharedWithMe({ onError }: SharedWithMeProps) {
  const [sharedCredentials, setSharedCredentials] = useState<SharedCredentialResponse[]>([]);
  const [decryptedCredentials, setDecryptedCredentials] = useState<Map<string, DecryptedCredential>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isDecrypting, setIsDecrypting] = useState<Set<string>>(new Set());
  const [expandedCredentials, setExpandedCredentials] = useState<Set<string>>(new Set());
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [syncStatus, setSyncStatus] = useState<{
    lastSyncTime?: number;
    pendingShares: number;
    activeShares: number;
  }>({ pendingShares: 0, activeShares: 0 });

  const { copyToClipboard } = useClipboard();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { encryptionKey } = useAuthStore();

  // Load shared credentials on component mount
  useEffect(() => {
    loadSharedCredentials();
    loadSyncStatus();
  }, []);

  const loadSharedCredentials = async () => {
    try {
      setIsLoading(true);
      const credentials = await sharingService.getReceivedCredentials();
      setSharedCredentials(credentials);
    } catch (error) {
      console.error('Failed to load shared credentials:', error);
      onError?.('Failed to load shared credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const status = await sharingService.getShareSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const decryptCredential = async (sharedCredential: SharedCredentialResponse) => {
    if (decryptedCredentials.has(sharedCredential.shareId) || isDecrypting.has(sharedCredential.shareId)) {
      return;
    }

    if (!encryptionKey) {
      onError?.('No encryption key available. Please unlock your session.');
      return;
    }

    try {
      setIsDecrypting(prev => new Set(prev).add(sharedCredential.shareId));

      // Access the shared credential (updates last accessed timestamp)
      const accessedCredential = await sharingService.accessSharedCredential(sharedCredential.shareId);

      // Decrypt the credential data
      const decryptedData = await CryptoService.decrypt({
        encryptedData: accessedCredential.encryptedData,
        iv: accessedCredential.iv,
        authTag: accessedCredential.authTag
      }, encryptionKey);

      const credentialData = JSON.parse(decryptedData);

      const decryptedCredential: DecryptedCredential = {
        shareId: accessedCredential.shareId,
        title: credentialData.title,
        username: credentialData.username,
        password: credentialData.password,
        url: credentialData.url,
        notes: credentialData.notes,
        ownerEmail: accessedCredential.ownerEmail,
        permissions: accessedCredential.permissions,
        sharedAt: accessedCredential.sharedAt,
        lastAccessedAt: accessedCredential.lastAccessedAt,
        canRead: accessedCredential.canRead,
        canWrite: accessedCredential.canWrite
      };

      setDecryptedCredentials(prev => new Map(prev).set(sharedCredential.shareId, decryptedCredential));
      setExpandedCredentials(prev => new Set(prev).add(sharedCredential.shareId));

    } catch (error) {
      console.error('Failed to decrypt credential:', error);
      onError?.('Failed to decrypt credential');
    } finally {
      setIsDecrypting(prev => {
        const newSet = new Set(prev);
        newSet.delete(sharedCredential.shareId);
        return newSet;
      });
    }
  };

  const toggleCredentialExpansion = (shareId: string) => {
    const sharedCredential = sharedCredentials.find(c => c.shareId === shareId);
    if (!sharedCredential) return;

    if (expandedCredentials.has(shareId)) {
      setExpandedCredentials(prev => {
        const newSet = new Set(prev);
        newSet.delete(shareId);
        return newSet;
      });
    } else {
      decryptCredential(sharedCredential);
    }
  };

  const togglePasswordVisibility = (shareId: string) => {
    setShowPasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shareId)) {
        newSet.delete(shareId);
      } else {
        newSet.add(shareId);
      }
      return newSet;
    });
  };

  const handleCopyToClipboard = useCallback(async (
    text: string,
    fieldType: 'username' | 'password' | 'url' | 'notes',
    shareId: string
  ) => {
    try {
      await copyToClipboard(text, fieldType, shareId);
      setCopiedField(`${shareId}-${fieldType}`);
      
      // Clear copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [copyToClipboard]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSyncTime = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Sync Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Shared with Me
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Credentials shared by other users
          </p>
        </div>
        
        {/* Sync Status */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>{syncStatus.activeShares} active</span>
            </div>
            {syncStatus.pendingShares > 0 && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <span>{syncStatus.pendingShares} pending</span>
              </div>
            )}
          </div>
          <div>
            Last sync: {formatSyncTime(syncStatus.lastSyncTime)}
          </div>
          <button
            onClick={loadSyncStatus}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            title="Refresh sync status"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Shared Credentials List */}
      {sharedCredentials.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No shared credentials
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No one has shared any credentials with you yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sharedCredentials.map((sharedCredential) => {
            const isExpanded = expandedCredentials.has(sharedCredential.shareId);
            const isDecryptingThis = isDecrypting.has(sharedCredential.shareId);
            const decryptedCredential = decryptedCredentials.get(sharedCredential.shareId);
            const showPassword = showPasswords.has(sharedCredential.shareId);

            return (
              <div
                key={sharedCredential.shareId}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCredentialExpansion(sharedCredential.shareId)}
                        className="flex items-center gap-2 text-left"
                      >
                        <svg
                          className={`h-5 w-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {sharedCredential.credentialTitle}
                        </h3>
                      </button>
                      
                      {/* Permissions */}
                      <div className="flex gap-1">
                        {sharedCredential.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Shared by {sharedCredential.ownerEmail}</span>
                      <span>•</span>
                      <span>{formatDate(sharedCredential.sharedAt)}</span>
                      {sharedCredential.lastAccessedAt && (
                        <>
                          <span>•</span>
                          <span>Last accessed {formatDate(sharedCredential.lastAccessedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                    {isDecryptingThis ? (
                      <div className="flex items-center justify-center py-8">
                        <svg className="h-6 w-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          Decrypting credential...
                        </span>
                      </div>
                    ) : decryptedCredential ? (
                      <div className="space-y-4">
                        {/* Username */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Username
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {decryptedCredential.username}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCopyToClipboard(decryptedCredential.username, 'username', sharedCredential.shareId)}
                            className="ml-2 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                            title="Copy username"
                          >
                            {copiedField === `${sharedCredential.shareId}-username` ? (
                              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Password */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Password
                            </label>
                            <p className="text-sm text-gray-900 dark:text-white font-mono">
                              {showPassword ? decryptedCredential.password : '••••••••••••'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => togglePasswordVisibility(sharedCredential.shareId)}
                              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                              title={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleCopyToClipboard(decryptedCredential.password, 'password', sharedCredential.shareId)}
                              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                              title="Copy password"
                            >
                              {copiedField === `${sharedCredential.shareId}-password` ? (
                                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* URL */}
                        {decryptedCredential.url && (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                URL
                              </label>
                              <a
                                href={decryptedCredential.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 truncate block"
                              >
                                {decryptedCredential.url}
                              </a>
                            </div>
                            <button
                              onClick={() => handleCopyToClipboard(decryptedCredential.url, 'url', sharedCredential.shareId)}
                              className="ml-2 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                              title="Copy URL"
                            >
                              {copiedField === `${sharedCredential.shareId}-url` ? (
                                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Notes */}
                        {decryptedCredential.notes && (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Notes
                              </label>
                              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                {decryptedCredential.notes}
                              </p>
                            </div>
                            <button
                              onClick={() => handleCopyToClipboard(decryptedCredential.notes, 'notes', sharedCredential.shareId)}
                              className="ml-2 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                              title="Copy notes"
                            >
                              {copiedField === `${sharedCredential.shareId}-notes` ? (
                                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Failed to decrypt credential
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}