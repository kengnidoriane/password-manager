/**
 * Session Status Component
 * 
 * Displays current session status including time until expiration
 * and provides manual session controls.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';

interface SessionStatusProps {
  /**
   * Whether to show detailed session information
   * @default false
   */
  detailed?: boolean;
  
  /**
   * Whether to show session controls (lock, refresh)
   * @default true
   */
  showControls?: boolean;
  
  /**
   * Custom className for styling
   */
  className?: string;
}

export function SessionStatus({ 
  detailed = false, 
  showControls = true,
  className = ''
}: SessionStatusProps) {
  const { sessionStatus, refresh, lock, isAuthenticated } = useSession();
  const [timeDisplay, setTimeDisplay] = useState<string>('');

  // Update time display every second
  useEffect(() => {
    if (!isAuthenticated || !sessionStatus.isActive) {
      setTimeDisplay('');
      return;
    }

    const updateTime = () => {
      const timeUntilTimeout = Math.min(
        sessionStatus.timeUntilExpiry,
        sessionStatus.timeUntilInactivityTimeout
      );
      
      if (timeUntilTimeout <= 0) {
        setTimeDisplay('Expired');
        return;
      }

      const minutes = Math.floor(timeUntilTimeout / 60000);
      const seconds = Math.floor((timeUntilTimeout % 60000) / 1000);
      
      if (minutes > 0) {
        setTimeDisplay(`${minutes}m ${seconds}s`);
      } else {
        setTimeDisplay(`${seconds}s`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, sessionStatus]);

  if (!isAuthenticated) {
    return null;
  }

  const getStatusColor = () => {
    if (sessionStatus.isLocked) return 'text-yellow-600';
    if (sessionStatus.isExpired) return 'text-red-600';
    if (sessionStatus.timeUntilInactivityTimeout < 300000) return 'text-orange-600'; // Less than 5 minutes
    return 'text-green-600';
  };

  const getStatusText = () => {
    if (sessionStatus.isLocked) return 'Locked';
    if (sessionStatus.isExpired) return 'Expired';
    return 'Active';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Status Indicator */}
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${
          sessionStatus.isLocked ? 'bg-yellow-500' :
          sessionStatus.isExpired ? 'bg-red-500' :
          sessionStatus.timeUntilInactivityTimeout < 300000 ? 'bg-orange-500' :
          'bg-green-500'
        }`} />
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* Time Display */}
      {sessionStatus.isActive && timeDisplay && (
        <span className="text-sm text-gray-500">
          {timeDisplay}
        </span>
      )}

      {/* Detailed Information */}
      {detailed && sessionStatus.isActive && (
        <div className="text-xs text-gray-400 space-y-1">
          <div>Token expires: {Math.floor(sessionStatus.timeUntilExpiry / 60000)}m</div>
          <div>Inactivity timeout: {Math.floor(sessionStatus.timeUntilInactivityTimeout / 60000)}m</div>
        </div>
      )}

      {/* Session Controls */}
      {showControls && sessionStatus.isActive && (
        <div className="flex items-center space-x-1">
          <button
            onClick={refresh}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh session"
            aria-label="Refresh session"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          
          <button
            onClick={lock}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Lock session"
            aria-label="Lock session"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}