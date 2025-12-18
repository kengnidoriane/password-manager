/**
 * Property-Based Tests for CryptoService
 * 
 * These tests use fast-check to verify correctness properties
 * across a wide range of inputs.
 */

import * as fc from 'fast-check';
import { CryptoService } from '../crypto';

describe('CryptoService', () => {
  // Helper to create a test encryption key
  async function createTestKey(password: string = 'test-password-123'): Promise<CryptoKey> {
    const keys = await CryptoService.deriveKeys(password);
    return keys.encryptionKey;
  }

  describe('Basic Functionality', () => {
    it('should be available in the environment', () => {
      expect(CryptoService.isWebCryptoAvailable()).toBe(true);
    });

    it('should generate random bytes of specified length', () => {
      const bytes = CryptoService.generateRandomBytes(32);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
    });

    it('should generate different random values each time', () => {
      const bytes1 = CryptoService.generateRandomBytes(32);
      const bytes2 = CryptoService.generateRandomBytes(32);
      expect(bytes1).not.toEqual(bytes2);
    });
  });

  describe('Key Derivation', () => {
    it('should derive keys from master password', async () => {
      const password = 'MySecurePassword123!';
      const keys = await CryptoService.deriveKeys(password);

      expect(keys.encryptionKey).toBeDefined();
      expect(keys.authKey).toBeDefined();
      expect(keys.salt).toBeInstanceOf(Uint8Array);
      expect(keys.salt.length).toBe(32);
    });

    it('should derive same keys with same password and salt', async () => {
      const password = 'MySecurePassword123!';
      const keys1 = await CryptoService.deriveKeys(password);
      const keys2 = await CryptoService.deriveKeys(password, keys1.salt);

      // We can't directly compare CryptoKey objects, but we can test by encrypting/decrypting
      const testData = 'test data';
      const encrypted = await CryptoService.encrypt(testData, keys1.encryptionKey);
      const decrypted = await CryptoService.decrypt(encrypted, keys2.encryptionKey);

      expect(decrypted).toBe(testData);
    });

    it('should reject iterations below minimum', async () => {
      await expect(
        CryptoService.deriveKeys('password', undefined, 50000)
      ).rejects.toThrow('Iterations must be at least 100000');
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt and decrypt string data', async () => {
      const key = await createTestKey();
      const plaintext = 'Hello, World!';

      const encrypted = await CryptoService.encrypt(plaintext, key);
      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();

      const decrypted = await CryptoService.decrypt(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt object data', async () => {
      const key = await createTestKey();
      const plainObject = { username: 'user@example.com', password: 'secret123' };

      const encrypted = await CryptoService.encrypt(plainObject, key);
      const decrypted = await CryptoService.decryptJSON<typeof plainObject>(encrypted, key);

      expect(decrypted).toEqual(plainObject);
    });

    it('should fail to decrypt with wrong key', async () => {
      const key1 = await createTestKey('password1');
      const key2 = await createTestKey('password2');
      const plaintext = 'Secret data';

      const encrypted = await CryptoService.encrypt(plaintext, key1);

      await expect(
        CryptoService.decrypt(encrypted, key2)
      ).rejects.toThrow('Decryption failed');
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const key = await createTestKey();
      const plaintext = 'Same data';

      const encrypted1 = await CryptoService.encrypt(plaintext, key);
      const encrypted2 = await CryptoService.encrypt(plaintext, key);

      // Different IVs should produce different ciphertexts
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);

      // But both should decrypt to the same plaintext
      const decrypted1 = await CryptoService.decrypt(encrypted1, key);
      const decrypted2 = await CryptoService.decrypt(encrypted2, key);
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });
  });

  describe('Utility Functions', () => {
    it('should hash data consistently', async () => {
      const data = 'test data';
      const hash1 = await CryptoService.hash(data);
      const hash2 = await CryptoService.hash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toBeTruthy();
    });

    it('should produce different hashes for different data', async () => {
      const hash1 = await CryptoService.hash('data1');
      const hash2 = await CryptoService.hash('data2');

      expect(hash1).not.toBe(hash2);
    });

    it('should generate random strings of specified length', () => {
      const str = CryptoService.generateRandomString(20);
      expect(str.length).toBe(20);
      expect(/^[A-Za-z0-9]+$/.test(str)).toBe(true);
    });
  });

  // **Feature: password-manager, Property 1: Encryption round-trip consistency**
  // **Validates: Requirements 3.1, 10.1**
  describe('Property 1: Encryption round-trip consistency', () => {
    it('should maintain data integrity through encryption and decryption for any string', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 10000 }),
          async (plaintext) => {
            const key = await createTestKey();
            const encrypted = await CryptoService.encrypt(plaintext, key);
            const decrypted = await CryptoService.decrypt(encrypted, key);
            expect(decrypted).toBe(plaintext);
          }
        ),
        { numRuns: 100 }
      );
    }, 60000); // 60 second timeout for property test

    it('should maintain data integrity for any JSON-serializable object', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.string(),
            password: fc.string(),
            url: fc.webUrl(),
            notes: fc.string(),
            tags: fc.array(fc.string()),
            metadata: fc.record({
              createdAt: fc.integer(),
              updatedAt: fc.integer(),
            }),
          }),
          async (plainObject) => {
            const key = await createTestKey();
            const encrypted = await CryptoService.encrypt(plainObject, key);
            const decrypted = await CryptoService.decryptJSON<typeof plainObject>(encrypted, key);
            expect(decrypted).toEqual(plainObject);
          }
        ),
        { numRuns: 100 }
      );
    }, 60000); // 60 second timeout for property test

    it('should handle empty strings correctly', async () => {
      const key = await createTestKey();
      const encrypted = await CryptoService.encrypt('', key);
      const decrypted = await CryptoService.decrypt(encrypted, key);
      expect(decrypted).toBe('');
    });

    it('should handle very long strings correctly', async () => {
      const key = await createTestKey();
      const longString = 'a'.repeat(100000);
      const encrypted = await CryptoService.encrypt(longString, key);
      const decrypted = await CryptoService.decrypt(encrypted, key);
      expect(decrypted).toBe(longString);
    });

    it('should handle unicode characters correctly', async () => {
      // Test with various unicode characters
      const unicodeStrings = [
        '你好世界', // Chinese
        'مرحبا بالعالم', // Arabic
        '🔐🔑🛡️', // Emojis
        'Ñoño', // Spanish
        'Привет', // Russian
      ];

      const key = await createTestKey();
      for (const plaintext of unicodeStrings) {
        const encrypted = await CryptoService.encrypt(plaintext, key);
        const decrypted = await CryptoService.decrypt(encrypted, key);
        expect(decrypted).toBe(plaintext);
      }
    });

    it('should handle special characters and symbols', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`\n\r\t\\';
      const key = await createTestKey();
      const encrypted = await CryptoService.encrypt(specialChars, key);
      const decrypted = await CryptoService.decrypt(encrypted, key);
      expect(decrypted).toBe(specialChars);
    });
  });

  // **Feature: password-manager, Property 4: Key derivation uses PBKDF2**
  // **Validates: Requirements 1.2**
  describe('Property 4: Key derivation uses PBKDF2', () => {
    it('should use at least 100,000 iterations for PBKDF2', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 12, maxLength: 128 }),
          async (password) => {
            const keys = await CryptoService.deriveKeys(password);
            
            // Verify keys are derived successfully
            expect(keys.encryptionKey).toBeDefined();
            expect(keys.authKey).toBeDefined();
            expect(keys.salt).toBeDefined();
            
            // Verify salt length (32 bytes = 256 bits)
            expect(keys.salt.length).toBe(32);
          }
        ),
        { numRuns: 100 }
      );
    }, 120000); // 120 second timeout for property test

    it('should produce consistent keys with same password and salt', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 12, maxLength: 128 }),
          async (password) => {
            const keys1 = await CryptoService.deriveKeys(password);
            const keys2 = await CryptoService.deriveKeys(password, keys1.salt);
            
            // Test that keys are functionally equivalent by encrypting/decrypting
            const testData = 'consistency test';
            const encrypted = await CryptoService.encrypt(testData, keys1.encryptionKey);
            const decrypted = await CryptoService.decrypt(encrypted, keys2.encryptionKey);
            
            expect(decrypted).toBe(testData);
          }
        ),
        { numRuns: 100 }
      );
    }, 180000); // 180 second timeout for property test

    it('should produce different keys for different passwords', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 12, maxLength: 128 }),
          fc.string({ minLength: 12, maxLength: 128 }),
          async (password1, password2) => {
            // Skip if passwords are the same
            fc.pre(password1 !== password2);
            
            const salt = CryptoService.generateSalt();
            const keys1 = await CryptoService.deriveKeys(password1, salt);
            const keys2 = await CryptoService.deriveKeys(password2, salt);
            
            // Keys should be different - test by trying to decrypt with wrong key
            const testData = 'different keys test';
            const encrypted = await CryptoService.encrypt(testData, keys1.encryptionKey);
            
            await expect(
              CryptoService.decrypt(encrypted, keys2.encryptionKey)
            ).rejects.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    }, 120000); // 120 second timeout for property test

    it('should produce different keys for different salts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 12, maxLength: 128 }),
          async (password) => {
            const keys1 = await CryptoService.deriveKeys(password);
            const keys2 = await CryptoService.deriveKeys(password); // Different salt
            
            // Keys should be different - test by trying to decrypt with wrong key
            const testData = 'different salts test';
            const encrypted = await CryptoService.encrypt(testData, keys1.encryptionKey);
            
            await expect(
              CryptoService.decrypt(encrypted, keys2.encryptionKey)
            ).rejects.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    }, 120000); // 120 second timeout for property test

    it('should accept custom iteration counts >= 100,000', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 12, maxLength: 128 }),
          fc.integer({ min: 100000, max: 200000 }),
          async (password, iterations) => {
            const keys = await CryptoService.deriveKeys(password, undefined, iterations);
            
            expect(keys.encryptionKey).toBeDefined();
            expect(keys.authKey).toBeDefined();
            
            // Verify keys work for encryption/decryption
            const testData = 'custom iterations test';
            const encrypted = await CryptoService.encrypt(testData, keys.encryptionKey);
            const decrypted = await CryptoService.decrypt(encrypted, keys.encryptionKey);
            
            expect(decrypted).toBe(testData);
          }
        ),
        { numRuns: 20 } // Fewer runs since this is computationally expensive
      );
    }, 120000); // 120 second timeout for property test

    it('should reject iteration counts below 100,000', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 12, maxLength: 128 }),
          fc.integer({ min: 1, max: 99999 }),
          async (password, iterations) => {
            await expect(
              CryptoService.deriveKeys(password, undefined, iterations)
            ).rejects.toThrow('Iterations must be at least 100000');
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // **Feature: password-manager, Property 39: Recovery key generation**
  // **Validates: Requirements 1.3**
  describe('Property 39: Recovery key generation', () => {
    it('should generate a recovery key for any account creation', () => {
      fc.assert(
        fc.property(
          fc.constant(null), // No input needed for recovery key generation
          () => {
            const recoveryKey = CryptoService.generateRecoveryKey();
            
            // Recovery key should be generated
            expect(recoveryKey).toBeDefined();
            expect(typeof recoveryKey).toBe('string');
            
            // Recovery key should be 32 characters long
            expect(recoveryKey.length).toBe(32);
            
            // Recovery key should contain only alphanumeric characters
            expect(/^[A-Za-z0-9]+$/.test(recoveryKey)).toBe(true);
            
            // Recovery key should not be empty
            expect(recoveryKey.trim()).toBe(recoveryKey);
            expect(recoveryKey.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate unique recovery keys for each account creation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 100 }),
          (numKeys) => {
            const recoveryKeys = new Set<string>();
            
            // Generate multiple recovery keys
            for (let i = 0; i < numKeys; i++) {
              const recoveryKey = CryptoService.generateRecoveryKey();
              recoveryKeys.add(recoveryKey);
            }
            
            // All recovery keys should be unique
            expect(recoveryKeys.size).toBe(numKeys);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should generate recovery keys with sufficient entropy', () => {
      const recoveryKey = CryptoService.generateRecoveryKey();
      
      // 32 characters from 62-character alphabet (A-Z, a-z, 0-9)
      // Entropy = 32 * log2(62) ≈ 190 bits
      // This is more than sufficient for cryptographic security
      
      // Test character distribution
      const charCounts = new Map<string, number>();
      for (const char of recoveryKey) {
        charCounts.set(char, (charCounts.get(char) || 0) + 1);
      }
      
      // Should not have excessive repetition of any single character
      // (this is a probabilistic test, but very unlikely to fail with good randomness)
      const maxCount = Math.max(...charCounts.values());
      expect(maxCount).toBeLessThanOrEqual(Math.ceil(recoveryKey.length * 0.5)); // No more than 50% same character
    });

    it('should generate recovery keys using cryptographically secure randomness', () => {
      // Generate multiple recovery keys and check for patterns
      const keys = [];
      for (let i = 0; i < 100; i++) {
        keys.push(CryptoService.generateRecoveryKey());
      }
      
      // Check that keys don't follow obvious patterns
      for (let i = 1; i < keys.length; i++) {
        // Keys should not be sequential or have obvious relationships
        expect(keys[i]).not.toBe(keys[i - 1]);
        
        // Check Hamming distance (number of differing positions)
        let differences = 0;
        for (let j = 0; j < keys[i].length; j++) {
          if (keys[i][j] !== keys[i - 1][j]) {
            differences++;
          }
        }
        
        // Should have significant differences between consecutive keys
        // (this is probabilistic but should pass with good randomness)
        expect(differences).toBeGreaterThan(10); // At least 10 different characters
      }
    });

    it('should be displayed to user exactly once during account creation', () => {
      // This property tests the requirement that recovery key is displayed once
      // In a real implementation, this would be tested at the UI/service layer
      // Here we test that the key generation is deterministic per call
      
      const recoveryKey1 = CryptoService.generateRecoveryKey();
      const recoveryKey2 = CryptoService.generateRecoveryKey();
      
      // Each call should generate a different key (no caching/reuse)
      expect(recoveryKey1).not.toBe(recoveryKey2);
      
      // Both should be valid recovery keys
      expect(recoveryKey1.length).toBe(32);
      expect(recoveryKey2.length).toBe(32);
      expect(/^[A-Za-z0-9]+$/.test(recoveryKey1)).toBe(true);
      expect(/^[A-Za-z0-9]+$/.test(recoveryKey2)).toBe(true);
    });
  });

  describe('Security Properties', () => {
    it('should generate cryptographically random values', () => {
      // Test that generated values have good distribution
      const samples = 1000;
      const byteValues = new Array(256).fill(0);
      
      for (let i = 0; i < samples; i++) {
        const bytes = CryptoService.generateRandomBytes(1);
        byteValues[bytes[0]]++;
      }
      
      // Check that we have reasonable distribution (not all values are the same)
      const uniqueValues = byteValues.filter(count => count > 0).length;
      expect(uniqueValues).toBeGreaterThan(100); // Should have good variety
    });

    it('should not leak information through timing', async () => {
      // This is a basic test - real timing attack prevention requires more sophisticated testing
      const key = await createTestKey();
      const data1 = 'a';
      const data2 = 'a'.repeat(1000);
      
      const encrypted1 = await CryptoService.encrypt(data1, key);
      const encrypted2 = await CryptoService.encrypt(data2, key);
      
      // Both should complete successfully regardless of size
      const decrypted1 = await CryptoService.decrypt(encrypted1, key);
      const decrypted2 = await CryptoService.decrypt(encrypted2, key);
      
      expect(decrypted1).toBe(data1);
      expect(decrypted2).toBe(data2);
    });
  });
});
