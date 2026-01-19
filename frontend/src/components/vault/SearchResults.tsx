'use client';

/**
 * SearchResults Component
 * 
 * Displays search results with highlighted matches and relevance scores.
 * Shows both credentials and secure notes in a unified interface.
 */

import { useSearch } from '@/hooks/useSearch';
import { useVault } from '@/hooks/useVault';
import { CredentialCard } from './CredentialCard';
import { SearchResult } from '@/services/searchService';
import { Credential, SecureNote } from '@/lib/db';

interface SearchResultsProps {
  onCredentialSelect?: (credentialId: string) => void;
  onCredentialEdit?: (credentialId: string) => void;
  onCredentialShare?: (credentialId: string) => void;
  onNoteSelect?: (noteId: string) => void;
  onNoteEdit?: (noteId: string) => void;
  selectedCredentialId?: string;
  selectedNoteId?: string;
}

export function SearchResults({
  onCredentialSelect,
  onCredentialEdit,
  onCredentialShare,
  onNoteSelect,
  onNoteEdit,
  selectedCredentialId,
  selectedNoteId
}: SearchResultsProps) {
  const {
    query,
    searchResults,
    isSearching,
    hasResults,
    hasQuery,
    isEmpty,
    highlightText
  } = useSearch();

  const { folders, tags } = useVault();

  if (!hasQuery) {
    return null;
  }

  if (isSearching) {
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
          <span className="text-gray-600 dark:text-gray-400">Searching...</span>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No results found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No credentials or notes match your search for "{query}"
          </p>
          <div className="mt-4 text-sm text-gray-400 dark:text-gray-500">
            <p>Try:</p>
            <ul className="mt-1 space-y-1">
              <li>• Using different keywords</li>
              <li>• Checking your spelling</li>
              <li>• Using fewer search terms</li>
              <li>• Searching for partial matches</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!hasResults || !searchResults) {
    return null;
  }

  const { credentials: credentialResults, notes: noteResults } = searchResults;

  return (
    <div className="space-y-6">
      {/* Credentials Results */}
      {credentialResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Credentials ({credentialResults.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {credentialResults.map((result) => (
              <SearchResultCredentialCard
                key={result.item.id}
                result={result}
                isSelected={selectedCredentialId === result.item.id}
                onSelect={() => onCredentialSelect?.(result.item.id)}
                onEdit={() => onCredentialEdit?.(result.item.id)}
                onShare={() => onCredentialShare?.(result.item.id)}
                folders={folders}
                tags={tags}
                highlightText={highlightText}
              />
            ))}
          </div>
        </div>
      )}

      {/* Secure Notes Results */}
      {noteResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Secure Notes ({noteResults.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {noteResults.map((result) => (
              <SearchResultNoteCard
                key={result.item.id}
                result={result}
                isSelected={selectedNoteId === result.item.id}
                onSelect={() => onNoteSelect?.(result.item.id)}
                onEdit={() => onNoteEdit?.(result.item.id)}
                folders={folders}
                tags={tags}
                highlightText={highlightText}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Search result card for credentials
 */
interface SearchResultCredentialCardProps {
  result: SearchResult<Credential>;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onShare: () => void;
  folders: any[];
  tags: any[];
  highlightText: (text: string) => string;
}

function SearchResultCredentialCard({
  result,
  isSelected,
  onSelect,
  onEdit,
  onShare,
  folders,
  tags,
  highlightText
}: SearchResultCredentialCardProps) {
  const { item: credential, score, matchedFields } = result;

  return (
    <div
      className={`rounded-lg border p-4 transition-all hover:shadow-md ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title with highlighting */}
          <h4 
            className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate"
            dangerouslySetInnerHTML={{ __html: highlightText(credential.title) }}
          />
          
          {/* Username with highlighting */}
          <p 
            className="text-sm text-gray-600 dark:text-gray-400 truncate"
            dangerouslySetInnerHTML={{ __html: highlightText(credential.username) }}
          />
          
          {/* URL with highlighting */}
          {credential.url && (
            <p 
              className="text-sm text-blue-600 dark:text-blue-400 truncate"
              dangerouslySetInnerHTML={{ __html: highlightText(credential.url) }}
            />
          )}

          {/* Search metadata */}
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Score: {score.toFixed(1)}</span>
            <span>Matches: {matchedFields.join(', ')}</span>
            {credential.lastUsed && (
              <span>Last used: {new Date(credential.lastUsed).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onSelect}
            className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            View
          </button>
          <button
            onClick={onShare}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Share
          </button>
          <button
            onClick={onEdit}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Search result card for secure notes
 */
interface SearchResultNoteCardProps {
  result: SearchResult<SecureNote>;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  folders: any[];
  tags: any[];
  highlightText: (text: string) => string;
}

function SearchResultNoteCard({
  result,
  isSelected,
  onSelect,
  onEdit,
  folders,
  tags,
  highlightText
}: SearchResultNoteCardProps) {
  const { item: note, score, matchedFields } = result;

  // Truncate content for preview
  const contentPreview = note.content.length > 150 
    ? note.content.substring(0, 150) + '...'
    : note.content;

  return (
    <div
      className={`rounded-lg border p-4 transition-all hover:shadow-md ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Note icon and title */}
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4 
              className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate"
              dangerouslySetInnerHTML={{ __html: highlightText(note.title) }}
            />
          </div>
          
          {/* Content preview with highlighting */}
          <div 
            className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3"
            dangerouslySetInnerHTML={{ __html: highlightText(contentPreview) }}
          />

          {/* Search metadata */}
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Score: {score.toFixed(1)}</span>
            <span>Matches: {matchedFields.join(', ')}</span>
            <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onSelect}
            className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            View
          </button>
          <button
            onClick={onEdit}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}