/**
 * useSearch Hook - Advanced search functionality
 * 
 * Provides comprehensive search capabilities using the SearchService.
 * Includes real-time search, relevance scoring, and multiple sort options.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useVault } from './useVault';
import { searchService, SearchOptions, SearchResults } from '@/services/searchService';
import { useDebounce } from './useDebounce';

interface UseSearchOptions {
  debounceMs?: number;
  autoSearch?: boolean;
  defaultSortBy?: 'relevance' | 'lastUsed' | 'created' | 'alphabetical';
  defaultSortOrder?: 'asc' | 'desc';
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const {
    debounceMs = 300,
    autoSearch = true,
    defaultSortBy = 'relevance',
    defaultSortOrder = 'desc'
  } = options;

  const { credentials, secureNotes, tags, selectedFolderId, selectedTags } = useVault();
  
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'lastUsed' | 'created' | 'alphabetical'>(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);
  const [includeCredentials, setIncludeCredentials] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Debounce the search query
  const debouncedQuery = useDebounce(query, debounceMs);

  // Search options
  const searchOptions = useMemo((): SearchOptions => ({
    query: debouncedQuery,
    sortBy,
    sortOrder,
    includeCredentials,
    includeNotes,
    folderId: selectedFolderId,
    tagIds: selectedTags
  }), [debouncedQuery, sortBy, sortOrder, includeCredentials, includeNotes, selectedFolderId, selectedTags]);

  /**
   * Perform search with current options
   */
  const performSearch = useCallback(async (searchQuery?: string) => {
    const queryToUse = searchQuery !== undefined ? searchQuery : debouncedQuery;
    
    setIsSearching(true);
    try {
      const results = await searchService.search(
        credentials,
        secureNotes,
        tags,
        {
          ...searchOptions,
          query: queryToUse
        }
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [credentials, secureNotes, tags, searchOptions, debouncedQuery]);

  /**
   * Get search suggestions
   */
  const getSuggestions = useCallback(async (partialQuery: string) => {
    if (!partialQuery.trim() || partialQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const newSuggestions = await searchService.getSearchSuggestions(
        credentials,
        secureNotes,
        tags,
        partialQuery,
        5
      );
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      setSuggestions([]);
    }
  }, [credentials, secureNotes, tags]);

  /**
   * Highlight search terms in text
   */
  const highlightText = useCallback((text: string, searchQuery?: string) => {
    const queryToUse = searchQuery || query;
    return searchService.highlightSearchTerms(text, queryToUse);
  }, [query]);

  /**
   * Clear search and reset results
   */
  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchResults(null);
    setSuggestions([]);
  }, []);

  /**
   * Set search query and optionally trigger immediate search
   */
  const setSearchQuery = useCallback((newQuery: string, immediate = false) => {
    setQuery(newQuery);
    if (immediate) {
      performSearch(newQuery);
    }
  }, [performSearch]);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (autoSearch) {
      performSearch();
    }
  }, [autoSearch, performSearch]);

  // Get suggestions when query changes (but not debounced)
  useEffect(() => {
    getSuggestions(query);
  }, [query, getSuggestions]);

  // Computed values
  const hasResults = searchResults && searchResults.totalResults > 0;
  const hasQuery = query.trim().length > 0;
  const isEmpty = hasQuery && !hasResults && !isSearching;

  return {
    // Search state
    query,
    debouncedQuery,
    sortBy,
    sortOrder,
    includeCredentials,
    includeNotes,
    isSearching,
    searchResults,
    suggestions,

    // Computed state
    hasResults,
    hasQuery,
    isEmpty,

    // Actions
    setSearchQuery,
    setSortBy,
    setSortOrder,
    setIncludeCredentials,
    setIncludeNotes,
    performSearch,
    clearSearch,
    highlightText,

    // Utility functions
    getSuggestions
  };
};