'use client';

import { useServiceWorkerUpdate } from '@/hooks/useServiceWorker';
import { useState, useEffect } from 'react';

/**
 * PWA Update Prompt Component
 * Shows notification when app update is available
 * Requirements: 22.5
 */
export function PWAUpdatePrompt() {
  const { 
    isUpdateAvailable, 
    isUpdating, 
    updateStatus, 
    applyUpdate, 
    dismissUpdate,
    checkForUpdates 
  } = useServiceWorkerUpdate();
  
  const [showDetails, setShowDetails] = useState(false);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);

  // Auto-check for updates periodically when enabled
  useEffect(() => {
    if (!autoCheckEnabled) return;

    const interval = setInterval(() => {
      checkForUpdates();
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [autoCheckEnabled, checkForUpdates]);

  // Handle visibility change to check for updates when app becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && autoCheckEnabled) {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoCheckEnabled, checkForUpdates]);

  if (!isUpdateAvailable) {
    return null;
  }

  const handleApplyUpdate = async () => {
    try {
      await applyUpdate();
    } catch (error) {
      console.error('Update failed:', error);
      // Show error state or retry option
    }
  };

  return (
    <aside 
      className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
      role="dialog"
      aria-labelledby="pwa-update-title"
      aria-describedby="pwa-update-description"
      aria-live="polite"
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-slide-up">
        <div className="flex items-start">
          {/* Update Icon */}
          <div className="flex-shrink-0" aria-hidden="true">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
              {isUpdating ? (
                <svg
                  className="animate-spin h-5 w-5 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="ml-3 flex-1">
            <h3 id="pwa-update-title" className="text-sm font-medium text-gray-900">
              {isUpdating ? 'Updating App...' : 'App Update Available'}
            </h3>
            <p id="pwa-update-description" className="mt-1 text-sm text-gray-500">
              {isUpdating 
                ? 'Installing the latest version. This will only take a moment.'
                : 'A new version of the Password Manager is ready to install with improvements and bug fixes.'
              }
            </p>

            {/* Update Status Details */}
            {showDetails && updateStatus && (
              <div className="mt-2 text-xs text-gray-400 space-y-1" role="status">
                <div>Status: {updateStatus.isWaiting ? 'Ready to install' : 'Installing...'}</div>
                {updateStatus.currentVersion && (
                  <div className="truncate">Current: {updateStatus.currentVersion.split('/').pop()}</div>
                )}
                {updateStatus.newVersion && (
                  <div className="truncate">New: {updateStatus.newVersion.split('/').pop()}</div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={handleApplyUpdate}
                  disabled={isUpdating}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label={isUpdating ? "Updating app, please wait" : "Update app now"}
                >
                  {isUpdating ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-3 w-3 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update Now'
                  )}
                </button>
                
                {!isUpdating && (
                  <button
                    onClick={dismissUpdate}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    aria-label="Dismiss update, remind me later"
                  >
                    Later
                  </button>
                )}
              </div>

              {/* Details Toggle */}
              {!isUpdating && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showDetails ? "Hide update details" : "Show update details"}
                  aria-expanded={showDetails}
                >
                  {showDetails ? 'Hide' : 'Details'}
                </button>
              )}
            </div>

            {/* Progress indicator */}
            {isUpdating && (
              <div className="mt-3" role="progressbar" aria-label="Update progress" aria-valuenow={100} aria-valuemin={0} aria-valuemax={100}>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          {!isUpdating && (
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={dismissUpdate}
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-label="Close update notification"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}