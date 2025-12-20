 'use client';

import { useState } from 'react';
import { VaultList, CredentialForm, FolderTree, TagManager, SecureNoteList, SecureNoteForm } from '@/components/vault';
import { useVault } from '@/hooks/useVault';
import { CredentialFormData } from '@/lib/validations';
import { SecureNote } from '@/lib/db';

/**
 * Vault Page
 * Main password vault page with credential and secure note management
 */
export default function VaultPage() {
  const { 
    credentials,
    secureNotes,
    createCredential, 
    updateCredential,
    createSecureNote,
    updateSecureNote,
    setSelectedFolder,
    setSelectedTags 
  } = useVault();
  
  const [activeView, setActiveView] = useState<'credentials' | 'notes'>('credentials');
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCredentialId, setEditingCredentialId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const handleCreateCredential = async (data: CredentialFormData) => {
    try {
      await createCredential({
        ...data,
        deletedAt: undefined,
        lastUsed: undefined
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create credential:', error);
      throw error;
    }
  };

  const handleEditCredential = async (data: CredentialFormData) => {
    if (!editingCredentialId) return;
    
    try {
      await updateCredential(editingCredentialId, data);
      setEditingCredentialId(null);
    } catch (error) {
      console.error('Failed to update credential:', error);
      throw error;
    }
  };

  const handleCreateSecureNote = async (data: Omit<SecureNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createSecureNote(data);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create secure note:', error);
      throw error;
    }
  };

  const handleEditSecureNote = async (data: Omit<SecureNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingNoteId) return;
    
    try {
      await updateSecureNote(editingNoteId, data);
      setEditingNoteId(null);
    } catch (error) {
      console.error('Failed to update secure note:', error);
      throw error;
    }
  };

  const handleCredentialSelect = (credentialId: string) => {
    setSelectedCredentialId(credentialId);
    setSelectedNoteId(null);
  };

  const handleCredentialEdit = (credentialId: string) => {
    setEditingCredentialId(credentialId);
    setEditingNoteId(null);
    setIsCreating(false);
  };

  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId);
    setSelectedCredentialId(null);
  };

  const handleNoteEdit = (noteId: string) => {
    setEditingNoteId(noteId);
    setEditingCredentialId(null);
    setIsCreating(false);
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolder(folderId);
  };

  const handleTagSelect = (tagId: string) => {
    // This will be handled by the useVault hook's setSelectedTags
    // For now, we'll implement a simple toggle
    console.log('Tag selected:', tagId);
  };

  const startCreating = () => {
    setIsCreating(true);
    setEditingCredentialId(null);
    setEditingNoteId(null);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingCredentialId(null);
    setEditingNoteId(null);
  };

  const switchToCredentials = () => {
    setActiveView('credentials');
    setSelectedNoteId(null);
    setEditingNoteId(null);
  };

  const switchToNotes = () => {
    setActiveView('notes');
    setSelectedCredentialId(null);
    setEditingCredentialId(null);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Organization
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <FolderTree
                onFolderSelect={handleFolderSelect}
                onFolderCreate={() => {/* TODO: Implement folder creation */}}
                onFolderEdit={() => {/* TODO: Implement folder editing */}}
                onFolderDelete={() => {/* TODO: Implement folder deletion */}}
              />
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-800 p-4">
              <TagManager
                onTagSelect={handleTagSelect}
                compact={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeView === 'credentials' ? 'Password Vault' : 'Secure Notes'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {activeView === 'credentials' 
                    ? 'Manage your secure credentials' 
                    : 'Store and organize your secure notes'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
                <button
                  onClick={switchToCredentials}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                    activeView === 'credentials'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Credentials
                </button>
                <button
                  onClick={switchToNotes}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                    activeView === 'notes'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Notes
                </button>
              </div>

              {/* Add Button */}
              <button
                onClick={startCreating}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {activeView === 'credentials' ? 'Add Credential' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {(isCreating || editingCredentialId || editingNoteId) ? (
            <div className="h-full overflow-y-auto p-6">
              <div className="mx-auto max-w-2xl">
                {(activeView === 'credentials' || editingCredentialId) ? (
                  <CredentialForm
                    credential={editingCredentialId ? credentials.find(c => c.id === editingCredentialId) : undefined}
                    onSubmit={editingCredentialId ? handleEditCredential : handleCreateCredential}
                    onCancel={cancelForm}
                  />
                ) : (
                  <SecureNoteForm
                    note={editingNoteId ? secureNotes.find(n => n.id === editingNoteId) : undefined}
                    onSave={editingNoteId ? handleEditSecureNote : handleCreateSecureNote}
                    onCancel={cancelForm}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              {activeView === 'credentials' ? (
                <VaultList
                  selectedCredentialId={selectedCredentialId || undefined}
                  onCredentialSelect={handleCredentialSelect}
                  onCredentialEdit={handleCredentialEdit}
                />
              ) : (
                <SecureNoteList
                  selectedNoteId={selectedNoteId || undefined}
                  onNoteSelect={handleNoteSelect}
                  onNoteEdit={handleNoteEdit}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
