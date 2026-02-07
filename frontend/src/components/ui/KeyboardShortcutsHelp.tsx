/**
 * Keyboard Shortcuts Help Component
 * 
 * Displays available keyboard shortcuts to users.
 * Validates: Requirements 20.2
 */

'use client';

import React, { useState, useEffect } from 'react';
import { KeyboardShortcut } from '@/hooks/useKeyboardNavigation';

export interface KeyboardShortcutsHelpProps {
  shortcuts?: KeyboardShortcut[];
  showByDefault?: boolean;
}

/**
 * Component to display keyboard shortcuts help
 */
export function KeyboardShortcutsHelp({ 
  shortcuts = [],
  showByDefault = false 
}: KeyboardShortcutsHelpProps) {
  const [isVisible, setIsVisible] = useState(showByDefault);

  // Toggle help with ? key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        // Only trigger if not in an input field
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          setIsVisible(prev => !prev);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-50"
        aria-label="Show keyboard shortcuts help"
        title="Press ? to show keyboard shortcuts"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    );
  }

  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const keys: string[] = [];
    
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.metaKey) keys.push('Cmd');
    if (shortcut.altKey) keys.push('Alt');
    if (shortcut.shiftKey) keys.push('Shift');
    keys.push(shortcut.key.toUpperCase());
    
    return keys.join(' + ');
  };

  const defaultShortcuts: KeyboardShortcut[] = [
    { key: '?', description: 'Show/hide this help', handler: () => {} },
    { key: '/', description: 'Focus search', handler: () => {} },
    { key: 'n', ctrlKey: true, description: 'New credential', handler: () => {} },
    { key: 'g', ctrlKey: true, description: 'Open password generator', handler: () => {} },
    { key: 's', ctrlKey: true, description: 'Open settings', handler: () => {} },
    { key: 'Escape', description: 'Close modal/dialog', handler: () => {} },
    { key: 'Tab', description: 'Navigate forward', handler: () => {} },
    { key: 'Tab', shiftKey: true, description: 'Navigate backward', handler: () => {} },
  ];

  const allShortcuts = shortcuts.length > 0 ? shortcuts : defaultShortcuts;

  return (
    <div
      className="keyboard-help-overlay"
      role="dialog"
      aria-labelledby="keyboard-shortcuts-title"
      aria-modal="false"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 
          id="keyboard-shortcuts-title"
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Keyboard Shortcuts
        </h2>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Close keyboard shortcuts help"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {allShortcuts.map((shortcut, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-gray-700 dark:text-gray-300">
              {shortcut.description}
            </span>
            <kbd className="keyboard-shortcut ml-3">
              {formatShortcut(shortcut)}
            </kbd>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Press <kbd className="keyboard-shortcut">?</kbd> to toggle this help
        </p>
      </div>
    </div>
  );
}
