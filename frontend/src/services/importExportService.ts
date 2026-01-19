/**
 * ImportExportService - Handles vault import and export operations
 * 
 * Provides functionality for exporting vault data to CSV/JSON formats
 * and importing data from external password managers and browsers.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { config } from '@/lib/config';
import { CryptoService } from '@/lib/crypto';
import { useAuthStore } from '@/stores/authStore';
import { Credential, Folder, Tag, SecureNote } from '@/lib/db';
import { vaultService } from './vaultService';

/**
 * Export request data
 */
export interface ExportRequest {
  format: 'CSV' | 'JSON';
  masterPassword: string;
  encrypted: boolean;
  exportPassword?: string;
  includeDeleted: boolean;
}

/**
 * Export response data
 */
export interface ExportResponse {
  data: string;
  format: string;
  encrypted: boolean;
  credentialCount: number;
  secureNoteCount: number;
  folderCount: number;
  tagCount: number;
  includeDeleted: boolean;
  exportedAt: string;
  dataSize: number;
}

/**
 * Import request data
 */
export interface ImportRequest {
  format: 'CSV' | 'JSON';
  source?: string;
  skipDuplicates: boolean;
  mergeDuplicates: boolean;
  entries: Array<Record<string, string>>;
}

/**
 * Import response data
 */
export interface ImportResponse {
  imported: number;
  duplicates: number;
  errors: number;
  total: number;
  errorMessages: string[];
  duplicateEntries: Array<{
    title: string;
    username: string;
    url: string;
    existingEntryId: string;
    action: 'SKIPPED' | 'MERGED' | 'REPLACED';
  }>;
  importedAt: string;
  format: string;
  source?: string;
}

/**
 * CSV field mapping for different sources
 */
const CSV_FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  Chrome: {
    name: 'title',
    url: 'url',
    username: 'username',
    password: 'password'
  },
  Firefox: {
    hostname: 'url',
    username: 'username',
    password: 'password',
    httpRealm: 'title'
  },
  Safari: {
    Title: 'title',
    Url: 'url',
    Username: 'username',
    Password: 'password',
    Notes: 'notes'
  },
  '1Password': {
    Title: 'title',
    Website: 'url',
    Username: 'username',
    Password: 'password',
    Notes: 'notes'
  },
  LastPass: {
    name: 'title',
    url: 'url',
    username: 'username',
    password: 'password',
    extra: 'notes',
    grouping: 'folder'
  },
  Bitwarden: {
    name: 'title',
    login_uri: 'url',
    login_username: 'username',
    login_password: 'password',
    notes: 'notes',
    folder: 'folder'
  }
};

/**
 * ImportExportService class
 */
export class ImportExportService {
  private static readonly API_BASE = config.api.baseUrl;

  /**
   * Export vault data
   */
  static async exportVault(request: ExportRequest): Promise<ExportResponse> {
    try {
      // Verify master password by deriving keys
      const authStore = useAuthStore.getState();
      const user = authStore.user;
      
      if (!user?.salt || !user?.iterations) {
        throw new Error('User authentication data not available');
      }

      const salt = CryptoService.base64ToArrayBuffer(user.salt);
      const derivedKeys = await CryptoService.deriveKeys(request.masterPassword, salt, user.iterations);
      
      // Hash auth key for server verification
      const authKeyHash = await this.hashAuthKey(derivedKeys.authKey);

      // Prepare export request
      const exportRequest = {
        format: request.format,
        masterPasswordHash: authKeyHash,
        encrypted: request.encrypted,
        exportPassword: request.exportPassword,
        includeDeleted: request.includeDeleted
      };

      // Make API request
      const response = await this.makeApiRequest<ExportResponse>('/vault/export', {
        method: 'POST',
        body: JSON.stringify(exportRequest)
      });

      return response;
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Export failed');
    }
  }

