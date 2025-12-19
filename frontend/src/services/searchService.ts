/**
 * SearchService - Advanced search functionality for vault data
 * 
 * Provides full-text search across credentials and secure notes with:
 * - Search across website names, URLs, usernames, tags
 * - Relevance scoring and sorting
 * - Last-used date sorting
 * - Real-time search results
 */

import { Credential, SecureNote, Tag } from '@/lib/db';

export interface SearchResult<T> {
  item: T;
  score: number;
  matchedFields: string[];
}

export interface SearchOptions {
  query: string;
  sortBy?: 'relevance' | 'lastUsed' | 'created' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
  includeCredentials?: boolean;
  includeNotes?: boolean;
  folderId?: string | null;
  tagIds?: string[];
}

export interface SearchResults {
  credentials: SearchResult<Credential>[];
  notes: SearchResult<SecureNote>[];
  totalResults: number;
  query: string;
  executionTime: number;
}

/**
 * SearchService class for advanced vault search
 */
export class SearchService {
  private static instance: SearchService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Perform comprehensive search across vault data
   */
  async search(
    credentials: Credential[],
    notes: SecureNote[],
    tags: Tag[],
    options: SearchOptions
  ): Promise<SearchResults> {
    const startTime = performance.now();
    
    const {
      query,
      sortBy = 'relevance',
      sortOrder = 'desc',
      includeCredentials = true,
      includeNotes = true,
      folderId,
      tagIds = []
    } = options;

    // If no query, return all items (filtered)
    if (!query.trim()) {
      const filteredCredentials = includeCredentials 
        ? this.applyFilters(credentials, folderId, tagIds)
        : [];
      const filteredNotes = includeNotes 
        ? this.applyFilters(notes, folderId, tagIds)
        : [];

      const credentialResults = filteredCredentials.map(item => ({
        item,
        score: 1,
        matchedFields: []
      }));

      const noteResults = filteredNotes.map(item => ({
        item,
        score: 1,
        matchedFields: []
      }));

      const results = {
        credentials: this.sortResults(credentialResults, sortBy, sortOrder),
        notes: this.sortResults(noteResults, sortBy, sortOrder),
        totalResults: credentialResults.length + noteResults.length,
        query,
        executionTime: performance.now() - startTime
      };

      return results;
    }

    // Create tag lookup map for efficient tag name resolution
    const tagMap = new Map(tags.map(tag => [tag.id, tag.name]));

    // Search credentials
    const credentialResults: SearchResult<Credential>[] = [];
    if (includeCredentials) {
      const filteredCredentials = this.applyFilters(credentials, folderId, tagIds);
      
      for (const credential of filteredCredentials) {
        const result = this.searchCredential(credential, query, tagMap);
        if (result.score > 0) {
          credentialResults.push(result);
        }
      }
    }

    // Search secure notes
    const noteResults: SearchResult<SecureNote>[] = [];
    if (includeNotes) {
      const filteredNotes = this.applyFilters(notes, folderId, tagIds);
      
      for (const note of filteredNotes) {
        const result = this.searchSecureNote(note, query, tagMap);
        if (result.score > 0) {
          noteResults.push(result);
        }
      }
    }

    // Sort results
    const sortedCredentials = this.sortResults(credentialResults, sortBy, sortOrder);
    const sortedNotes = this.sortResults(noteResults, sortBy, sortOrder);

    const executionTime = performance.now() - startTime;

    return {
      credentials: sortedCredentials,
      notes: sortedNotes,
      totalResults: sortedCredentials.length + sortedNotes.length,
      query,
      executionTime
    };
  }

  /**
   * Search within a single credential
   */
  private searchCredential(
    credential: Credential,
    query: string,
    tagMap: Map<string, string>
  ): SearchResult<Credential> {
    const searchTerms = this.normalizeQuery(query);
    let totalScore = 0;
    const matchedFields: string[] = [];

    // Search in title (highest weight)
    const titleScore = this.calculateFieldScore(credential.title, searchTerms, 3.0);
    if (titleScore > 0) {
      totalScore += titleScore;
      matchedFields.push('title');
    }

    // Search in username (high weight)
    const usernameScore = this.calculateFieldScore(credential.username, searchTerms, 2.5);
    if (usernameScore > 0) {
      totalScore += usernameScore;
      matchedFields.push('username');
    }

    // Search in URL (high weight)
    const urlScore = this.calculateFieldScore(credential.url, searchTerms, 2.0);
    if (urlScore > 0) {
      totalScore += urlScore;
      matchedFields.push('url');
    }

    // Search in notes (medium weight)
    const notesScore = this.calculateFieldScore(credential.notes, searchTerms, 1.5);
    if (notesScore > 0) {
      totalScore += notesScore;
      matchedFields.push('notes');
    }

    // Search in tag names (medium weight)
    const tagNames = credential.tags
      .map(tagId => tagMap.get(tagId))
      .filter(Boolean) as string[];
    
    const tagScore = this.calculateFieldScore(tagNames.join(' '), searchTerms, 1.8);
    if (tagScore > 0) {
      totalScore += tagScore;
      matchedFields.push('tags');
    }

    return {
      item: credential,
      score: totalScore,
      matchedFields
    };
  }

