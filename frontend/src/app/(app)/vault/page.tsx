 'use client';

import { useState } from 'react';
import { VaultList, CredentialForm, FolderTree, TagManager } from '@/components/vault';
import { useVault } from '@/hooks/useVault';
import { CredentialFormData } from '@/lib/validations';

/**
 * Vault Page
 * Main password vault page with credential management
 */
export default function VaultPage() {
  const { 
    credentials,
    createCredential, 
    updateCredential,
    setSelectedFolder,
    setSelectedTags 
  } = useVault();
  
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCredentialId, setEditingCredentialId] = useState<string | null>(null);
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

  const handleCredentialSelect = (credentialId: string) => {
    setSelectedCredentialId(credentialId);
  };

  const handleCredentialEdit = (credentialId: string) => {
    setEditingCredentialId(credentialId);
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
  };

  const cancelForm = () => {
    setIsCreating(false);
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
                  Password Vault
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your secure credentials
                </p>
              </div>
            </div>
            
            <button
              onClick={startCreating}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Credential
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {(isCreating || editingCredentialId) ? (
            <div className="h-full overflow-y-auto p-6">
              <div className="mx-auto max-w-2xl">
                <CredentialForm
                  credential={editingCredentialId ? credentials.find(c => c.id === editingCredentialId) : undefined}
                  onSubmit={editingCredentialId ? handleEditCredential : handleCreateCredential}
                  onCancel={cancelForm}
                />
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <VaultList
                selectedCredentialId={selectedCredentialId || undefined}
                onCredentialSelect={handleCredentialSelect}
                onCredentialEdit={handleCredentialEdit}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
