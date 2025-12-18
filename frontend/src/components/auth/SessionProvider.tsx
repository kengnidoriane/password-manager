/**
 * Session Provider Component
 * 
 * Provides global session management for the application.
 * Handles automatic session monitoring, expiration, and lock screen display.
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSession } from '@/hooks/useSession';
import { SessionLock } from './SessionLock';

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { session, isAuthenticated } = useAuthStore();
  const { sessionStatus } = useSession({
    trackActivity: true,
    autoRefresh: true,
    refreshThreshold: 5 * 60 * 1000 // 5 minutes before expiration
  });

  const [showLockScreen, setShowLockScreen] = useState(false);

  // Show lock screen when session is locked
  useEffect(() => {
    if (isAuthenticated && session?.isLocked) {
      setShowLockScreen(true);
    } else {
      setShowLockScreen(false);
    }
  }, [isAuthenticated, session?.isLocked]);

  // Handle session unlock
  const handleUnlock = () => {
    setShowLockScreen(false);
  };

  // Handle logout from lock screen
  const handleLogout = () => {
    setShowLockScreen(false);
  };

  return (
    <>
      {children}
      {showLockScreen && (
        <SessionLock
          onUnlock={handleUnlock}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}