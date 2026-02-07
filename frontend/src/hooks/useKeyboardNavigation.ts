/**
 * Keyboard Navigation Hook
 * 
 * Provides keyboard navigation utilities and shortcuts for the application.
 * Validates: Requirements 20.2
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export interface UseKeyboardNavigationOptions {
  shortcuts?: KeyboardShortcut[];
  trapFocus?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
}

/**
 * Hook for managing keyboard navigation and shortcuts
 */
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: UseKeyboardNavigationOptions = {}
) {
  const {
    shortcuts = [],
    trapFocus = false,
    restoreFocus = false,
    autoFocus = false,
  } = options;

  const previousFocusRef = useRef<HTMLElement | null>(null);

  /**
   * Get all focusable elements within a container
   */
  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
      .filter(el => {
        // Filter out hidden elements
        return el.offsetParent !== null && 
               window.getComputedStyle(el).visibility !== 'hidden';
      });
  }, []);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check for matching shortcuts
    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
      const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
      const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey;
      const metaMatches = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler(event);
        return;
      }
    }

    // Handle focus trap
    if (trapFocus && containerRef.current) {
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements(containerRef.current);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    }
  }, [shortcuts, trapFocus, containerRef, getFocusableElements]);

  /**
   * Set up keyboard event listeners
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Store previous focus for restoration
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // Auto-focus first focusable element
    if (autoFocus) {
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore previous focus
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [containerRef, handleKeyDown, restoreFocus, autoFocus, getFocusableElements]);

  /**
   * Manually focus first element
   */
  const focusFirst = useCallback(() => {
    if (!containerRef.current) return;
    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [containerRef, getFocusableElements]);

  /**
   * Manually focus last element
   */
  const focusLast = useCallback(() => {
    if (!containerRef.current) return;
    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [containerRef, getFocusableElements]);

  /**
   * Get all focusable elements in container
   */
  const getFocusable = useCallback(() => {
    if (!containerRef.current) return [];
    return getFocusableElements(containerRef.current);
  }, [containerRef, getFocusableElements]);

  return {
    focusFirst,
    focusLast,
    getFocusable,
  };
}

/**
 * Global keyboard shortcuts for the application
 */
export const GLOBAL_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: '/',
    description: 'Focus search',
    handler: () => {
      const searchInput = document.querySelector<HTMLInputElement>('[aria-label*="Search"]');
      searchInput?.focus();
    },
  },
  {
    key: 'n',
    ctrlKey: true,
    description: 'New credential',
    handler: () => {
      const newButton = document.querySelector<HTMLButtonElement>('[aria-label*="Add new credential"]');
      newButton?.click();
    },
  },
  {
    key: 'g',
    ctrlKey: true,
    description: 'Open password generator',
    handler: () => {
      const generatorLink = document.querySelector<HTMLAnchorElement>('[href*="/generator"]');
      generatorLink?.click();
    },
  },
  {
    key: 's',
    ctrlKey: true,
    description: 'Open settings',
    handler: () => {
      const settingsLink = document.querySelector<HTMLAnchorElement>('[href*="/settings"]');
      settingsLink?.click();
    },
  },
  {
    key: 'Escape',
    description: 'Close modal/dialog',
    handler: () => {
      const closeButton = document.querySelector<HTMLButtonElement>('[aria-label*="Close"]');
      closeButton?.click();
    },
    preventDefault: false,
  },
];
