/**
 * SharingService - Handles credential sharing operations
 * 
 * Provides functionality for sharing credentials with other users,
 * managing permissions, and handling shared credential access.
 */

import { config } from '@/lib/config';
import { useAuthStore } from '@/stores/authStore';

/**
 * Types for sharing operations
 */
export interface ShareCredentialRequest {
  credentialId: string;
  recipientEmail: string;
  permissions: string[];
  encryptedData: string;
  iv: string;
  authTag: string;
}

export interface ShareCredentialResponse {
  shareId: string;
  credentialId: string;
  credentialTitle: string;
  ownerEmail: string;
  recipientEmail: string;
  permissions: string[];
  sharedAt: string;
  lastAccessedAt?: string;
  isActive: boolean;
}

export interface SharedCredentialResponse {
  shareId: string;
  credentialId: string;
  credentialTitle: string;
  ownerEmail: string;
  permissions: string[];
  encryptedData: string;
  iv: string;
  authTag: string;
  sharedAt: string;
  lastAccessedAt?: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface ShareAuditEntry {
  id: string;
  shareId: string;
  action: 'access' | 'share' | 'revoke' | 'update';
  userEmail: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SharingError {
  message: string;
  code?: string;
  field?: string;
}

/**
 * SharingService class for credential sharing operations
 */
export class SharingService {
  private static instance: SharingService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SharingService {
    if (!SharingService.instance) {
      SharingService.instance = new SharingService();
    }
    return SharingService.instance;
  }

  /**
   * Make authenticated API request
   */
  private async makeApiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const authStore = useAuthStore.getState();
    const token = authStore.session?.token;
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${config.api.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.api.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: SharingError = {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          code: errorData.code,
          field: errorData.field
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          code: 'TIMEOUT'
        } as SharingError;
      }
      
      throw error;
    }
  }

  /**
   * Share a credential with another user
   */
  async shareCredential(request: ShareCredentialRequest): Promise<ShareCredentialResponse> {
    try {
      return await this.makeApiRequest<ShareCredentialResponse>('/api/v1/share/credential', {
        method: 'POST',
        body: JSON.stringify(request)
      });
    } catch (error) {
      console.error('Failed to share credential:', error);
      throw this.handleError(error, 'share credential');
    }
  }

  /**
   * Get credentials shared by the current user
   */
  async getSharedCredentials(): Promise<ShareCredentialResponse[]> {
    try {
      return await this.makeApiRequest<ShareCredentialResponse[]>('/api/v1/share/shared');
    } catch (error) {
      console.error('Failed to get shared credentials:', error);
      throw this.handleError(error, 'get shared credentials');
    }
  }

  /**
   * Get credentials shared with the current user
   */
  async getReceivedCredentials(): Promise<SharedCredentialResponse[]> {
    try {
      return await this.makeApiRequest<SharedCredentialResponse[]>('/api/v1/share/received');
    } catch (error) {
      console.error('Failed to get received credentials:', error);
      throw this.handleError(error, 'get received credentials');
    }
  }

  /**
   * Revoke access to a shared credential
   */
  async revokeShare(shareId: string): Promise<void> {
    try {
      await this.makeApiRequest(`/api/v1/share/${shareId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to revoke share:', error);
      throw this.handleError(error, 'revoke share');
    }
  }

  /**
   * Get audit log for a shared credential
   */
  async getShareAuditLog(shareId: string): Promise<ShareAuditEntry[]> {
    try {
      return await this.makeApiRequest<ShareAuditEntry[]>(`/api/v1/share/${shareId}/audit`);
    } catch (error) {
      console.error('Failed to get share audit log:', error);
      throw this.handleError(error, 'get share audit log');
    }
  }

  /**
   * Update permissions for a shared credential
   */
  async updateSharePermissions(shareId: string, permissions: string[]): Promise<ShareCredentialResponse> {
    try {
      return await this.makeApiRequest<ShareCredentialResponse>(`/api/v1/share/${shareId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions })
      });
    } catch (error) {
      console.error('Failed to update share permissions:', error);
      throw this.handleError(error, 'update share permissions');
    }
  }

  /**
   * Access a shared credential (updates last accessed timestamp)
   */
  async accessSharedCredential(shareId: string): Promise<SharedCredentialResponse> {
    try {
      return await this.makeApiRequest<SharedCredentialResponse>(`/api/v1/share/${shareId}/access`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to access shared credential:', error);
      throw this.handleError(error, 'access shared credential');
    }
  }

  /**
   * Get sync status for shared credentials
   */
  async getShareSyncStatus(): Promise<{
    lastSyncTime?: number;
    pendingShares: number;
    activeShares: number;
  }> {
    try {
      return await this.makeApiRequest<{
        lastSyncTime?: number;
        pendingShares: number;
        activeShares: number;
      }>('/api/v1/share/sync-status');
    } catch (error) {
      console.error('Failed to get share sync status:', error);
      return {
        pendingShares: 0,
        activeShares: 0
      };
    }
  }

  /**
   * Handle error and provide user-friendly message
   */
  private handleError(error: unknown, operation: string): Error {
    console.error(`${operation} failed:`, error);
    
    if (error && typeof error === 'object' && 'message' in error) {
      const sharingError = error as SharingError;
      
      // Preserve specific error messages
      if (
        sharingError.message.includes('not found') ||
        sharingError.message.includes('already shared') ||
        sharingError.message.includes('invalid email') ||
        sharingError.message.includes('permission denied')
      ) {
        return new Error(sharingError.message);
      }
      
      // Network errors
      if (sharingError.message.includes('timeout') || sharingError.message.includes('fetch')) {
        return new Error('Network error. Please check your connection and try again.');
      }
      
      // Authentication errors
      if (sharingError.message.includes('401') || sharingError.message.includes('unauthorized')) {
        return new Error('Session expired. Please log in again.');
      }
      
      // Server errors
      if (sharingError.message.includes('500') || sharingError.message.includes('502') || sharingError.message.includes('503')) {
        return new Error('Server error. Please try again later.');
      }
      
      // Rate limiting
      if (sharingError.message.includes('429')) {
        return new Error('Too many requests. Please wait before trying again.');
      }
    }
    
    // Generic error message
    return new Error(`Failed to ${operation}`);
  }
}

// Export singleton instance
export const sharingService = SharingService.getInstance();