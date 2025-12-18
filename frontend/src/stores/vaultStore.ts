import { create } from 'zustand';
import { Credential, Folder, Tag, SecureNote } from '@/lib/db';

/**
 * Vault State Store
 * Manages vault data and operations
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
  
  addCredential: (credential) => set((state) => ({
    credentials: [...state.credentials, credential]
  })),
  
  updateCredential: (id, updates) => set((state) => ({
    credentials: state.credentials.map(c => 
      c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
    )
  })),
  
  deleteCredential: (id) => set((state) => ({
    credentials: state.credentials.map(c =>
      c.id === id ? { ...c, deletedAt: Date.now() } : c
    )
  })),

  setFolders: (folders) => set({ folders }),
  
  addFolder: (folder) => set((state) => ({
    folders: [...state.folders, folder]
  })),
  
  updateFolder: (id, updates) => set((state) => ({
    folders: state.folders.map(f =>
      f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f
    )
  })),
  
  deleteFolder: (id) => set((state) => ({
    folders: state.folders.filter(f => f.id !== id)
  })),

  setTags: (tags) => set({ tags }),
  
  addTag: (tag) => set((state) => ({
    tags: [...state.tags, tag]
  })),
  
  deleteTag: (id) => set((state) => ({
    tags: state.tags.filter(t => t.id !== id)
  })),

  setSecureNotes: (notes) => set({ secureNotes: notes }),
  
  addSecureNote: (note) => set((state) => ({
    secureNotes: [...state.secureNotes, note]
  })),
  
  updateSecureNote: (id, updates) => set((state) => ({
    secureNotes: state.secureNotes.map(n =>
      n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
    )
  })),
  
  deleteSecureNote: (id) => set((state) => ({
    secureNotes: state.secureNotes.filter(n => n.id !== id)
  })),

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
