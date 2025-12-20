'use client';

/**
 * SecureNoteList Component
 * 
 * Displays a list of secure notes with search and filtering capabilities.
 * Supports folder filtering, tag filtering, and advanced text search.
 * Provides note preview without full decryption.
 */

import { useState, useMemo } from 'react';
import { useVault } from '@/hooks/useVault';
import { SecureNote, Folder, Tag } from '@/lib/db';

interface SecureNoteCardProps {
  note: SecureNote;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  folders: Folder[];
  tags: Tag[];
}

function SecureNoteCard({
  note,
  isSelected = false,
  onSelect,
  onEdit,
  folders,
  tags
}: SecureNoteCardProps) {
  // Get folder name
  const folder = folders.find(f => f.id === note.folderId);
  
  // Get tag names and colors
  const noteTags = tags.filter(tag => note.tags.includes(tag.id));

  // Format timestamps
  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  // Create preview text without full decryption
  const getContentPreview = (content: string) => {
    // For now, show a truncated version
    // In a real implementation, this might show cached preview text
    const preview = content.length > 150 ? content.substring(0, 150) + '...' : content;
    return preview;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card selection when clicking on interactive elements
    if (
      e.target instanceof HTMLElement &&
      (e.target.tagName === 'BUTTON' || 
       e.target.closest('button'))
    ) {
      return;
    }
    onSelect?.();
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'
      }`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {note.title}
            </h3>
            {folder && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                {folder.name}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            title="Edit note"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mt-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {getContentPreview(note.content)}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {noteTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
              style={{ 
                backgroundColor: tag.color + '20', 
                color: tag.color 
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(note.updatedAt)}
        </div>
      </div>
    </div>
  );
}

interface SecureNoteListProps {
  onNoteSelect?: (noteId: string) => void;
  onNoteEdit?: (noteId: string) => void;
  selectedNoteId?: string;
}

export function SecureNoteList({ 
  onNoteSelect, 
  onNoteEdit, 
  selectedNoteId 
}: SecureNoteListProps) {
  const { 
    secureNotes,
    folders, 
    tags, 
    selectedFolderId, 
    selectedTags, 
    setSelectedFolder,
    setSelectedTags,
    isLoading 
  } = useVault();

  const [sortBy, setSortBy] = useState<'title' | 'updated' | 'created'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter notes based on folder and tag selection
  const filteredNotes = useMemo(() => {
    let filtered = secureNotes;

    // Apply folder filter
    if (selectedFolderId) {
      filtered = filtered.filter(note => note.folderId === selectedFolderId);
    }

    // Apply tag filter (must have ALL selected tags)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        selectedTags.every(tagId => note.tags.includes(tagId))
      );
    }

    return filtered;
  }, [secureNotes, selectedFolderId, selectedTags]);

  // Sort notes based on selected criteria
  const sortedNotes = useMemo(() => {
    const sorted = [...filteredNotes].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'updated':
          comparison = b.updatedAt - a.updatedAt; // Most recent first by default
          break;
        case 'created':
          comparison = b.createdAt - a.createdAt; // Most recent first by default
          break;
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredNotes, sortBy, sortOrder]);

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
    setSelectedFolder(null);
    setSelectedTags([]);
  };

  const hasActiveFilters = selectedFolderId || selectedTags.length > 0;

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
          <span className="text-gray-600 dark:text-gray-400">Loading notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
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

      {/* Results Summary and Sort Options */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {sortedNotes.length} note{sortedNotes.length !== 1 ? 's' : ''} found
          {hasActiveFilters && ' (filtered)'}
        </p>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'title' | 'updated' | 'created')}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="updated">Last Updated</option>
            <option value="title">Title</option>
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
      </div>

      {/* Notes List */}
      {sortedNotes.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          {hasActiveFilters ? (
            <div className="space-y-2">
              <p className="text-gray-500 dark:text-gray-400">
                No notes match your current filters
              </p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Clear filters to see all notes
              </button>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No secure notes found. Create your first note to get started.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedNotes.map((note) => (
            <SecureNoteCard
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onSelect={() => onNoteSelect?.(note.id)}
              onEdit={() => onNoteEdit?.(note.id)}
              folders={folders}
              tags={tags}
            />
          ))}
        </div>
      )}
    </div>
  );
}