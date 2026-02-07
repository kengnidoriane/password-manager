/**
 * URL Detection Service
 * 
 * Detects the current browser tab URL and provides domain matching
 * functionality for highlighting matching credentials in PWA context.
 */

import { Credential } from '@/lib/db';

export interface URLMatchResult {
  credential: Credential;
  matchType: 'exact' | 'domain' | 'subdomain';
  matchScore: number; // 0-100, higher is better match
}

export interface CurrentURLInfo {
  url: string;
  domain: string;
  subdomain?: string;
  protocol: string;
  port?: string;
}

/**
 * URL Detection Service for PWA
 */
export class URLDetectionService {
  private static instance: URLDetectionService;
  private currentURL: CurrentURLInfo | null = null;
  private urlChangeListeners: Array<(url: CurrentURLInfo | null) => void> = [];

  private constructor() {
    this.initializeURLDetection();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): URLDetectionService {
    if (!URLDetectionService.instance) {
      URLDetectionService.instance = new URLDetectionService();
    }
    return URLDetectionService.instance;
  }

  /**
   * Initialize URL detection based on PWA capabilities
   */
  private initializeURLDetection(): void {
    if (typeof window === 'undefined') return;

    // Try to get current URL from various sources
    this.detectCurrentURL();

    // Listen for URL changes (limited in PWA context)
    this.setupURLChangeListeners();
  }

  /**
   * Detect current URL from available sources
   */
  private detectCurrentURL(): void {
    if (typeof window === 'undefined') return;

    try {
      // Primary method: window.location
      const currentLocation = window.location;
      if (currentLocation && currentLocation.href) {
        this.currentURL = this.parseURL(currentLocation.href);
        this.notifyURLChange();
        return;
      }

      // Fallback: document.referrer (limited usefulness)
      if (document.referrer) {
        this.currentURL = this.parseURL(document.referrer);
        this.notifyURLChange();
        return;
      }

      // If no URL detected, clear current URL
      this.currentURL = null;
      this.notifyURLChange();
    } catch (error) {
      console.warn('Failed to detect current URL:', error);
      this.currentURL = null;
      this.notifyURLChange();
    }
  }

