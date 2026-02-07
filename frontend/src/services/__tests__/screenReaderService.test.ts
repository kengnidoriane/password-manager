/**
 * Screen Reader Service Tests
 * Tests for screen reader announcement functionality
 * Requirements: 20.4 - Multi-modal feedback
 */

import { screenReaderService } from '../screenReaderService';

describe('ScreenReaderService', () => {
  beforeEach(() => {
    // Clear any existing announcements
    screenReaderService.clearHistory();
    
    // Mock document.body if not available
    if (!document.body) {
      document.body = document.createElement('body');
    }
  });

  afterEach(() => {
    // Cleanup
    screenReaderService.clearHistory();
  });

  describe('announce', () => {
    it('should add announcement to history', () => {
      screenReaderService.announce('Test message', 'polite');
      
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements).toHaveLength(1);
      expect(announcements[0].message).toBe('Test message');
      expect(announcements[0].priority).toBe('polite');
    });

    it('should handle empty messages', () => {
      screenReaderService.announce('', 'polite');
      
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements).toHaveLength(0);
    });

    it('should default to polite priority', () => {
      screenReaderService.announce('Test message');
      
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements[0].priority).toBe('polite');
    });
  });

  describe('announceSuccess', () => {
    it('should announce success message with prefix', () => {
      screenReaderService.announceSuccess('Operation completed');
      
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements[0].message).toBe('Success: Operation completed');
      expect(announcements[0].priority).toBe('polite');
    });
  });

  describe('announceError', () => {
    it('should announce error message with prefix and assertive priority', () => {
      screenReaderService.announceError('Operation failed');
      
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements[0].message).toBe('Error: Operation failed');
      expect(announcements[0].priority).toBe('assertive');
    });
  });

  describe('announceWarning', () => {
    it('should announce warning message with prefix and assertive priority', () => {
      screenReaderService.announceWarning('Check your input');
      
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements[0].message).toBe('Warning: Check your input');
      expect(announcements[0].priority).toBe('assertive');
    });
  });

  describe('announceInfo', () => {
    it('should announce info message with prefix', () => {
      screenReaderService.announceInfo('New update available');
      
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements[0].message).toBe('Information: New update available');
      expect(announcements[0].priority).toBe('polite');
    });
  });

  describe('announceLoading', () => {
    it('should announce loading message with default text', () => {
      screenReaderService.announceLoading();
      
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements[0].message).toBe('Loading, please wait');
      expect(announcements[0].priority).toBe('polite');
    });

    it('should announce loading message with custom text', () => {
      screenReaderService.announceLoading('Saving data');
      
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements[0].message).toBe('Saving data, please wait');
    });
  });

  describe('announceComplete', () => {
    it('should announce completion with default message', () => {
      screenReaderService.announceComplete();
      
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements[0].message).toBe('Operation complete');
      expect(announcements[0].priority).toBe('polite');
    });

    it('should announce completion with custom message', () => {
      screenReaderService.announceComplete('Save complete');
      
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements[0].message).toBe('Save complete');
    });
  });

  describe('getAnnouncements', () => {
    it('should return all announcements', () => {
      screenReaderService.announce('First', 'polite');
      screenReaderService.announce('Second', 'assertive');
      screenReaderService.announce('Third', 'polite');
      
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements).toHaveLength(3);
      expect(announcements[0].message).toBe('First');
      expect(announcements[1].message).toBe('Second');
      expect(announcements[2].message).toBe('Third');
    });

    it('should return copy of announcements array', () => {
      screenReaderService.announce('Test', 'polite');
      
      const announcements1 = screenReaderService.getAnnouncements();
      const announcements2 = screenReaderService.getAnnouncements();
      
      expect(announcements1).not.toBe(announcements2);
      expect(announcements1).toEqual(announcements2);
    });
  });

  describe('clearHistory', () => {
    it('should clear all announcements', () => {
      screenReaderService.announce('First', 'polite');
      screenReaderService.announce('Second', 'polite');
      
      expect(screenReaderService.getAnnouncements()).toHaveLength(2);
      
      screenReaderService.clearHistory();
      
      expect(screenReaderService.getAnnouncements()).toHaveLength(0);
    });
  });

  describe('timestamp', () => {
    it('should add timestamp to announcements', () => {
      const before = Date.now();
      screenReaderService.announce('Test', 'polite');
      const after = Date.now();
      
      const announcements = screenReaderService.getAnnouncements();
      expect(announcements[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(announcements[0].timestamp).toBeLessThanOrEqual(after);
    });
  });
});
