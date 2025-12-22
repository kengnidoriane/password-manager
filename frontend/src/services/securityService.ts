/**
 * SecurityService - Security analysis API service
 * 
 * Handles security analysis API calls including security reports,
 * password strength analysis, and breach checking.
 */

import { config } from '@/lib/config';

/**
 * Security report response types matching backend DTOs
 */
export interface WeakPasswordInfo {
  credential_id: string;
  title: string;
  url: string;
  entropy: number;
}

export interface OldPasswordInfo {
  credential_id: string;
  title: string;
  url: string;
  days_since_created: number;
  created_at: string;
}

export interface BreachedPasswordInfo {
  credential_id: string;
  title: string;
  url: string;
  breach_count: number;
  breach_sources: string[];
  last_breach_date?: string;
}

export interface SecurityReportResponse {
  user_id: string;
  overall_score: number;
  total_credentials: number;
  weak_passwords: WeakPasswordInfo[];
  reused_passwords: Record<string, string[]>;
  old_passwords: OldPasswordInfo[];
  very_old_passwords: OldPasswordInfo[];
  breached_passwords?: BreachedPasswordInfo[]; // Optional until backend implements breach checking
  recommendations: string[];
  generated_at: string;
}

/**
 * SecurityService class for handling security analysis operations
 */
export class SecurityService {
  private static readonly API_BASE = config.api.baseUrl;
  private static readonly TIMEOUT = config.api.timeout;

  /**
   * Get security analysis report for the current user
   * @param token JWT authentication token
   * @returns Promise<SecurityReportResponse> Security analysis report
   */
  static async getSecurityReport(token: string): Promise<SecurityReportResponse> {
    try {
      const response = await this.makeRequest<SecurityReportResponse>('/audit/security-report', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make HTTP request with common configuration
   * @param endpoint API endpoint (relative to base URL)
   * @param options Fetch options
   * @returns Promise<T> Response data
   */
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.API_BASE}${endpoint}`;
    
    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse JSON response
      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Handle and normalize API errors
   * @param error Raw error from API call
   * @returns Error Normalized error object
   */
  private static handleError(error: unknown): Error {
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('timeout')) {
        return new Error('Request timed out. Please check your connection and try again.');
      }
      
      if (error.message.includes('401')) {
        return new Error('Authentication failed. Please log in again.');
      }
      
      if (error.message.includes('403')) {
        return new Error('Access denied. You do not have permission to view security reports.');
      }
      
      if (error.message.includes('429')) {
        return new Error('Too many requests. Please wait before trying again.');
      }
      
      return error;
    }
    
    return new Error('An unexpected error occurred. Please try again.');
  }
}

// Export singleton instance for convenience
export const securityService = SecurityService;