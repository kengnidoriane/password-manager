/**
 * useVault Hook - Integrates VaultService with Zustand store
 * 
 * Provides a clean interface for components to interact with vault data.
 * Handles loading from IndexedDB and keeping the store synchronized.
 */

import { useCallback, useEffect } from 'react';
import { useVaultStore } from '@/stores/vaultStore';
import { useAuthStore } from '@/stores/authStore';
import { vaultService } from '@/services/vaultService';
import { Credential, Folder, Tag, SecureNote } from '@/lib/db';

/**
 * Hook for vault operations
 */
export const useVault = () => {
  const {
    credentials,
    folders,
    tags,
    secureNotes,
    selectedFolderId,
    selectedTags,
    searchQuery,
    isLoading,
    isSyncing,
    lastSyncTime,
    setCredentials,
    addCredential,
    updateCredential,
    deleteCredential,
    setFolders,
    addFolder,
    updateFolder,
    deleteFolder,
    setTags,
    addTag,
    deleteTag,
    setSecureNotes,
    addSecureNote,
    updateSecureNote,
    deleteSecureNote,
    setSelectedFolder,
    setSelectedTags,
    setSearchQuery,
    setLoading,
    setSyncing,
    setLastSyncTime,
    clearVault
  } = useVaultStore();

  const { isAuthenticated, encryptionKey } = useAuthStore();

  /**
   * Initialize vault service with encryption key
   */
  useEffect(() => {
    if (isAuthenticated && encryptionKey) {
      vaultService.setEncryptionKey(encryptionKey);
    } else {
      vaultService.clearEncryptionKey();
    }
  }, [isAuthenticated, encryptionKey]);

  /**
   * Load all vault data from IndexedDB
   */
  const loadVaultData = useCallback(async () => {
    if (!isAuthenticated || !encryptionKey) {
      return;
    }

    setLoading(true);
    try {
      const [credentialsData, foldersData, tagsData, notesData] = await Promise.all([
        vaultService.getCredentials(),
        vaultService.getFolders(),
        vaultService.getTags(),
        vaultService.getSecureNotes()
      ]);

      setCredentials(credentialsData);
      setFolders(foldersData);
      setTags(tagsData);
      setSecureNotes(notesData);
    } catch (error) {
      console.error('Failed to load vault data:', error);
      // TODO: Show error notification
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, encryptionKey, setCredentials, setFolders, setTags, setSecureNotes, setLoading]);

  /**
   * Load vault data on authentication
   */
  useEffect(() => {
    if (isAuthenticated && encryptionKey) {
      loadVaultData();
    } else {
      clearVault();
    }
  }, [isAuthenticated, encryptionKey, loadVaultData, clearVault]);

  // ===== CREDENTIAL OPERATIONS =====

  const createCredential = useCallback(async (
    credentialData: Omit<Credential, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<Credential> => {
    try {
      const newCredential = await vaultService.createCredential(credentialData);
      addCredential(newCredential);
      return newCredential;
    } catch (error) {
      console.error('Failed to create credential:', error);
      throw error;
    }
  }, [addCredential]);

  const updateCredentialData = useCallback(async (
    id: string,
    updates: Partial<Credential>
  ): Promise<Credential> => {
    try {
      const updatedCredential = await vaultService.updateCredential(id, updates);
      updateCredential(id, updatedCredential);
      return updatedCredential;
    } catch (error) {
      console.error('Failed to update credential:', error);
      throw error;
    }
  }, [updateCredential]);

  const deleteCredentialData = useCallback(async (id: string): Promise<void> => {
    try {
      await vaultService.deleteCredential(id);
      deleteCredential(id);
    } catch (error) {
      console.error('Failed to delete credential:', error);
      throw error;
    }
  }, [deleteCredential]);

  const updateLastUsed = useCallback(async (id: string): Promise<void> => {
    try {
      await vaultService.updateLastUsed(id);
      // Update the store with new lastUsed timestamp
      updateCredential(id, { lastUsed: Date.now() });
    } catch (error) {
      console.error('Failed to update last used:', error);
    }
  }, [updateCredential]);

  // ===== FOLDER OPERATIONS =====

  const createFolderData = useCallback(async (
    folderData: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Folder> => {
    try {
      const newFolder = await vaultService.createFolder(folderData);
      addFolder(newFolder);
      return newFolder;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }, [addFolder]);

  const updateFolderData = useCallback(async (
    id: string,
    updates: Partial<Folder>
  ): Promise<Folder> => {
    try {
      const updatedFolder = await vaultService.updateFolder(id, updates);
      updateFolder(id, updatedFolder);
      return updatedFolder;
    } catch (error) {
      console.error('Failed to update folder:', error);
      throw error;
    }
  }, [updateFolder]);

  const deleteFolderData = useCallback(async (id: string): Promise<void> => {
    try {
      await vaultService.deleteFolder(id);
      deleteFolder(id);
      // Reload data to reflect moved items
      await loadVaultData();
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  }, [deleteFolder, loadVaultData]);

  // ===== TAG OPERATIONS =====

  const createTagData = useCallback(async (
    tagData: Omit<Tag, 'id' | 'createdAt'>
  ): Promise<Tag> => {
    try {
      const newTag = await vaultService.createTag(tagData);
      addTag(newTag);
      return newTag;
    } catch (error) {
      console.error('Failed to create tag:', error);
      throw error;
    }
  }, [addTag]);

  const deleteTagData = useCallback(async (id: string): Promise<void> => {
    try {
      await vaultService.deleteTag(id);
      deleteTag(id);
      // Reload data to reflect tag removal from items
      await loadVaultData();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      throw error;
    }
  }, [deleteTag, loadVaultData]);

  // ===== SECURE NOTE OPERATIONS =====

  const createSecureNoteData = useCallback(async (
    noteData: Omit<SecureNote, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SecureNote> => {
    try {
      const newNote = await vaultService.createSecureNote(noteData);
      addSecureNote(newNote);
      return newNote;
    } catch (error) {
      console.error('Failed to create secure note:', error);
      throw error;
    }
  }, [addSecureNote]);

  const updateSecureNoteData = useCallback(async (
    id: string,
    updates: Partial<SecureNote>
  ): Promise<SecureNote> => {
    try {
      const updatedNote = await vaultService.updateSecureNote(id, updates);
      updateSecureNote(id, updatedNote);
      return updatedNote;
    } catch (error) {
      console.error('Failed to update secure note:', error);
      throw error;
    }
  }, [updateSecureNote]);

  const deleteSecureNoteData = useCallback(async (id: string): Promise<void> => {
    try {
      await vaultService.deleteSecureNote(id);
      deleteSecureNote(id);
    } catch (error) {
      console.error('Failed to delete secure note:', error);
      throw error;
    }
  }, [deleteSecureNote]);

  // ===== SEARCH OPERATIONS =====

  const searchCredentials = useCallback(async (query: string): Promise<Credential[]> => {
    try {
      return await vaultService.searchCredentials(query);
    } catch (error) {
      console.error('Failed to search credentials:', error);
      return [];
    }
  }, []);

  const searchSecureNotes = useCallback(async (query: string): Promise<SecureNote[]> => {
    try {
      return await vaultService.searchSecureNotes(query);
    } catch (error) {
      console.error('Failed to search secure notes:', error);
      return [];
    }
  }, []);

  // ===== FILTERED DATA =====

  /**
   * Get filtered credentials based on current filters
   */
  const getFilteredCredentials = useCallback((): Credential[] => {
    let filtered = credentials.filter(c => !c.deletedAt);

    // Filter by folder
    if (selectedFolderId) {
      filtered = filtered.filter(c => c.folderId === selectedFolderId);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(c => 
        selectedTags.every(tagId => c.tags.includes(tagId))
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.username.toLowerCase().includes(query) ||
        c.url.toLowerCase().includes(query) ||
        c.notes.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [credentials, selectedFolderId, selectedTags, searchQuery]);

  /**
   * Get filtered secure notes based on current filters
   */
  const getFilteredSecureNotes = useCallback((): SecureNote[] => {
    let filtered = secureNotes;

    // Filter by folder
    if (selectedFolderId) {
      filtered = filtered.filter(n => n.folderId === selectedFolderId);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(n => 
        selectedTags.every(tagId => n.tags.includes(tagId))
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [secureNotes, selectedFolderId, selectedTags, searchQuery]);

  // ===== SYNC OPERATIONS =====

  const getPendingSyncOperations = useCallback(async () => {
    try {
      return await vaultService.getPendingSyncOperations();
    } catch (error) {
      console.error('Failed to get pending sync operations:', error);
      return [];
    }
  }, []);

  const getVaultStats = useCallback(async () => {
    try {
      return await vaultService.getVaultStats();
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
  }, []);

  // ===== CACHE MANAGEMENT =====

  const clearVaultData = useCallback(async (): Promise<void> => {
    try {
      await vaultService.clearVaultData();
      clearVault();
    } catch (error) {
      console.error('Failed to clear vault data:', error);
      throw error;
    }
  }, [clearVault]);

  return {
    // State
    credentials,
    folders,
    tags,
    secureNotes,
    selectedFolderId,
    selectedTags,
    searchQuery,
    isLoading,
    isSyncing,
    lastSyncTime,

    // Filtered data
    filteredCredentials: getFilteredCredentials(),
    filteredSecureNotes: getFilteredSecureNotes(),

    // Actions
    loadVaultData,
    
    // Credential operations
    createCredential,
    updateCredential: updateCredentialData,
    deleteCredential: deleteCredentialData,
    updateLastUsed,
    
    // Folder operations
    createFolder: createFolderData,
    updateFolder: updateFolderData,
    deleteFolder: deleteFolderData,
    
    // Tag operations
    createTag: createTagData,
    deleteTag: deleteTagData,
    
    // Secure note operations
    createSecureNote: createSecureNoteData,
    updateSecureNote: updateSecureNoteData,
    deleteSecureNote: deleteSecureNoteData,
    
    // Search operations
    searchCredentials,
    searchSecureNotes,
    
    // Filter operations
    setSelectedFolder,
    setSelectedTags,
    setSearchQuery,
    
    // Sync operations
    getPendingSyncOperations,
    getVaultStats,
    
    // Cache management
    clearVaultData,
    
    // Loading states
    setLoading,
    setSyncing,
    setLastSyncTime
  };
};