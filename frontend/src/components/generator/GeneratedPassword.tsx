'use client';

/**
 * GeneratedPassword Component
 * 
 * Displays the generated password with copy and save options.
 * Includes password visibility toggle and integration with clipboard service.
 */

import { useState, useCallback } from 'react';
import { useClipboard } from '@/hooks/useClipboard';

interface GeneratedPasswordProps {
  password: string;
  onCopy?: () => void;
  onSave?: () => void;
  onRegenerate?: () => void;
  showSaveOption?: boolean;
  isGenerating?: boolean;
  className?: string;
}

export function GeneratedPassword({
  password,
  onCopy,
  onSave,
  onRegenerate,
  showSaveOption = true,
  isGenerating = false,
  className = ''
}: GeneratedPasswordProps) {
  const [showPassword, setShowPassword] = useState(true);
  const { copyToClipboard, isActive, remainingTime } = useClipboard();

  const handleCopy = useCallback(async () => {
    try {
      // For generated passwords, we don't have a credential ID yet, so use a placeholder
      await copyToClipboard(password, 'password', 'generated-password');
      onCopy?.();
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  }, [password, copyToClipboard, onCopy]);

  const handleSave = useCallback(() => {
    onSave?.();
  }, [onSave]);

  const handleRegenerate = useCallback(() => {
    onRegenerate?.();
  }, [onRegenerate]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  if (!password && !isGenerating) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500 dark:text-gray-400">
          Configure your options and generate a password
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Password Display */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Generated Password
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {password.length} characters
            </span>
          </div>
        </div>
        
        <div className="relative">
          <div className="flex">
            <input
              type={showPassword ? 'text' : 'password'}
              value={isGenerating ? 'Generating...' : password}
              readOnly
              className="flex-1 px-4 py-3 text-lg font-mono bg-gray-50 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white selection:bg-blue-200 dark:selection:bg-blue-800"
              style={{ letterSpacing: '0.05em' }}
              disabled={isGenerating}
            />
            
            {/* Visibility Toggle */}
            <button
              type="button"
              onClick={togglePasswordVisibility}
              disabled={isGenerating || !password}
              className="px-3 border-t border-b border-gray-300 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              disabled={isGenerating || !password}
              className="px-4 py-3 bg-blue-600 text-white border border-blue-600 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Copy password"
            >
              {isActive ? (
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm">Copied</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm">Copy</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Copy Status */}
        {isActive && remainingTime > 0 && (
          <div className="mt-2 text-sm text-green-600 dark:text-green-400">
            Copied! Clipboard will clear in {Math.ceil(remainingTime / 1000)}s
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Regenerate Button */}
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {isGenerating ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Generate New</span>
            </>
          )}
        </button>

        {/* Save Button */}
        {showSaveOption && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isGenerating || !password}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Save as Credential</span>
          </button>
        )}
      </div>

      {/* Password Tips */}
      {password && !isGenerating && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>💡 <strong>Tip:</strong> Use this password for a new account or update an existing one.</div>
          <div>🔒 <strong>Security:</strong> Never share this password or use it on untrusted websites.</div>
        </div>
      )}
    </div>
  );
}