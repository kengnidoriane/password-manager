'use client';

/**
 * AppearanceSettings Component
 * 
 * Handles appearance-related settings including theme and language preferences.
 * 
 * Requirements: 19.4 (appearance settings)
 */

import { useState, useEffect } from 'react';
import { UserSettingsRequest, settingsService } from '@/services/settingsService';

interface AppearanceSettingsProps {
  settings: UserSettingsRequest;
  onChange: (settings: Partial<UserSettingsRequest>) => void;
  isLoading?: boolean;
}

export function AppearanceSettings({ settings, onChange, isLoading = false }: AppearanceSettingsProps) {
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

  // Get theme options
  const themeOptions = settingsService.getThemeOptions();
  const languageOptions = settingsService.getLanguageOptions();

  // Preview theme change
  const previewTheme = (theme: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Appearance Settings
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Customize the look and feel of your password manager.
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme Selection */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Theme
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Choose your preferred color scheme.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {themeOptions.map((option) => (
              <div key={option.value} className="relative">
                <input
                  type="radio"
                  id={`theme-${option.value}`}
                  name="theme"
                  value={option.value}
                  checked={localSettings.theme === option.value}
                  onChange={(e) => {
                    handleChange('theme', e.target.value as 'light' | 'dark' | 'auto');
                    previewTheme(e.target.value as 'light' | 'dark' | 'auto');
                  }}
                  disabled={isLoading}
                  className="sr-only"
                />
                <label
                  htmlFor={`theme-${option.value}`}
                  className={`block cursor-pointer rounded-lg border-2 p-4 text-center transition-colors ${
                    localSettings.theme === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {/* Theme preview icon */}
                    <div className="flex space-x-1">
                      {option.value === 'light' && (
                        <svg className="h-8 w-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {option.value === 'dark' && (
                        <svg className="h-8 w-8 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                      )}
                      {option.value === 'auto' && (
                        <div className="flex">
                          <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <svg className="h-4 w-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </span>
                    {option.value === 'auto' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Follows system
                      </span>
                    )}
                  </div>
                  {localSettings.theme === option.value && (
                    <div className="absolute -top-2 -right-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Language
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Choose your preferred language for the interface.
            </p>
          </div>

          <div className="max-w-xs">
            <select
              value={localSettings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              disabled={isLoading}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

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
                  Language changes will take effect after refreshing the page. Some languages may not be fully translated yet.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Display Options
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Additional display preferences.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Compact Mode
                </h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Show more content in less space
                </p>
              </div>
              <button
                type="button"
                disabled={isLoading}
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700"
              >
                <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Animations
                </h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enable smooth transitions and animations
                </p>
              </div>
              <button
                type="button"
                disabled={isLoading}
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Preview
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              See how your settings will look.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                PM
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  Password Manager
                </h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This is how your interface will appear
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-2 bg-gray-200 rounded dark:bg-gray-700"></div>
              <div className="h-2 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
              <div className="h-2 bg-gray-200 rounded w-1/2 dark:bg-gray-700"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}