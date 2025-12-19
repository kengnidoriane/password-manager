'use client';

/**
 * CredentialCard Component
 * 
 * Displays a single credential with copy buttons, password reveal/mask toggle,
 * and last-used timestamp display.
 */

import { useState, useCallback } from 'react';
import { Credential, Folder, Tag } from '@/lib/db';
import { useVault } from '@/hooks/useVault';

interface CredentialCardProps {
  credential: Credential;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  folders: Folder[];
  tags: Tag[];
}

export function CredentialCard({
  credential,
  isSelected = false,
  onSelect,
  onEdit,
  folders,
  tags
}: CredentialCardProps) {
  const { updateLastUsed } = useVault();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Get folder name
  const folder = folders.find(f => f.id === credential.folderId);
  
  // Get tag names and colors
  const credentialTags = tags.filter(tag => credential.tags.includes(tag.id));

  // Format last used timestamp
  const formatLastUsed = (timestamp?: number) => {
    if (!timestamp) return 'Never used';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  // Copy to clipboard with auto-clear
  const copyToClipboard = useCallback(async (text: string, fieldType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldType);
      
      // Update last used timestamp
      await updateLastUsed(credential.id);
      
      // Clear copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
      
      // Auto-clear clipboard after 60 seconds (configurable)
      setTimeout(() => {
        navigator.clipboard.writeText('').catch(() => {
          // Ignore errors - clipboard might be overwritten by user
        });
      }, 60000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [credential.id, updateLastUsed]);

  const handleUsernameClick = () => {
    copyToClipboard(credential.username, 'username');
  };

  const handlePasswordClick = () => {
    copyToClipboard(credential.password, 'password');
  };

  const handleUrlClick = () => {
    if (credential.url) {
      copyToClipboard(credential.url, 'url');
    }
  };

  const handleNotesClick = () => {
    if (credential.notes) {
      copyToClipboard(credential.notes, 'notes');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card selection when clicking on interactive elements
    if (
      e.target instanceof HTMLElement &&
      (e.target.tagName === 'BUTTON' || 
       e.target.closest('button') ||
       e.target.tagName === 'A' ||
       e.target.closest('a'))
    ) {
      return;
    }
    onSelect?.();
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'
      }`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {credential.title}
            </h3>
            {folder && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                {folder.name}
              </span>
            )}
          </div>
          
          {credential.url && (
            <a
              href={credential.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 truncate block mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              {credential.url}
            </a>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            title="Edit credential"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Credential Fields */}
      <div className="mt-4 space-y-3">
        {/* Username */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Username
            </label>
            <p className="text-sm text-gray-900 dark:text-white truncate">
              {credential.username}
            </p>
          </div>
          <button
            onClick={handleUsernameClick}
            className="ml-2 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            title="Copy username"
          >
            {copiedField === 'username' ? (
              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Password */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Password
            </label>
            <p className="text-sm text-gray-900 dark:text-white font-mono">
              {showPassword ? credential.password : '••••••••••••'}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={togglePasswordVisibility}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={handlePasswordClick}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title="Copy password"
            >
              {copiedField === 'password' ? (
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* URL (if present) */}
        {credential.url && (
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                URL
              </label>
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {credential.url}
              </p>
            </div>
            <button
              onClick={handleUrlClick}
              className="ml-2 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title="Copy URL"
            >
              {copiedField === 'url' ? (
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Notes (if present) */}
        {credential.notes && (
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Notes
              </label>
              <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                {credential.notes}
              </p>
            </div>
            <button
              onClick={handleNotesClick}
              className="ml-2 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title="Copy notes"
            >
              {copiedField === 'notes' ? (
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {credentialTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
              style={{ 
                backgroundColor: tag.color + '20', 
                color: tag.color 
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>

        {/* Last Used */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatLastUsed(credential.lastUsed)}
        </div>
      </div>
    </div>
  );
}