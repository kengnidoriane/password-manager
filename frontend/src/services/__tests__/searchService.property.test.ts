/**
 * Property-Based Tests for SearchService
 * 
 * **Feature: password-manager, Property 19: Search across all fields**
 * **Validates: Requirements 5.1**
 * 
 * Tests that search functionality works correctly across all searchable fields
 * using property-based testing to verify behavior across many inputs.
 */

import fc from 'fast-check';
import { SearchService } from '../searchService';
import { Credential, SecureNote, Tag } from '@/lib/db';

describe('SearchService Property Tests', () => {
  let searchService: SearchService;

  beforeEach(() => {
    searchService = SearchService.getInstance();
  });

  /**
   * **Feature: password-manager, Property 19: Search across all fields**
   * **Validates: Requirements 5.1**
   * 
   * Property: For any search query and vault data, if a credential contains the query
   * in any of its searchable fields (title, username, URL, notes, or tag names),
   * then that credential should appear in the search results.
   */
  test('Property 19: Search across all fields - credentials containing query in any field should be found', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test data
        fc.record({
          // Generate a search query (non-empty string)
          query: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          
          // Generate credentials with the query potentially in different fields
          credentials: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 16 }),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              username: fc.string({ minLength: 1, maxLength: 30 }),
              password: fc.string({ minLength: 8, maxLength: 50 }),
              url: fc.string({ minLength: 1, maxLength: 100 }),
              notes: fc.string({ maxLength: 200 }),
              folderId: fc.option(fc.string({ minLength: 1, maxLength: 16 }), { nil: undefined }),
              tags: fc.array(fc.string({ minLength: 1, maxLength: 16 }), { maxLength: 5 }),
              createdAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              updatedAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              lastUsed: fc.option(fc.integer({ min: 1000000000000, max: Date.now() }), { nil: undefined }),
              version: fc.integer({ min: 1, max: 10 }),
              deletedAt: fc.option(fc.integer({ min: 1000000000000, max: Date.now() }), { nil: undefined })
            }),
            { minLength: 0, maxLength: 20 }
          ),
          
          // Generate tags
          tags: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 16 }),
              name: fc.string({ minLength: 1, maxLength: 30 }),
              color: fc.string({ minLength: 1, maxLength: 10 }),
              createdAt: fc.integer({ min: 1000000000000, max: Date.now() })
            }),
            { minLength: 0, maxLength: 10 }
          ),
          
          // Generate secure notes
          notes: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 16 }),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              content: fc.string({ minLength: 1, maxLength: 500 }),
              folderId: fc.option(fc.string({ minLength: 1, maxLength: 16 }), { nil: undefined }),
              tags: fc.array(fc.string({ minLength: 1, maxLength: 16 }), { maxLength: 5 }),
              createdAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              updatedAt: fc.integer({ min: 1000000000000, max: Date.now() })
            }),
            { minLength: 0, maxLength: 10 }
          )
        }),
        
        async (testData) => {
          const { query, credentials, tags, notes } = testData;
          
          // Filter out deleted credentials for this test
          const activeCredentials = credentials.filter(c => !c.deletedAt);
          
          // Create a credential that definitely contains the query in the title
          const matchingCredential: Credential = {
            id: 'test-match-id',
            title: `Test ${query} Title`,
            username: 'testuser',
            password: 'testpassword123',
            url: 'https://example.com',
            notes: 'Test notes',
            folderId: undefined,
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1
          };
          
          // Add the matching credential to our test data
          const testCredentials = [...activeCredentials, matchingCredential];
          
          // Perform search
          const searchResults = await searchService.search(
            testCredentials,
            notes,
            tags,
            {
              query,
              sortBy: 'relevance',
              sortOrder: 'desc',
              includeCredentials: true,
              includeNotes: true
            }
          );
          
          // The matching credential should be found
          const foundMatchingCredential = searchResults.credentials.find(
            result => result.item.id === 'test-match-id'
          );
          
          expect(foundMatchingCredential).toBeDefined();
          expect(foundMatchingCredential!.score).toBeGreaterThan(0);
          expect(foundMatchingCredential!.matchedFields).toContain('title');
          
          // All returned credentials should have a positive score
          searchResults.credentials.forEach(result => {
            expect(result.score).toBeGreaterThan(0);
            expect(result.matchedFields.length).toBeGreaterThan(0);
          });
          
          // All returned notes should have a positive score
          searchResults.notes.forEach(result => {
            expect(result.score).toBeGreaterThan(0);
            expect(result.matchedFields.length).toBeGreaterThan(0);
          });
          
          // Total results should match the sum of credentials and notes
          expect(searchResults.totalResults).toBe(
            searchResults.credentials.length + searchResults.notes.length
          );
          
          // Query should be preserved
          expect(searchResults.query).toBe(query);
          
          // Execution time should be reasonable (less than 1 second)
          expect(searchResults.executionTime).toBeLessThan(1000);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in requirements
    );
  });

  /**
   * Additional property test: Search should find credentials with query in username field
   */
  test('Property 19: Search finds credentials with query in username field', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          query: fc.string({ minLength: 2, maxLength: 10 }).filter(s => s.trim().length > 1),
          baseCredentials: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 16 }),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              username: fc.string({ minLength: 1, maxLength: 30 }),
              password: fc.string({ minLength: 8, maxLength: 50 }),
              url: fc.string({ minLength: 1, maxLength: 100 }),
              notes: fc.string({ maxLength: 200 }),
              folderId: fc.option(fc.string({ minLength: 1, maxLength: 16 }), { nil: undefined }),
              tags: fc.array(fc.string({ minLength: 1, maxLength: 16 }), { maxLength: 3 }),
              createdAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              updatedAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              version: fc.integer({ min: 1, max: 5 })
            }),
            { maxLength: 10 }
          )
        }),
        
        async (testData) => {
          const { query, baseCredentials } = testData;
          
          // Create a credential with the query in the username
          const usernameMatchCredential: Credential = {
            id: 'username-match-id',
            title: 'Test Title',
            username: `user_${query}_test`,
            password: 'testpassword123',
            url: 'https://example.com',
            notes: 'Test notes',
            folderId: undefined,
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1
          };
          
          const testCredentials = [...baseCredentials, usernameMatchCredential];
          
          const searchResults = await searchService.search(
            testCredentials,
            [],
            [],
            {
              query,
              includeCredentials: true,
              includeNotes: false
            }
          );
          
          // Should find the credential with matching username
          const foundCredential = searchResults.credentials.find(
            result => result.item.id === 'username-match-id'
          );
          
          expect(foundCredential).toBeDefined();
          expect(foundCredential!.matchedFields).toContain('username');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Search should find credentials with query in URL field
   */
  test('Property 19: Search finds credentials with query in URL field', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          query: fc.string({ minLength: 3, maxLength: 15 }).filter(s => s.trim().length > 2),
          baseCredentials: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 16 }),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              username: fc.string({ minLength: 1, maxLength: 30 }),
              password: fc.string({ minLength: 8, maxLength: 50 }),
              url: fc.string({ minLength: 1, maxLength: 100 }),
              notes: fc.string({ maxLength: 200 }),
              folderId: fc.option(fc.string({ minLength: 1, maxLength: 16 }), { nil: undefined }),
              tags: fc.array(fc.string({ minLength: 1, maxLength: 16 }), { maxLength: 3 }),
              createdAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              updatedAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              version: fc.integer({ min: 1, max: 5 })
            }),
            { maxLength: 10 }
          )
        }),
        
        async (testData) => {
          const { query, baseCredentials } = testData;
          
          // Create a credential with the query in the URL
          const urlMatchCredential: Credential = {
            id: 'url-match-id',
            title: 'Test Title',
            username: 'testuser',
            password: 'testpassword123',
            url: `https://${query}.example.com`,
            notes: 'Test notes',
            folderId: undefined,
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1
          };
          
          const testCredentials = [...baseCredentials, urlMatchCredential];
          
          const searchResults = await searchService.search(
            testCredentials,
            [],
            [],
            {
              query,
              includeCredentials: true,
              includeNotes: false
            }
          );
          
          // Should find the credential with matching URL
          const foundCredential = searchResults.credentials.find(
            result => result.item.id === 'url-match-id'
          );
          
          expect(foundCredential).toBeDefined();
          expect(foundCredential!.matchedFields).toContain('url');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Search should find secure notes with query in content
   */
  test('Property 19: Search finds secure notes with query in content field', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          query: fc.string({ minLength: 3, maxLength: 15 }).filter(s => s.trim().length > 2),
          baseNotes: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 16 }),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              content: fc.string({ minLength: 1, maxLength: 200 }),
              folderId: fc.option(fc.string({ minLength: 1, maxLength: 16 }), { nil: undefined }),
              tags: fc.array(fc.string({ minLength: 1, maxLength: 16 }), { maxLength: 3 }),
              createdAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              updatedAt: fc.integer({ min: 1000000000000, max: Date.now() })
            }),
            { maxLength: 10 }
          )
        }),
        
        async (testData) => {
          const { query, baseNotes } = testData;
          
          // Create a note with the query in the content
          const contentMatchNote: SecureNote = {
            id: 'content-match-id',
            title: 'Test Note',
            content: `This note contains ${query} in the content.`,
            folderId: undefined,
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          const testNotes = [...baseNotes, contentMatchNote];
          
          const searchResults = await searchService.search(
            [],
            testNotes,
            [],
            {
              query,
              includeCredentials: false,
              includeNotes: true
            }
          );
          
          // Should find the note with matching content
          const foundNote = searchResults.notes.find(
            result => result.item.id === 'content-match-id'
          );
          
          expect(foundNote).toBeDefined();
          expect(foundNote!.matchedFields).toContain('content');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Search should find items with query in tag names
   */
  test('Property 19: Search finds items with query in tag names', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          query: fc.string({ minLength: 3, maxLength: 10 }).filter(s => s.trim().length > 2),
          tagId: fc.string({ minLength: 1, maxLength: 16 })
        }),
        
        async (testData) => {
          const { query, tagId } = testData;
          
          // Create a tag with the query in the name
          const matchingTag: Tag = {
            id: tagId,
            name: `tag-${query}-name`,
            color: '#blue',
            createdAt: Date.now()
          };
          
          // Create a credential that uses this tag
          const taggedCredential: Credential = {
            id: 'tagged-credential-id',
            title: 'Test Credential',
            username: 'testuser',
            password: 'testpassword123',
            url: 'https://example.com',
            notes: 'Test notes',
            folderId: undefined,
            tags: [tagId],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1
          };
          
          const searchResults = await searchService.search(
            [taggedCredential],
            [],
            [matchingTag],
            {
              query,
              includeCredentials: true,
              includeNotes: false
            }
          );
          
          // Should find the credential through its tag
          const foundCredential = searchResults.credentials.find(
            result => result.item.id === 'tagged-credential-id'
          );
          
          expect(foundCredential).toBeDefined();
          expect(foundCredential!.matchedFields).toContain('tags');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property test: Empty query should return all non-deleted items
   */
  test('Empty query returns all non-deleted items', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          credentials: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 16 }),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              username: fc.string({ minLength: 1, maxLength: 30 }),
              password: fc.string({ minLength: 8, maxLength: 50 }),
              url: fc.string({ minLength: 1, maxLength: 100 }),
              notes: fc.string({ maxLength: 200 }),
              folderId: fc.option(fc.string({ minLength: 1, maxLength: 16 }), { nil: undefined }),
              tags: fc.array(fc.string({ minLength: 1, maxLength: 16 }), { maxLength: 3 }),
              createdAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              updatedAt: fc.integer({ min: 1000000000000, max: Date.now() }),
              version: fc.integer({ min: 1, max: 5 }),
              deletedAt: fc.option(fc.integer({ min: 1000000000000, max: Date.now() }), { nil: undefined })
            }),
            { minLength: 1, maxLength: 10 }
          )
        }),
        
        async (testData) => {
          const { credentials } = testData;
          
          const searchResults = await searchService.search(
            credentials,
            [],
            [],
            {
              query: '', // Empty query
              includeCredentials: true,
              includeNotes: false
            }
          );
          
          // Should return all non-deleted credentials
          const expectedCount = credentials.filter(c => !c.deletedAt).length;
          expect(searchResults.credentials.length).toBe(expectedCount);
          
          // All returned items should have score of 1 (default for empty query)
          searchResults.credentials.forEach(result => {
            expect(result.score).toBe(1);
            expect(result.matchedFields).toEqual([]);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});