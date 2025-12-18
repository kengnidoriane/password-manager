/**
 * Session Management Hook
 * 
 * Provides session management functionality including automatic expiration monitoring,
 * session refresh, and activity tracking.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { config } from '@/lib/config';

export interface UseSessionOptions {
  /**
   * Whether to automatically track user activity
   * @default true
   */
  trackActivity?: boolean;
  
  /**
   * Whether to automatically refresh session when it's about to expire
   * @default true
   */
  autoRefresh?: boolean;
  
  /**
   * Time before expiration to attempt refresh (in milliseconds)
   * @default 300000 (5 minutes)
   */
  refreshThreshold?: number;
}

export interface SessionStatus {
  isActive: boolean;
  isLocked: boolean;
  isExpired: boolean;
  timeUntilExpiry: number;
  timeUntilInactivityTimeout: number;
}

/**
 * Hook for managing user session state and automatic expiration
 */
export function useSession(options: UseSessionOptions = {}) {
  const {
    trackActivity = true,
    autoRefresh = true,
    refreshThreshold = 5 * 60 * 1000 // 5 minutes
  } = options;

  const {
    session,
    user,
    isAuthenticated,
    updateActivity,
    checkSessionExpiry,
    refreshSession,
    lockSession,
    logout,
    startSessionTimer,
    clearSessionTimer
  } = useAuthStore();

  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Handle user activity events
   */
  const handleActivity = useCallback(() => {
    if (session && !session.isLocked && trackActivity) {
      updateActivity();
    }
  }, [session, trackActivity, updateActivity]);

  /**
   * Set up activity listeners
   */
  useEffect(() => {
    if (!trackActivity || !session || session.isLocked) {
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Throttle activity updates to avoid excessive calls
    let lastActivity = 0;
    const throttledActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 1000) { // Throttle to once per second
        lastActivity = now;
        handleActivity();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, throttledActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledActivity);
      });
    };
  }, [trackActivity, session, handleActivity]);

  /**
   * Set up automatic session refresh
   */
  useEffect(() => {
    if (!autoRefresh || !session || session.isLocked) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      return;
    }

    const timeUntilExpiry = session.expiresAt - Date.now();
    const timeUntilRefresh = timeUntilExpiry - refreshThreshold;

    if (timeUntilRefresh > 0) {
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          await refreshSession();
        } catch (error) {
          console.error('Automatic session refresh failed:', error);
        }
      }, timeUntilRefresh);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [session, autoRefresh, refreshThreshold, refreshSession]);

  /**
   * Monitor session expiry
   */
  useEffect(() => {
    if (!session) {
      return;
    }

    const checkExpiry = () => {
      const expired = checkSessionExpiry();
      if (expired) {
        console.log('Session expired due to inactivity');
      }
    };

    // Check expiry every 30 seconds
    const interval = setInterval(checkExpiry, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [session, checkSessionExpiry]);

  /**
   * Initialize session timer when component mounts
   */
  useEffect(() => {
    if (session && !session.isLocked) {
      startSessionTimer();
    }

    return () => {
      clearSessionTimer();
    };
  }, [session, startSessionTimer, clearSessionTimer]);

  /**
   * Get current session status
   */
  const getSessionStatus = useCallback((): SessionStatus => {
    if (!session) {
      return {
        isActive: false,
        isLocked: false,
        isExpired: true,
        timeUntilExpiry: 0,
        timeUntilInactivityTimeout: 0
      };
    }

    const now = Date.now();
    const timeUntilExpiry = Math.max(0, session.expiresAt - now);
    const timeSinceActivity = now - session.lastActivity;
    const timeUntilInactivityTimeout = Math.max(0, config.security.sessionTimeout - timeSinceActivity);

    return {
      isActive: !session.isLocked && timeUntilExpiry > 0 && timeUntilInactivityTimeout > 0,
      isLocked: session.isLocked,
      isExpired: timeUntilExpiry <= 0 || timeUntilInactivityTimeout <= 0,
      timeUntilExpiry,
      timeUntilInactivityTimeout
    };
  }, [session]);

  /**
   * Manually refresh the session
   */
  const manualRefresh = useCallback(async () => {
    try {
      return await refreshSession();
    } catch (error) {
      console.error('Manual session refresh failed:', error);
      return false;
    }
  }, [refreshSession]);

  /**
   * Manually lock the session
   */
  const lock = useCallback(() => {
    lockSession();
  }, [lockSession]);

  /**
   * Manually logout
   */
  const logoutUser = useCallback(async () => {
    await logout();
  }, [logout]);

  return {
    // Session state
    session,
    user,
    isAuthenticated,
    sessionStatus: getSessionStatus(),
    
    // Actions
    refresh: manualRefresh,
    lock,
    logout: logoutUser,
    updateActivity: handleActivity
  };
}

/**
 * Hook for session status only (lighter weight)
 */
export function useSessionStatus() {
  const { session } = useAuthStore();
  
  const getStatus = useCallback((): SessionStatus => {
    if (!session) {
      return {
        isActive: false,
        isLocked: false,
        isExpired: true,
        timeUntilExpiry: 0,
        timeUntilInactivityTimeout: 0
      };
    }

    const now = Date.now();
    const timeUntilExpiry = Math.max(0, session.expiresAt - now);
    const timeSinceActivity = now - session.lastActivity;
    const timeUntilInactivityTimeout = Math.max(0, config.security.sessionTimeout - timeSinceActivity);

    return {
      isActive: !session.isLocked && timeUntilExpiry > 0 && timeUntilInactivityTimeout > 0,
      isLocked: session.isLocked,
      isExpired: timeUntilExpiry <= 0 || timeUntilInactivityTimeout <= 0,
      timeUntilExpiry,
      timeUntilInactivityTimeout
    };
  }, [session]);

  return getStatus();
}