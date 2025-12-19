/**
 * VaultService - Handles vault data operations with encryption
 * 
 * Provides CRUD operations for vault data with client-side encryption.
 * All sensitive data is encrypted before storage in IndexedDB.
 */

import { db, Credential, Folder, Tag, SecureNote, SyncQueue } from '@/lib/db';
import { CryptoService, EncryptedData } from '@/lib/crypto';
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
 * VaultService class for encrypted vault operations
 */
export class VaultService {
  private static instance: VaultService;
  private encryptionKey: CryptoKey | null = null;

  private constructor() {}

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
   * Add operation to sync queue
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
  }

  // ===== CREDENTIAL OPERATIONS =====

  /**
   * Get all credentials (decrypted)
   */
  async getCredentials(): Promise<Credential[]> {
    const encryptionKey = this.ensureEncryptionKey();
    
    try {
      const encryptedCredentials = await db.credentials
        .where('deletedAt')
        .equals(undefined)
        .toArray() as unknown as EncryptedCredential[];

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

      await db.credentials.add(encryptedCredential as unknown as Credential);
      await this.addToSyncQueue('create', 'credential', id, newCredential);
      
      return newCredential;
    } catch (error) {
      console.error('Failed to create credential:', error);
      throw new Error('Failed to create credential');
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

      await db.credentials.put(encryptedCredential as unknown as Credential);
      await this.addToSyncQueue('update', 'credential', id, updatedCredential);
      
      return updatedCredential;
    } catch (error) {
      console.error(`Failed to update credential ${id}:`, error);
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

      await db.credentials.put(encryptedCredential as unknown as Credential);
      await this.addToSyncQueue('delete', 'credential', id);
    } catch (error) {
      console.error(`Failed to delete credential ${id}:`, error);
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

      await db.folders.add(newFolder);
      await this.addToSyncQueue('create', 'folder', id, newFolder);
      
      return newFolder;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw new Error('Failed to create folder');
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
      const folder = await db.folders.get(currentId);
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
      const id = CryptoService.generateRandomString(16);
      
      const newTag: Tag = {
        ...tag,
        id,
        createdAt: Date.now()
      };

      await db.tags.add(newTag);
      await this.addToSyncQueue('create', 'tag', id, newTag);
      
      return newTag;
    } catch (error) {
      console.error('Failed to create tag:', error);
      throw new Error('Failed to create tag');
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

      await db.secureNotes.add(encryptedNote as unknown as SecureNote);
      await this.addToSyncQueue('create', 'note', id, newNote);
      
      return newNote;
    } catch (error) {
      console.error('Failed to create secure note:', error);
      throw new Error('Failed to create secure note');
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
   * Search credentials by query
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
   * Search secure notes by query
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
   * Get pending sync operations
   */
  async getPendingSyncOperations(): Promise<SyncQueue[]> {
    try {
      return await db.syncQueue.where('synced').equals(false).toArray();
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
      await db.syncQueue.where('synced').equals(true).delete();
    } catch (error) {
      console.error('Failed to clear completed sync operations:', error);
    }
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
      const [credentialCount, folderCount, tagCount, noteCount, pendingSyncCount] = await Promise.all([
        db.credentials.where('deletedAt').equals(undefined).count(),
        db.folders.count(),
        db.tags.count(),
        db.secureNotes.count(),
        db.syncQueue.where('synced').equals(false).count()
      ]);

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
}

// Export singleton instance
export const vaultService = VaultService.getInstance();