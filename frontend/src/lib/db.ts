import Dexie, { Table } from 'dexie';

/**
 * IndexedDB Database for local encrypted storage
 * All sensitive data stored here is encrypted client-side before storage
 */

export interface Credential {
  id: string;
  title: string;
  username: string;
  password: string; // Encrypted
  url: string;
  notes: string; // Encrypted
  folderId?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  lastUsed?: number;
  version: number;
  deletedAt?: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface SecureNote {
  id: string;
  title: string;
  content: string; // Encrypted
  folderId?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SyncQueue {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  resourceType: 'credential' | 'folder' | 'tag' | 'note';
  resourceId: string;
  data?: any;
  timestamp: number;
  synced: boolean;
}

export interface AppSettings {
  id: string; // Always 'settings'
  sessionTimeout: number;
  clipboardTimeout: number;
  biometricEnabled: boolean;
  strictSecurityMode: boolean;
  theme: 'light' | 'dark' | 'system';
  lastSyncTime?: number;
}

/**
 * Password Manager Database
 * Uses Dexie.js for IndexedDB access with TypeScript support
 */
class PasswordManagerDB extends Dexie {
  credentials!: Table<Credential, string>;
  folders!: Table<Folder, string>;
  tags!: Table<Tag, string>;
  secureNotes!: Table<SecureNote, string>;
  syncQueue!: Table<SyncQueue, number>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('PasswordManagerDB');
    
    // Define database schema
    this.version(1).stores({
      credentials: 'id, title, username, url, folderId, *tags, createdAt, updatedAt, lastUsed, deletedAt',
      folders: 'id, name, parentId, createdAt',
      tags: 'id, name, createdAt',
      secureNotes: 'id, title, folderId, *tags, createdAt, updatedAt',
      syncQueue: '++id, resourceType, resourceId, timestamp, synced',
      settings: 'id'
    });
  }

  /**
   * Clear all data from the database
   * Used during logout or account deletion
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.credentials.clear(),
      this.folders.clear(),
      this.tags.clear(),
      this.secureNotes.clear(),
      this.syncQueue.clear(),
      this.settings.clear()
    ]);
  }

  /**
   * Get default settings
   */
  async getSettings(): Promise<AppSettings> {
    const settings = await this.settings.get('settings');
    if (settings) {
      return settings;
    }

    // Return default settings
    const defaultSettings: AppSettings = {
      id: 'settings',
      sessionTimeout: 900000, // 15 minutes
      clipboardTimeout: 60000, // 60 seconds
      biometricEnabled: false,
      strictSecurityMode: false,
      theme: 'system'
    };

    await this.settings.put(defaultSettings);
    return defaultSettings;
  }

  /**
   * Update settings
   */
  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings();
    await this.settings.put({ ...current, ...updates });
  }
}

// Export singleton instance
export const db = new PasswordManagerDB();
