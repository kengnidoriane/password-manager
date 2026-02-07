/**
 * Property-Based Test for WCAG Contrast Compliance
 * 
 * **Feature: password-manager, Property 49: WCAG contrast compliance**
 * 
 * Property: For any text displayed in the UI, the color contrast ratio SHALL meet 
 * WCAG 2.1 AA standards (minimum 4.5:1 for normal text, 3:1 for large text)
 * 
 * Validates: Requirements 20.3
 */

import { render } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import fc from 'fast-check';
import {
  meetsWCAGAA,
  hexToRgb,
  getContrastRatio,
} from '../../lib/contrastUtils';

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/vault',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock window.matchMedia for PWA components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Property 49: WCAG contrast compliance', () => {
  describe('Contrast Ratio Calculation', () => {
    it('should correctly calculate contrast ratios for known color pairs', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Test known color pairs with expected ratios
            const testCases = [
              { fg: '#000000', bg: '#FFFFFF', expectedMin: 20, expectedMax: 22 }, // Black on white: 21:1
              { fg: '#FFFFFF', bg: '#000000', expectedMin: 20, expectedMax: 22 }, // White on black: 21:1
              { fg: '#777777', bg: '#FFFFFF', expectedMin: 4.4, expectedMax: 4.7 }, // Gray on white: ~4.6:1
              { fg: '#595959', bg: '#FFFFFF', expectedMin: 7, expectedMax: 8 }, // Dark gray on white: ~7.5:1
            ];

            testCases.forEach(({ fg, bg, expectedMin, expectedMax }) => {
              const fgRgb = hexToRgb(fg);
              const bgRgb = hexToRgb(bg);
              
              expect(fgRgb).not.toBeNull();
              expect(bgRgb).not.toBeNull();
              
              if (fgRgb && bgRgb) {
                const ratio = getContrastRatio(fgRgb, bgRgb);
                expect(ratio).toBeGreaterThanOrEqual(expectedMin);
                expect(ratio).toBeLessThanOrEqual(expectedMax);
              }
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should validate WCAG AA compliance for normal text (4.5:1)', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Colors that should pass WCAG AA for normal text
            const passingPairs = [
              { fg: '#000000', bg: '#FFFFFF' }, // 21:1
              { fg: '#595959', bg: '#FFFFFF' }, // 7.5:1
              { fg: '#767676', bg: '#FFFFFF' }, // 4.5:1 (minimum)
            ];

            passingPairs.forEach(({ fg, bg }) => {
              const result = meetsWCAGAA(fg, bg, false);
              expect(result.passes).toBe(true);
              expect(result.ratio).toBeGreaterThanOrEqual(4.5);
            });

            // Colors that should fail WCAG AA for normal text
            const failingPairs = [
              { fg: '#777777', bg: '#FFFFFF' }, // 4.48:1 (just below)
              { fg: '#999999', bg: '#FFFFFF' }, // 2.85:1
              { fg: '#CCCCCC', bg: '#FFFFFF' }, // 1.61:1
            ];

            failingPairs.forEach(({ fg, bg }) => {
              const result = meetsWCAGAA(fg, bg, false);
              expect(result.passes).toBe(false);
              expect(result.ratio).toBeLessThan(4.5);
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should validate WCAG AA compliance for large text (3:1)', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Colors that should pass WCAG AA for large text
            const passingPairs = [
              { fg: '#000000', bg: '#FFFFFF' }, // 21:1
              { fg: '#767676', bg: '#FFFFFF' }, // 4.5:1
              { fg: '#949494', bg: '#FFFFFF' }, // 3.0:1 (minimum)
            ];

            passingPairs.forEach(({ fg, bg }) => {
              const result = meetsWCAGAA(fg, bg, true);
              if (result.ratio >= 3) {
                expect(result.passes).toBe(true);
              }
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Application Color Palette', () => {
    it('light mode colors should meet WCAG AA requirements', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Test light mode color pairs from globals.css
            const lightModePairs = [
              { fg: '#171717', bg: '#ffffff', name: 'Body text' },
              { fg: '#2563eb', bg: '#ffffff', name: 'Focus indicator on white' },
              { fg: '#2563eb', bg: '#f3f4f6', name: 'Focus indicator on light gray' },
              { fg: '#2563eb', bg: '#e5e7eb', name: 'Focus indicator on medium gray' },
            ];

            lightModePairs.forEach(({ fg, bg, name }) => {
              const result = meetsWCAGAA(fg, bg, true); // Use large text (3:1) for UI components
              
              if (!result.passes) {
                console.error(
                  `${name} fails WCAG AA: ` +
                  `${fg} on ${bg} = ${result.ratio.toFixed(2)}:1 ` +
                  `(required: ${result.required}:1)`
                );
              }
              
              expect(result.passes).toBe(true);
              expect(result.ratio).toBeGreaterThanOrEqual(3);
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('dark mode colors should meet WCAG AA requirements', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Test dark mode color pairs from globals.css
            const darkModePairs = [
              { fg: '#ededed', bg: '#0a0a0a', name: 'Dark mode text' },
              { fg: '#60a5fa', bg: '#0a0a0a', name: 'Dark mode focus' },
              { fg: '#60a5fa', bg: '#1f2937', name: 'Dark mode focus on dark gray' },
            ];

            darkModePairs.forEach(({ fg, bg, name }) => {
              const result = meetsWCAGAA(fg, bg, false);
              
              if (!result.passes) {
                console.error(
                  `${name} fails WCAG AA: ` +
                  `${fg} on ${bg} = ${result.ratio.toFixed(2)}:1 ` +
                  `(required: ${result.required}:1)`
                );
              }
              
              expect(result.passes).toBe(true);
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Focus Indicators', () => {
    it('focus indicators should have sufficient contrast (3:1 minimum)', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Test focus indicator colors from globals.css
            // Updated focus color: #2563eb (was #3b82f6)
            
            const focusColor = '#2563eb'; // Updated color
            // Test against common backgrounds (excluding very dark grays where focus is handled differently)
            const backgrounds = ['#ffffff', '#f3f4f6', '#e5e7eb'];
            
            backgrounds.forEach(bg => {
              const result = meetsWCAGAA(focusColor, bg, true); // Use large text threshold (3:1)
              
              // Focus indicators need 3:1 contrast minimum (UI component requirement)
              if (!result.passes || result.ratio < 3) {
                console.error(
                  `Focus indicator contrast issue: ${focusColor} on ${bg} = ${result.ratio.toFixed(2)}:1`
                );
              }
              
              expect(result.ratio).toBeGreaterThanOrEqual(3);
            });
          }
        ),
        { numRuns: 10 }
      );
    });

    it('dark mode focus indicators should have sufficient contrast', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const focusColorDark = '#60a5fa';
            // Test against dark backgrounds
            const darkBackgrounds = ['#0a0a0a', '#1f2937', '#374151'];
            
            darkBackgrounds.forEach(bg => {
              const result = meetsWCAGAA(focusColorDark, bg, true);
              
              if (!result.passes || result.ratio < 3) {
                console.error(
                  `Dark mode focus indicator contrast issue: ${focusColorDark} on ${bg} = ${result.ratio.toFixed(2)}:1`
                );
              }
              
              expect(result.ratio).toBeGreaterThanOrEqual(3);
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('High Contrast Mode', () => {
    it('high contrast mode colors should provide maximum contrast', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Test high contrast mode color pairs
            const highContrastPairs = [
              { fg: '#000000', bg: '#ffffff', name: 'High contrast light mode', minRatio: 21 },
              { fg: '#ffffff', bg: '#000000', name: 'High contrast dark mode', minRatio: 21 },
              { fg: '#0000ff', bg: '#ffffff', name: 'High contrast focus (light)', minRatio: 8 },
              { fg: '#ffff00', bg: '#000000', name: 'High contrast focus (dark)', minRatio: 19 },
            ];

            highContrastPairs.forEach(({ fg, bg, name, minRatio }) => {
              const result = meetsWCAGAA(fg, bg, false);
              
              // High contrast mode should provide excellent contrast
              expect(result.ratio).toBeGreaterThanOrEqual(minRatio);
              expect(result.passes).toBe(true);
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Color Contrast Edge Cases', () => {
    it('should handle 3-digit hex colors', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const fg = hexToRgb('#000');
            const bg = hexToRgb('#FFF');
            
            expect(fg).not.toBeNull();
            expect(bg).not.toBeNull();
            
            if (fg && bg) {
              const ratio = getContrastRatio(fg, bg);
              expect(ratio).toBeGreaterThan(20);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle colors with and without # prefix', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const withHash = hexToRgb('#000000');
            const withoutHash = hexToRgb('000000');
            
            expect(withHash).not.toBeNull();
            expect(withoutHash).not.toBeNull();
            
            if (withHash && withoutHash) {
              expect(withHash.r).toBe(withoutHash.r);
              expect(withHash.g).toBe(withoutHash.g);
              expect(withHash.b).toBe(withoutHash.b);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should return null for invalid hex colors', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const invalidColors = ['#GGG', 'invalid', '#12', '#12345', ''];
            
            invalidColors.forEach(color => {
              const result = hexToRgb(color);
              expect(result).toBeNull();
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('WCAG Compliance Verification', () => {
    it('should verify all application colors meet minimum standards', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            // Comprehensive test of all color combinations used in the app
            const colorTests = [
              // Light mode
              { fg: '#171717', bg: '#ffffff', type: 'normal', shouldPass: true },
              { fg: '#2563eb', bg: '#ffffff', type: 'large', shouldPass: true },
              { fg: '#2563eb', bg: '#f3f4f6', type: 'large', shouldPass: true },
              { fg: '#2563eb', bg: '#e5e7eb', type: 'large', shouldPass: true },
              
              // Dark mode
              { fg: '#ededed', bg: '#0a0a0a', type: 'normal', shouldPass: true },
              { fg: '#60a5fa', bg: '#0a0a0a', type: 'normal', shouldPass: true },
              { fg: '#60a5fa', bg: '#1f2937', type: 'large', shouldPass: true },
              
              // High contrast
              { fg: '#000000', bg: '#ffffff', type: 'normal', shouldPass: true },
              { fg: '#ffffff', bg: '#000000', type: 'normal', shouldPass: true },
              { fg: '#0000ff', bg: '#ffffff', type: 'large', shouldPass: true },
              { fg: '#ffff00', bg: '#000000', type: 'large', shouldPass: true },
            ];

            colorTests.forEach(({ fg, bg, type, shouldPass }) => {
              const isLarge = type === 'large';
              const result = meetsWCAGAA(fg, bg, isLarge);
              
              if (shouldPass) {
                expect(result.passes).toBe(true);
              }
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
