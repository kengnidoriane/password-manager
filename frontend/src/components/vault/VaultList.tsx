'use client';

/**
 * VaultList Component
 * 
 * Displays a list of credentials with search and filtering capabilities.
 * Supports folder filtering, tag filtering, and text search.
 */

import { useState, useMemo } from 'react';
import { useVault } from '@/hooks/useVault';
import { useSearch } from '@/hooks/useSearch';
import { CredentialCard } from './CredentialCard';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { SearchFilters } from '@/types/vault';

interface VaultListProps {
  onCredentialSelect?: (credentialId: string) => void;
  onCredentialEdit?: (credentialId: string) => void;
  selectedCredentialId?: string;
}

export function VaultList({ 
  onCredentialSelect, 
  onCredentialEdit, 
  selectedCredentialId 
}: VaultListProps) {
  const { 
    filteredCredentials, 
    folders, 
    tags, 
    selectedFolderId, 
    selectedTags, 
    searchQuery,
    setSearchQuery,
    setSelectedFolder,
    setSelectedTags,
    isLoading 
  } = useVault();

  const [sortBy, setSortBy] = useState<'name' | 'lastUsed' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sort credentials based on selected criteria
  const sortedCredentials = useMemo(() => {
    const sorted = [...filteredCredentials].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'lastUsed':
          const aLastUsed = a.lastUsed || 0;
          const bLastUsed = b.lastUsed || 0;
          comparison = bLastUsed - aLastUsed; // Most recent first by default
          break;
        case 'created':
          comparison = b.createdAt - a.createdAt; // Most recent first by default
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  }, [filteredCredentials, sortBy, sortOrder]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFolderFilter = (folderId: string | null) => {
    setSelectedFolder(folderId);
  };

  const handleTagFilter = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newSelectedTags);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFolder(null);
    setSelectedTags([]);
  };

  const hasActiveFilters = searchQuery || selectedFolderId || selectedTags.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 animate-spin text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-gray-600 dark:text-gray-400">Loading vault...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search credentials..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Folder Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Folder:
            </label>
            <select
              value={selectedFolderId || ''}
              onChange={(e) => handleFolderFilter(e.target.value || null)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Folders</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'lastUsed' | 'created')}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="name">Name</option>
              <option value="lastUsed">Last Used</option>
              <option value="created">Date Created</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="rounded-md border border-gray-300 p-1 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <svg
                className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${
                  sortOrder === 'desc' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 11l5-5m0 0l5 5m-5-5v12"
                />
              </svg>
            </button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Tag Filter Pills */}
        {tags.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by tags:
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleTagFilter(tag.id)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={isSelected ? { backgroundColor: tag.color + '20', color: tag.color } : {}}
                  >
                    {tag.name}
                    {isSelected && (
                      <svg
                        className="ml-1 h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {sortedCredentials.length} credential{sortedCredentials.length !== 1 ? 's' : ''} found
          {hasActiveFilters && ' (filtered)'}
        </p>
      </div>

      {/* Credentials List */}
      {sortedCredentials.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          {hasActiveFilters ? (
            <div className="space-y-2">
              <p className="text-gray-500 dark:text-gray-400">
                No credentials match your current filters
              </p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Clear filters to see all credentials
              </button>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No credentials found. Create your first credential to get started.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCredentials.map((credential) => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              isSelected={selectedCredentialId === credential.id}
              onSelect={() => onCredentialSelect?.(credential.id)}
              onEdit={() => onCredentialEdit?.(credential.id)}
              folders={folders}
              tags={tags}
            />
          ))}
        </div>
      )}
    </div>
  );
}