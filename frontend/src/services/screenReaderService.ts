/**
 * Screen Reader Service
 * Provides announcements for screen readers using ARIA live regions
 * Requirements: 20.4 - Multi-modal feedback
 */

export type AnnouncementPriority = 'polite' | 'assertive';

export interface Announcement {
  message: string;
  priority: AnnouncementPriority;
  timestamp: number;
}

class ScreenReaderService {
  private static instance: ScreenReaderService;
  private politeRegion: HTMLDivElement | null = null;
  private assertiveRegion: HTMLDivElement | null = null;
  private announcements: Announcement[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeLiveRegions();
    }
  }

  static getInstance(): ScreenReaderService {
    if (!ScreenReaderService.instance) {
      ScreenReaderService.instance = new ScreenReaderService();
    }
    return ScreenReaderService.instance;
  }

  /**
   * Initialize ARIA live regions for announcements
   */
  private initializeLiveRegions(): void {
    // Create polite live region
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('role', 'status');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.className = 'sr-only';
    document.body.appendChild(this.politeRegion);

    // Create assertive live region
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('role', 'alert');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    document.body.appendChild(this.assertiveRegion);
  }

  /**
   * Announce a message to screen readers
   * @param message - The message to announce
   * @param priority - 'polite' (default) or 'assertive' for urgent messages
   */
  announce(message: string, priority: AnnouncementPriority = 'polite'): void {
    if (!message || typeof window === 'undefined') return;

    const announcement: Announcement = {
      message,
      priority,
      timestamp: Date.now(),
    };

    this.announcements.push(announcement);

    // Use the appropriate live region
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    
    if (region) {
      // Clear and set new message
      region.textContent = '';
      
      // Use setTimeout to ensure the change is detected
      setTimeout(() => {
        if (region) {
          region.textContent = message;
        }
      }, 100);

      // Clear after announcement
      setTimeout(() => {
        if (region && region.textContent === message) {
          region.textContent = '';
        }
      }, 3000);
    }
  }

  /**
   * Announce success message
   */
  announceSuccess(message: string): void {
    this.announce(`Success: ${message}`, 'polite');
  }

  /**
   * Announce error message
   */
  announceError(message: string): void {
    this.announce(`Error: ${message}`, 'assertive');
  }

  /**
   * Announce warning message
   */
  announceWarning(message: string): void {
    this.announce(`Warning: ${message}`, 'assertive');
  }

  /**
   * Announce info message
   */
  announceInfo(message: string): void {
    this.announce(`Information: ${message}`, 'polite');
  }

  /**
   * Announce loading state
   */
  announceLoading(message: string = 'Loading'): void {
    this.announce(`${message}, please wait`, 'polite');
  }

  /**
   * Announce completion
   */
  announceComplete(message: string = 'Operation complete'): void {
    this.announce(message, 'polite');
  }

  /**
   * Get announcement history
   */
  getAnnouncements(): Announcement[] {
    return [...this.announcements];
  }

  /**
   * Clear announcement history
   */
  clearHistory(): void {
    this.announcements = [];
  }

  /**
   * Cleanup live regions (for testing)
   */
  cleanup(): void {
    if (this.politeRegion) {
      document.body.removeChild(this.politeRegion);
      this.politeRegion = null;
    }
    if (this.assertiveRegion) {
      document.body.removeChild(this.assertiveRegion);
      this.assertiveRegion = null;
    }
    this.announcements = [];
  }
}

export const screenReaderService = ScreenReaderService.getInstance();
