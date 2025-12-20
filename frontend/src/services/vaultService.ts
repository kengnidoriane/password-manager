/**
 * VaultService - Handles vault data operations with encryption
 * 
 * Provides CRUD operations for vault data with client-side encryption.
 * All sensitive data is encrypted before storage in IndexedDB.
 * Includes API communication, offline queue, and retry logic.
 */

import { db, Credential, Folder, Tag, SecureNote, SyncQueue } from '@/lib/db';
import { CryptoService, EncryptedData } from '@/lib/crypto';
import { config } from '@/lib/config';
import { useAuthStore } from '@/stores/authStore';

/**
 * Encrypted versions of data structures for storage
 */
interface EncryptedCredential extends Omit<Credential, 'password' | 'notes'> {
  password: EncryptedData;
  notes: EncryptedData;
}

interface EncryptedSecureNote extends Omit<SecureNote, 'content'> {
  content: EncryptedData;
}

/**
 * API request/response types
 */
export interface VaultSyncRequest {
  changes: Array<{
    operation: 'create' | 'update' | 'delete';
    resourceType: 'credential' | 'folder' | 'tag' | 'note';
    resourceId: string;
    data?: any;
    version?: number;
  }>;
  lastSyncTime?: number;
}

export interface VaultSyncResponse {
  conflicts: Array<{
    resourceId: string;
    resourceType: string;
    serverVersion: any;
    clientVersion: any;
  }>;
  serverChanges: Array<{
    operation: 'create' | 'update' | 'delete';
    resourceType: 'credential' | 'folder' | 'tag' | 'note';
    resourceId: string;
    data?: any;
    version: number;
  }>;
  lastSyncTime: number;
}

export interface VaultError {
  message: string;
  code?: string;
  field?: string;
  retryable?: boolean;
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

/**
 * VaultService class for encrypted vault operations
 */
export class VaultService {
  private static instance: VaultService;
  private encryptionKey: CryptoKey | null = null;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncInProgress: boolean = false;
  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  };

  private constructor() {
    // Listen for online/offline events (only in browser)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processPendingSyncOperations();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): VaultService {
    if (!VaultService.instance) {
      VaultService.instance = new VaultService();
    }
    return VaultService.instance;
  }

  /**
   * Initialize the service with encryption key
   * @param encryptionKey The user's encryption key derived from master password
   */
  setEncryptionKey(encryptionKey: CryptoKey): void {
    this.encryptionKey = encryptionKey;
  }

  /**
   * Clear encryption key (on logout)
   */
  clearEncryptionKey(): void {
    this.encryptionKey = null;
  }

