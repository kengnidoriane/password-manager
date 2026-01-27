/**
 * SettingsService - User settings API service
 * 
 * Handles all settings-related API calls including retrieving and updating
 * user preferences, security settings, and configuration options.
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */

import { config } from '@/lib/config';

/**
 * User settings data types
 */
export interface UserSettings {
  id: string;
  sessionTimeoutMinutes: number;
  clipboardTimeoutSeconds: number;
  biometricEnabled: boolean;
  strictSecurityMode: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettingsRequest {
  sessionTimeoutMinutes: number;
  clipboardTimeoutSeconds: number;
  biometricEnabled: boolean;
  strictSecurityMode: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface SettingsError {
  message: string;
  code?: string;
  field?: string;
}

/**
 * SettingsService class for handling user settings operations
 */
export class SettingsService {
  private static readonly API_BASE = config.api.baseUrl;
  private static readonly TIMEOUT = config.api.timeout;

  /**
   * Get current user settings
   * @param token JWT authentication token
   * @returns Promise<UserSettings> Current user settings
   */
  static async getUserSettings(token: string): Promise<UserSettings> {
    try {
      const response = await this.makeRequest<UserSettings>('/settings', {
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
   * Update user settings
   * @param token JWT authentication token
   * @param settings Settings to update
   * @returns Promise<UserSettings> Updated settings
   */
  static async updateUserSettings(
    token: string, 
    settings: UserSettingsRequest
  ): Promise<UserSettings> {
    try {
      // Validate settings before sending
      this.validateSettings(settings);

      const response = await this.makeRequest<UserSettings>('/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate settings values are within acceptable bounds
   * @param settings Settings to validate
   * @throws Error if any setting is invalid
   */
  private static validateSettings(settings: UserSettingsRequest): void {
    // Session timeout validation (1-60 minutes)
    if (settings.sessionTimeoutMinutes < 1 || settings.sessionTimeoutMinutes > 60) {
      throw new Error('Session timeout must be between 1 and 60 minutes');
    }

    // Clipboard timeout validation (30-300 seconds)
    if (settings.clipboardTimeoutSeconds < 30 || settings.clipboardTimeoutSeconds > 300) {
      throw new Error('Clipboard timeout must be between 30 and 300 seconds');
    }

    // Theme validation
    if (!['light', 'dark', 'auto'].includes(settings.theme)) {
      throw new Error('Theme must be light, dark, or auto');
    }

    // Language validation (basic ISO 639-1 format)
    if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(settings.language)) {
      throw new Error('Language must be a valid ISO 639-1 code');
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
   * @returns SettingsError Normalized error object
   */
  private static handleError(error: unknown): SettingsError {
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('timeout')) {
        return {
          message: 'Request timed out. Please check your connection and try again.',
          code: 'TIMEOUT',
        };
      }
      
      if (error.message.includes('401')) {
        return {
          message: 'Authentication required. Please log in again.',
          code: 'UNAUTHORIZED',
        };
      }
      
      if (error.message.includes('400') || error.message.includes('422')) {
        return {
          message: error.message,
          code: 'VALIDATION_ERROR',
        };
      }
      
      if (error.message.includes('429')) {
        return {
          message: 'Too many requests. Please wait before trying again.',
          code: 'RATE_LIMITED',
        };
      }
      
      return {
        message: error.message,
        code: 'UNKNOWN',
      };
    }
    
    return {
      message: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN',
    };
  }

  /**
   * Get default settings values
   * @returns UserSettingsRequest Default settings
   */
  static getDefaultSettings(): UserSettingsRequest {
    return {
      sessionTimeoutMinutes: 15,
      clipboardTimeoutSeconds: 60,
      biometricEnabled: false,
      strictSecurityMode: false,
      theme: 'light',
      language: 'en',
    };
  }

  /**
   * Get available theme options
   * @returns Array of theme options
   */
  static getThemeOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'auto', label: 'Auto (System)' },
    ];
  }

  /**
   * Get available language options
   * @returns Array of language options
   */
  static getLanguageOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'en', label: 'English' },
      { value: 'en-US', label: 'English (US)' },
      { value: 'en-GB', label: 'English (UK)' },
      { value: 'fr', label: 'Français' },
      { value: 'fr-CA', label: 'Français (Canada)' },
      { value: 'es', label: 'Español' },
      { value: 'de', label: 'Deutsch' },
      { value: 'it', label: 'Italiano' },
      { value: 'pt', label: 'Português' },
      { value: 'ja', label: '日本語' },
      { value: 'ko', label: '한국어' },
      { value: 'zh', label: '中文' },
    ];
  }
}

// Export singleton instance for convenience
export const settingsService = SettingsService;