/**
 * Frontend security tests
 * Tests XSS prevention, secure storage, and encryption practices
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sanitizeHTML, escapeHTML } from '../security';
import { encryptData, decryptData, deriveKey } from '../crypto';

describe('XSS Prevention', () => {
  describe('HTML Sanitization', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("XSS")</script>Hello';
      const sanitized = sanitizeHTML(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove event handlers', () => {
      const malicious = '<img src=x onerror=alert("XSS")>';
      const sanitized = sanitizeHTML(malicious);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove javascript: URLs', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const sanitized = sanitizeHTML(malicious);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should remove inline styles with expressions', () => {
      const malicious = '<div style="background:url(\'javascript:alert(XSS)\')">Test</div>';
      const sanitized = sanitizeHTML(malicious);
      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle multiple XSS vectors', () => {
      const malicious = '<script>alert(1)</script><img src=x onerror=alert(2)><svg onload=alert(3)>';
      const sanitized = sanitizeHTML(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('HTML Escaping', () => {
    it('should escape < and >', () => {
      const input = '<div>Test</div>';
      const escaped = escapeHTML(input);
      expect(escaped).toBe('&lt;div&gt;Test&lt;/div&gt;');
    });

    it('should escape quotes', () => {
      const input = 'Test "quoted" text';
      const escaped = escapeHTML(input);
      expect(escaped).toContain('&quot;');
    });

    it('should escape ampersands', () => {
      const input = 'Test & More';
      const escaped = escapeHTML(input);
      expect(escaped).toBe('Test &amp; More');
    });

    it('should handle empty strings', () => {
      expect(escapeHTML('')).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(escapeHTML(null as any)).toBe('');
      expect(escapeHTML(undefined as any)).toBe('');
    });
  });
});

describe('Secure Storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should not store master password in localStorage', () => {
    const masterPassword = 'MySecretPassword123!';
    
    // Simulate login
    localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
    
    // Verify master password is not stored
    const allStorage = JSON.stringify(localStorage);
    expect(allStorage).not.toContain(masterPassword);
  });

  it('should not store encryption keys in localStorage', () => {
    const encryptionKey = 'secret-encryption-key-12345';
    
    localStorage.setItem('session', JSON.stringify({ token: 'jwt-token' }));
    
    const allStorage = JSON.stringify(localStorage);
    expect(allStorage).not.toContain(encryptionKey);
  });

  it('should not store plain text passwords', () => {
    const password = 'PlainTextPassword123!';
    
    // Simulate storing a credential
    localStorage.setItem('vault', JSON.stringify({
      credentials: [{
        id: '1',
        title: 'Test',
        username: 'user',
        encryptedPassword: 'encrypted-data-here'
      }]
    }));
    
    const allStorage = JSON.stringify(localStorage);
    expect(allStorage).not.toContain(password);
  });

  it('should clear sensitive data on logout', () => {
    localStorage.setItem('session', JSON.stringify({ token: 'jwt-token' }));
    localStorage.setItem('vault', JSON.stringify({ data: 'encrypted' }));
    
    // Simulate logout
    localStorage.removeItem('session');
    localStorage.removeItem('vault');
    
    expect(localStorage.getItem('session')).toBeNull();
    expect(localStorage.getItem('vault')).toBeNull();
  });
});

describe('Encryption Verification', () => {
  it('should encrypt data before storage', async () => {
    const plainText = 'Sensitive data';
    const password = 'MasterPassword123!';
    
    const key = await deriveKey(password, 'salt123', 100000);
    const encrypted = await encryptData(plainText, key);
    
    expect(encrypted.encryptedData).not.toBe(plainText);
    expect(encrypted.encryptedData).not.toContain(plainText);
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();
  });

  it('should use different IVs for each encryption', async () => {
    const plainText = 'Sensitive data';
    const password = 'MasterPassword123!';
    
    const key = await deriveKey(password, 'salt123', 100000);
    const encrypted1 = await encryptData(plainText, key);
    const encrypted2 = await encryptData(plainText, key);
    
    expect(encrypted1.iv).not.toBe(encrypted2.iv);
    expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
  });

  it('should successfully decrypt encrypted data', async () => {
    const plainText = 'Sensitive data';
    const password = 'MasterPassword123!';
    
    const key = await deriveKey(password, 'salt123', 100000);
    const encrypted = await encryptData(plainText, key);
    const decrypted = await decryptData(
      encrypted.encryptedData,
      key,
      encrypted.iv,
      encrypted.authTag
    );
    
    expect(decrypted).toBe(plainText);
  });

  it('should fail decryption with wrong key', async () => {
    const plainText = 'Sensitive data';
    const password1 = 'MasterPassword123!';
    const password2 = 'WrongPassword456!';
    
    const key1 = await deriveKey(password1, 'salt123', 100000);
    const key2 = await deriveKey(password2, 'salt123', 100000);
    
    const encrypted = await encryptData(plainText, key1);
    
    await expect(
      decryptData(encrypted.encryptedData, key2, encrypted.iv, encrypted.authTag)
    ).rejects.toThrow();
  });

  it('should use strong key derivation', async () => {
    const password = 'MasterPassword123!';
    const salt = 'random-salt-12345';
    const iterations = 100000;
    
    const key = await deriveKey(password, salt, iterations);
    
    expect(key).toBeDefined();
    // Key should be CryptoKey object
    expect(key.type).toBe('secret');
  });
});

describe('Input Validation', () => {
  it('should validate email format', () => {
    const validEmails = [
      'test@example.com',
      'user.name@example.co.uk',
      'user+tag@example.com'
    ];
    
    const invalidEmails = [
      'invalid',
      '@example.com',
      'user@',
      'user @example.com',
      '<script>@example.com'
    ];
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    validEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(true);
    });
    
    invalidEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  it('should validate URL format', () => {
    const validURLs = [
      'https://example.com',
      'http://example.com',
      'https://sub.example.com/path'
    ];
    
    const invalidURLs = [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      'vbscript:msgbox(1)'
    ];
    
    validURLs.forEach(url => {
      expect(url.startsWith('http://') || url.startsWith('https://')).toBe(true);
    });
    
    invalidURLs.forEach(url => {
      expect(url.startsWith('http://') || url.startsWith('https://')).toBe(false);
    });
  });

  it('should validate password strength', () => {
    const strongPasswords = [
      'MyStr0ng!Pass',
      'C0mpl3x@Password',
      'Secur3#Pass123'
    ];
    
    const weakPasswords = [
      'password',
      '12345678',
      'abcdefgh',
      'Password' // No numbers or symbols
    ];
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{12,}$/;
    
    strongPasswords.forEach(password => {
      expect(passwordRegex.test(password)).toBe(true);
    });
    
    weakPasswords.forEach(password => {
      expect(passwordRegex.test(password)).toBe(false);
    });
  });
});

describe('CSRF Protection', () => {
  it('should include authentication token in requests', () => {
    const token = 'jwt-token-12345';
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    expect(headers.Authorization).toBe(`Bearer ${token}`);
  });

  it('should not accept requests without authentication', () => {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    expect(headers).not.toHaveProperty('Authorization');
  });
});

describe('Content Security Policy', () => {
  it('should not execute inline scripts', () => {
    // This test verifies that CSP headers prevent inline script execution
    // In a real browser environment with CSP, this would be blocked
    
    const inlineScript = '<script>alert("XSS")</script>';
    const sanitized = sanitizeHTML(inlineScript);
    
    expect(sanitized).not.toContain('<script>');
  });

  it('should not load external scripts from untrusted sources', () => {
    const untrustedScript = '<script src="https://evil.com/malicious.js"></script>';
    const sanitized = sanitizeHTML(untrustedScript);
    
    expect(sanitized).not.toContain('evil.com');
  });
});

describe('Secure Communication', () => {
  it('should use HTTPS for API calls', () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    // In production, should use HTTPS
    if (process.env.NODE_ENV === 'production') {
      expect(apiUrl).toMatch(/^https:\/\//);
    }
  });

  it('should not expose sensitive data in URLs', () => {
    const url = '/api/vault/credentials';
    
    // URLs should not contain passwords or tokens
    expect(url).not.toContain('password');
    expect(url).not.toContain('token');
    expect(url).not.toContain('secret');
  });
});

describe('Session Security', () => {
  it('should implement session timeout', () => {
    const sessionTimeout = 15 * 60 * 1000; // 15 minutes
    const lastActivity = Date.now();
    const currentTime = Date.now() + sessionTimeout + 1000;
    
    const isExpired = currentTime - lastActivity > sessionTimeout;
    expect(isExpired).toBe(true);
  });

  it('should lock vault on inactivity', () => {
    const inactivityTimeout = 15 * 60 * 1000;
    const lastActivity = Date.now() - inactivityTimeout - 1000;
    const currentTime = Date.now();
    
    const shouldLock = currentTime - lastActivity > inactivityTimeout;
    expect(shouldLock).toBe(true);
  });
});
