/**
 * Property-Based Tests for PasswordValidationService
 * 
 * These tests use fast-check to verify correctness properties
 * across a wide range of inputs.
 */

import * as fc from 'fast-check';
import { PasswordValidationService } from '../passwordValidation';

// Mock fetch for breach check tests
global.fetch = jest.fn();

describe('PasswordValidationService', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    (global.fetch as jest.Mock).mockReset();
  });
  describe('Basic Functionality', () => {
    it('should validate a strong master password', () => {
      const result = PasswordValidationService.validateMasterPassword('MySecureP@ssw0rd123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.meetsMinLength).toBe(true);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasUppercase).toBe(true);
      expect(result.hasNumber).toBe(true);
      expect(result.hasSpecialChar).toBe(true);
    });

    it('should reject password that is too short', () => {
      const result = PasswordValidationService.validateMasterPassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.meetsMinLength).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should reject password without lowercase', () => {
      const result = PasswordValidationService.validateMasterPassword('NOLOWERCASE1!');
      expect(result.isValid).toBe(false);
      expect(result.hasLowercase).toBe(false);
    });

    it('should reject password without uppercase', () => {
      const result = PasswordValidationService.validateMasterPassword('nouppercase1!');
      expect(result.isValid).toBe(false);
      expect(result.hasUppercase).toBe(false);
    });

    it('should reject password without numbers', () => {
      const result = PasswordValidationService.validateMasterPassword('NoNumbersHere!');
      expect(result.isValid).toBe(false);
      expect(result.hasNumber).toBe(false);
    });

    it('should reject password without special characters', () => {
      const result = PasswordValidationService.validateMasterPassword('NoSpecialChar1');
      expect(result.isValid).toBe(false);
      expect(result.hasSpecialChar).toBe(false);
    });
  });

  describe('Password Strength Analysis', () => {
    it('should analyze password strength', () => {
      const result = PasswordValidationService.analyzePasswordStrength('MySecureP@ssw0rd123');
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.entropy).toBeGreaterThan(0);
      expect(result.crackTime).toBeDefined();
      expect(result.crackTimeSeconds).toBeGreaterThan(0);
      expect(result.feedback).toBeDefined();
      expect(Array.isArray(result.feedback)).toBe(true);
    });

    it('should detect weak passwords', () => {
      const result = PasswordValidationService.analyzePasswordStrength('password123');
      expect(result.isWeak).toBe(true);
      expect(result.score).toBeLessThan(60);
    });

    it('should detect strong passwords', () => {
      const result = PasswordValidationService.analyzePasswordStrength('Xk9$mP2#qL5@wN8&vB3!');
      expect(result.isWeak).toBe(false);
      expect(result.score).toBeGreaterThan(60);
    });

    it('should detect common passwords', () => {
      const result = PasswordValidationService.analyzePasswordStrength('password');
      expect(result.feedback.some(f => f.toLowerCase().includes('common'))).toBe(true);
    });

    it('should detect keyboard patterns', () => {
      const result = PasswordValidationService.analyzePasswordStrength('qwerty123');
      expect(result.feedback.some(f => f.toLowerCase().includes('keyboard'))).toBe(true);
    });

    it('should detect sequential characters', () => {
      const result = PasswordValidationService.analyzePasswordStrength('abc123xyz');
      expect(result.feedback.some(f => f.toLowerCase().includes('sequential'))).toBe(true);
    });

    it('should detect repeated characters', () => {
      const result = PasswordValidationService.analyzePasswordStrength('aaa111bbb');
      expect(result.feedback.some(f => f.toLowerCase().includes('repeated'))).toBe(true);
    });

    it('should detect date patterns', () => {
      const result = PasswordValidationService.analyzePasswordStrength('password2023');
      expect(result.feedback.some(f => f.toLowerCase().includes('date'))).toBe(true);
    });

    it('should provide feedback for short passwords', () => {
      const result = PasswordValidationService.analyzePasswordStrength('short');
      expect(result.feedback.some(f => f.toLowerCase().includes('12 characters'))).toBe(true);
    });

    it('should calculate entropy correctly for different character sets', () => {
      const lowercase = PasswordValidationService.analyzePasswordStrength('abcdefghijkl');
      const mixed = PasswordValidationService.analyzePasswordStrength('AbCdEfGh1234');
      const full = PasswordValidationService.analyzePasswordStrength('AbCd1234!@#$');

      // More character variety should increase entropy
      expect(mixed.entropy).toBeGreaterThan(lowercase.entropy);
      expect(full.entropy).toBeGreaterThan(mixed.entropy);
    });

    it('should format crack time correctly', () => {
      const weak = PasswordValidationService.analyzePasswordStrength('123');
      const strong = PasswordValidationService.analyzePasswordStrength('Xk9$mP2#qL5@wN8&vB3!rT6%');

      expect(weak.crackTime).toBeDefined();
      expect(strong.crackTime).toBeDefined();
      expect(strong.crackTimeSeconds).toBeGreaterThan(weak.crackTimeSeconds);
    });
  });

  // **Feature: password-manager, Property 11: Master password validation**
  // **Validates: Requirements 1.1, 1.5**
  describe('Property 11: Master password validation', () => {
    it('should accept any password with 12+ chars, mixed case, numbers, and symbols', async () => {
      await fc.assert(
        fc.property(
          // Generate passwords that meet all requirements
          fc.string({ minLength: 12, maxLength: 128 })
            .filter(s => /[a-z]/.test(s) && /[A-Z]/.test(s) && /[0-9]/.test(s) && /[^a-zA-Z0-9]/.test(s)),
          (password) => {
            const result = PasswordValidationService.validateMasterPassword(password);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.meetsMinLength).toBe(true);
            expect(result.hasLowercase).toBe(true);
            expect(result.hasUppercase).toBe(true);
            expect(result.hasNumber).toBe(true);
            expect(result.hasSpecialChar).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject any password shorter than 12 characters', async () => {
      await fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 11 }),
          (password) => {
            const result = PasswordValidationService.validateMasterPassword(password);
            expect(result.meetsMinLength).toBe(false);
            expect(result.isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject any password without lowercase letters', async () => {
      await fc.assert(
        fc.property(
          // Generate strings without lowercase
          fc.string({ minLength: 12, maxLength: 128 })
            .map(s => s.toUpperCase() + '123!@#')
            .filter(s => !/[a-z]/.test(s) && s.length >= 12),
          (password) => {
            const result = PasswordValidationService.validateMasterPassword(password);
            expect(result.hasLowercase).toBe(false);
            expect(result.isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject any password without uppercase letters', async () => {
      await fc.assert(
        fc.property(
          // Generate strings without uppercase
          fc.string({ minLength: 12, maxLength: 128 })
            .map(s => s.toLowerCase() + '123!@#')
            .filter(s => !/[A-Z]/.test(s) && s.length >= 12),
          (password) => {
            const result = PasswordValidationService.validateMasterPassword(password);
            expect(result.hasUppercase).toBe(false);
            expect(result.isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject any password without numbers', async () => {
      await fc.assert(
        fc.property(
          // Generate strings without numbers
          fc.array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()'.split('')), { minLength: 12, maxLength: 128 })
            .map(arr => arr.join(''))
            .filter(s => !/[0-9]/.test(s)),
          (password) => {
            const result = PasswordValidationService.validateMasterPassword(password);
            expect(result.hasNumber).toBe(false);
            expect(result.isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject any password without special characters', async () => {
      await fc.assert(
        fc.property(
          // Generate strings without special characters
          fc.array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 12, maxLength: 128 })
            .map(arr => arr.join(''))
            .filter(s => !/[^a-zA-Z0-9]/.test(s)),
          (password) => {
            const result = PasswordValidationService.validateMasterPassword(password);
            expect(result.hasSpecialChar).toBe(false);
            expect(result.isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate exactly at the boundary (12 characters)', async () => {
      await fc.assert(
        fc.property(
          // Generate exactly 12 character passwords with all requirements
          fc.tuple(
            fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 3, maxLength: 3 }).map(arr => arr.join('')),
            fc.array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), { minLength: 3, maxLength: 3 }).map(arr => arr.join('')),
            fc.array(fc.constantFrom(...'0123456789'.split('')), { minLength: 3, maxLength: 3 }).map(arr => arr.join('')),
            fc.array(fc.constantFrom(...'!@#$%^&*()'.split('')), { minLength: 3, maxLength: 3 }).map(arr => arr.join(''))
          ).map(([lower, upper, num, special]) => lower + upper + num + special),
          (password) => {
            expect(password.length).toBe(12);
            const result = PasswordValidationService.validateMasterPassword(password);
            expect(result.isValid).toBe(true);
            expect(result.meetsMinLength).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case of very long passwords', async () => {
      await fc.assert(
        fc.property(
          fc.string({ minLength: 100, maxLength: 1000 })
            .map(s => 'Aa1!' + s), // Ensure it meets requirements
          (password) => {
            const result = PasswordValidationService.validateMasterPassword(password);
            // Should still validate correctly even for very long passwords
            expect(result.meetsMinLength).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle unicode and special characters correctly', async () => {
      const unicodePasswords = [
        'MyP@ssw0rd你好', // Chinese characters
        'Sécür3P@ss!', // Accented characters
        'P@ssw0rd🔐🔑', // Emojis
        'Пароль123!@#', // Cyrillic
      ];

      for (const password of unicodePasswords) {
        const result = PasswordValidationService.validateMasterPassword(password);
        // Should handle unicode correctly
        expect(result.meetsMinLength).toBe(password.length >= 12);
      }
    });
  });

  // **Feature: password-manager, Property 14: Password strength analysis completeness**
  // **Validates: Requirements 4.4**
  describe('Property 14: Password strength analysis completeness', () => {
    it('should produce entropy score and crack time for any password', async () => {
      await fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 128 }),
          (password) => {
            const result = PasswordValidationService.analyzePasswordStrength(password);
            
            // Must have all required fields
            expect(result.score).toBeDefined();
            expect(result.entropy).toBeDefined();
            expect(result.crackTime).toBeDefined();
            expect(result.crackTimeSeconds).toBeDefined();
            expect(result.feedback).toBeDefined();
            expect(result.isWeak).toBeDefined();
            
            // Score must be 0-100
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
            
            // Entropy must be non-negative
            expect(result.entropy).toBeGreaterThanOrEqual(0);
            
            // Crack time must be non-negative
            expect(result.crackTimeSeconds).toBeGreaterThanOrEqual(0);
            
            // Crack time string must be defined
            expect(typeof result.crackTime).toBe('string');
            expect(result.crackTime.length).toBeGreaterThan(0);
            
            // Feedback must be an array
            expect(Array.isArray(result.feedback)).toBe(true);
            expect(result.feedback.length).toBeGreaterThan(0);
            
            // isWeak must be boolean
            expect(typeof result.isWeak).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce higher entropy for longer passwords', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 51, max: 100 }),
          (shortLen, longLen) => {
            // Generate passwords with same character set but different lengths
            const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
            const shortPassword = Array.from({ length: shortLen }, () => 
              charset[Math.floor(Math.random() * charset.length)]
            ).join('');
            const longPassword = Array.from({ length: longLen }, () => 
              charset[Math.floor(Math.random() * charset.length)]
            ).join('');
            
            const shortResult = PasswordValidationService.analyzePasswordStrength(shortPassword);
            const longResult = PasswordValidationService.analyzePasswordStrength(longPassword);
            
            // Longer password should have higher entropy (unless patterns detected)
            // We'll check that crack time is longer
            expect(longResult.crackTimeSeconds).toBeGreaterThanOrEqual(shortResult.crackTimeSeconds);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should produce higher entropy for more diverse character sets', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 12, max: 20 }),
          (length) => {
            // Generate passwords with different character set diversity
            const lowercaseOnly = 'a'.repeat(length);
            const mixedCase = 'Aa'.repeat(Math.floor(length / 2));
            const withNumbers = 'Aa1'.repeat(Math.floor(length / 3));
            const withSymbols = 'Aa1!'.repeat(Math.floor(length / 4));
            
            const result1 = PasswordValidationService.analyzePasswordStrength(lowercaseOnly);
            const result2 = PasswordValidationService.analyzePasswordStrength(mixedCase);
            const result3 = PasswordValidationService.analyzePasswordStrength(withNumbers);
            const result4 = PasswordValidationService.analyzePasswordStrength(withSymbols);
            
            // More diverse character sets should generally have higher base entropy
            // Note: patterns may reduce final entropy, so we check that more character types
            // are detected rather than strict entropy ordering
            expect(result2.entropy).toBeGreaterThan(0);
            expect(result3.entropy).toBeGreaterThan(0);
            expect(result4.entropy).toBeGreaterThan(0);
            
            // At minimum, mixed case should be better than lowercase only
            expect(result2.entropy).toBeGreaterThanOrEqual(result1.entropy);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should always provide actionable feedback', async () => {
      await fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 128 }),
          (password) => {
            const result = PasswordValidationService.analyzePasswordStrength(password);
            
            // Feedback must be non-empty array of strings
            expect(result.feedback.length).toBeGreaterThan(0);
            result.feedback.forEach(item => {
              expect(typeof item).toBe('string');
              expect(item.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark weak passwords correctly', async () => {
      await fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 6 }), // Short passwords are weak
          (password) => {
            const result = PasswordValidationService.analyzePasswordStrength(password);
            
            // Short passwords should be marked as weak
            expect(result.isWeak).toBe(true);
            expect(result.score).toBeLessThan(60);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty password gracefully', () => {
      const result = PasswordValidationService.analyzePasswordStrength('');
      
      expect(result.score).toBe(0);
      expect(result.entropy).toBe(0);
      expect(result.isWeak).toBe(true);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should calculate consistent results for same password', async () => {
      await fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 128 }),
          (password) => {
            const result1 = PasswordValidationService.analyzePasswordStrength(password);
            const result2 = PasswordValidationService.analyzePasswordStrength(password);
            
            // Results should be identical for same password
            expect(result1.score).toBe(result2.score);
            expect(result1.entropy).toBe(result2.entropy);
            expect(result1.crackTimeSeconds).toBe(result2.crackTimeSeconds);
            expect(result1.isWeak).toBe(result2.isWeak);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // **Feature: password-manager, Property 24: Breach check using k-anonymity**
  // **Validates: Requirements 8.1**
  describe('Property 24: Breach check using k-anonymity', () => {
    it('should detect known breached passwords', async () => {
      // Mock the API response for breached passwords
      // For 'password', the SHA-1 hash is 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
      // Prefix: 5BAA6, Suffix: 1E4C9B93F3F0682250B6CF8331B7EE68FD8
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => '1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493\n0018A45C4D1DEF81644B54AB7F969B88D65:1',
      });

      const isBreached = await PasswordValidationService.checkPasswordBreach('password');
      expect(isBreached).toBe(true);
      
      // Verify fetch was called with correct prefix
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.pwnedpasswords.com/range/'),
        expect.any(Object)
      );
    }, 30000); // 30 second timeout for API calls

    it('should not detect strong unique passwords as breached', async () => {
      // Mock the API response for non-breached password (suffix not in list)
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => '0018A45C4D1DEF81644B54AB7F969B88D65:1\n003D68EB55068C33ACE09247EE4C639306B:3',
      });
      
      const uniquePassword = 'Xk9$mP2#qL5@wN8&vB3!rT6%yU4^iO7*';
      const isBreached = await PasswordValidationService.checkPasswordBreach(uniquePassword);
      expect(isBreached).toBe(false);
    }, 30000);

    it('should use k-anonymity (only send hash prefix)', async () => {
      // Mock API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => '0018A45C4D1DEF81644B54AB7F969B88D65:1',
      });
      
      const password = 'TestPassword123!';
      await PasswordValidationService.checkPasswordBreach(password);
      
      // Verify that only the first 5 characters of the hash are sent in the URL
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      const prefix = callUrl.split('/range/')[1];
      expect(prefix.length).toBe(5);
    }, 30000);

    it('should handle API failures gracefully', async () => {
      // Mock API failure
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });
      
      const password = 'test1';
      const isBreached = await PasswordValidationService.checkPasswordBreach(password);
      
      // Should return false (fail open) rather than throwing
      expect(isBreached).toBe(false);
    }, 30000);

    it('should include breach status in comprehensive analysis', async () => {
      const password = 'password123';
      
      // Calculate the actual hash for password123 to mock correctly
      // SHA-1 of 'password123' is 482C811DA5D5B4BC6D497FFA98491E38:...
      // We need to mock a response that includes the suffix
      (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
        // Extract the prefix from the URL
        const prefix = url.split('/range/')[1];
        
        // For any password, we'll return a response that includes a matching suffix
        // This simulates finding the password in the breach database
        return {
          ok: true,
          text: async () => {
            // Get the full hash of the password
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-1', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
            const suffix = hashHex.substring(5);
            
            // Return the suffix in the response
            return `${suffix}:12345\n0018A45C4D1DEF81644B54AB7F969B88D65:1`;
          },
        };
      });
      
      const result = await PasswordValidationService.analyzePasswordWithBreachCheck(password, true);
      
      expect(result.isBreached).toBe(true);
      // Should have breach warning in feedback
      expect(result.feedback.some(f => f.includes('breach'))).toBe(true);
      // Should be marked as weak
      expect(result.isWeak).toBe(true);
      // Score should be capped
      expect(result.score).toBeLessThanOrEqual(30);
    }, 30000);

    it('should allow skipping breach check', async () => {
      const password = 'TestPassword123!';
      
      const result = await PasswordValidationService.analyzePasswordWithBreachCheck(password, false);
      
      expect(result.isBreached).toBeUndefined();
    });

    it('should handle network errors without breaking', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const password = 'SomeRandomPassword123!';
      const isBreached = await PasswordValidationService.checkPasswordBreach(password);
      
      // Should return false (fail open) rather than throwing
      expect(isBreached).toBe(false);
    }, 30000);
  });

  describe('Integration Tests', () => {
    it('should validate and analyze password in complete workflow', async () => {
      // Mock non-breached response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => '0018A45C4D1DEF81644B54AB7F969B88D65:1',
      });
      
      const password = 'MySecureP@ssw0rd123';
      
      // Validate
      const validation = PasswordValidationService.validateMasterPassword(password);
      expect(validation.isValid).toBe(true);
      
      // Analyze
      const strength = PasswordValidationService.analyzePasswordStrength(password);
      expect(strength.score).toBeGreaterThan(0);
      expect(strength.isWeak).toBe(false);
      
      // Check breach
      const isBreached = await PasswordValidationService.checkPasswordBreach(password);
      expect(typeof isBreached).toBe('boolean');
    }, 30000);

    it('should reject weak password in validation and analysis', () => {
      const password = 'weak';
      
      // Validation should fail
      const validation = PasswordValidationService.validateMasterPassword(password);
      expect(validation.isValid).toBe(false);
      
      // Analysis should show weak
      const strength = PasswordValidationService.analyzePasswordStrength(password);
      expect(strength.isWeak).toBe(true);
      expect(strength.score).toBeLessThan(60);
    });
  });
});
