/**
 * AuditService - Audit log API service
 * 
 * Handles all audit log-related API calls including retrieving logs,
 * filtering, and exporting to CSV.
 * 
 * Requirements: 18.2, 18.3, 18.4
 */

import { config } from '@/lib/config';

/**
 * Audit action types matching backend enum
 */
export enum AuditAction {
  // Authentication events
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  REGISTER = 'REGISTER',
  
  // Credential operations
  CREDENTIAL_CREATE = 'CREDENTIAL_CREATE',
  CREDENTIAL_READ = 'CREDENTIAL_READ',
  CREDENTIAL_UPDATE = 'CREDENTIAL_UPDATE',
  CREDENTIAL_DELETE = 'CREDENTIAL_DELETE',
  CREDENTIAL_COPY = 'CREDENTIAL_COPY',
  CREDENTIAL_EXPORT = 'CREDENTIAL_EXPORT',
  CREDENTIAL_IMPORT = 'CREDENTIAL_IMPORT',
  
  // Secure note operations
  NOTE_CREATE = 'NOTE_CREATE',
  NOTE_READ = 'NOTE_READ',
  NOTE_UPDATE = 'NOTE_UPDATE',
  NOTE_DELETE = 'NOTE_DELETE',
  
  // Folder operations
  FOLDER_CREATE = 'FOLDER_CREATE',
  FOLDER_UPDATE = 'FOLDER_UPDATE',
  FOLDER_DELETE = 'FOLDER_DELETE',
  
  // Tag operations
  TAG_CREATE = 'TAG_CREATE',
  TAG_UPDATE = 'TAG_UPDATE',
  TAG_DELETE = 'TAG_DELETE',
  
  // Sharing operations
  SHARE_CREATE = 'SHARE_CREATE',
  SHARE_REVOKE = 'SHARE_REVOKE',
  SHARE_ACCESS = 'SHARE_ACCESS',
  
  // Vault operations
  VAULT_SYNC = 'VAULT_SYNC',
  VAULT_EXPORT = 'VAULT_EXPORT',
  VAULT_IMPORT = 'VAULT_IMPORT',
  
  // 2FA operations
  TWO_FA_ENABLE = 'TWO_FA_ENABLE',
  TWO_FA_DISABLE = 'TWO_FA_DISABLE',
  TWO_FA_VERIFY = 'TWO_FA_VERIFY',
  
  // Account operations
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  ACCOUNT_RECOVERY = 'ACCOUNT_RECOVERY',
  ACCOUNT_DELETE = 'ACCOUNT_DELETE',
  
  // Settings operations
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string;
  deviceInfo: string;
  success: boolean;
  errorMessage: string | null;
  timestamp: string;
  suspicious: boolean;
}

/**
 * Paginated audit log response
 */
export interface AuditLogPageResponse {
  logs: AuditLogEntry[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

/**
 * Audit log filter parameters
 */
export interface AuditLogFilters {
  startDate?: string; // ISO format
  endDate?: string; // ISO format
  action?: AuditAction;
  device?: string;
  page?: number;
  size?: number;
}

/**
 * AuditService class for handling audit log operations
 */
export class AuditService {
  private static readonly API_BASE = config.api.baseUrl;
  private static readonly TIMEOUT = config.api.timeout;

  /**
   * Retrieve audit logs with optional filtering and pagination
   * @param token JWT authentication token
   * @param filters Optional filter parameters
   * @returns Promise<AuditLogPageResponse> Paginated audit logs
   */
  static async getAuditLogs(
    token: string,
    filters?: AuditLogFilters
  ): Promise<AuditLogPageResponse> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters?.action) {
        params.append('action', filters.action);
      }
      if (filters?.device) {
        params.append('device', filters.device);
      }
      if (filters?.page !== undefined) {
        params.append('page', filters.page.toString());
      }
      if (filters?.size !== undefined) {
        params.append('size', filters.size.toString());
      }

      const queryString = params.toString();
      const endpoint = `/audit/logs${queryString ? `?${queryString}` : ''}`;

      const response = await this.makeRequest<AuditLogPageResponse>(endpoint, {
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
   * Export audit logs to CSV
   * @param token JWT authentication token
   * @param filters Optional filter parameters (startDate, endDate)
   * @returns Promise<Blob> CSV file as blob
   */
  static async exportAuditLogs(
    token: string,
    filters?: Pick<AuditLogFilters, 'startDate' | 'endDate'>
  ): Promise<Blob> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }

      const queryString = params.toString();
      const endpoint = `/audit/logs/export${queryString ? `?${queryString}` : ''}`;
      const url = `${this.API_BASE}${endpoint}`;

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Return blob for CSV download
        const blob = await response.blob();
        return blob;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Download CSV blob as file
   * @param blob CSV blob
   * @param filename Filename for download
   */
  static downloadCsv(blob: Blob, filename: string = 'audit-logs.csv'): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Format action name for display
   * @param action Audit action enum value
   * @returns Formatted action name
   */
  static formatActionName(action: AuditAction): string {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Get action category for grouping/filtering
   * @param action Audit action enum value
   * @returns Action category
   */
  static getActionCategory(action: AuditAction): string {
    const actionStr = action.toString();
    
    if (actionStr.startsWith('LOGIN') || actionStr === 'LOGOUT' || actionStr === 'REGISTER') {
      return 'Authentication';
    }
    if (actionStr.startsWith('CREDENTIAL_')) {
      return 'Credentials';
    }
    if (actionStr.startsWith('NOTE_')) {
      return 'Secure Notes';
    }
    if (actionStr.startsWith('FOLDER_')) {
      return 'Folders';
    }
    if (actionStr.startsWith('TAG_')) {
      return 'Tags';
    }
    if (actionStr.startsWith('SHARE_')) {
      return 'Sharing';
    }
    if (actionStr.startsWith('VAULT_')) {
      return 'Vault';
    }
    if (actionStr.startsWith('TWO_FA_')) {
      return '2FA';
    }
    if (actionStr.includes('PASSWORD') || actionStr.includes('ACCOUNT') || actionStr.includes('SETTINGS')) {
      return 'Account';
    }
    
    return 'Other';
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
        return new Error('Unauthorized. Please log in again.');
      }
      
      if (error.message.includes('403')) {
        return new Error('Access denied.');
      }
      
      return error;
    }
    
    return new Error('An unexpected error occurred. Please try again.');
  }
}

// Export singleton instance for convenience
export const auditService = AuditService;
