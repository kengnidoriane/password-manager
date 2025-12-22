'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Offline fallback page
 * Displayed when user is offline and tries to navigate to a page not in cache
 * Requirements: 13.1, 22.4
 */
export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check initial online status
    const initialStatus = navigator.onLine;
    setIsOnline(initialStatus);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Redirect to home when back online
      setTimeout(() => {
        router.push('/');
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Offline Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You&apos;re Offline
            </h1>
            
            <p className="text-gray-600 mb-6">
              {isOnline 
                ? "Connection restored! Redirecting..." 
                : "Check your internet connection and try again."
              }
            </p>

            {/* Connection Status */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-6 ${
              isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isOnline ? 'bg-green-400' : 'bg-red-400'
              }`} />
              {isOnline ? 'Online' : 'Offline'}
            </div>

            {/* Offline Features */}
            {!isOnline && (
              <div className="text-left bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  Available Offline:
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• View cached passwords</li>
                  <li>• Add new credentials</li>
                  <li>• Edit existing entries</li>
                  <li>• Generate passwords</li>
                  <li>• Search your vault</li>
                </ul>
                <p className="text-xs text-blue-600 mt-2">
                  Changes will sync when you&apos;re back online.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Vault
              </button>
            </div>

            {/* Tips */}
            <div className="mt-6 text-xs text-gray-500">
              <p>
                This app works offline! Your data is stored securely on your device
                and will sync when you reconnect.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}