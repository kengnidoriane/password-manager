/**
 * useURLDetection Hook
 * 
 * React hook for URL detection and credential matching functionality.
 * Provides real-time URL detection and credential highlighting.
 */

import { useState, useEffect, useCallback } from 'react';
import { urlDetectionService, URLMatchResult, CurrentURLInfo } from '@/services/urlDetectionService';
import { useVault } from './useVault';

export interface URLDetectionState {
  currentURL: CurrentURLInfo | null;
  isSupported: boolean;
  matchingCredentials: URLMatchResult[];
  isDetecting: boolean;
}

/**
 * Hook for URL detection and credential matching
 */
export function useURLDetection() {
  const { credentials } = useVault();
  const [state, setState] = useState<URLDetectionState>({
    currentURL: null,
    isSupported: urlDetectionService.isURLDetectionSupported(),
    matchingCredentials: [],
    isDetecting: false
  });

  /**
   * Update matching credentials when URL or credentials change
   */
  const updateMatchingCredentials = useCallback((currentURL: CurrentURLInfo | null) => {
    if (!currentURL || !credentials.length) {
      setState(prev => ({
        ...prev,
        currentURL,
        matchingCredentials: []
      }));
      return;
    }

    setState(prev => ({ ...prev, isDetecting: true }));

    try {
      const matches = urlDetectionService.findMatchingCredentials(credentials);
      setState(prev => ({
        ...prev,
        currentURL,
        matchingCredentials: matches,
        isDetecting: false
      }));
    } catch (error) {
      console.error('Failed to find matching credentials:', error);
      setState(prev => ({
        ...prev,
        currentURL,
        matchingCredentials: [],
        isDetecting: false
      }));
    }
  }, [credentials]);

  /**
   * Initialize URL detection
   */
  useEffect(() => {
    if (!state.isSupported) {
      return;
    }

    // Get initial URL
    const initialURL = urlDetectionService.getCurrentURL();
    updateMatchingCredentials(initialURL);

    // Listen for URL changes
    const cleanup = urlDetectionService.addURLChangeListener(updateMatchingCredentials);

    return cleanup;
  }, [state.isSupported, updateMatchingCredentials]);

  /**
   * Manually refresh URL detection
   */
  const refreshURLDetection = useCallback(() => {
    if (!state.isSupported) {
      return;
    }

    const currentURL = urlDetectionService.getCurrentURL();
    updateMatchingCredentials(currentURL);
  }, [state.isSupported, updateMatchingCredentials]);

  /**
   * Check if a credential matches the current URL
   */
  const isCredentialMatching = useCallback((credentialId: string): URLMatchResult | null => {
    return state.matchingCredentials.find(match => match.credential.id === credentialId) || null;
  }, [state.matchingCredentials]);

  /**
   * Get match score for a credential
   */
  const getMatchScore = useCallback((credentialId: string): number => {
    const match = isCredentialMatching(credentialId);
    return match?.matchScore || 0;
  }, [isCredentialMatching]);

  /**
   * Get match type for a credential
   */
  const getMatchType = useCallback((credentialId: string): string | null => {
    const match = isCredentialMatching(credentialId);
    return match?.matchType || null;
  }, [isCredentialMatching]);

  /**
   * Get all matching credentials sorted by score
   */
  const getMatchingCredentials = useCallback(() => {
    return state.matchingCredentials;
  }, [state.matchingCredentials]);

  /**
   * Get top matching credential
   */
  const getTopMatch = useCallback((): URLMatchResult | null => {
    return state.matchingCredentials.length > 0 ? state.matchingCredentials[0] : null;
  }, [state.matchingCredentials]);

  /**
   * Check if there are any matching credentials
   */
  const hasMatches = useCallback((): boolean => {
    return state.matchingCredentials.length > 0;
  }, [state.matchingCredentials]);

  /**
   * Get current domain
   */
  const getCurrentDomain = useCallback((): string | null => {
    return state.currentURL?.domain || null;
  }, [state.currentURL]);

  /**
   * Get current URL string
   */
  const getCurrentURLString = useCallback((): string | null => {
    return state.currentURL?.url || null;
  }, [state.currentURL]);

  /**
   * Get detection status for debugging
   */
  const getDetectionStatus = useCallback(() => {
    return urlDetectionService.getDetectionStatus();
  }, []);

  /**
   * Manually set current URL (for testing)
   */
  const setCurrentURL = useCallback((url: string | null) => {
    urlDetectionService.setCurrentURL(url);
  }, []);

  return {
    // State
    currentURL: state.currentURL,
    isSupported: state.isSupported,
    matchingCredentials: state.matchingCredentials,
    isDetecting: state.isDetecting,
    
    // Actions
    refreshURLDetection,
    setCurrentURL,
    
    // Utilities
    isCredentialMatching,
    getMatchScore,
    getMatchType,
    getMatchingCredentials,
    getTopMatch,
    hasMatches,
    getCurrentDomain,
    getCurrentURLString,
    getDetectionStatus
  };
}