  /**
   * Import vault data from file
   */
  static async importVault(file: File, options: { format: 'CSV' | 'JSON'; source?: string; skipDuplicates: boolean; mergeDuplicates: boolean }): Promise<ImportResponse> {
    try {
      // Parse file content
      const fileContent = await this.readFileContent(file);
      let entries: Array<Record<string, string>>;

      if (options.format === 'CSV') {
        entries = this.parseCSV(fileContent, options.source);
      } else {
        entries = this.parseJSON(fileContent);
      }

      // Validate and normalize entries
      const normalizedEntries = this.normalizeEntries(entries, options.source);

      // Prepare import request
      const importRequest: ImportRequest = {
        format: options.format,
        source: options.source,
        skipDuplicates: options.skipDuplicates,
        mergeDuplicates: options.mergeDuplicates,
        entries: normalizedEntries
      };

      // Make API request
      const response = await this.makeApiRequest<ImportResponse>('/vault/import', {
        method: 'POST',
        body: JSON.stringify(importRequest)
      });

      return response;
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Import failed');
    }
  }

  /**
   * Download export data as file
   */
  static downloadExportData(data: string, filename: string, format: 'CSV' | 'JSON'): void {
    const mimeType = format === 'CSV' ? 'text/csv' : 'application/json';
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Generate export filename
   */
  static generateExportFilename(format: 'CSV' | 'JSON', encrypted: boolean): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format.toLowerCase();
    const suffix = encrypted ? '_encrypted' : '';
    return `password_manager_export_${timestamp}${suffix}.${extension}`;
  }

  /**
   * Read file content as text
   */
  private static readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }

  /**
   * Parse CSV content
   */
  private static parseCSV(content: string, source?: string): Array<Record<string, string>> {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }

    const headers = this.parseCSVLine(lines[0]);
    const entries: Array<Record<string, string>> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const entry: Record<string, string> = {};
        headers.forEach((header, index) => {
          entry[header] = values[index] || '';
        });
        entries.push(entry);
      }
    }

    return entries;
  }

  /**
   * Parse CSV line handling quoted values
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Parse JSON content
   */
  private static parseJSON(content: string): Array<Record<string, string>> {
    try {
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON file must contain an array of entries');
      }

      return data.map(entry => {
        if (typeof entry !== 'object' || entry === null) {
          throw new Error('Each entry must be an object');
        }
        
        // Convert all values to strings
        const stringEntry: Record<string, string> = {};
        Object.entries(entry).forEach(([key, value]) => {
          stringEntry[key] = String(value || '');
        });
        
        return stringEntry;
      });
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * Normalize entries based on source field mappings
   */
  private static normalizeEntries(entries: Array<Record<string, string>>, source?: string): Array<Record<string, string>> {
    if (!source || !CSV_FIELD_MAPPINGS[source]) {
      return entries;
    }

    const mapping = CSV_FIELD_MAPPINGS[source];
    
    return entries.map(entry => {
      const normalized: Record<string, string> = {};
      
      // Apply field mappings
      Object.entries(mapping).forEach(([sourceField, targetField]) => {
        if (entry[sourceField]) {
          normalized[targetField] = entry[sourceField];
        }
      });
      
      // Copy unmapped fields
      Object.entries(entry).forEach(([key, value]) => {
        if (!Object.keys(mapping).includes(key) && !Object.values(mapping).includes(key)) {
          normalized[key] = value;
        }
      });
      
      return normalized;
    });
  }

  /**
   * Validate import entry
   */
  private static validateEntry(entry: Record<string, string>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!entry.title?.trim()) {
      errors.push('Title is required');
    }
    
    if (!entry.username?.trim()) {
      errors.push('Username is required');
    }
    
    if (!entry.password?.trim()) {
      errors.push('Password is required');
    }
    
    if (entry.url && entry.url.trim() && !this.isValidUrl(entry.url)) {
      errors.push('Invalid URL format');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if URL is valid
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Hash auth key for server verification
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
   * Make authenticated API request
   */
  private static async makeApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const authStore = useAuthStore.getState();
    const token = authStore.session?.token;
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${this.API_BASE}${endpoint}`;
    
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
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }
}

// Export singleton-like static methods
export const importExportService = ImportExportService;