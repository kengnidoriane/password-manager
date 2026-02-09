/**
 * E2E Test: Offline Mode and Sync
 * Tests: Offline functionality and synchronization
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 13.1, 13.2, 13.3, 13.4
 */

describe('Offline Mode and Sync', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecureP@ssw0rd123!';

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.clearIndexedDB();
    
    // Register and login
    cy.register(testEmail, testPassword);
  });

  it('should display offline indicator when network is unavailable', () => {
    cy.visit('/vault');
    
    // Go offline
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false);
      win.dispatchEvent(new Event('offline'));
    });
    
    // Should show offline indicator
    cy.get('[data-testid="offline-indicator"]').should('be.visible');
    cy.contains('Offline').should('be.visible');
  });

  it('should allow reading cached credentials when offline', () => {
    cy.visit('/vault');
    
    // Add a credential while online
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Offline Test');
    cy.get('input[name="username"]').type('offlineuser');
    cy.get('input[name="password"]').type('OfflineP@ss123');
    cy.get('button[type="submit"]').click();
    
    // Wait for sync
    cy.waitForSync();
    
    // Go offline
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false);
      win.dispatchEvent(new Event('offline'));
    });
    
    // Reload page
    cy.reload();
    
    // Should still see the credential
    cy.contains('Offline Test').should('be.visible');
    cy.contains('offlineuser').should('be.visible');
  });

  it('should queue changes when offline and sync when back online', () => {
    cy.visit('/vault');
    
    // Go offline
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false);
      win.dispatchEvent(new Event('offline'));
    });
    
    // Add credential while offline
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Queued Credential');
    cy.get('input[name="username"]').type('queueduser');
    cy.get('input[name="password"]').type('QueuedP@ss123');
    cy.get('button[type="submit"]').click();
    
    // Should show queued indicator
    cy.get('[data-testid="sync-status"]').should('contain', 'Pending');
    
    // Go back online
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(true);
      win.dispatchEvent(new Event('online'));
    });
    
    // Should sync automatically
    cy.waitForSync();
    cy.get('[data-testid="sync-status"]').should('contain', 'Synced');
  });

  it('should allow editing credentials offline', () => {
    cy.visit('/vault');
    
    // Add credential while online
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Edit Test');
    cy.get('input[name="username"]').type('edituser');
    cy.get('input[name="password"]').type('EditP@ss123');
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    // Go offline
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false);
      win.dispatchEvent(new Event('offline'));
    });
    
    // Edit credential
    cy.contains('Edit Test').click();
    cy.get('button').contains('Edit').click();
    cy.get('input[name="username"]').clear().type('editeduser');
    cy.get('button[type="submit"]').click();
    
    // Should show updated username
    cy.contains('editeduser').should('be.visible');
    
    // Should show pending sync
    cy.get('[data-testid="sync-status"]').should('contain', 'Pending');
  });

  it('should allow deleting credentials offline', () => {
    cy.visit('/vault');
    
    // Add credential while online
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Delete Test');
    cy.get('input[name="username"]').type('deleteuser');
    cy.get('input[name="password"]').type('DeleteP@ss123');
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    // Go offline
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false);
      win.dispatchEvent(new Event('offline'));
    });
    
    // Delete credential
    cy.contains('Delete Test').click();
    cy.get('button').contains('Delete').click();
    cy.get('button').contains('Confirm').click();
    
    // Should not show credential
    cy.contains('Delete Test').should('not.exist');
    
    // Should show pending sync
    cy.get('[data-testid="sync-status"]').should('contain', 'Pending');
  });

  it('should handle sync conflicts with last-write-wins', () => {
    cy.visit('/vault');
    
    // Add credential
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Conflict Test');
    cy.get('input[name="username"]').type('conflictuser');
    cy.get('input[name="password"]').type('ConflictP@ss123');
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    // Simulate conflict by modifying on another device
    // (In real scenario, this would be done through API)
    
    // Edit locally
    cy.contains('Conflict Test').click();
    cy.get('button').contains('Edit').click();
    cy.get('input[name="username"]').clear().type('localuser');
    cy.get('button[type="submit"]').click();
    
    // Should sync and resolve conflict
    cy.waitForSync();
    
    // Should show conflict notification
    cy.contains('Sync conflict resolved').should('be.visible');
  });

  it('should sync changes across devices', () => {
    // Device 1: Add credential
    cy.visit('/vault');
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Multi-Device Test');
    cy.get('input[name="username"]').type('multiuser');
    cy.get('input[name="password"]').type('MultiP@ss123');
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    // Simulate Device 2: Clear local data and login
    cy.clearIndexedDB();
    cy.clearLocalStorage();
    
    cy.login(testEmail, testPassword);
    
    // Should download and decrypt latest vault data
    cy.contains('Multi-Device Test', { timeout: 10000 }).should('be.visible');
    cy.contains('multiuser').should('be.visible');
  });

  it('should show sync status indicator', () => {
    cy.visit('/vault');
    
    // Should show sync status
    cy.get('[data-testid="sync-status"]').should('be.visible');
    
    // Add credential to trigger sync
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Sync Status Test');
    cy.get('input[name="username"]').type('syncuser');
    cy.get('input[name="password"]').type('SyncP@ss123');
    cy.get('button[type="submit"]').click();
    
    // Should show syncing status
    cy.get('[data-testid="sync-status"]').should('have.attr', 'data-syncing', 'true');
    
    // Should complete sync
    cy.waitForSync();
    cy.get('[data-testid="sync-status"]').should('contain', 'Synced');
  });

  it('should handle network errors gracefully', () => {
    cy.visit('/vault');
    
    // Intercept sync request and force error
    cy.intercept('POST', '**/api/v1/vault/sync', {
      statusCode: 500,
      body: { error: 'Server error' },
    }).as('syncError');
    
    // Add credential
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Error Test');
    cy.get('input[name="username"]').type('erroruser');
    cy.get('input[name="password"]').type('ErrorP@ss123');
    cy.get('button[type="submit"]').click();
    
    // Should show error notification
    cy.contains('Sync failed').should('be.visible');
    
    // Should queue for retry
    cy.get('[data-testid="sync-status"]').should('contain', 'Pending');
  });
});