  /**
   * Search within a single secure note
   */
  private searchSecureNote(
    note: SecureNote,
    query: string,
    tagMap: Map<string, string>
  ): SearchResult<SecureNote> {
    const searchTerms = this.normalizeQuery(query);
    let totalScore = 0;
    const matchedFields: string[] = [];

    // Search in title (highest weight)
    const titleScore = this.calculateFieldScore(note.title, searchTerms, 3.0);
    if (titleScore > 0) {
      totalScore += titleScore;
      matchedFields.push('title');
    }

    // Search in content (high weight)
    const contentScore = this.calculateFieldScore(note.content, searchTerms, 2.0);
    if (contentScore > 0) {
      totalScore += contentScore;
      matchedFields.push('content');
    }

    // Search in tag names (medium weight)
    const tagNames = note.tags
      .map(tagId => tagMap.get(tagId))
      .filter(Boolean) as string[];
    
    const tagScore = this.calculateFieldScore(tagNames.join(' '), searchTerms, 1.8);
    if (tagScore > 0) {
      totalScore += tagScore;
      matchedFields.push('tags');
    }

    return {
      item: note,
      score: totalScore,
      matchedFields
    };
  }

  /**
   * Calculate relevance score for a field
   */
  private calculateFieldScore(fieldValue: string, searchTerms: string[], weight: number): number {
    if (!fieldValue) return 0;

    const normalizedField = fieldValue.toLowerCase();
    let score = 0;

    for (const term of searchTerms) {
      if (normalizedField.includes(term)) {
        // Exact match gets higher score
        if (normalizedField === term) {
          score += 10 * weight;
        }
        // Word boundary match gets medium score
        else if (this.isWordBoundaryMatch(normalizedField, term)) {
          score += 5 * weight;
        }
        // Partial match gets lower score
        else {
          score += 2 * weight;
        }
      }
    }

    return score;
  }

  /**
   * Check if term matches at word boundaries
   */
  private isWordBoundaryMatch(text: string, term: string): boolean {
    const regex = new RegExp(`\\b${this.escapeRegExp(term)}\\b`, 'i');
    return regex.test(text);
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Normalize search query into terms
   */
  private normalizeQuery(query: string): string[] {
    return query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 0);
  }

  /**
   * Apply folder and tag filters
   */
  private applyFilters<T extends { folderId?: string; tags: string[] }>(
    items: T[],
    folderId?: string | null,
    tagIds: string[] = []
  ): T[] {
    let filtered = items.filter(item => {
      // Filter out deleted credentials
      if ('deletedAt' in item && (item as any).deletedAt) {
        return false;
      }
      return true;
    });

    // Apply folder filter
    if (folderId !== undefined && folderId !== null) {
      filtered = filtered.filter(item => item.folderId === folderId);
    }

    // Apply tag filter (must have ALL selected tags)
    if (tagIds.length > 0) {
      filtered = filtered.filter(item =>
        tagIds.every(tagId => item.tags.includes(tagId))
      );
    }

    return filtered;
  }

  /**
   * Sort search results
   */
  private sortResults<T>(
    results: SearchResult<T>[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): SearchResult<T>[] {
    const sorted = [...results].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          comparison = b.score - a.score; // Higher score first
          break;
        case 'lastUsed':
          const aLastUsed = ('lastUsed' in a.item && a.item.lastUsed) ? a.item.lastUsed as number : 0;
          const bLastUsed = ('lastUsed' in b.item && b.item.lastUsed) ? b.item.lastUsed as number : 0;
          comparison = bLastUsed - aLastUsed; // Most recent first by default
          break;
        case 'created':
          const aCreated = a.item.createdAt;
          const bCreated = b.item.createdAt;
          comparison = bCreated - aCreated; // Most recent first by default
          break;
        case 'alphabetical':
          const aTitle = ('title' in a.item) ? (a.item as any).title : '';
          const bTitle = ('title' in b.item) ? (b.item as any).title : '';
          comparison = aTitle.localeCompare(bTitle);
          break;
        default:
          comparison = b.score - a.score;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(
    credentials: Credential[],
    notes: SecureNote[],
    tags: Tag[],
    partialQuery: string,
    maxSuggestions: number = 5
  ): Promise<string[]> {
    if (!partialQuery.trim() || partialQuery.length < 2) {
      return [];
    }

    const suggestions = new Set<string>();
    const query = partialQuery.toLowerCase();

    // Collect suggestions from credential titles
    for (const credential of credentials) {
      if (credential.deletedAt) continue;
      
      if (credential.title.toLowerCase().includes(query)) {
        suggestions.add(credential.title);
      }
      if (credential.username.toLowerCase().includes(query)) {
        suggestions.add(credential.username);
      }
      if (credential.url.toLowerCase().includes(query)) {
        // Extract domain from URL for suggestions
        try {
          const domain = new URL(credential.url).hostname;
          if (domain.toLowerCase().includes(query)) {
            suggestions.add(domain);
          }
        } catch {
          // Invalid URL, use as-is
          if (credential.url.toLowerCase().includes(query)) {
            suggestions.add(credential.url);
          }
        }
      }
    }

    // Collect suggestions from note titles
    for (const note of notes) {
      if (note.title.toLowerCase().includes(query)) {
        suggestions.add(note.title);
      }
    }

    // Collect suggestions from tag names
    for (const tag of tags) {
      if (tag.name.toLowerCase().includes(query)) {
        suggestions.add(tag.name);
      }
    }

    return Array.from(suggestions)
      .slice(0, maxSuggestions)
      .sort((a, b) => a.localeCompare(b));
  }

  /**
   * Highlight search terms in text
   */
  highlightSearchTerms(text: string, query: string): string {
    if (!query.trim()) return text;

    const terms = this.normalizeQuery(query);
    let highlightedText = text;

    for (const term of terms) {
      const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    }

    return highlightedText;
  }
}

// Export singleton instance
export const searchService = SearchService.getInstance();