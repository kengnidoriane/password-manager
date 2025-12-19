/**
 * ClipboardService - Handles secure clipboard operations
 * 
 * Provides one-click copy functionality with automatic clearing,
 * countdown timers, and last-used timestamp updates.
 */

import { db } from '@/lib/db';
import { config } from '@/lib/config';
import { ClipboardOperation } from '@/types/vault';

export interface ClipboardState {
  isActive: boolean;
  operation: ClipboardOperation | null;
  remainingTime: number;
  timerId: NodeJS.Timeout | null;
  countdownTimerId: NodeJS.Timeout | null;
}

/**
 * ClipboardService class for secure clipboard operations
 */
export class ClipboardService {
  private static instance: ClipboardService;
  private state: ClipboardState = {
    isActive: false,
    operation: null,
    remainingTime: 0,
    timerId: null,
    countdownTimerId: null
  };
  private listeners: Set<(state: ClipboardState) => void> = new Set();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ClipboardService {
    if (!ClipboardService.instance) {
      ClipboardService.instance = new ClipboardService();
    }
    return ClipboardService.instance;
  }

  /**
   * Subscribe to clipboard state changes
   */
  subscribe(listener: (state: ClipboardState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  /**
   * Copy text to clipboard with auto-clear and countdown
   */
  async copyToClipboard(
    text: string,
    type: ClipboardOperation['type'],
    credentialId: string
  ): Promise<void> {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }

      // Clear any existing timer
      this.clearCurrentOperation();

      // Copy to clipboard
      await navigator.clipboard.writeText(text);

      // Get clipboard timeout from settings
      const settings = await db.getSettings();
      const timeoutMs = settings.clipboardTimeout;

      // Create operation record
      const operation: ClipboardOperation = {
        type,
        credentialId,
        timestamp: Date.now()
      };

      // Update state
      this.state = {
        isActive: true,
        operation,
        remainingTime: Math.ceil(timeoutMs / 1000),
        timerId: null,
        countdownTimerId: null
      };

      // Start countdown timer (updates every second)
      this.state.countdownTimerId = setInterval(() => {
        this.state.remainingTime -= 1;
        if (this.state.remainingTime <= 0) {
          // Stop the countdown timer when we reach 0
          if (this.state.countdownTimerId) {
            clearInterval(this.state.countdownTimerId);
            this.state.countdownTimerId = null;
          }
        }
        this.notifyListeners();
      }, 1000);

      // Set auto-clear timer
      this.state.timerId = setTimeout(() => {
        // Clear clipboard asynchronously but don't wait
        this.clearClipboard().catch(error => {
          console.warn('Failed to clear clipboard on timeout:', error);
        });
      }, timeoutMs);

      // Notify listeners
      this.notifyListeners();

    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw new Error('Failed to copy to clipboard');
    }
  }

  /**
   * Clear clipboard and reset state
   */
  async clearClipboard(): Promise<void> {
    try {
      // Clear clipboard content
      if (navigator.clipboard) {
        await navigator.clipboard.writeText('');
      }
    } catch (error) {
      // Ignore errors - clipboard might be overwritten by user
      console.warn('Failed to clear clipboard:', error);
    } finally {
      // Always clear our state
      this.clearCurrentOperation();
    }
  }

  /**
   * Clear current operation and timers
   */
  private clearCurrentOperation(): void {
    // Clear timers
    if (this.state.timerId) {
      clearTimeout(this.state.timerId);
    }
    if (this.state.countdownTimerId) {
      clearInterval(this.state.countdownTimerId);
    }

    // Reset state
    this.state = {
      isActive: false,
      operation: null,
      remainingTime: 0,
      timerId: null,
      countdownTimerId: null
    };

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Get current clipboard state
   */
  getState(): ClipboardState {
    return { ...this.state };
  }

  /**
   * Check if clipboard is currently active
   */
  isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Get remaining time in seconds
   */
  getRemainingTime(): number {
    return this.state.remainingTime;
  }

  /**
   * Get current operation
   */
  getCurrentOperation(): ClipboardOperation | null {
    return this.state.operation;
  }

  /**
   * Manually clear clipboard (for user-initiated clear)
   */
  async manualClear(): Promise<void> {
    await this.clearClipboard();
  }

  /**
   * Update clipboard timeout setting
   */
  async updateTimeout(timeoutMs: number): Promise<void> {
    await db.updateSettings({ clipboardTimeout: timeoutMs });
    
    // If there's an active operation, restart with new timeout
    if (this.state.isActive && this.state.operation) {
      const { operation } = this.state;
      const elapsed = Date.now() - operation.timestamp;
      const remaining = Math.max(0, timeoutMs - elapsed);
      
      if (remaining > 0) {
        // Clear existing timers
        if (this.state.timerId) {
          clearTimeout(this.state.timerId);
        }
        if (this.state.countdownTimerId) {
          clearInterval(this.state.countdownTimerId);
        }

        // Update remaining time
        this.state.remainingTime = Math.ceil(remaining / 1000);

        // Restart timers with remaining time
        this.state.countdownTimerId = setInterval(() => {
          this.state.remainingTime -= 1;
          if (this.state.remainingTime <= 0) {
            this.clearCurrentOperation();
          } else {
            this.notifyListeners();
          }
        }, 1000);

        this.state.timerId = setTimeout(() => {
          this.clearClipboard();
        }, remaining);

        this.notifyListeners();
      } else {
        // Timeout already passed, clear immediately
        await this.clearClipboard();
      }
    }
  }

  /**
   * Check if clipboard API is supported
   */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 
           'clipboard' in navigator && 
           typeof navigator.clipboard.writeText === 'function';
  }

  /**
   * Get formatted time string (e.g., "1:23", "0:05")
   */
  getFormattedRemainingTime(): string {
    const minutes = Math.floor(this.state.remainingTime / 60);
    const seconds = this.state.remainingTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Cleanup on service destruction
   */
  destroy(): void {
    this.clearCurrentOperation();
    this.listeners.clear();
  }
}

// Export singleton instance
export const clipboardService = ClipboardService.getInstance();