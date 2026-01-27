'use client';

/**
 * SecuritySettings Component
 * 
 * Handles security-related settings including session timeout, clipboard timeout,
 * biometric authentication, and strict security mode.
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.5
 */

import { useState, useEffect } from 'react';
import { UserSettingsRequest } from '@/services/settingsService';

interface SecuritySettingsProps {
  settings: UserSettingsRequest;
  onChange: (settings: Partial<UserSettingsRequest>) => void;
  isLoading?: boolean;
}

export function SecuritySettings({ settings, onChange, isLoading = false }: SecuritySettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Handle input changes
  const handleChange = (field: keyof UserSettingsRequest, value: any) => {
    const newSettings = { ...localSettings, [field]: value };
    setLocalSettings(newSettings);
    onChange({ [field]: value });
  };

  // Format timeout display
  const formatSessionTimeout = (minutes: number) => {
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatClipboardTimeout = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Security Settings
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Configure security preferences and timeout settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Session Timeout */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Session Timeout
              </h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400" id="session-timeout-description">
                Automatically lock your vault after this period of inactivity.
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                Current: {formatSessionTimeout(localSettings.sessionTimeoutMinutes)}
              </p>
            </div>
            <div className="ml-6 w-48">
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={localSettings.sessionTimeoutMinutes}
                  onChange={(e) => handleChange('sessionTimeoutMinutes', parseInt(e.target.value))}
                  disabled={isLoading}
                  aria-label="Session timeout in minutes"
                  aria-describedby="session-timeout-description"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 min</span>
                  <span>60 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clipboard Timeout */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Clipboard Auto-Clear
              </h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400" id="clipboard-timeout-description">
                Automatically clear copied passwords from clipboard after this time.
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                Current: {formatClipboardTimeout(localSettings.clipboardTimeoutSeconds)}
              </p>
            </div>
            <div className="ml-6 w-48">
              <div className="space-y-2">
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="30"
                  value={localSettings.clipboardTimeoutSeconds}
                  onChange={(e) => handleChange('clipboardTimeoutSeconds', parseInt(e.target.value))}
                  disabled={isLoading}
                  aria-label="Clipboard timeout in seconds"
                  aria-describedby="clipboard-timeout-description"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>30s</span>
                  <span>5m</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Biometric Authentication */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  localSettings.biometricEnabled ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <svg
                    className={`h-6 w-6 ${
                      localSettings.biometricEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Biometric Authentication
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use fingerprint or face recognition to unlock your vault
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleChange('biometricEnabled', !localSettings.biometricEnabled)}
                disabled={isLoading}
                aria-label="Toggle biometric authentication"
                aria-pressed={localSettings.biometricEnabled}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  localSettings.biometricEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    localSettings.biometricEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
          
          {!localSettings.biometricEnabled && (
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
                    Enable biometric authentication for faster and more secure access to your vault.
                    Your device must support biometric authentication.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Strict Security Mode */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  localSettings.strictSecurityMode ? 'bg-red-100 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <svg
                    className={`h-6 w-6 ${
                      localSettings.strictSecurityMode ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Strict Security Mode
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Disable clipboard access and require authentication for every credential view
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleChange('strictSecurityMode', !localSettings.strictSecurityMode)}
                disabled={isLoading}
                aria-label="Toggle strict security mode"
                aria-pressed={localSettings.strictSecurityMode}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  localSettings.strictSecurityMode ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    localSettings.strictSecurityMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
          
          {localSettings.strictSecurityMode && (
            <div className="mt-4 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Warning:</strong> Strict security mode will make the application less convenient to use.
                    You'll need to authenticate every time you want to view a password, and clipboard functionality will be disabled.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}