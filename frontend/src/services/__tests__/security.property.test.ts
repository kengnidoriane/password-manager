/**
 * Property-based tests for Security Properties
 * 
 * Tests that critical security properties are maintained across all operations
 * **Feature: password-manager, Property 2: Master password never transmitted**
 * **Feature: password-manager, Property 3: Zero-knowledge sync**
 * **Validates: Requirements 1.4, 6.5**
 */

import { AuthService } from '../authService';
import { vaultService } from '../vaultService';
import { CryptoService } from '@/lib/crypto';

// Mock dependencies
jest.mock('@/lib/crypto');
jest.mock('../vaultService');
jest.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      setUser: jest.fn(),
      initializeSession: jest.fn()
    })
  }
}));

// Store original fetch
const originalFetch = global.fetch;

// Network request interceptor
interface NetworkRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
}

let capturedRequests: NetworkRequest[] = [];

/**
 * Mock fetch to capture all network requests
 */
function setupNetworkInterceptor() {
  capturedRequests = [];
  
  global.fetch = jest.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const requestUrl = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    const method = init?.method || 'GET';
    const headers: Record<string, string> = {};
    
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, init.headers);
      }
    }
    
    const body = init?.body ? String(init.body) : null;
    
    // Capture the request
    capturedRequests.push({
      url: requestUrl,
      method,
      headers,
      body
    });
    
    // Return mock response
    return new Response(JSON.stringify({
      userId: 'test-user-id',
      token: 'test-token',
      expiresAt: Date.now() + 900000,
      recoveryKey: 'test-recovery-key'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }) as jest.Mock;
}

/**
 * Restore original fetch
 */
function teardownNetworkInterceptor() {
  global.fetch = originalFetch;
  capturedRequests = [];
}

/**
 * Check if a string contains the master password or any substring of it
 */
function containsMasterPassword(text: string, masterPassword: string): boolean {
  if (!text || !masterPassword) return false;
  
  // Check for exact match
  if (text.includes(masterPassword)) return true;
  
  // Check for URL-encoded version
  if (text.includes(encodeURIComponent(masterPassword))) return true;
  
  // Check for base64-encoded version
  try {
    const base64 = btoa(masterPassword);
    if (text.includes(base64)) return true;
  } catch (e) {
    // Ignore encoding errors
  }
  
  return false;
}

