'use client';

import type { Metadata } from 'next';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { TwoFactorSettings } from '@/components/auth/TwoFactorSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { DataManagementSettings } from '@/components/settings/DataManagementSettings';
import { UserSettingsRequest, settingsService } from '@/services/settingsService';

/**
 * Settings Page
 * Comprehensive user preferences and configuration with tabbed interface
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */

type SettingsTab = 'security' | 'account' | 'appearance' | 'data';

export default function SettingsPage() {
  const { user, session } = useAuthStore();
  const { 
    settings, 
    isLoading, 
    error, 
    hasUnsavedChanges,
    loadSettings, 
    updateSettings,
    setHasUnsavedChanges 
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('security');
  const [localSettings, setLocalSettings] = useState<UserSettingsRequest>(
    settingsService.getDefaultSettings()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>('');

  // Load settings on mount
  useEffect(() => {
    if (session?.token) {
      loadSettings(session.token);
    }
  }, [session?.token, loadSettings]);

  // Update local settings when store settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        clipboardTimeoutSeconds: settings.clipboardTimeoutSeconds,
        biometricEnabled: settings.biometricEnabled,
        strictSecurityMode: settings.strictSecurityMode,
        theme: settings.theme,
        language: settings.language,
      });
    }
  }, [settings]);

  // Handle settings changes
  const handleSettingsChange = (changes: Partial<UserSettingsRequest>) => {
    const newSettings = { ...localSettings, ...changes };
    setLocalSettings(newSettings);
    setHasUnsavedChanges(true);
    setSaveError('');
  };

  // Save settings
  const handleSave = async () => {
    if (!session?.token) {
      setSaveError('Authentication required. Please log in again.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError('');
      
      await updateSettings(session.token, localSettings);
      
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset settings
  const handleReset = () => {
    if (settings) {
      setLocalSettings({
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        clipboardTimeoutSeconds: settings.clipboardTimeoutSeconds,
        biometricEnabled: settings.biometricEnabled,
        strictSecurityMode: settings.strictSecurityMode,
        theme: settings.theme,
        language: settings.language,
      });
      setHasUnsavedChanges(false);
      setSaveError('');
    }
  };

  // Tab configuration
  const tabs = [
    {
      id: 'security' as const,
      name: 'Security',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    {
      id: 'account' as const,
      name: 'Account',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: 'appearance' as const,
      name: 'Appearance',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
          />
        </svg>
      ),
    },
    {
      id: 'data' as const,
      name: 'Data Management',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
          />
        </svg>
      ),
    },
  ];

  if (isLoading && !settings) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <svg
              className="h-6 w-6 animate-spin text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
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
            <span className="text-gray-600 dark:text-gray-400">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account and preferences
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
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

      <div className="flex flex-col lg:flex-row lg:space-x-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 lg:flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                }`}
              >
                <span className="mr-3">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="mt-8 lg:mt-0 lg:flex-1">
          <div className="max-w-4xl">
            {/* Save/Reset Actions */}
            {hasUnsavedChanges && (
              <div className="mb-6 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <div className="flex items-center justify-between">
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
                        You have unsaved changes.
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleReset}
                      disabled={isSaving}
                      className="rounded-md border border-yellow-300 px-3 py-1 text-sm font-semibold text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-900/40"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="rounded-md bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Error */}
            {saveError && (
              <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
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
                      {saveError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content */}
            <div className="space-y-8">
              {activeTab === 'security' && (
                <div className="space-y-8">
                  <SecuritySettings
                    settings={localSettings}
                    onChange={handleSettingsChange}
                    isLoading={isLoading || isSaving}
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Two-Factor Authentication
                    </h3>
                    <TwoFactorSettings userId={user?.id || 'current-user'} />
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <AccountSettings isLoading={isLoading || isSaving} />
              )}

              {activeTab === 'appearance' && (
                <AppearanceSettings
                  settings={localSettings}
                  onChange={handleSettingsChange}
                  isLoading={isLoading || isSaving}
                />
              )}

              {activeTab === 'data' && (
                <DataManagementSettings isLoading={isLoading || isSaving} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
