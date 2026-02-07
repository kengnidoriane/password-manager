/**
 * URL Detection Service Tests
 * 
 * Tests for URL detection and credential matching functionality
 */

import { urlDetectionService, URLDetectionService } from '../urlDetectionService';
import { Credential } from '@/lib/db';

describe('URLDetectionService', () => {
  let service: URLDetectionService;
  
  beforeEach(() => {
    service = URLDetectionService.getInstance();
  });

  describe('URL Parsing', () => {
    it('should parse URL correctly', () => {
      service.setCurrentURL('https://login.example.com:8080/path');
      const currentURL = service.getCurrentURL();
      
      expect(currentURL).not.toBeNull();
      expect(currentURL?.domain).toBe('example.com');
      expect(currentURL?.subdomain).toBe('login');
      expect(currentURL?.protocol).toBe('https:');
      expect(currentURL?.port).toBe('8080');
    });

    it('should handle simple domain', () => {
      service.setCurrentURL('https://example.com');
      const currentURL = service.getCurrentURL();
      
      expect(currentURL?.domain).toBe('example.com');
      expect(currentURL?.subdomain).toBeUndefined();
    });

    it('should handle www subdomain', () => {
      service.setCurrentURL('https://www.example.com');
      const currentURL = service.getCurrentURL();
      
      expect(currentURL?.domain).toBe('example.com');
      expect(currentURL?.subdomain).toBe('www');
    });
  });

  describe('Domain Matching', () => {
    const mockCredentials: Credential[] = [
      {
        id: '1',
        title: 'Example Login',
        username: 'user1',
        password: 'pass1',
        url: 'https://example.com/login',
        notes: '',
        folderId: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        encryptedData: '',
        iv: '',
        authTag: ''
      },
      {
        id: '2',
        title: 'Example Subdomain',
        username: 'user2',
        password: 'pass2',
        url: 'https://app.example.com',
        notes: '',
        folderId: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        encryptedData: '',
        iv: '',
        authTag: ''
      },
      {
        id: '3',
        title: 'Different Site',
        username: 'user3',
        password: 'pass3',
        url: 'https://different.com',
        notes: '',
        folderId: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        encryptedData: '',
        iv: '',
        authTag: ''
      },
      {
        id: '4',
        title: 'Exact Match',
        username: 'user4',
        password: 'pass4',
        url: 'https://example.com/login',
        notes: '',
        folderId: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        encryptedData: '',
        iv: '',
        authTag: ''
      }
    ];

    it('should find exact URL matches', () => {
      service.setCurrentURL('https://example.com/login');
      const matches = service.findMatchingCredentials(mockCredentials);
      
      const exactMatches = matches.filter(m => m.matchType === 'exact');
      expect(exactMatches).toHaveLength(2);
      expect(exactMatches[0].matchScore).toBe(100);
    });

    it('should find domain matches', () => {
      service.setCurrentURL('https://example.com/different-path');
      const matches = service.findMatchingCredentials(mockCredentials);
      
      expect(matches.length).toBeGreaterThan(0);
      const domainMatches = matches.filter(m => m.matchType === 'domain');
      expect(domainMatches.length).toBeGreaterThan(0);
    });

    it('should find subdomain matches', () => {
      service.setCurrentURL('https://app.example.com');
      const matches = service.findMatchingCredentials(mockCredentials);
      
      expect(matches.length).toBeGreaterThan(0);
      const subdomainMatch = matches.find(m => m.credential.id === '2');
      expect(subdomainMatch).toBeDefined();
      expect(subdomainMatch?.matchType).toBe('domain');
    });

    it('should not match different domains', () => {
      service.setCurrentURL('https://example.com');
      const matches = service.findMatchingCredentials(mockCredentials);
      
      const differentSiteMatch = matches.find(m => m.credential.id === '3');
      expect(differentSiteMatch).toBeUndefined();
    });

    it('should sort matches by score', () => {
      service.setCurrentURL('https://example.com/login');
      const matches = service.findMatchingCredentials(mockCredentials);
      
      // Verify matches are sorted by score (highest first)
      for (let i = 0; i < matches.length - 1; i++) {
        expect(matches[i].matchScore).toBeGreaterThanOrEqual(matches[i + 1].matchScore);
      }
    });

    it('should skip deleted credentials', () => {
      const credentialsWithDeleted = [
        ...mockCredentials,
        {
          id: '5',
          title: 'Deleted',
          username: 'user5',
          password: 'pass5',
          url: 'https://example.com',
          notes: '',
          folderId: null,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deletedAt: Date.now(),
          version: 1,
          encryptedData: '',
          iv: '',
          authTag: ''
        }
      ];

      service.setCurrentURL('https://example.com');
      const matches = service.findMatchingCredentials(credentialsWithDeleted);
      
      const deletedMatch = matches.find(m => m.credential.id === '5');
      expect(deletedMatch).toBeUndefined();
    });

    it('should skip credentials without URL', () => {
      const credentialsWithoutURL = [
        ...mockCredentials,
        {
          id: '6',
          title: 'No URL',
          username: 'user6',
          password: 'pass6',
          url: '',
          notes: '',
          folderId: null,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
          encryptedData: '',
          iv: '',
          authTag: ''
        }
      ];

      service.setCurrentURL('https://example.com');
      const matches = service.findMatchingCredentials(credentialsWithoutURL);
      
      const noURLMatch = matches.find(m => m.credential.id === '6');
      expect(noURLMatch).toBeUndefined();
    });
  });

  describe('URL Detection Support', () => {
    it('should report URL detection as supported in browser environment', () => {
      expect(service.isURLDetectionSupported()).toBe(true);
    });

    it('should provide detection status', () => {
      service.setCurrentURL('https://example.com');
      const status = service.getDetectionStatus();
      
      expect(status.supported).toBe(true);
      expect(status.currentURL).toBe('https://example.com');
      expect(status.domain).toBe('example.com');
      expect(status.lastDetected).not.toBeNull();
    });
  });

  describe('URL Change Listeners', () => {
    it('should notify listeners on URL change', () => {
      const listener = jest.fn();
      const cleanup = service.addURLChangeListener(listener);
      
      service.setCurrentURL('https://example.com');
      
      expect(listener).toHaveBeenCalled();
      const callArg = listener.mock.calls[0][0];
      expect(callArg?.url).toBe('https://example.com');
      
      cleanup();
    });

    it('should remove listener on cleanup', () => {
      const listener = jest.fn();
      const cleanup = service.addURLChangeListener(listener);
      
      cleanup();
      listener.mockClear();
      
      service.setCurrentURL('https://example.com');
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Domain Matching Algorithm', () => {
    it('should provide matching info for debugging', () => {
      service.setCurrentURL('https://example.com');
      const info = service.getDomainMatchingInfo('https://app.example.com');
      
      expect(info.credentialDomain).toBe('example.com');
      expect(info.currentDomain).toBe('example.com');
      expect(info.matchType).toBe('subdomain');
      expect(info.matchScore).toBeGreaterThan(0);
    });

    it('should handle invalid URLs gracefully', () => {
      service.setCurrentURL('https://example.com');
      const info = service.getDomainMatchingInfo('not-a-valid-url');
      
      expect(info.matchScore).toBe(0);
    });
  });

  describe('Match Score Calculation', () => {
    it('should assign highest score to exact matches', () => {
      service.setCurrentURL('https://example.com/login');
      const credential: Credential = {
        id: '1',
        title: 'Test',
        username: 'user',
        password: 'pass',
        url: 'https://example.com/login',
        notes: '',
        folderId: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        encryptedData: '',
        iv: '',
        authTag: ''
      };
      
      const matches = service.findMatchingCredentials([credential]);
      expect(matches[0].matchScore).toBe(100);
      expect(matches[0].matchType).toBe('exact');
    });

    it('should assign medium score to domain matches', () => {
      service.setCurrentURL('https://example.com/different');
      const credential: Credential = {
        id: '1',
        title: 'Test',
        username: 'user',
        password: 'pass',
        url: 'https://example.com/login',
        notes: '',
        folderId: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        encryptedData: '',
        iv: '',
        authTag: ''
      };
      
      const matches = service.findMatchingCredentials([credential]);
      expect(matches[0].matchScore).toBe(90);
      expect(matches[0].matchType).toBe('domain');
    });

    it('should assign lower score to subdomain matches', () => {
      service.setCurrentURL('https://app.example.com');
      const credential: Credential = {
        id: '1',
        title: 'Test',
        username: 'user',
        password: 'pass',
        url: 'https://login.example.com',
        notes: '',
        folderId: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        encryptedData: '',
        iv: '',
        authTag: ''
      };
      
      const matches = service.findMatchingCredentials([credential]);
      expect(matches[0].matchScore).toBe(75);
      expect(matches[0].matchType).toBe('subdomain');
    });
  });
});
