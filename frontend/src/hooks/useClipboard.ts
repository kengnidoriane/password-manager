/**
 * useClipboard Hook - React integration for ClipboardService
 * 
 * Provides clipboard functionality with state management for React components.
 * Handles copying, countdown timers, and automatic clearing.
 */

import { useState, useEffect, useCallback } from 'react';
import { getClipboardService, ClipboardService, ClipboardState } from '@/services/clipboardService';
import { ClipboardOperation } from '@/types/vault';
import { useVault } from '@/hooks/useVault';

export interface UseClipboardReturn {
  // State
  isActive: boolean;
  operation: ClipboardOperation | null;
  remainingTime: number;
  formattedTime: string;
  
  // Actions
  copyToClipboard: (text: string, type: ClipboardOperation['type'], credentialId: string) => Promise<void>;
  clearClipboard: () => Promise<void>;
  
  // Utilities
  isSupported: boolean;
}

/**
 * Hook for clipboard operations with React state management
 */
export const useClipboard = (): UseClipboardReturn => {
  const { updateLastUsed } = useVault();
  const [state, setState] = useState<ClipboardState>(() => {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      return getClipboardService().getState();
    }
    return {
      isActive: false,
      operation: null,
      remainingTime: 0,
      timerId: null,
      countdownTimerId: null
    };
  });

  // Subscribe to clipboard service state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clipboardService = getClipboardService();
      const unsubscribe = clipboardService.subscribe(setState);
      return unsubscribe;
    }
  }, []);

  /**
   * Copy text to clipboard and update last used timestamp
   */
  const copyToClipboard = useCallback(async (
    text: string,
    type: ClipboardOperation['type'],
    credentialId: string
  ): Promise<void> => {
    if (typeof window === 'undefined') return;
    
    try {
      const clipboardService = getClipboardService();
      // Copy to clipboard with auto-clear
      await clipboardService.copyToClipboard(text, type, credentialId);
      
      // Update last used timestamp for the credential
      if (credentialId !== 'generated-password') {
        await updateLastUsed(credentialId);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw error;
    }
  }, [updateLastUsed]);

  /**
   * Manually clear clipboard
   */
  const clearClipboard = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    
    try {
      const clipboardService = getClipboardService();
      await clipboardService.manualClear();
    } catch (error) {
      console.error('Failed to clear clipboard:', error);
      throw error;
    }
  }, []);

  /**
   * Get formatted remaining time
   */
  const formattedTime = typeof window !== 'undefined' ? getClipboardService().getFormattedRemainingTime() : '0:00';

  return {
    // State
    isActive: state.isActive,
    operation: state.operation,
    remainingTime: state.remainingTime,
    formattedTime,
    
    // Actions
    copyToClipboard,
    clearClipboard,
    
    // Utilities
    isSupported: ClipboardService.isSupported()
  };
};