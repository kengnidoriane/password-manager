/**
 * Property-Based Tests for ClipboardService
 * 
 * Tests clipboard auto-clear functionality using property-based testing.
 * **Property 20: Clipboard auto-clear**
 * **Validates: Requirements 5.4, 17.2**
 */

import fc from 'fast-check';
import { ClipboardService } from '../clipboardService';
import { db } from '@/lib/db';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn(),
  readText: jest.fn()
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true
});

// Mock timers
jest.useFakeTimers();

describe('ClipboardService Property Tests', () => {
  let clipboardService: ClipboardService;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
    mockClipboard.readText.mockResolvedValue('');
    
    // Clear any existing timers
    jest.clearAllTimers();
    
    // Reset the singleton instance by creating a new one
    // This is a bit of a hack but necessary for testing
    (ClipboardService as any).instance = undefined;
    clipboardService = ClipboardService.getInstance();
    
    // Mock database settings
    jest.spyOn(db, 'getSettings').mockResolvedValue({
      id: 'settings',
      sessionTimeout: 900000,
      clipboardTimeout: 60000, // 60 seconds
      biometricEnabled: false,
      strictSecurityMode: false,
      theme: 'system'
    });
  });

  afterEach(async () => {
    // Clean up
    await clipboardService.manualClear();
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  /**
   * Property 20: Clipboard auto-clear
   * For any copied content, the clipboard SHALL be automatically cleared 
   * after the configured timeout period (default 60 seconds)
   * **Validates: Requirements 5.4, 17.2**
   */
  test('Property 20: Clipboard auto-clear - clipboard is cleared after timeout', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test data
        fc.record({
          text: fc.string({ minLength: 1, maxLength: 100 }),
          type: fc.constantFrom('username', 'password', 'url', 'notes'),
          credentialId: fc.uuid(),
          timeoutMs: fc.integer({ min: 1000, max: 300000 }) // 1s to 5min
        }),
        async ({ text, type, credentialId, timeoutMs }) => {
          // Mock settings with custom timeout
          jest.spyOn(db, 'getSettings').mockResolvedValue({
            id: 'settings',
            sessionTimeout: 900000,
            clipboardTimeout: timeoutMs,
            biometricEnabled: false,
            strictSecurityMode: false,
            theme: 'system'
          });

          // Copy content to clipboard
          await clipboardService.copyToClipboard(text, type, credentialId);

          // Verify content was copied
          expect(mockClipboard.writeText).toHaveBeenCalledWith(text);
          expect(clipboardService.isActive()).toBe(true);

          // Fast-forward time to just before timeout
          jest.advanceTimersByTime(timeoutMs - 100);
          
          // Should still be active
          expect(clipboardService.isActive()).toBe(true);

          // Fast-forward past timeout
          jest.advanceTimersByTime(200);

          // Run all pending timers and promises
          jest.runAllTimers();
          await Promise.resolve();

          // Should be cleared now
          expect(clipboardService.isActive()).toBe(false);
          expect(mockClipboard.writeText).toHaveBeenCalledWith(''); // Cleared
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Clipboard countdown accuracy
   * For any active clipboard operation, the remaining time should decrease 
   * accurately every second until it reaches zero
   */
  test('Property: Clipboard countdown decreases accurately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          text: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('username', 'password', 'url', 'notes'),
          credentialId: fc.uuid(),
          timeoutMs: fc.integer({ min: 5000, max: 30000 }) // 5s to 30s for faster tests
        }),
        async ({ text, type, credentialId, timeoutMs }) => {
          // Mock settings
          jest.spyOn(db, 'getSettings').mockResolvedValue({
            id: 'settings',
            sessionTimeout: 900000,
            clipboardTimeout: timeoutMs,
            biometricEnabled: false,
            strictSecurityMode: false,
            theme: 'system'
          });

          // Copy content
          await clipboardService.copyToClipboard(text, type, credentialId);

          const expectedInitialTime = Math.ceil(timeoutMs / 1000);
          expect(clipboardService.getRemainingTime()).toBe(expectedInitialTime);

          // Advance by 1 second intervals and check countdown
          for (let i = 1; i < expectedInitialTime; i++) {
            jest.advanceTimersByTime(1000);
            const expectedRemaining = expectedInitialTime - i;
            expect(clipboardService.getRemainingTime()).toBe(expectedRemaining);
          }

          // Final second should clear the clipboard
          jest.advanceTimersByTime(1000);
          
          // Run all pending timers and promises
          jest.runAllTimers();
          await Promise.resolve();
          
          expect(clipboardService.isActive()).toBe(false);
          expect(clipboardService.getRemainingTime()).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Manual clear works at any time
   * For any active clipboard operation, manual clear should immediately 
   * clear the clipboard regardless of remaining time
   */
  test('Property: Manual clear works at any time during countdown', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          text: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('username', 'password', 'url', 'notes'),
          credentialId: fc.uuid(),
          timeoutMs: fc.integer({ min: 10000, max: 60000 }), // 10s to 60s
          clearAfterMs: fc.integer({ min: 1000, max: 9000 }) // Clear after 1-9s
        }),
        async ({ text, type, credentialId, timeoutMs, clearAfterMs }) => {
          // Ensure clearAfterMs is less than timeoutMs
          const actualClearAfter = Math.min(clearAfterMs, timeoutMs - 1000);
          
          // Mock settings
          jest.spyOn(db, 'getSettings').mockResolvedValue({
            id: 'settings',
            sessionTimeout: 900000,
            clipboardTimeout: timeoutMs,
            biometricEnabled: false,
            strictSecurityMode: false,
            theme: 'system'
          });

          // Copy content
          await clipboardService.copyToClipboard(text, type, credentialId);
          expect(clipboardService.isActive()).toBe(true);

          // Advance time but not to full timeout
          jest.advanceTimersByTime(actualClearAfter);
          expect(clipboardService.isActive()).toBe(true);

          // Manually clear
          await clipboardService.manualClear();

          // Should be immediately cleared
          expect(clipboardService.isActive()).toBe(false);
          expect(clipboardService.getRemainingTime()).toBe(0);
          expect(mockClipboard.writeText).toHaveBeenCalledWith(''); // Cleared
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Only one operation active at a time
   * For any sequence of clipboard operations, only the most recent 
   * operation should be active, and previous operations should be cancelled
   */
  test('Property: Only one clipboard operation active at a time', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 30 }),
            type: fc.constantFrom('username', 'password', 'url', 'notes'),
            credentialId: fc.uuid()
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (operations) => {
          // Mock settings
          jest.spyOn(db, 'getSettings').mockResolvedValue({
            id: 'settings',
            sessionTimeout: 900000,
            clipboardTimeout: 60000,
            biometricEnabled: false,
            strictSecurityMode: false,
            theme: 'system'
          });

          // Perform multiple operations in sequence
          for (let i = 0; i < operations.length; i++) {
            const op = operations[i];
            await clipboardService.copyToClipboard(op.text, op.type, op.credentialId);
            
            // Should always be active after each operation
            expect(clipboardService.isActive()).toBe(true);
            
            // Current operation should match the last one
            const currentOp = clipboardService.getCurrentOperation();
            expect(currentOp).not.toBeNull();
            expect(currentOp!.type).toBe(op.type);
            expect(currentOp!.credentialId).toBe(op.credentialId);
            
            // Should have copied the latest text
            expect(mockClipboard.writeText).toHaveBeenLastCalledWith(op.text);
          }

          // Only one operation should be active (the last one)
          const finalOp = operations[operations.length - 1];
          const currentOp = clipboardService.getCurrentOperation();
          expect(currentOp!.type).toBe(finalOp.type);
          expect(currentOp!.credentialId).toBe(finalOp.credentialId);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Clipboard state consistency
   * For any clipboard operation, the state should be consistent:
   * - If active, should have operation and remaining time > 0
   * - If not active, should have no operation and remaining time = 0
   */
  test('Property: Clipboard state consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          text: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('username', 'password', 'url', 'notes'),
          credentialId: fc.uuid(),
          timeoutMs: fc.integer({ min: 2000, max: 10000 })
        }),
        async ({ text, type, credentialId, timeoutMs }) => {
          // Mock settings
          jest.spyOn(db, 'getSettings').mockResolvedValue({
            id: 'settings',
            sessionTimeout: 900000,
            clipboardTimeout: timeoutMs,
            biometricEnabled: false,
            strictSecurityMode: false,
            theme: 'system'
          });

          // Initially should be inactive
          expect(clipboardService.isActive()).toBe(false);
          expect(clipboardService.getCurrentOperation()).toBeNull();
          expect(clipboardService.getRemainingTime()).toBe(0);

          // Copy content
          await clipboardService.copyToClipboard(text, type, credentialId);

          // Should be active with consistent state
          expect(clipboardService.isActive()).toBe(true);
          expect(clipboardService.getCurrentOperation()).not.toBeNull();
          expect(clipboardService.getRemainingTime()).toBeGreaterThan(0);

          // Advance to timeout
          jest.advanceTimersByTime(timeoutMs + 100);

          // Run all pending timers and promises
          jest.runAllTimers();
          await Promise.resolve();

          // Should be inactive with consistent state
          expect(clipboardService.isActive()).toBe(false);
          expect(clipboardService.getCurrentOperation()).toBeNull();
          expect(clipboardService.getRemainingTime()).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});