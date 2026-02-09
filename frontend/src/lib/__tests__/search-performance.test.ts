/**
 * Performance tests for search operations with large datasets
 * Tests search performance with 1000+ credentials
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import Dexie from 'dexie';
import { Credential } from '@/types/vault';

class TestSearchDB extends Dexie {
  credentials!: Dexie.Table<Credential, string>;

  constructor() {
    super('TestSearchDB');
    this.version(1).stores({
      credentials: 'id, userId, title, url, username, folderId, *tags, createdAt, updatedAt, lastUsed'
    });
  }
}

describe('Search Performance Tests', () => {
  let db: TestSearchDB;
  const LARGE_DATASET_SIZE = 1000;

  beforeEach(async () => {
    db = new TestSearchDB();
    await db.delete();
    db = new TestSearchDB();
    await createSearchableCredentials(db, LARGE_DATASET_SIZE);
  });

  it('should perform full-text search efficiently', async () => {
    const searchTerms = ['example', 'user', 'credential', 'test', 'website'];

    for (const term of searchTerms) {
      const startTime = performance.now();

      const results = await db.credentials
        .filter(cred =>
          cred.title.toLowerCase().includes(term.toLowerCase()) ||
          cred.url?.toLowerCase().includes(term.toLowerCase()) ||
          cred.username.toLowerCase().includes(term.toLowerCase()) ||
          cred.notes?.toLowerCase().includes(term.toLowerCase())
        )
        .toArray();

      const duration = performance.now() - startTime;

      console.log(`Search for "${term}" in ${LARGE_DATASET_SIZE} credentials: ${duration.toFixed(2)}ms (${results.length} results)`);

      expect(duration).toBeLessThan(500);
    }
  });

  it('should search by URL domain efficiently', async () => {
    const domain = 'example50.com';
    const startTime = performance.now();

    const results = await db.credentials
      .filter(cred => cred.url?.includes(domain))
      .toArray();

    const duration = performance.now() - startTime;

    console.log(`URL domain search in ${duration.toFixed(2)}ms (${results.length} results)`);

    expect(results.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(300);
  });

  it('should search by username efficiently', async () => {
    const username = 'user500';
    const startTime = performance.now();

    const results = await db.credentials
      .filter(cred => cred.username.includes(username))
      .toArray();

    const duration = performance.now() - startTime;

    console.log(`Username search in ${duration.toFixed(2)}ms (${results.length} results)`);

    expect(results.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(300);
  });

  it('should perform case-insensitive search efficiently', async () => {
    const searchTerm = 'CREDENTIAL';
    const startTime = performance.now();

    const results = await db.credentials
      .filter(cred => cred.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .toArray();

    const duration = performance.now() - startTime;

    console.log(`Case-insensitive search in ${duration.toFixed(2)}ms (${results.length} results)`);

    expect(results.length).toBe(LARGE_DATASET_SIZE);
    expect(duration).toBeLessThan(500);
  });

  it('should search with multiple filters efficiently', async () => {
    const startTime = performance.now();

    const results = await db.credentials
      .filter(cred =>
        cred.title.includes('Credential') &&
        cred.tags?.includes('work') &&
        cred.folderId === 'folder-1'
      )
      .toArray();

    const duration = performance.now() - startTime;

    console.log(`Multi-filter search in ${duration.toFixed(2)}ms (${results.length} results)`);

    expect(duration).toBeLessThan(500);
  });

  it('should search and sort efficiently', async () => {
    const searchTerm = 'example';
    const startTime = performance.now();

    const results = await db.credentials
      .filter(cred => cred.url?.includes(searchTerm))
      .sortBy('updatedAt');

    const duration = performance.now() - startTime;

    console.log(`Search and sort in ${duration.toFixed(2)}ms (${results.length} results)`);

    expect(results.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(800);
  });

  it('should perform fuzzy search efficiently', async () => {
    const searchTerm = 'crdntl'; // Fuzzy match for "credential"
    const startTime = performance.now();

    // Simple fuzzy search implementation
    const results = await db.credentials
      .filter(cred => {
        const title = cred.title.toLowerCase();
        let searchIndex = 0;
        for (const char of searchTerm.toLowerCase()) {
          searchIndex = title.indexOf(char, searchIndex);
          if (searchIndex === -1) return false;
          searchIndex++;
        }
        return true;
      })
      .toArray();

    const duration = performance.now() - startTime;

    console.log(`Fuzzy search in ${duration.toFixed(2)}ms (${results.length} results)`);

    expect(duration).toBeLessThan(1000);
  });

  it('should search with relevance scoring efficiently', async () => {
    const searchTerm = 'example';
    const startTime = performance.now();

    const results = await db.credentials.toArray();
    
    // Calculate relevance scores
    const scored = results.map(cred => {
      let score = 0;
      const term = searchTerm.toLowerCase();
      
      if (cred.title.toLowerCase().includes(term)) score += 10;
      if (cred.url?.toLowerCase().includes(term)) score += 5;
      if (cred.username.toLowerCase().includes(term)) score += 3;
      if (cred.notes?.toLowerCase().includes(term)) score += 1;
      
      return { credential: cred, score };
    });

    const filtered = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.credential);

    const duration = performance.now() - startTime;

    console.log(`Relevance-scored search in ${duration.toFixed(2)}ms (${filtered.length} results)`);

    expect(duration).toBeLessThan(1000);
  });

  it('should handle empty search results efficiently', async () => {
    const searchTerm = 'nonexistent-term-xyz123';
    const startTime = performance.now();

    const results = await db.credentials
      .filter(cred => cred.title.includes(searchTerm))
      .toArray();

    const duration = performance.now() - startTime;

    console.log(`Empty result search in ${duration.toFixed(2)}ms`);

    expect(results).toHaveLength(0);
    expect(duration).toBeLessThan(500);
  });

  it('should perform concurrent searches efficiently', async () => {
    const searchTerms = ['example', 'user', 'credential', 'website', 'test'];
    const startTime = performance.now();

    const promises = searchTerms.map(term =>
      db.credentials
        .filter(cred => cred.title.toLowerCase().includes(term.toLowerCase()))
        .toArray()
    );

    const results = await Promise.all(promises);

    const duration = performance.now() - startTime;

    console.log(`${searchTerms.length} concurrent searches in ${duration.toFixed(2)}ms`);
    results.forEach((result, i) => {
      console.log(`  "${searchTerms[i]}": ${result.length} results`);
    });

    expect(duration).toBeLessThan(1500);
  });

  it('should search with pagination efficiently', async () => {
    const searchTerm = 'credential';
    const pageSize = 50;
    const startTime = performance.now();

    const totalResults = await db.credentials
      .filter(cred => cred.title.includes(searchTerm))
      .count();

    const firstPage = await db.credentials
      .filter(cred => cred.title.includes(searchTerm))
      .limit(pageSize)
      .toArray();

    const duration = performance.now() - startTime;

    console.log(`Paginated search in ${duration.toFixed(2)}ms (${totalResults} total, showing ${firstPage.length})`);

    expect(firstPage.length).toBeLessThanOrEqualTo(pageSize);
    expect(duration).toBeLessThan(500);
  });

  it('should measure search index effectiveness', async () => {
    // Search using indexed field (title)
    const startTime1 = performance.now();
    const indexedResults = await db.credentials
      .where('title')
      .startsWithIgnoreCase('Credential')
      .toArray();
    const indexedDuration = performance.now() - startTime1;

    // Search using non-indexed field (notes)
    const startTime2 = performance.now();
    const nonIndexedResults = await db.credentials
      .filter(cred => cred.notes?.includes('Notes'))
      .toArray();
    const nonIndexedDuration = performance.now() - startTime2;

    console.log('Search index effectiveness:');
    console.log(`  Indexed field search: ${indexedDuration.toFixed(2)}ms (${indexedResults.length} results)`);
    console.log(`  Non-indexed field search: ${nonIndexedDuration.toFixed(2)}ms (${nonIndexedResults.length} results)`);

    expect(indexedDuration).toBeLessThan(300);
    expect(nonIndexedDuration).toBeLessThan(1000);
  });
});

async function createSearchableCredentials(db: TestSearchDB, count: number): Promise<void> {
  const credentials: Credential[] = [];
  const domains = ['example', 'test', 'demo', 'sample', 'website'];
  const categories = ['work', 'personal', 'finance', 'social', 'shopping'];

  for (let i = 0; i < count; i++) {
    const domain = domains[i % domains.length];
    const category = categories[i % categories.length];

    credentials.push({
      id: `cred-${i}`,
      userId: 'test-user',
      title: `Credential ${i} for ${domain}`,
      username: `user${i}@${domain}.com`,
      password: `encrypted-password-${i}`,
      url: `https://${domain}${i}.com`,
      notes: `Notes for credential ${i} in ${category} category`,
      folderId: i % 10 === 0 ? `folder-${i % 10}` : undefined,
      tags: [category, `tag-${i % 5}`],
      createdAt: Date.now() - (count - i) * 1000,
      updatedAt: Date.now() - (count - i) * 500,
      version: 1
    });
  }

  await db.credentials.bulkAdd(credentials);
}