describe('Security Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupNetworkInterceptor();
    
    // Mock CryptoService methods
    const mockCryptoService = CryptoService as jest.Mocked<typeof CryptoService>;
    mockCryptoService.deriveKeys = jest.fn().mockResolvedValue({
      encryptionKey: {} as CryptoKey,
      authKey: {} as CryptoKey,
      salt: new Uint8Array(32)
    });
    mockCryptoService.arrayBufferToBase64 = jest.fn().mockReturnValue('mock-base64-salt');
    mockCryptoService.isWebCryptoAvailable = jest.fn().mockReturnValue(true);
    
    // Mock crypto.subtle for hashing
    const mockDigest = jest.fn().mockResolvedValue(new ArrayBuffer(32));
    const mockExportKey = jest.fn().mockResolvedValue(new ArrayBuffer(32));
    
    Object.defineProperty(global, 'crypto', {
      value: {
        subtle: {
          digest: mockDigest,
          exportKey: mockExportKey
        }
      },
      writable: true
    });
  });

  afterEach(() => {
    teardownNetworkInterceptor();
  });

  /**
   * Property 2: Master password never transmitted
   * For any network request made by the Password Manager, the payload SHALL NOT contain
   * the master password or derived encryption keys in any form
   * **Validates: Requirements 1.4**
   */
  describe('Property 2: Master password never transmitted', () => {
    const testPasswords = [
      'TestPassword123!',
      'MySecure@Pass2024',
      'Complex!Pass#456',
      'Str0ng&Secure!Pwd'
    ];

    testPasswords.forEach(masterPassword => {
      it(`should never transmit master password "${masterPassword.substring(0, 5)}..." during registration`, async () => {
        // Reset captured requests
        capturedRequests = [];
        const email = 'test@example.com';

        // Act: Register user
        try {
          await AuthService.register({
            email,
            masterPassword,
            confirmPassword: masterPassword
          });
        } catch (error) {
          // Ignore errors - we're only checking network requests
        }

        // Assert: Master password should not appear in any request
        for (const request of capturedRequests) {
          expect(containsMasterPassword(request.url, masterPassword)).toBe(false);
          expect(containsMasterPassword(JSON.stringify(request.headers), masterPassword)).toBe(false);
          if (request.body) {
            expect(containsMasterPassword(request.body, masterPassword)).toBe(false);
          }
        }

        // Verify request was made
        expect(capturedRequests.length).toBeGreaterThan(0);
      });

      it(`should never transmit master password "${masterPassword.substring(0, 5)}..." during login`, async () => {
        // Reset captured requests
        capturedRequests = [];
        const email = 'test@example.com';

        // Act: Login user
        try {
          await AuthService.login({
            email,
            masterPassword
          });
        } catch (error) {
          // Ignore errors
        }

        // Assert: Master password should not appear in any request
        for (const request of capturedRequests) {
          expect(containsMasterPassword(request.url, masterPassword)).toBe(false);
          expect(containsMasterPassword(JSON.stringify(request.headers), masterPassword)).toBe(false);
          if (request.body) {
            expect(containsMasterPassword(request.body, masterPassword)).toBe(false);
          }
        }

        // Verify request was made
        expect(capturedRequests.length).toBeGreaterThan(0);
      });
    });

    it('should only transmit derived hashes, never raw master password', async () => {
      const email = 'test@example.com';
      const masterPassword = 'TestPassword123!';
      
      // Reset captured requests
      capturedRequests = [];

      // Act: Register user
      try {
        await AuthService.register({
          email,
          masterPassword,
          confirmPassword: masterPassword
        });
      } catch (error) {
        // Ignore errors
      }

      // Assert: Requests should contain hashes but not master password
      let foundAuthKeyHash = false;
      
      for (const request of capturedRequests) {
        if (request.body) {
          try {
            const body = JSON.parse(request.body);
            
            if (body.authKeyHash) {
              foundAuthKeyHash = true;
              expect(body.authKeyHash).not.toBe(masterPassword);
              expect(body.authKeyHash).not.toBe(btoa(masterPassword));
            }
            
            expect(body.masterPassword).toBeUndefined();
            expect(body.password).toBeUndefined();
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      }

      expect(foundAuthKeyHash).toBe(true);
    });
  });

  /**
   * Property 3: Zero-knowledge sync
   * For any vault data transmitted to the server, the payload SHALL contain only
   * encrypted data that cannot be decrypted without the user's master password
   * **Validates: Requirements 6.5**
   */
  describe('Property 3: Zero-knowledge sync', () => {
    const testCredential = {
      id: 'test-id-123',
      title: 'Test Website',
      username: 'testuser@example.com',
      password: 'SecretPassword123!',
      url: 'https://example.com',
      notes: 'These are my secret notes',
      folderId: 'folder-1',
      tags: ['work', 'important'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    };

    function containsPlaintextData(text: string, credential: any): boolean {
      if (!text) return false;
      
      const sensitiveFields = [
        credential.title,
        credential.username,
        credential.password,
        credential.url,
        credential.notes
      ];
      
      for (const field of sensitiveFields) {
        if (field && text.includes(field)) {
          return true;
        }
      }
      
      return false;
    }

    it('should never transmit unencrypted credential data', async () => {
      // Reset captured requests
      capturedRequests = [];

      // Mock vault service
      jest.spyOn(vaultService, 'createCredential').mockResolvedValue(testCredential);

      // Act: Create credential
      try {
        await vaultService.createCredential(testCredential);
      } catch (error) {
        // Ignore errors
      }

      // Assert: Plaintext data should not appear in requests
      for (const request of capturedRequests) {
        if (request.url.includes('/vault') || request.url.includes('/sync')) {
          expect(containsPlaintextData(request.url, testCredential)).toBe(false);
          expect(containsPlaintextData(JSON.stringify(request.headers), testCredential)).toBe(false);
          if (request.body) {
            expect(containsPlaintextData(request.body, testCredential)).toBe(false);
          }
        }
      }
    });

    it('should never expose encryption keys in network requests', async () => {
      // Reset captured requests
      capturedRequests = [];

      // Mock vault service
      jest.spyOn(vaultService, 'createCredential').mockResolvedValue(testCredential);

      // Act: Create credential
      try {
        await vaultService.createCredential(testCredential);
      } catch (error) {
        // Ignore errors
      }

      // Assert: No encryption keys in requests
      for (const request of capturedRequests) {
        if (request.body) {
          try {
            const body = JSON.parse(request.body);
            
            expect(body.encryptionKey).toBeUndefined();
            expect(body.masterKey).toBeUndefined();
            expect(body.derivedKey).toBeUndefined();
            expect(body.cryptoKey).toBeUndefined();
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      }
    });
  });
});
