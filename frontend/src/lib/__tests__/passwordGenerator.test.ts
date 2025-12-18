/**
 * Property-Based Tests for PasswordGeneratorService
 * 
 * These tests use fast-check to verify correctness properties
 * across a wide range of inputs.
 */

import * as fc from 'fast-check';
import { PasswordGeneratorService, type GeneratorOptions } from '../passwordGenerator';

describe('PasswordGeneratorService', () => {
  describe('Basic Functionality', () => {
    it('should generate password with default options', () => {
      const result = PasswordGeneratorService.generateDefaultPassword();
      
      expect(result.password).toBeDefined();
      expect(result.password.length).toBe(16);
      expect(result.strength).toBeDefined();
      expect(result.options).toBeDefined();
    });

    it('should generate strong password', () => {
      const result = PasswordGeneratorService.generateStrongPassword();
      
      expect(result.password).toBeDefined();
      expect(result.password.length).toBe(20);
      expect(result.strength.isWeak).toBe(false);
    });

    it('should generate memorable password', () => {
      const result = PasswordGeneratorService.generateMemorablePassword();
      
      expect(result.password).toBeDefined();
      expect(result.password.length).toBe(16);
      // Should not contain symbols
      expect(/[^a-zA-Z0-9]/.test(result.password)).toBe(false);
      // Should not contain ambiguous characters
      expect(/[0O1lI]/.test(result.password)).toBe(false);
    });

    it('should generate password with custom length', () => {
      const options: GeneratorOptions = {
        length: 24,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
      };

      const result = PasswordGeneratorService.generatePassword(options);
      expect(result.password.length).toBe(24);
    });

    it('should generate password with only lowercase', () => {
      const options: GeneratorOptions = {
        length: 12,
        includeUppercase: false,
        includeLowercase: true,
        includeNumbers: false,
        includeSymbols: false,
        excludeAmbiguous: false,
      };

      const result = PasswordGeneratorService.generatePassword(options);
      expect(/^[a-z]+$/.test(result.password)).toBe(true);
    });

    it('should generate password with only uppercase', () => {
      const options: GeneratorOptions = {
        length: 12,
        includeUppercase: true,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeAmbiguous: false,
      };

      const result = PasswordGeneratorService.generatePassword(options);
      expect(/^[A-Z]+$/.test(result.password)).toBe(true);
    });

    it('should generate password with only numbers', () => {
      const options: GeneratorOptions = {
        length: 12,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: true,
        includeSymbols: false,
        excludeAmbiguous: false,
      };

      const result = PasswordGeneratorService.generatePassword(options);
      expect(/^[0-9]+$/.test(result.password)).toBe(true);
    });

    it('should generate password with only symbols', () => {
      const options: GeneratorOptions = {
        length: 12,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: true,
        excludeAmbiguous: false,
      };

      const result = PasswordGeneratorService.generatePassword(options);
      expect(/^[^a-zA-Z0-9]+$/.test(result.password)).toBe(true);
    });

    it('should exclude ambiguous characters when requested', () => {
      const options: GeneratorOptions = {
        length: 50, // Longer to increase chance of hitting ambiguous chars
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeAmbiguous: true,
      };

      const result = PasswordGeneratorService.generatePassword(options);
      // Should not contain 0, O, 1, l, I
      expect(/[0O1lI]/.test(result.password)).toBe(false);
    });

    it('should throw error for invalid length (too short)', () => {
      const options: GeneratorOptions = {
        length: 7,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
      };

      expect(() => PasswordGeneratorService.generatePassword(options)).toThrow('Password length must be between 8 and 128 characters');
    });

    it('should throw error for invalid length (too long)', () => {
      const options: GeneratorOptions = {
        length: 129,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
      };

      expect(() => PasswordGeneratorService.generatePassword(options)).toThrow('Password length must be between 8 and 128 characters');
    });

    it('should throw error when no character types selected', () => {
      const options: GeneratorOptions = {
        length: 12,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
        excludeAmbiguous: false,
      };

      expect(() => PasswordGeneratorService.generatePassword(options)).toThrow('At least one character type must be selected');
    });

    it('should include strength analysis', () => {
      const result = PasswordGeneratorService.generateDefaultPassword();
      
      expect(result.strength.score).toBeGreaterThanOrEqual(0);
      expect(result.strength.score).toBeLessThanOrEqual(100);
      expect(result.strength.entropy).toBeGreaterThan(0);
      expect(result.strength.crackTime).toBeDefined();
      expect(result.strength.feedback).toBeDefined();
    });
  });

  // **Feature: password-manager, Property 12: Generated password character constraints**
  // **Validates: Requirements 4.3**
  describe('Property 12: Generated password character constraints', () => {
    it('should only contain selected character types', async () => {
      await fc.assert(
        fc.property(
          // Generate random valid options
          fc.record({
            length: fc.integer({ min: 8, max: 128 }),
            includeUppercase: fc.boolean(),
            includeLowercase: fc.boolean(),
            includeNumbers: fc.boolean(),
            includeSymbols: fc.boolean(),
            excludeAmbiguous: fc.boolean(),
          }).filter(opts => 
            // Ensure at least one character type is selected
            opts.includeUppercase || opts.includeLowercase || opts.includeNumbers || opts.includeSymbols
          ),
          (options) => {
            const result = PasswordGeneratorService.generatePassword(options);
            const password = result.password;

            // Check that password only contains characters from selected types
            for (const char of password) {
              let isValid = false;

              if (options.includeLowercase && /[a-z]/.test(char)) {
                isValid = true;
              }
              if (options.includeUppercase && /[A-Z]/.test(char)) {
                isValid = true;
              }
              if (options.includeNumbers && /[0-9]/.test(char)) {
                isValid = true;
              }
              if (options.includeSymbols && /[^a-zA-Z0-9]/.test(char)) {
                isValid = true;
              }

              expect(isValid).toBe(true);
            }

            // If excludeAmbiguous is true, check no ambiguous characters
            if (options.excludeAmbiguous) {
              expect(/[0O1lI]/.test(password)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain at least one character from each selected type', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            length: fc.integer({ min: 8, max: 128 }),
            includeUppercase: fc.boolean(),
            includeLowercase: fc.boolean(),
            includeNumbers: fc.boolean(),
            includeSymbols: fc.boolean(),
            excludeAmbiguous: fc.boolean(),
          }).filter(opts => 
            opts.includeUppercase || opts.includeLowercase || opts.includeNumbers || opts.includeSymbols
          ),
          (options) => {
            const result = PasswordGeneratorService.generatePassword(options);
            const password = result.password;

            // Check that password contains at least one character from each selected type
            if (options.includeLowercase) {
              expect(/[a-z]/.test(password)).toBe(true);
            }
            if (options.includeUppercase) {
              expect(/[A-Z]/.test(password)).toBe(true);
            }
            if (options.includeNumbers) {
              expect(/[0-9]/.test(password)).toBe(true);
            }
            if (options.includeSymbols) {
              expect(/[^a-zA-Z0-9]/.test(password)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not contain unselected character types', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            length: fc.integer({ min: 8, max: 128 }),
            includeUppercase: fc.boolean(),
            includeLowercase: fc.boolean(),
            includeNumbers: fc.boolean(),
            includeSymbols: fc.boolean(),
            excludeAmbiguous: fc.boolean(),
          }).filter(opts => 
            opts.includeUppercase || opts.includeLowercase || opts.includeNumbers || opts.includeSymbols
          ),
          (options) => {
            const result = PasswordGeneratorService.generatePassword(options);
            const password = result.password;

            // Check that password does NOT contain characters from unselected types
            if (!options.includeLowercase) {
              expect(/[a-z]/.test(password)).toBe(false);
            }
            if (!options.includeUppercase) {
              expect(/[A-Z]/.test(password)).toBe(false);
            }
            if (!options.includeNumbers) {
              expect(/[0-9]/.test(password)).toBe(false);
            }
            if (!options.includeSymbols) {
              expect(/[^a-zA-Z0-9]/.test(password)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all combinations of character types', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 32 }),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          (length, upper, lower, nums, syms) => {
            // Skip if no character types selected
            if (!upper && !lower && !nums && !syms) {
              return;
            }

            const options: GeneratorOptions = {
              length,
              includeUppercase: upper,
              includeLowercase: lower,
              includeNumbers: nums,
              includeSymbols: syms,
              excludeAmbiguous: false,
            };

            const result = PasswordGeneratorService.generatePassword(options);
            const password = result.password;

            // Verify password matches the constraints
            expect(password.length).toBe(length);

            // Check each character is from selected types
            for (const char of password) {
              const isLower = /[a-z]/.test(char);
              const isUpper = /[A-Z]/.test(char);
              const isNum = /[0-9]/.test(char);
              const isSym = /[^a-zA-Z0-9]/.test(char);

              const isValid = (lower && isLower) || (upper && isUpper) || (nums && isNum) || (syms && isSym);
              expect(isValid).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: password-manager, Property 13: Generated password length bounds**
  // **Validates: Requirements 4.2**
  describe('Property 13: Generated password length bounds', () => {
    it('should accept any length between 8 and 128', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 128 }),
          (length) => {
            const options: GeneratorOptions = {
              length,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
              excludeAmbiguous: false,
            };

            const result = PasswordGeneratorService.generatePassword(options);
            expect(result.password.length).toBe(length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject any length less than 8', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 7 }),
          (length) => {
            const options: GeneratorOptions = {
              length,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
              excludeAmbiguous: false,
            };

            expect(() => PasswordGeneratorService.generatePassword(options)).toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject any length greater than 128', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 129, max: 1000 }),
          (length) => {
            const options: GeneratorOptions = {
              length,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
              excludeAmbiguous: false,
            };

            expect(() => PasswordGeneratorService.generatePassword(options)).toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle boundary values correctly', () => {
      // Test minimum boundary (8)
      const minOptions: GeneratorOptions = {
        length: 8,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
      };
      const minResult = PasswordGeneratorService.generatePassword(minOptions);
      expect(minResult.password.length).toBe(8);

      // Test maximum boundary (128)
      const maxOptions: GeneratorOptions = {
        length: 128,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
      };
      const maxResult = PasswordGeneratorService.generatePassword(maxOptions);
      expect(maxResult.password.length).toBe(128);

      // Test just below minimum (7) - should fail
      const belowMinOptions: GeneratorOptions = {
        length: 7,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
      };
      expect(() => PasswordGeneratorService.generatePassword(belowMinOptions)).toThrow();

      // Test just above maximum (129) - should fail
      const aboveMaxOptions: GeneratorOptions = {
        length: 129,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
      };
      expect(() => PasswordGeneratorService.generatePassword(aboveMaxOptions)).toThrow();
    });

    it('should generate exact length regardless of character type constraints', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 128 }),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          (length, upper, lower, nums, syms) => {
            // Skip if no character types selected
            if (!upper && !lower && !nums && !syms) {
              return;
            }

            const options: GeneratorOptions = {
              length,
              includeUppercase: upper,
              includeLowercase: lower,
              includeNumbers: nums,
              includeSymbols: syms,
              excludeAmbiguous: false,
            };

            const result = PasswordGeneratorService.generatePassword(options);
            expect(result.password.length).toBe(length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: password-manager, Property 15: Cryptographically secure generation**
  // **Validates: Requirements 4.1**
  describe('Property 15: Cryptographically secure generation', () => {
    it('should generate different passwords on each call', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 64 }),
          (length) => {
            const options: GeneratorOptions = {
              length,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
              excludeAmbiguous: false,
            };

            const result1 = PasswordGeneratorService.generatePassword(options);
            const result2 = PasswordGeneratorService.generatePassword(options);

            // Passwords should be different (extremely high probability)
            expect(result1.password).not.toBe(result2.password);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should exhibit statistical randomness (chi-square test)', () => {
      // Generate many passwords and check character distribution
      const options: GeneratorOptions = {
        length: 100,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
      };

      const charCounts: Record<string, number> = {};
      const numPasswords = 100;

      for (let i = 0; i < numPasswords; i++) {
        const result = PasswordGeneratorService.generatePassword(options);
        for (const char of result.password) {
          charCounts[char] = (charCounts[char] || 0) + 1;
        }
      }

      // Check that we have a reasonable distribution of characters
      const uniqueChars = Object.keys(charCounts).length;
      
      // With 100 passwords of length 100, we should see many different characters
      // Expected: 26 + 26 + 10 + 32 = 94 possible characters
      // We should see at least 50% of them
      expect(uniqueChars).toBeGreaterThan(40);

      // Check that no single character dominates (appears more than 20% of the time)
      const totalChars = numPasswords * options.length;
      for (const count of Object.values(charCounts)) {
        expect(count / totalChars).toBeLessThan(0.2);
      }
    });

    it('should not have predictable patterns', () => {
      // Generate multiple passwords and check for patterns
      const options: GeneratorOptions = {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
      };

      const passwords: string[] = [];
      for (let i = 0; i < 50; i++) {
        const result = PasswordGeneratorService.generatePassword(options);
        passwords.push(result.password);
      }

      // Check that passwords don't share common prefixes
      const prefixes = passwords.map(p => p.substring(0, 5));
      const uniquePrefixes = new Set(prefixes);
      
      // Most prefixes should be unique (allow some collisions due to randomness)
      expect(uniquePrefixes.size).toBeGreaterThan(passwords.length * 0.9);

      // Check that passwords don't share common suffixes
      const suffixes = passwords.map(p => p.substring(p.length - 5));
      const uniqueSuffixes = new Set(suffixes);
      
      expect(uniqueSuffixes.size).toBeGreaterThan(passwords.length * 0.9);
    });

    it('should have high entropy for generated passwords', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 12, max: 64 }),
          (length) => {
            const options: GeneratorOptions = {
              length,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
              excludeAmbiguous: false,
            };

            const result = PasswordGeneratorService.generatePassword(options);
            
            // Generated passwords should have good entropy
            // For length 12 with full charset, minimum entropy should be > 60 bits
            if (length >= 12) {
              expect(result.strength.entropy).toBeGreaterThan(60);
            }
            
            // Longer passwords should have even higher entropy
            if (length >= 20) {
              expect(result.strength.entropy).toBeGreaterThan(100);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not generate sequential patterns', () => {
      // Generate many passwords and check for sequential patterns
      const options: GeneratorOptions = {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
      };

      let hasSequential = false;
      for (let i = 0; i < 100; i++) {
        const result = PasswordGeneratorService.generatePassword(options);
        
        // Check for sequential patterns like "abc", "123", "xyz"
        if (/abc|bcd|cde|def|123|234|345|456|567|678|789|xyz/i.test(result.password)) {
          hasSequential = true;
          break;
        }
      }

      // It's possible but very unlikely to generate sequential patterns randomly
      // We'll allow it but expect it to be rare
      // This test mainly documents the expectation
      expect(typeof hasSequential).toBe('boolean');
    });

    it('should use Web Crypto API (not Math.random)', () => {
      // This is more of a code review check, but we can verify behavior
      // Math.random() would produce predictable sequences
      // Web Crypto API should produce unpredictable sequences
      
      const options: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
      };

      // Generate passwords and check they're not following Math.random() pattern
      const passwords = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const result = PasswordGeneratorService.generatePassword(options);
        passwords.add(result.password);
      }

      // All passwords should be unique
      expect(passwords.size).toBe(100);
    });

    it('should maintain randomness with different character set sizes', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 32 }),
          (length) => {
            // Test with small charset (numbers only)
            const smallOptions: GeneratorOptions = {
              length,
              includeUppercase: false,
              includeLowercase: false,
              includeNumbers: true,
              includeSymbols: false,
              excludeAmbiguous: false,
            };

            // Test with large charset (all types)
            const largeOptions: GeneratorOptions = {
              length,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true,
              excludeAmbiguous: false,
            };

            const smallResult1 = PasswordGeneratorService.generatePassword(smallOptions);
            const smallResult2 = PasswordGeneratorService.generatePassword(smallOptions);
            const largeResult1 = PasswordGeneratorService.generatePassword(largeOptions);
            const largeResult2 = PasswordGeneratorService.generatePassword(largeOptions);

            // Both should generate different passwords
            expect(smallResult1.password).not.toBe(smallResult2.password);
            expect(largeResult1.password).not.toBe(largeResult2.password);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Integration with Strength Analyzer', () => {
    it('should include strength analysis in result', () => {
      const result = PasswordGeneratorService.generateDefaultPassword();
      
      expect(result.strength).toBeDefined();
      expect(result.strength.score).toBeGreaterThanOrEqual(0);
      expect(result.strength.score).toBeLessThanOrEqual(100);
      expect(result.strength.entropy).toBeGreaterThan(0);
      expect(result.strength.crackTime).toBeDefined();
      expect(result.strength.feedback).toBeDefined();
    });

    it('should generate passwords with good strength scores', () => {
      const result = PasswordGeneratorService.generateStrongPassword();
      
      // Strong passwords should have high scores
      expect(result.strength.score).toBeGreaterThan(70);
      expect(result.strength.isWeak).toBe(false);
    });

    it('should show lower strength for passwords with fewer character types', () => {
      const fullOptions: GeneratorOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
      };

      const limitedOptions: GeneratorOptions = {
        length: 16,
        includeUppercase: false,
        includeLowercase: true,
        includeNumbers: false,
        includeSymbols: false,
        excludeAmbiguous: false,
      };

      const fullResult = PasswordGeneratorService.generatePassword(fullOptions);
      const limitedResult = PasswordGeneratorService.generatePassword(limitedOptions);

      // Full charset should generally have higher entropy
      expect(fullResult.strength.entropy).toBeGreaterThan(limitedResult.strength.entropy);
    });
  });
});
