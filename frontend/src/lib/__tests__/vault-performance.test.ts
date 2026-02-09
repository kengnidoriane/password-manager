/**
 * Performance tests for vault operations with large datasets
 * Tests vault operations with 1000+ credentials
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import Dexie from 'dexie';
import { Credential } from '@/types/vault';

// Mock IndexedDB database
class TestVaultDB extends Dexie {
  credentials!: Dexie.Table<Credential, string>;

  constructor() {
    super('TestVaultDB');
    this.version(1).stores({
      credentials: 'id, userId, title, url, username, folderId, *tags, createdAt, updatedAt, lastUsed, deletedAt'
    });
  }
}

describe('Vault Performance Tests', () => {
  let db: TestVaultDB;
  const LARGE_DATASET_SIZE = 1000;
  const PERFORMANCE_THRESHOLD_MS = 5000;

  beforeEach(async () => {
    db = new TestVaultDB();
    await db.delete();
    db = new TestVaultDB();
  });

  it('should create 1000+ credentials within performance threshold', async () => {
    const startTime = performance.now();

    const credentials: Credential[] = [];
    for (let i = 0; i < LARGE_DATASET_SIZE; i++) {
      credentials.push({
        id: `cred-${i}`,
        userId: 'test-user',
        title: `Credential ${i}`,
        username: `user${i}@example.com`,
        password: `encrypted-password-${i}`,
        url: `https://example${i % 100}.com`,
        notes: `Notes for credential ${i}`,
        folderId: i % 10 === 0 ? `folder-${i % 10}` : undefined,
        tags: [`tag-${i % 5}`, `category-${i % 3}`],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      });
    }

    await db.credentials.bulkAdd(credentials);

    const duration = performance.now() - startTime;
    console.log(`Created ${LARGE_DATASET_SIZE} credentials in ${duration.toFixed(2)}ms`);
    console.log(`Average time per credential: ${(duration / LARGE_DATASET_SIZE).toFixed(2)}ms`);

    const count = await db.credentials.count();
    expect(count).toBe(LARGE_DATASET_SIZE);
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
  });

  it('should retrieve large vault quickly', async () => {
    // Create test data
    await createTestCredentials(db, LARGE_DATASET_SIZE);

    const startTime = performance.now();
    const credentials = await db.credentials.toArray();
    const duration = performance.now() - startTime;

    console.log(`Retrieved ${credentials.length} credentials in ${duration.toFixed(2)}ms`);

    expect(credentials).toHaveLength(LARGE_DATASET_SIZE);
    expect(duration).toBeLessThan(1000); // Should be under 1 second
  });

  it('should search credentials efficiently in large vault', async () => {
    await createTestCredentials(db, LARGE_DATASET_SIZE);

    const searchTerm = 'example50';
    const startTime = performance.now();

    const results = await db.credentials
      .filter(cred => 
        cred.title.toLowerCase().includes(searchTerm) ||
        cred.url?.toLowerCase().includes(searchTerm) ||
        cred.username.toLowerCase().includes(searchTerm)
      )
      .toArray();

    const duration = performance.now() - startTime;

    console.log(`Searched ${LARGE_DATASET_SIZE} credentials in ${duration.toFixed(2)}ms`);
    console.log(`Found ${results.length} matches`);

    expect(results.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(500); // Should be under 500ms
  });

  it('should filter by tags efficiently', async () => {
    await createTestCredentials(db, LARGE_DATASET_SIZE);

    const targetTag = 'tag-2';
    const startTime = performance.now();

    const results = await db.credentials
      .filter(cred => cred.tags?.includes(targetTag))
      .toArray();

    const duration = performance.now() - startTime;

    console.log(`Filtered by tag in ${duration.toFixed(2)}ms`);
    console.log(`Found ${results.length} credentials with tag "${targetTag}"`);

    expect(results.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(500);
  });

  it('should update credentials efficiently in large vault', async () => {
    await createTestCredentials(db, LARGE_DATASET_SIZE);

    const startTime = performance.now();

    // Update 100 credentials
    const updateCount = 100;
    const updates = [];
    for (let i = 0; i < updateCount; i++) {
      updates.push({
        key: `cred-${i}`,
        changes: {
          password: `updated-password-${i}`,
          updatedAt: Date.now()
        }
      });
    }

    await db.credentials.bulkUpdate(updates);

    const duration = performance.now() - startTime;

    console.log(`Updated ${updateCount} credentials in ${duration.toFixed(2)}ms`);
    console.log(`Average time per update: ${(duration / updateCount).toFixed(2)}ms`);

    expect(duration).toBeLessThan(1000);
  });

  it('should delete credentials efficiently', async () => {
    await createTestCredentials(db, LARGE_DATASET_SIZE);

    const startTime = performance.now();

    // Delete 100 credentials
    const deleteCount = 100;
    const idsToDelete = Array.from({ length: deleteCount }, (_, i) => `cred-${i}`);
    await db.credentials.bulkDelete(idsToDelete);

    const duration = performance.now() - startTime;

    console.log(`Deleted ${deleteCount} credentials in ${duration.toFixed(2)}ms`);
    console.log(`Average time per delete: ${(duration / deleteCount).toFixed(2)}ms`);

    const remainingCount = await db.credentials.count();
    expect(remainingCount).toBe(LARGE_DATASET_SIZE - deleteCount);
    expect(duration).toBeLessThan(500);
  });

  it('should handle pagination efficiently', async () => {
    await createTestCredentials(db, LARGE_DATASET_SIZE);

    const pageSize = 50;
    const totalPages = Math.ceil(LARGE_DATASET_SIZE / pageSize);

    const startTime = performance.now();

    for (let page = 0; page < totalPages; page++) {
      await db.credentials
        .offset(page * pageSize)
        .limit(pageSize)
        .toArray();
    }

    const duration = performance.now() - startTime;

    console.log(`Paginated through ${totalPages} pages in ${duration.toFixed(2)}ms`);
    console.log(`Average time per page: ${(duration / totalPages).toFixed(2)}ms`);

    expect(duration).toBeLessThan(3000);
  });

  it('should sort large datasets efficiently', async () => {
    await createTestCredentials(db, LARGE_DATASET_SIZE);

    const startTime = performance.now();

    const sorted = await db.credentials
      .orderBy('updatedAt')
      .reverse()
      .toArray();

    const duration = performance.now() - startTime;

    console.log(`Sorted ${LARGE_DATASET_SIZE} credentials in ${duration.toFixed(2)}ms`);

    expect(sorted).toHaveLength(LARGE_DATASET_SIZE);
    expect(duration).toBeLessThan(1000);
  });

  it('should handle complex queries efficiently', async () => {
    await createTestCredentials(db, LARGE_DATASET_SIZE);

    const startTime = performance.now();

    // Complex query: filter by folder, tag, and search term
    const results = await db.credentials
      .filter(cred => 
        cred.folderId === 'folder-0' &&
        cred.tags?.includes('tag-1') &&
        cred.title.includes('Credential')
      )
      .toArray();

    const duration = performance.now() - startTime;

    console.log(`Complex query on ${LARGE_DATASET_SIZE} credentials in ${duration.toFixed(2)}ms`);
    console.log(`Found ${results.length} matches`);

    expect(duration).toBeLessThan(1000);
  });

  it('should measure memory usage with large vault', async () => {
    if (performance.memory) {
      const memoryBefore = performance.memory.usedJSHeapSize;

      await createTestCredentials(db, LARGE_DATASET_SIZE);
      const credentials = await db.credentials.toArray();

      const memoryAfter = performance.memory.usedJSHeapSize;
      const memoryUsedMB = (memoryAfter - memoryBefore) / (1024 * 1024);

      console.log(`Memory used for ${LARGE_DATASET_SIZE} credentials: ${memoryUsedMB.toFixed(2)}MB`);

      expect(credentials).toHaveLength(LARGE_DATASET_SIZE);
      expect(memoryUsedMB).toBeLessThan(50); // Should use less than 50MB
    } else {
      console.log('Memory measurement not available in this environment');
    }
  });
});

async function createTestCredentials(db: TestVaultDB, count: number): Promise<void> {
  const credentials: Credential[] = [];
  for (let i = 0; i < count; i++) {
    credentials.push({
      id: `cred-${i}`,
      userId: 'test-user',
      title: `Credential ${i}`,
      username: `user${i}@example.com`,
      password: `encrypted-password-${i}`,
      url: `https://example${i % 100}.com`,
      notes: `Notes for credential ${i}`,
      folderId: i % 10 === 0 ? `folder-${i % 10}` : undefined,
      tags: [`tag-${i % 5}`, `category-${i % 3}`],
      createdAt: Date.now() - (count - i) * 1000,
      updatedAt: Date.now() - (count - i) * 1000,
      version: 1
    });
  }
  await db.credentials.bulkAdd(credentials);
}