  /**
   * Setup listeners for URL changes
   */
  private setupURLChangeListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      this.detectCurrentURL();
    });

    // Listen for pushstate/replacestate (SPA navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      setTimeout(() => this.detectCurrentURL(), 0);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      setTimeout(() => this.detectCurrentURL(), 0);
    };

    // Listen for focus events (when returning to PWA)
    window.addEventListener('focus', () => {
      this.detectCurrentURL();
    });

    // Periodic check for URL changes (fallback)
    setInterval(() => {
      this.detectCurrentURL();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Parse URL string into components
   */
  private parseURL(urlString: string): CurrentURLInfo {
    try {
      const url = new URL(urlString);
      const hostParts = url.hostname.split('.');
      
      let domain = url.hostname;
      let subdomain: string | undefined;

      // Extract main domain and subdomain
      if (hostParts.length > 2) {
        // For domains like "login.example.com", extract "example.com" as domain
        domain = hostParts.slice(-2).join('.');
        subdomain = hostParts.slice(0, -2).join('.');
      } else if (hostParts.length === 2) {
        // For domains like "example.com"
        domain = url.hostname;
      }

      return {
        url: urlString,
        domain,
        subdomain,
        protocol: url.protocol,
        port: url.port || undefined
      };
    } catch (error) {
      // Fallback for invalid URLs
      return {
        url: urlString,
        domain: urlString,
        protocol: 'unknown:'
      };
    }
  }

  /**
   * Notify listeners of URL changes
   */
  private notifyURLChange(): void {
    this.urlChangeListeners.forEach(listener => {
      try {
        listener(this.currentURL);
      } catch (error) {
        console.error('Error in URL change listener:', error);
      }
    });
  }

  /**
   * Get current URL information
   */
  getCurrentURL(): CurrentURLInfo | null {
    return this.currentURL;
  }

  /**
   * Add listener for URL changes
   */
  addURLChangeListener(listener: (url: CurrentURLInfo | null) => void): () => void {
    this.urlChangeListeners.push(listener);
    
    // Return cleanup function
    return () => {
      const index = this.urlChangeListeners.indexOf(listener);
      if (index > -1) {
        this.urlChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Find matching credentials for current URL
   */
  findMatchingCredentials(credentials: Credential[]): URLMatchResult[] {
    if (!this.currentURL) {
      return [];
    }

    const matches: URLMatchResult[] = [];
    const currentURL = this.currentURL;

    for (const credential of credentials) {
      if (!credential.url || credential.deletedAt) {
        continue;
      }

      const matchResult = this.calculateURLMatch(credential, currentURL);
      if (matchResult) {
        matches.push(matchResult);
      }
    }

    // Sort by match score (highest first)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate URL match between credential and current URL
   */
  private calculateURLMatch(credential: Credential, currentURL: CurrentURLInfo): URLMatchResult | null {
    try {
      const credentialURL = this.parseURL(credential.url);
      
      // Exact URL match (highest score)
      if (this.normalizeURL(credential.url) === this.normalizeURL(currentURL.url)) {
        return {
          credential,
          matchType: 'exact',
          matchScore: 100
        };
      }

      // Domain match
      if (credentialURL.domain === currentURL.domain) {
        // Same domain, different subdomain or path
        if (credentialURL.subdomain === currentURL.subdomain) {
          return {
            credential,
            matchType: 'domain',
            matchScore: 90
          };
        } else {
          return {
            credential,
            matchType: 'subdomain',
            matchScore: 75
          };
        }
      }

      // Check if one domain is a subdomain of the other
      if (this.isSubdomainMatch(credentialURL.domain, currentURL.domain)) {
        return {
          credential,
          matchType: 'subdomain',
          matchScore: 60
        };
      }

      return null;
    } catch (error) {
      console.warn(`Failed to match credential URL ${credential.url}:`, error);
      return null;
    }
  }

  /**
   * Normalize URL for comparison
   */
  private normalizeURL(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove trailing slash, convert to lowercase
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.toLowerCase().replace(/\/$/, '');
    } catch (error) {
      return url.toLowerCase();
    }
  }

  /**
   * Check if domains have subdomain relationship
   */
  private isSubdomainMatch(domain1: string, domain2: string): boolean {
    const d1 = domain1.toLowerCase();
    const d2 = domain2.toLowerCase();
    
    return d1.endsWith(`.${d2}`) || d2.endsWith(`.${d1}`);
  }

  /**
   * Get domain matching algorithm details for debugging
   */
  getDomainMatchingInfo(credentialURL: string): {
    credentialDomain: string;
    currentDomain: string | null;
    matchType: string | null;
    matchScore: number;
  } {
    if (!this.currentURL) {
      return {
        credentialDomain: '',
        currentDomain: null,
        matchType: null,
        matchScore: 0
      };
    }

    try {
      const credentialParsed = this.parseURL(credentialURL);
      const matchResult = this.calculateURLMatch(
        { url: credentialURL } as Credential,
        this.currentURL
      );

      return {
        credentialDomain: credentialParsed.domain,
        currentDomain: this.currentURL.domain,
        matchType: matchResult?.matchType || null,
        matchScore: matchResult?.matchScore || 0
      };
    } catch (error) {
      return {
        credentialDomain: credentialURL,
        currentDomain: this.currentURL.domain,
        matchType: null,
        matchScore: 0
      };
    }
  }

  /**
   * Manually set current URL (for testing or manual override)
   */
  setCurrentURL(url: string | null): void {
    if (url) {
      this.currentURL = this.parseURL(url);
    } else {
      this.currentURL = null;
    }
    this.notifyURLChange();
  }

  /**
   * Check if URL detection is supported in current environment
   */
  isURLDetectionSupported(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.location !== 'undefined';
  }

  /**
   * Get URL detection status
   */
  getDetectionStatus(): {
    supported: boolean;
    currentURL: string | null;
    domain: string | null;
    lastDetected: number | null;
  } {
    return {
      supported: this.isURLDetectionSupported(),
      currentURL: this.currentURL?.url || null,
      domain: this.currentURL?.domain || null,
      lastDetected: this.currentURL ? Date.now() : null
    };
  }
}

// Export singleton instance
export const urlDetectionService = URLDetectionService.getInstance();