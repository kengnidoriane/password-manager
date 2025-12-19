/**
 * useClipboard Hook - React integration for ClipboardService
 * 
 * Provides clipboard functionality with state management for React components.
 * Handles copying, countdown timers, and automatic clearing.
 */

import { useState, useEffect, useCallback } from 'react';
import { clipboardService, ClipboardState } from '@/services/clipboardService';
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
  const [state, setState] = useState<ClipboardState>(clipboardService.getState());

  // Subscribe to clipboard service state changes
  useEffect(() => {
    const unsubscribe = clipboardService.subscribe(setState);
    return unsubscribe;
  }, []);

  /**
   * Copy text to clipboard and update last used timestamp
   */
  const copyToClipboard = useCallback(async (
    text: string,
    type: ClipboardOperation['type'],
    credentialId: string
  ): Promise<void> => {
    try {
      // Copy to clipboard with auto-clear
      await clipboardService.copyToClipboard(text, type, credentialId);
      
      // Update last used timestamp for the credential
      await updateLastUsed(credentialId);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw error;
    }
  }, [updateLastUsed]);

  /**
   * Manually clear clipboard
   */
  const clearClipboard = useCallback(async (): Promise<void> => {
    try {
      await clipboardService.manualClear();
    } catch (error) {
      console.error('Failed to clear clipboard:', error);
      throw error;
    }
  }, []);

  /**
   * Get formatted remaining time
   */
  const formattedTime = clipboardService.getFormattedRemainingTime();

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
    isSupported: clipboardService.constructor.isSupported()
  };
};