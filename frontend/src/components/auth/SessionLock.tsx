/**
 * Session Lock Component
 * 
 * Displays when the user session is locked due to inactivity.
 * Allows the user to unlock their session by re-entering their master password.
 */

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSession } from '@/hooks/useSession';

interface SessionLockProps {
  /**
   * Callback when session is successfully unlocked
   */
  onUnlock?: () => void;
  
  /**
   * Callback when user chooses to logout
   */
  onLogout?: () => void;
}

export function SessionLock({ onUnlock, onLogout }: SessionLockProps) {
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, unlockSession } = useAuthStore();
  const { logout } = useSession();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!masterPassword.trim()) {
      setError('Please enter your master password');
      return;
    }

    setIsUnlocking(true);
    setError(null);

    try {
      const success = await unlockSession(masterPassword);
      
      if (success) {
        setMasterPassword('');
        onUnlock?.();
      } else {
        setError('Invalid master password or session expired');
      }
    } catch (error) {
      console.error('Failed to unlock session:', error);
      setError('Failed to unlock session. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onLogout?.();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Session Locked
          </h3>
          <p className="text-sm text-gray-500">
            Your session has been locked due to inactivity. Please enter your master password to continue.
          </p>
          {user && (
            <p className="text-sm text-gray-600 mt-2">
              Signed in as: <span className="font-medium">{user.email}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label htmlFor="masterPassword" className="sr-only">
              Master Password
            </label>
            <input
              id="masterPassword"
              name="masterPassword"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter your master password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              disabled={isUnlocking}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isUnlocking || !masterPassword.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUnlocking ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Unlocking...
                </>
              ) : (
                'Unlock Session'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign Out
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            For security, your session automatically locks after 15 minutes of inactivity.
          </p>
        </div>
      </div>
    </div>
  );
}