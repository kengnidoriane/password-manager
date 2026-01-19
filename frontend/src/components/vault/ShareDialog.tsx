'use client';

/**
 * ShareDialog Component
 * 
 * Dialog for sharing credentials with other users.
 * Includes recipient selection, permission configuration, and sharing management.
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Credential } from '@/lib/db';
import { sharingService, ShareCredentialResponse, ShareAuditEntry } from '@/services/sharingService';
import { CryptoService } from '@/lib/crypto';
import { useAuthStore } from '@/stores/authStore';

const shareSchema = z.object({
  recipientEmail: z.string().email('Please enter a valid email address'),
  permissions: z.array(z.string()).min(1, 'Please select at least one permission'),
  message: z.string().optional()
});

type ShareFormData = z.infer<typeof shareSchema>;

interface ShareDialogProps {
  credential: Credential;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (shareResponse: ShareCredentialResponse) => void;
}

const PERMISSION_OPTIONS = [
  { value: 'read', label: 'View', description: 'Can view the credential details' },
  { value: 'write', label: 'Edit', description: 'Can modify the credential' }
];

export function ShareDialog({ credential, isOpen, onClose, onShare }: ShareDialogProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [existingShares, setExistingShares] = useState<ShareCredentialResponse[]>([]);
  const [auditLog, setAuditLog] = useState<ShareAuditEntry[]>([]);
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { encryptionKey } = useAuthStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<ShareFormData>({
    resolver: zodResolver(shareSchema),
    defaultValues: {
      recipientEmail: '',
      permissions: ['read'],
      message: ''
    }
  });

  // Load existing shares when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadExistingShares();
      setError(null);
    }
  }, [isOpen]);

  const loadExistingShares = async () => {
    try {
      setIsLoadingShares(true);
      const shares = await sharingService.getSharedCredentials();
      const credentialShares = shares.filter(share => share.credentialId === credential.id);
      setExistingShares(credentialShares);
    } catch (error) {
      console.error('Failed to load existing shares:', error);
      setError('Failed to load existing shares');
    } finally {
      setIsLoadingShares(false);
    }
  };

  const loadAuditLog = async (shareId: string) => {
    try {
      const audit = await sharingService.getShareAuditLog(shareId);
      setAuditLog(audit);
      setSelectedShareId(shareId);
    } catch (error) {
      console.error('Failed to load audit log:', error);
      setError('Failed to load audit log');
    }
  };

  const handleShare = async (data: ShareFormData) => {
    if (!encryptionKey) {
      setError('No encryption key available. Please unlock your session.');
      return;
    }

    try {
      setIsSharing(true);
      setError(null);

      // Encrypt credential data for sharing
      const credentialData = {
        title: credential.title,
        username: credential.username,
        password: credential.password,
        url: credential.url,
        notes: credential.notes
      };

      const encryptionResult = await CryptoService.encrypt(JSON.stringify(credentialData), encryptionKey);

      const shareRequest = {
        credentialId: credential.id,
        recipientEmail: data.recipientEmail,
        permissions: data.permissions,
        encryptedData: encryptionResult.encryptedData,
        iv: encryptionResult.iv,
        authTag: encryptionResult.authTag
      };

      const shareResponse = await sharingService.shareCredential(shareRequest);
      
      // Refresh existing shares
      await loadExistingShares();
      
      // Reset form
      reset();
      
      // Notify parent component
      onShare?.(shareResponse);
      
    } catch (error) {
      console.error('Failed to share credential:', error);
      setError(error instanceof Error ? error.message : 'Failed to share credential');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      await sharingService.revokeShare(shareId);
      await loadExistingShares();
      if (selectedShareId === shareId) {
        setSelectedShareId(null);
        setAuditLog([]);
      }
    } catch (error) {
      console.error('Failed to revoke share:', error);
      setError('Failed to revoke access');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Share Credential
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {credential.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Share Form */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Share with New User
              </h3>
              
              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                  <div className="flex">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(handleShare)} className="space-y-4">
                {/* Recipient Email */}
                <div>
                  <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recipient Email *
                  </label>
                  <input
                    {...register('recipientEmail')}
                    type="email"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="user@example.com"
                  />
                  {errors.recipientEmail && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.recipientEmail.message}
                    </p>
                  )}
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Permissions *
                  </label>
                  <Controller
                    name="permissions"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        {PERMISSION_OPTIONS.map((option) => (
                          <label key={option.value} className="flex items-start">
                            <input
                              type="checkbox"
                              checked={field.value.includes(option.value)}
                              onChange={(e) => {
                                const newValue = e.target.checked
                                  ? [...field.value, option.value]
                                  : field.value.filter(v => v !== option.value);
                                field.onChange(newValue);
                              }}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="ml-3">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {option.label}
                              </span>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {option.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  />
                  {errors.permissions && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.permissions.message}
                    </p>
                  )}
                </div>

                {/* Optional Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message (Optional)
                  </label>
                  <textarea
                    {...register('message')}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="Add a note for the recipient..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSharing}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSharing ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sharing...
                    </>
                  ) : (
                    'Share Credential'
                  )}
                </button>
              </form>
            </div>

            {/* Existing Shares */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Current Shares
              </h3>
              
              {isLoadingShares ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="h-6 w-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : existingShares.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    This credential hasn't been shared yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {existingShares.map((share) => (
                    <div
                      key={share.shareId}
                      className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {share.recipientEmail}
                            </p>
                            {!share.isActive && (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                                Revoked
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {share.permissions.map((permission) => (
                              <span
                                key={permission}
                                className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              >
                                {permission}
                              </span>
                            ))}
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Shared {formatDate(share.sharedAt)}
                            {share.lastAccessedAt && (
                              <> • Last accessed {formatDate(share.lastAccessedAt)}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => loadAuditLog(share.shareId)}
                            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                            title="View audit log"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          {share.isActive && (
                            <button
                              onClick={() => handleRevokeShare(share.shareId)}
                              className="rounded-md p-2 text-red-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300"
                              title="Revoke access"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Audit Log */}
              {selectedShareId && auditLog.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Access History
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {auditLog.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-md bg-gray-50 p-3 dark:bg-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {entry.action === 'access' && 'Accessed credential'}
                              {entry.action === 'share' && 'Credential shared'}
                              {entry.action === 'revoke' && 'Access revoked'}
                              {entry.action === 'update' && 'Permissions updated'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {entry.userEmail} • {formatDate(entry.timestamp)}
                            </p>
                          </div>
                          <div className="text-xs text-gray-400">
                            {entry.ipAddress}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}