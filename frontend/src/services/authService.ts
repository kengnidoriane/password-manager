/**
 * AuthService - Authentication API service
 * 
 * Handles all authentication-related API calls including registration,
 * login, logout, and session management.
 */

import { config } from '@/lib/config';
import { CryptoService } from '@/lib/crypto';

/**
 * API request/response types
 */
export interface RegisterRequest {
  email: string;
  authKeyHash: string;
  salt: string;
  iterations: number;
}

export interface RegisterResponse {
  userId: string;
  recoveryKey: string;
}

export interface LoginRequest {
  email: string;
  authKeyHash: string;
  twoFactorCode?: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: number;
  userId: string;
}

export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}

/**
 * Authentication credentials for internal use
 */
export interface AuthCredentials {
  email: string;
  masterPassword: string;
  twoFactorCode?: string;
}

/**
 * Registration data for internal use
 */
export interface RegistrationData {
  email: string;
  masterPassword: string;
  confirmPassword: string;
}

/**
 * AuthService class for handling authentication operations
 */
export class AuthService {
  private static readonly API_BASE = config.api.baseUrl;
  private static readonly TIMEOUT = config.api.timeout;

  /**
   * Register a new user account
   * @param registrationData User registration data
   * @returns Promise<RegisterResponse> containing userId and recovery key
   */
  static async register(registrationData: RegistrationData): Promise<RegisterResponse> {
    try {
      // Derive keys from master password
      const derivedKeys = await CryptoService.deriveKeys(
        registrationData.masterPassword,
        undefined, // Generate new salt
        config.security.pbkdf2Iterations
      );

      // Hash the auth key for server storage
      const authKeyHash = await this.hashAuthKey(derivedKeys.authKey);

      // Prepare request payload
      const requestPayload: RegisterRequest = {
        email: registrationData.email,
        authKeyHash,
        salt: CryptoService.arrayBufferToBase64(derivedKeys.salt),
        iterations: config.security.pbkdf2Iterations,
      };

      // Make API request
      const response = await this.makeRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(requestPayload),
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Authenticate user login
   * @param credentials User login credentials
   * @returns Promise<LoginResponse> containing token and user info
   */
  static async login(credentials: AuthCredentials): Promise<LoginResponse> {
    try {
      // For login, we need to get the user's salt first
      // In a real implementation, this might be a separate endpoint
      // For now, we'll derive keys and let the server validate
      
      // Note: In production, you might want to fetch salt first to avoid
      // doing expensive key derivation with wrong parameters
      const derivedKeys = await CryptoService.deriveKeys(
        credentials.masterPassword,
        undefined, // Will need salt from server in real implementation
        config.security.pbkdf2Iterations
      );

      // Hash the auth key
      const authKeyHash = await this.hashAuthKey(derivedKeys.authKey);

      // Prepare request payload
      const requestPayload: LoginRequest = {
        email: credentials.email,
        authKeyHash,
        twoFactorCode: credentials.twoFactorCode,
      };

      // Make API request
      const response = await this.makeRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(requestPayload),
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Logout user and invalidate session
   * @param token JWT token to invalidate
   * @returns Promise<void>
   */
  static async logout(token: string): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      // Don't throw on logout errors - user should be logged out locally anyway
      console.warn('Logout API call failed:', error);
    }
  }

  /**
   * Refresh JWT token
   * @param token Current JWT token
   * @returns Promise<LoginResponse> with new token
   */
  static async refreshToken(token: string): Promise<LoginResponse> {
    try {
      const response = await this.makeRequest<LoginResponse>('/auth/refresh', {
        method: 'POST',
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
   * Hash auth key for server storage using SHA-256
   * @param authKey CryptoKey to hash
   * @returns Promise<string> Base64 encoded hash
   */
  private static async hashAuthKey(authKey: CryptoKey): Promise<string> {
    // Export the key to get raw bytes
    const keyData = await crypto.subtle.exportKey('raw', authKey);
    
    // Hash with SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    
    // Convert to base64
    return CryptoService.arrayBufferToBase64(hashBuffer);
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
   * @returns AuthError Normalized error object
   */
  private static handleError(error: unknown): AuthError {
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
          message: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS',
        };
      }
      
      if (error.message.includes('409')) {
        return {
          message: 'An account with this email already exists.',
          code: 'EMAIL_EXISTS',
          field: 'email',
        };
      }
      
      if (error.message.includes('429')) {
        return {
          message: 'Too many attempts. Please wait before trying again.',
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
   * Validate that required crypto APIs are available
   * @returns boolean True if crypto APIs are available
   */
  static validateCryptoSupport(): boolean {
    return CryptoService.isWebCryptoAvailable();
  }
}

// Export singleton instance for convenience
export const authService = AuthService;