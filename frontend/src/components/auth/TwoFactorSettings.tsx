'use client';

/**
 * TwoFactorSettings Component
 * 
 * Handles 2FA enable/disable toggle in settings.
 * Requirements: 14.1, 14.2, 14.3
 */

import { useState, useEffect } from 'react';
import { TwoFactorSetup } from './TwoFactorSetup';

interface TwoFactorSettingsProps {
  userId: string;
}

export function TwoFactorSettings({ userId }: TwoFactorSettingsProps) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [error, setError] = useState<string>('');

  // Load current 2FA status
  useEffect(() => {
    const load2FAStatus = async () => {
      try {
        const response = await fetch('/api/v1/auth/2fa/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIs2FAEnabled(data.enabled);
        }
      } catch (err) {
        console.error('Failed to load 2FA status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load2FAStatus();
  }, []);

  // Enable 2FA
  const enable2FA = () => {
    setShowSetup(true);
  };

  // Disable 2FA
  const disable2FA = async () => {
    try {
      setError('');
      setIsLoading(true);

      const response = await fetch('/api/v1/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disable 2FA');
      }

      setIs2FAEnabled(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle setup completion
  const handleSetupComplete = () => {
    setShowSetup(false);
    setIs2FAEnabled(true);
  };

  // Handle setup cancellation
  const handleSetupCancel = () => {
    setShowSetup(false);
  };

  if (showSetup) {
    return (
      <TwoFactorSetup
        onSetupComplete={handleSetupComplete}
        onCancel={handleSetupCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Two-Factor Authentication
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Add an extra layer of security to your account with 2FA.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                is2FAEnabled ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <svg
                  className={`h-6 w-6 ${
                    is2FAEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Two-Factor Authentication
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {is2FAEnabled ? 'Enabled' : 'Disabled'} • {is2FAEnabled ? 'Your account is protected with 2FA' : 'Add extra security to your account'}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            {is2FAEnabled ? (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx={4} cy={4} r={3} />
                  </svg>
                  Active
                </span>
                <button
                  onClick={disable2FA}
                  disabled={isLoading}
                  className="rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  {isLoading ? 'Disabling...' : 'Disable'}
                </button>
              </div>
            ) : (
              <button
                onClick={enable2FA}
                disabled={isLoading}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Enable 2FA'}
              </button>
            )}
          </div>
        </div>

        {is2FAEnabled && (
          <div className="mt-4 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Keep your backup codes safe!</strong> If you lose access to your authenticator app, 
                  you'll need your backup codes to sign in. Store them in a secure location.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!is2FAEnabled && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Why enable 2FA?
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>Protects your account even if your password is compromised</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>Works with popular authenticator apps like Google Authenticator</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>Includes backup codes for emergency access</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>Industry standard security practice</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}