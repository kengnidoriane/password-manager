import { create } from 'zustand';
import { Credential, Folder, Tag, SecureNote } from '@/lib/db';
import { syncService } from '@/services/syncService';

/**
 * Vault State Store
 * Manages vault data and operations with sync integration
 */

interface VaultState {
  credentials: Credential[];
  folders: Folder[];
  tags: Tag[];
  secureNotes: SecureNote[];
  selectedFolderId: string | null;
  selectedTags: string[];
  searchQuery: string;
  isLoading: boolean;
  lastSyncTime: number | null;
  isSyncing: boolean;

  // Actions
  setCredentials: (credentials: Credential[]) => void;
  addCredential: (credential: Credential) => void;
  updateCredential: (id: string, updates: Partial<Credential>) => void;
  deleteCredential: (id: string) => void;
  
  setFolders: (folders: Folder[]) => void;
  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  
  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  deleteTag: (id: string) => void;
  
  setSecureNotes: (notes: SecureNote[]) => void;
  addSecureNote: (note: SecureNote) => void;
  updateSecureNote: (id: string, updates: Partial<SecureNote>) => void;
  deleteSecureNote: (id: string) => void;
  
  setSelectedFolder: (folderId: string | null) => void;
  setSelectedTags: (tags: string[]) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncTime: (time: number) => void;
  clearVault: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  credentials: [],
  folders: [],
  tags: [],
  secureNotes: [],
  selectedFolderId: null,
  selectedTags: [],
  searchQuery: '',
  isLoading: false,
  lastSyncTime: null,
  isSyncing: false,

  setCredentials: (credentials) => set({ credentials }),
  
  addCredential: (credential) => set((state) => {
    const newCredentials = [...state.credentials, credential];
    // Trigger sync after adding credential
    syncService.triggerSync();
    return { credentials: newCredentials };
  }),
  
  updateCredential: (id, updates) => set((state) => {
    const newCredentials = state.credentials.map(c => 
      c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
    );
    // Trigger sync after updating credential
    syncService.triggerSync();
    return { credentials: newCredentials };
  }),
  
  deleteCredential: (id) => set((state) => {
    const newCredentials = state.credentials.map(c =>
      c.id === id ? { ...c, deletedAt: Date.now() } : c
    );
    // Trigger sync after deleting credential
    syncService.triggerSync();
    return { credentials: newCredentials };
  }),

  setFolders: (folders) => set({ folders }),
  
  addFolder: (folder) => set((state) => {
    const newFolders = [...state.folders, folder];
    // Trigger sync after adding folder
    syncService.triggerSync();
    return { folders: newFolders };
  }),
  
  updateFolder: (id, updates) => set((state) => {
    const newFolders = state.folders.map(f =>
      f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f
    );
    // Trigger sync after updating folder
    syncService.triggerSync();
    return { folders: newFolders };
  }),
  
  deleteFolder: (id) => set((state) => {
    const newFolders = state.folders.filter(f => f.id !== id);
    // Trigger sync after deleting folder
    syncService.triggerSync();
    return { folders: newFolders };
  }),

  setTags: (tags) => set({ tags }),
  
  addTag: (tag) => set((state) => {
    const newTags = [...state.tags, tag];
    // Trigger sync after adding tag
    syncService.triggerSync();
    return { tags: newTags };
  }),
  
  deleteTag: (id) => set((state) => {
    const newTags = state.tags.filter(t => t.id !== id);
    // Trigger sync after deleting tag
    syncService.triggerSync();
    return { tags: newTags };
  }),

  setSecureNotes: (notes) => set({ secureNotes: notes }),
  
  addSecureNote: (note) => set((state) => {
    const newNotes = [...state.secureNotes, note];
    // Trigger sync after adding note
    syncService.triggerSync();
    return { secureNotes: newNotes };
  }),
  
  updateSecureNote: (id, updates) => set((state) => {
    const newNotes = state.secureNotes.map(n =>
      n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
    );
    // Trigger sync after updating note
    syncService.triggerSync();
    return { secureNotes: newNotes };
  }),
  
  deleteSecureNote: (id) => set((state) => {
    const newNotes = state.secureNotes.filter(n => n.id !== id);
    // Trigger sync after deleting note
    syncService.triggerSync();
    return { secureNotes: newNotes };
  }),

  setSelectedFolder: (folderId) => set({ selectedFolderId: folderId }),
  
  setSelectedTags: (tags) => set({ selectedTags: tags }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  
  clearVault: () => set({
    credentials: [],
    folders: [],
    tags: [],
    secureNotes: [],
    selectedFolderId: null,
    selectedTags: [],
    searchQuery: '',
    lastSyncTime: null
  })
}));