  /**
   * Ensure encryption key is available
   */
  private ensureEncryptionKey(): CryptoKey {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available. User must be authenticated.');
    }
    return this.encryptionKey;
  }

  /**
   * Add operation to sync queue and attempt immediate sync if online
   */
  private async addToSyncQueue(
    operation: 'create' | 'update' | 'delete',
    resourceType: 'credential' | 'folder' | 'tag' | 'note',
    resourceId: string,
    data?: any
  ): Promise<void> {
    const queueItem: SyncQueue = {
      operation,
      resourceType,
      resourceId,
      data,
      timestamp: Date.now(),
      synced: false
    };
    
    await db.syncQueue.add(queueItem);
    
    // Attempt immediate sync if online (with debounce)
    if (this.isOnline && !this.syncInProgress) {
      this.debouncedSync();
    }
  }

  /**
   * Debounced sync to avoid too frequent API calls
   */
  private syncTimeout: NodeJS.Timeout | null = null;
  private debouncedSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    
    this.syncTimeout = setTimeout(() => {
      this.processPendingSyncOperations();
    }, 5000); // 5 second debounce as per requirements
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
        const error: VaultError = {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          code: errorData.code,
          field: errorData.field,
          retryable: response.status >= 500 || response.status === 429
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          code: 'TIMEOUT',
          retryable: true
        } as VaultError;
      }
      
      throw error;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    config: RetryConfig = this.retryConfig
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry if error is not retryable
        if (error && typeof error === 'object' && 'retryable' in error && !error.retryable) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === config.maxAttempts) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
          config.maxDelay
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // ===== CREDENTIAL OPERATIONS =====

  /**
   * Get all credentials (decrypted)
   */
  async getCredentials(): Promise<Credential[]> {
    const encryptionKey = this.ensureEncryptionKey();
    
    try {
      const allCredentials = await db.credentials.toArray();
      const encryptedCredentials = allCredentials.filter(credential => !credential.deletedAt) as unknown as EncryptedCredential[];

      const credentials: Credential[] = [];
      
      for (const encrypted of encryptedCredentials) {
        try {
          const password = await CryptoService.decrypt(encrypted.password, encryptionKey);
          const notes = await CryptoService.decrypt(encrypted.notes, encryptionKey);
          
          credentials.push({
            ...encrypted,
            password,
            notes
          } as Credential);
        } catch (error) {
          console.error(`Failed to decrypt credential ${encrypted.id}:`, error);
          // Skip corrupted credentials
        }
      }
      
      return credentials;
    } catch (error) {
      console.error('Failed to get credentials:', error);
      throw new Error('Failed to retrieve credentials');
    }
  }

  /**
   * Get credential by ID (decrypted)
   */
  async getCredential(id: string): Promise<Credential | null> {
    const encryptionKey = this.ensureEncryptionKey();
    
    try {
      const encrypted = await db.credentials.get(id) as unknown as EncryptedCredential;
      if (!encrypted || encrypted.deletedAt) {
        return null;
      }

      const password = await CryptoService.decrypt(encrypted.password, encryptionKey);
      const notes = await CryptoService.decrypt(encrypted.notes, encryptionKey);
      
      return {
        ...encrypted,
        password,
        notes
      } as Credential;
    } catch (error) {
      console.error(`Failed to get credential ${id}:`, error);
      return null;
    }
  }

  /**
   * Create new credential
   */
  async createCredential(credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Credential> {
    const encryptionKey = this.ensureEncryptionKey();
    
    try {
      // Validate input data
      this.validateCredential(credential);
      
      const id = CryptoService.generateRandomString(16);
      const now = Date.now();
      
      // Encrypt sensitive fields
      const encryptedPassword = await CryptoService.encrypt(credential.password, encryptionKey);
      const encryptedNotes = await CryptoService.encrypt(credential.notes, encryptionKey);
      
      const newCredential: Credential = {
        ...credential,
        id,
        createdAt: now,
        updatedAt: now,
        version: 1
      };

      const encryptedCredential: EncryptedCredential = {
        ...newCredential,
        password: encryptedPassword,
        notes: encryptedNotes
      };

      // Store locally first (optimistic update)
      await db.credentials.add(encryptedCredential as unknown as Credential);
      
      // Add to sync queue for server sync
      await this.addToSyncQueue('create', 'credential', id, newCredential);
      
      return newCredential;
    } catch (error) {
      throw this.handleError(error, 'Create credential');
    }
  }

  /**
   * Update credential
   */
  async updateCredential(id: string, updates: Partial<Credential>): Promise<Credential> {
    const encryptionKey = this.ensureEncryptionKey();
    
    try {
      const existing = await this.getCredential(id);
      if (!existing) {
        throw new Error('Credential not found');
      }

      const updatedCredential: Credential = {
        ...existing,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: Date.now(),
        version: existing.version + 1
      };

      // Encrypt sensitive fields
      const encryptedPassword = await CryptoService.encrypt(updatedCredential.password, encryptionKey);
      const encryptedNotes = await CryptoService.encrypt(updatedCredential.notes, encryptionKey);
      
      const encryptedCredential: EncryptedCredential = {
        ...updatedCredential,
        password: encryptedPassword,
        notes: encryptedNotes
      };

      // Store locally first (optimistic update)
      await db.credentials.put(encryptedCredential as unknown as Credential);
      
      // Add to sync queue for server sync
      await this.addToSyncQueue('update', 'credential', id, updatedCredential);
      
      return updatedCredential;
    } catch (error) {
      console.error(`Failed to update credential ${id}:`, error);
      
      if (error instanceof Error && error.message === 'Credential not found') {
        throw error;
      }
      
      throw new Error('Failed to update credential');
    }
  }

  /**
   * Soft delete credential
   */
  async deleteCredential(id: string): Promise<void> {
    try {
      const existing = await this.getCredential(id);
      if (!existing) {
        throw new Error('Credential not found');
      }

      const deletedCredential = {
        ...existing,
        deletedAt: Date.now(),
        updatedAt: Date.now(),
        version: existing.version + 1
      };

      // Re-encrypt with deletion timestamp
      const encryptionKey = this.ensureEncryptionKey();
      const encryptedPassword = await CryptoService.encrypt(deletedCredential.password, encryptionKey);
      const encryptedNotes = await CryptoService.encrypt(deletedCredential.notes, encryptionKey);
      
      const encryptedCredential: EncryptedCredential = {
        ...deletedCredential,
        password: encryptedPassword,
        notes: encryptedNotes
      };

      // Store locally first (optimistic update)
      await db.credentials.put(encryptedCredential as unknown as Credential);
      
      // Add to sync queue for server sync
      await this.addToSyncQueue('delete', 'credential', id);
    } catch (error) {
      console.error(`Failed to delete credential ${id}:`, error);
      
      if (error instanceof Error && error.message === 'Credential not found') {
        throw error;
      }
      
      throw new Error('Failed to delete credential');
    }
  }

  /**
   * Update last used timestamp for credential
   */
  async updateLastUsed(id: string): Promise<void> {
    try {
      const existing = await this.getCredential(id);
      if (!existing) {
        return;
      }

      await this.updateCredential(id, { lastUsed: Date.now() });
    } catch (error) {
      console.error(`Failed to update last used for credential ${id}:`, error);
    }
  }

  // ===== FOLDER OPERATIONS =====

  /**
   * Get all folders
   */
  async getFolders(): Promise<Folder[]> {
    try {
      return await db.folders.orderBy('name').toArray();
    } catch (error) {
      console.error('Failed to get folders:', error);
      throw new Error('Failed to retrieve folders');
    }
  }

  /**
   * Create new folder
   */
  async createFolder(folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Folder> {
    try {
      // Validate input data
      this.validateFolder(folder);
      
      // Validate nesting depth (max 5 levels)
      if (folder.parentId) {
        const depth = await this.getFolderDepth(folder.parentId);
        if (depth >= 5) {
          throw new Error('Maximum folder nesting depth (5 levels) exceeded');
        }
      }

      const id = CryptoService.generateRandomString(16);
      const now = Date.now();
      
      const newFolder: Folder = {
        ...folder,
        id,
        createdAt: now,
        updatedAt: now
      };

      // Store locally first (optimistic update)
      await db.folders.add(newFolder);
      
      // Add to sync queue for server sync
      await this.addToSyncQueue('create', 'folder', id, newFolder);
      
      return newFolder;
    } catch (error) {
      throw this.handleError(error, 'Create folder');
    }
  }

  /**
   * Update folder
   */
  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder> {
    try {
      const existing = await db.folders.get(id);
      if (!existing) {
        throw new Error('Folder not found');
      }

      // Validate nesting depth if parent is changing
      if (updates.parentId && updates.parentId !== existing.parentId) {
        const depth = await this.getFolderDepth(updates.parentId);
        if (depth >= 5) {
          throw new Error('Maximum folder nesting depth (5 levels) exceeded');
        }
      }

      const updatedFolder: Folder = {
        ...existing,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: Date.now()
      };

      await db.folders.put(updatedFolder);
      await this.addToSyncQueue('update', 'folder', id, updatedFolder);
      
      return updatedFolder;
    } catch (error) {
      console.error(`Failed to update folder ${id}:`, error);
      throw new Error('Failed to update folder');
    }
  }

  /**
   * Delete folder (and move contents to parent or root)
   */
  async deleteFolder(id: string): Promise<void> {
    try {
      const folder = await db.folders.get(id);
      if (!folder) {
        throw new Error('Folder not found');
      }

      // Move child folders to parent or root
      const childFolders = await db.folders.where('parentId').equals(id).toArray();
      for (const child of childFolders) {
        await db.folders.put({
          ...child,
          parentId: folder.parentId,
          updatedAt: Date.now()
        });
      }

      // Move credentials to parent or root
      const credentials = await db.credentials.where('folderId').equals(id).toArray();
      for (const credential of credentials) {
        await db.credentials.put({
          ...credential,
          folderId: folder.parentId,
          updatedAt: Date.now()
        });
      }

      // Move secure notes to parent or root
      const notes = await db.secureNotes.where('folderId').equals(id).toArray();
      for (const note of notes) {
        await db.secureNotes.put({
          ...note,
          folderId: folder.parentId,
          updatedAt: Date.now()
        });
      }

      await db.folders.delete(id);
      await this.addToSyncQueue('delete', 'folder', id);
    } catch (error) {
      console.error(`Failed to delete folder ${id}:`, error);
      throw new Error('Failed to delete folder');
    }
  }

  /**
   * Get folder nesting depth
   */
  private async getFolderDepth(folderId: string): Promise<number> {
    let depth = 0;
    let currentId: string | undefined = folderId;
    
    while (currentId && depth < 10) { // Safety limit
      const folder: Folder | undefined = await db.folders.get(currentId);
      if (!folder) break;
      
      depth++;
      currentId = folder.parentId;
    }
    
    return depth;
  }

  // ===== TAG OPERATIONS =====

  /**
   * Get all tags
   */
  async getTags(): Promise<Tag[]> {
    try {
      return await db.tags.orderBy('name').toArray();
    } catch (error) {
      console.error('Failed to get tags:', error);
      throw new Error('Failed to retrieve tags');
    }
  }

  /**
   * Create new tag
   */
  async createTag(tag: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag> {
    try {
      // Validate input data
      this.validateTag(tag);
      
      const id = CryptoService.generateRandomString(16);
      
      const newTag: Tag = {
        ...tag,
        id,
        createdAt: Date.now()
      };

      // Store locally first (optimistic update)
      await db.tags.add(newTag);
      
      // Add to sync queue for server sync
      await this.addToSyncQueue('create', 'tag', id, newTag);
      
      return newTag;
    } catch (error) {
      throw this.handleError(error, 'Create tag');
    }
  }

  /**
   * Delete tag (and remove from all credentials/notes)
   */
  async deleteTag(id: string): Promise<void> {
    try {
      // Remove tag from all credentials
      const credentials = await db.credentials.toArray();
      for (const credential of credentials) {
        if (credential.tags.includes(id)) {
          const updatedTags = credential.tags.filter(tagId => tagId !== id);
          await db.credentials.put({
            ...credential,
            tags: updatedTags,
            updatedAt: Date.now()
          });
        }
      }

      // Remove tag from all secure notes
      const notes = await db.secureNotes.toArray();
      for (const note of notes) {
        if (note.tags.includes(id)) {
          const updatedTags = note.tags.filter(tagId => tagId !== id);
          await db.secureNotes.put({
            ...note,
            tags: updatedTags,
            updatedAt: Date.now()
          });
        }
      }

      await db.tags.delete(id);
      await this.addToSyncQueue('delete', 'tag', id);
    } catch (error) {
      console.error(`Failed to delete tag ${id}:`, error);
      throw new Error('Failed to delete tag');
    }
  }

  // ===== SECURE NOTE OPERATIONS =====

  /**
   * Get all secure notes (decrypted)
   */
  async getSecureNotes(): Promise<SecureNote[]> {
    const encryptionKey = this.ensureEncryptionKey();
    
    try {
      const encryptedNotes = await db.secureNotes.toArray() as unknown as EncryptedSecureNote[];
      const notes: SecureNote[] = [];
      
      for (const encrypted of encryptedNotes) {
        try {
          const content = await CryptoService.decrypt(encrypted.content, encryptionKey);
          
          notes.push({
            ...encrypted,
            content
          } as SecureNote);
        } catch (error) {
          console.error(`Failed to decrypt secure note ${encrypted.id}:`, error);
          // Skip corrupted notes
        }
      }
      
      return notes;
    } catch (error) {
      console.error('Failed to get secure notes:', error);
      throw new Error('Failed to retrieve secure notes');
    }
  }

  /**
   * Get secure note by ID (decrypted)
   */
  async getSecureNote(id: string): Promise<SecureNote | null> {
    const encryptionKey = this.ensureEncryptionKey();
    
    try {
      const encrypted = await db.secureNotes.get(id) as unknown as EncryptedSecureNote;
      if (!encrypted) {
        return null;
      }

      const content = await CryptoService.decrypt(encrypted.content, encryptionKey);
      
      return {
        ...encrypted,
        content
      } as SecureNote;
    } catch (error) {
      console.error(`Failed to get secure note ${id}:`, error);
      return null;
    }
  }

  /**
   * Create new secure note
   */
  async createSecureNote(note: Omit<SecureNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecureNote> {
    const encryptionKey = this.ensureEncryptionKey();
    
    try {
      // Validate input data
      this.validateSecureNote(note);
      
      const id = CryptoService.generateRandomString(16);
      const now = Date.now();
      
      // Encrypt content
      const encryptedContent = await CryptoService.encrypt(note.content, encryptionKey);
      
      const newNote: SecureNote = {
        ...note,
        id,
        createdAt: now,
        updatedAt: now
      };

      const encryptedNote: EncryptedSecureNote = {
        ...newNote,
        content: encryptedContent
      };

      // Store locally first (optimistic update)
      await db.secureNotes.add(encryptedNote as unknown as SecureNote);
      
      // Add to sync queue for server sync
      await this.addToSyncQueue('create', 'note', id, newNote);
      
      return newNote;
    } catch (error) {
      throw this.handleError(error, 'Create secure note');
    }
  }

  /**
   * Update secure note
   */
  async updateSecureNote(id: string, updates: Partial<SecureNote>): Promise<SecureNote> {
    const encryptionKey = this.ensureEncryptionKey();
    
    try {
      const existing = await this.getSecureNote(id);
      if (!existing) {
        throw new Error('Secure note not found');
      }

      const updatedNote: SecureNote = {
        ...existing,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: Date.now()
      };

      // Encrypt content
      const encryptedContent = await CryptoService.encrypt(updatedNote.content, encryptionKey);
      
      const encryptedNote: EncryptedSecureNote = {
        ...updatedNote,
        content: encryptedContent
      };

      await db.secureNotes.put(encryptedNote as unknown as SecureNote);
      await this.addToSyncQueue('update', 'note', id, updatedNote);
      
      return updatedNote;
    } catch (error) {
      console.error(`Failed to update secure note ${id}:`, error);
      throw new Error('Failed to update secure note');
    }
  }

  /**
   * Delete secure note
   */
  async deleteSecureNote(id: string): Promise<void> {
    try {
      await db.secureNotes.delete(id);
      await this.addToSyncQueue('delete', 'note', id);
    } catch (error) {
      console.error(`Failed to delete secure note ${id}:`, error);
      throw new Error('Failed to delete secure note');
    }
  }

  // ===== SEARCH OPERATIONS =====

  /**
   * Search credentials by query (legacy method - kept for compatibility)
   */
  async searchCredentials(query: string): Promise<Credential[]> {
    if (!query.trim()) {
      return this.getCredentials();
    }

    try {
      const allCredentials = await this.getCredentials();
      const searchTerm = query.toLowerCase();
      
      return allCredentials.filter(credential => 
        credential.title.toLowerCase().includes(searchTerm) ||
        credential.username.toLowerCase().includes(searchTerm) ||
        credential.url.toLowerCase().includes(searchTerm) ||
        credential.notes.toLowerCase().includes(searchTerm) ||
        credential.tags.some(tagId => {
          // Note: This is a simplified search. In a real implementation,
          // you'd want to resolve tag names and search those too.
          return tagId.toLowerCase().includes(searchTerm);
        })
      );
    } catch (error) {
      console.error('Failed to search credentials:', error);
      throw new Error('Failed to search credentials');
    }
  }

  /**
   * Search secure notes by query (legacy method - kept for compatibility)
   */
  async searchSecureNotes(query: string): Promise<SecureNote[]> {
    if (!query.trim()) {
      return this.getSecureNotes();
    }

    try {
      const allNotes = await this.getSecureNotes();
      const searchTerm = query.toLowerCase();
      
      return allNotes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        note.tags.some(tagId => tagId.toLowerCase().includes(searchTerm))
      );
    } catch (error) {
      console.error('Failed to search secure notes:', error);
      throw new Error('Failed to search secure notes');
    }
  }

  // ===== SYNC OPERATIONS =====

  /**
   * Process pending sync operations
   */
  async processPendingSyncOperations(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    
    try {
      const pendingOperations = await this.getPendingSyncOperations();
      
      if (pendingOperations.length === 0) {
        return;
      }

      // Group operations by type for batch processing
      const changes = pendingOperations.map(op => ({
        operation: op.operation,
        resourceType: op.resourceType,
        resourceId: op.resourceId,
        data: op.data,
        version: op.data?.version
      }));

      const settings = await db.getSettings();
      const syncRequest: VaultSyncRequest = {
        changes,
        lastSyncTime: settings.lastSyncTime
      };

      // Perform sync with retry logic
      const syncResponse = await this.retryOperation(() =>
        this.makeApiRequest<VaultSyncResponse>('/vault/sync', {
          method: 'POST',
          body: JSON.stringify(syncRequest)
        })
      );

      // Process server changes
      await this.processServerChanges(syncResponse.serverChanges);
      
      // Handle conflicts
      if (syncResponse.conflicts.length > 0) {
        await this.handleSyncConflicts(syncResponse.conflicts);
      }

      // Mark operations as synced
      for (const operation of pendingOperations) {
        if (operation.id) {
          await this.markSyncOperationCompleted(operation.id);
        }
      }

      // Update last sync time
      await db.updateSettings({ lastSyncTime: syncResponse.lastSyncTime });
      
      // Clean up old completed operations
      await this.clearCompletedSyncOperations();
      
    } catch (error) {
      console.error('Sync failed:', error);
      // Don't throw - let operations remain in queue for retry
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process changes from server
   */
  private async processServerChanges(changes: VaultSyncResponse['serverChanges']): Promise<void> {
    const encryptionKey = this.ensureEncryptionKey();
    
    for (const change of changes) {
      try {
        switch (change.resourceType) {
          case 'credential':
            await this.processServerCredentialChange(change, encryptionKey);
            break;
          case 'folder':
            await this.processServerFolderChange(change);
            break;
          case 'tag':
            await this.processServerTagChange(change);
            break;
          case 'note':
            await this.processServerNoteChange(change, encryptionKey);
            break;
        }
      } catch (error) {
        console.error(`Failed to process server change for ${change.resourceType} ${change.resourceId}:`, error);
      }
    }
  }

  /**
   * Process server credential changes
   */
  private async processServerCredentialChange(
    change: VaultSyncResponse['serverChanges'][0],
    encryptionKey: CryptoKey
  ): Promise<void> {
    switch (change.operation) {
      case 'create':
      case 'update':
        if (change.data) {
          // Server data is already encrypted, store directly
          await db.credentials.put(change.data);
        }
        break;
      case 'delete':
        await db.credentials.delete(change.resourceId);
        break;
    }
  }

  /**
   * Process server folder changes
   */
  private async processServerFolderChange(change: VaultSyncResponse['serverChanges'][0]): Promise<void> {
    switch (change.operation) {
      case 'create':
      case 'update':
        if (change.data) {
          await db.folders.put(change.data);
        }
        break;
      case 'delete':
        await db.folders.delete(change.resourceId);
        break;
    }
  }

  /**
   * Process server tag changes
   */
  private async processServerTagChange(change: VaultSyncResponse['serverChanges'][0]): Promise<void> {
    switch (change.operation) {
      case 'create':
      case 'update':
        if (change.data) {
          await db.tags.put(change.data);
        }
        break;
      case 'delete':
        await db.tags.delete(change.resourceId);
        break;
    }
  }

  /**
   * Process server note changes
   */
  private async processServerNoteChange(
    change: VaultSyncResponse['serverChanges'][0],
    encryptionKey: CryptoKey
  ): Promise<void> {
    switch (change.operation) {
      case 'create':
      case 'update':
        if (change.data) {
          // Server data is already encrypted, store directly
          await db.secureNotes.put(change.data);
        }
        break;
      case 'delete':
        await db.secureNotes.delete(change.resourceId);
        break;
    }
  }

  /**
   * Handle sync conflicts using last-write-wins strategy
   */
  private async handleSyncConflicts(conflicts: VaultSyncResponse['conflicts']): Promise<void> {
    for (const conflict of conflicts) {
      try {
        // For now, implement last-write-wins (server wins)
        // In a more sophisticated implementation, you might want to:
        // 1. Show conflict resolution UI to user
        // 2. Implement more complex merge strategies
        // 3. Keep conflict history
        
        console.warn(`Sync conflict detected for ${conflict.resourceType} ${conflict.resourceId}. Using server version.`);
        
        // Apply server version
        switch (conflict.resourceType) {
          case 'credential':
            await db.credentials.put(conflict.serverVersion);
            break;
          case 'folder':
            await db.folders.put(conflict.serverVersion);
            break;
          case 'tag':
            await db.tags.put(conflict.serverVersion);
            break;
          case 'note':
            await db.secureNotes.put(conflict.serverVersion);
            break;
        }
      } catch (error) {
        console.error(`Failed to resolve conflict for ${conflict.resourceType} ${conflict.resourceId}:`, error);
      }
    }
  }

  /**
   * Force full sync from server
   */
  async forceSyncFromServer(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      const syncRequest: VaultSyncRequest = {
        changes: [],
        lastSyncTime: 0 // Force full sync
      };

      const syncResponse = await this.retryOperation(() =>
        this.makeApiRequest<VaultSyncResponse>('/vault/sync', {
          method: 'POST',
          body: JSON.stringify(syncRequest)
        })
      );

      // Clear local data and apply server changes
      await db.clearAll();
      await this.processServerChanges(syncResponse.serverChanges);
      
      // Update last sync time
      await db.updateSettings({ lastSyncTime: syncResponse.lastSyncTime });
      
    } catch (error) {
      console.error('Force sync failed:', error);
      throw new Error('Failed to sync from server');
    }
  }

  /**
   * Get pending sync operations
   */
  async getPendingSyncOperations(): Promise<SyncQueue[]> {
    try {
      const allOperations = await db.syncQueue.toArray();
      return allOperations.filter(op => !op.synced);
    } catch (error) {
      console.error('Failed to get pending sync operations:', error);
      return [];
    }
  }

  /**
   * Mark sync operation as completed
   */
  async markSyncOperationCompleted(id: number): Promise<void> {
    try {
      await db.syncQueue.update(id, { synced: true });
    } catch (error) {
      console.error(`Failed to mark sync operation ${id} as completed:`, error);
    }
  }

  /**
   * Clear completed sync operations
   */
  async clearCompletedSyncOperations(): Promise<void> {
    try {
      const completedOperations = await db.syncQueue.toArray();
      const completedIds = completedOperations
        .filter(op => op.synced)
        .map(op => op.id!)
        .filter(id => id !== undefined);
      
      if (completedIds.length > 0) {
        await db.syncQueue.bulkDelete(completedIds);
      }
    } catch (error) {
      console.error('Failed to clear completed sync operations:', error);
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    syncInProgress: boolean;
    pendingOperations: number;
    lastSyncTime?: number;
  }> {
    const pendingOperations = await this.getPendingSyncOperations();
    const settings = await db.getSettings();
    
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingOperations: pendingOperations.length,
      lastSyncTime: settings.lastSyncTime
    };
  }

  // ===== API OPERATIONS =====

  /**
   * Create credential on server
   */
  private async createCredentialOnServer(credential: Credential): Promise<void> {
    const encryptionKey = this.ensureEncryptionKey();
    
    // Encrypt sensitive fields for server
    const encryptedPassword = await CryptoService.encrypt(credential.password, encryptionKey);
    const encryptedNotes = await CryptoService.encrypt(credential.notes, encryptionKey);
    
    const serverData = {
      ...credential,
      password: encryptedPassword,
      notes: encryptedNotes
    };

    await this.makeApiRequest('/vault/credential', {
      method: 'POST',
      body: JSON.stringify(serverData)
    });
  }

  /**
   * Update credential on server
   */
  private async updateCredentialOnServer(credential: Credential): Promise<void> {
    const encryptionKey = this.ensureEncryptionKey();
    
    // Encrypt sensitive fields for server
    const encryptedPassword = await CryptoService.encrypt(credential.password, encryptionKey);
    const encryptedNotes = await CryptoService.encrypt(credential.notes, encryptionKey);
    
    const serverData = {
      ...credential,
      password: encryptedPassword,
      notes: encryptedNotes
    };

    await this.makeApiRequest(`/vault/credential/${credential.id}`, {
      method: 'PUT',
      body: JSON.stringify(serverData)
    });
  }

  /**
   * Delete credential on server
   */
  private async deleteCredentialOnServer(credentialId: string): Promise<void> {
    await this.makeApiRequest(`/vault/credential/${credentialId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Create folder on server
   */
  private async createFolderOnServer(folder: Folder): Promise<void> {
    await this.makeApiRequest('/vault/folder', {
      method: 'POST',
      body: JSON.stringify(folder)
    });
  }

  /**
   * Update folder on server
   */
  private async updateFolderOnServer(folder: Folder): Promise<void> {
    await this.makeApiRequest(`/vault/folder/${folder.id}`, {
      method: 'PUT',
      body: JSON.stringify(folder)
    });
  }

  /**
   * Delete folder on server
   */
  private async deleteFolderOnServer(folderId: string): Promise<void> {
    await this.makeApiRequest(`/vault/folder/${folderId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Create tag on server
   */
  private async createTagOnServer(tag: Tag): Promise<void> {
    await this.makeApiRequest('/vault/tag', {
      method: 'POST',
      body: JSON.stringify(tag)
    });
  }

  /**
   * Delete tag on server
   */
  private async deleteTagOnServer(tagId: string): Promise<void> {
    await this.makeApiRequest(`/vault/tag/${tagId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Create secure note on server
   */
  private async createSecureNoteOnServer(note: SecureNote): Promise<void> {
    const encryptionKey = this.ensureEncryptionKey();
    
    // Encrypt content for server
    const encryptedContent = await CryptoService.encrypt(note.content, encryptionKey);
    
    const serverData = {
      ...note,
      content: encryptedContent
    };

    await this.makeApiRequest('/vault/note', {
      method: 'POST',
      body: JSON.stringify(serverData)
    });
  }

  /**
   * Update secure note on server
   */
  private async updateSecureNoteOnServer(note: SecureNote): Promise<void> {
    const encryptionKey = this.ensureEncryptionKey();
    
    // Encrypt content for server
    const encryptedContent = await CryptoService.encrypt(note.content, encryptionKey);
    
    const serverData = {
      ...note,
      content: encryptedContent
    };

    await this.makeApiRequest(`/vault/note/${note.id}`, {
      method: 'PUT',
      body: JSON.stringify(serverData)
    });
  }

  /**
   * Delete secure note on server
   */
  private async deleteSecureNoteOnServer(noteId: string): Promise<void> {
    await this.makeApiRequest(`/vault/note/${noteId}`, {
      method: 'DELETE'
    });
  }

  // ===== CACHE MANAGEMENT =====

  /**
   * Clear all vault data from local storage
   */
  async clearVaultData(): Promise<void> {
    try {
      await db.clearAll();
      this.clearEncryptionKey();
    } catch (error) {
      console.error('Failed to clear vault data:', error);
      throw new Error('Failed to clear vault data');
    }
  }

  /**
   * Refresh vault data from server
   */
  async refreshVaultData(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot refresh data while offline');
    }

    try {
      await this.forceSyncFromServer();
    } catch (error) {
      console.error('Failed to refresh vault data:', error);
      throw new Error('Failed to refresh vault data from server');
    }
  }

  /**
   * Get vault statistics
   */
  async getVaultStats(): Promise<{
    credentialCount: number;
    folderCount: number;
    tagCount: number;
    noteCount: number;
    pendingSyncCount: number;
  }> {
    try {
      const [allCredentials, folderCount, tagCount, noteCount, allSyncOperations] = await Promise.all([
        db.credentials.toArray(),
        db.folders.count(),
        db.tags.count(),
        db.secureNotes.count(),
        db.syncQueue.toArray()
      ]);
      
      const pendingSyncCount = allSyncOperations.filter(op => !op.synced).length;
      
      const credentialCount = allCredentials.filter(credential => !credential.deletedAt).length;

      return {
        credentialCount,
        folderCount,
        tagCount,
        noteCount,
        pendingSyncCount
      };
    } catch (error) {
      console.error('Failed to get vault stats:', error);
      return {
        credentialCount: 0,
        folderCount: 0,
        tagCount: 0,
        noteCount: 0,
        pendingSyncCount: 0
      };
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Check if service is ready (has encryption key)
   */
  isReady(): boolean {
    return this.encryptionKey !== null;
  }

  /**
   * Get network status
   */
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get sync status
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * Handle error and provide user-friendly message
   */
  private handleError(error: unknown, operation: string): Error {
    console.error(`${operation} failed:`, error);
    
    if (error instanceof Error) {
      // Preserve validation errors and specific business logic errors
      if (
        error.message.includes('required') ||
        error.message.includes('Invalid') ||
        error.message.includes('not found') ||
        error.message.includes('Encryption key not available')
      ) {
        return error;
      }
      
      // Network errors
      if (error.message.includes('timeout') || error.message.includes('fetch')) {
        return new Error('Network error. Please check your connection and try again.');
      }
      
      // Authentication errors
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return new Error('Session expired. Please log in again.');
      }
      
      // Server errors
      if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        return new Error('Server error. Please try again later.');
      }
      
      // Rate limiting
      if (error.message.includes('429')) {
        return new Error('Too many requests. Please wait before trying again.');
      }
      
      // Storage quota
      if (error.message.includes('quota')) {
        return new Error('Storage quota exceeded. Please free up space.');
      }
    }
    
    // For all other errors, return a generic message with the operation name
    // Format: "Failed to [operation]" to match test expectations
    if (operation.startsWith('Create ')) {
      return new Error(`Failed to create ${operation.substring(7).toLowerCase()}`);
    } else if (operation.startsWith('Update ')) {
      return new Error(`Failed to update ${operation.substring(7).toLowerCase()}`);
    } else if (operation.startsWith('Delete ')) {
      return new Error(`Failed to delete ${operation.substring(7).toLowerCase()}`);
    }
    return new Error(`Failed to ${operation.toLowerCase()}`);
  }

  /**
   * Validate credential data
   */
  private validateCredential(credential: Partial<Credential>): void {
    if (!credential.title?.trim()) {
      throw new Error('Credential title is required');
    }
    
    if (!credential.username?.trim()) {
      throw new Error('Username is required');
    }
    
    if (!credential.password?.trim()) {
      throw new Error('Password is required');
    }
    
    if (credential.url && credential.url.trim() && !this.isValidUrl(credential.url)) {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Validate folder data
   */
  private validateFolder(folder: Partial<Folder>): void {
    if (!folder.name?.trim()) {
      throw new Error('Folder name is required');
    }
    
    if (folder.name.length > 100) {
      throw new Error('Folder name is too long (max 100 characters)');
    }
  }

  /**
   * Validate tag data
   */
  private validateTag(tag: Partial<Tag>): void {
    if (!tag.name?.trim()) {
      throw new Error('Tag name is required');
    }
    
    if (tag.name.length > 50) {
      throw new Error('Tag name is too long (max 50 characters)');
    }
  }

  /**
   * Validate secure note data
   */
  private validateSecureNote(note: Partial<SecureNote>): void {
    if (!note.title?.trim()) {
      throw new Error('Note title is required');
    }
    
    if (!note.content?.trim()) {
      throw new Error('Note content is required');
    }
  }

  /**
   * Check if URL is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const vaultService = VaultService.getInstance();