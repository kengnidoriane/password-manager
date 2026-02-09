/// <reference types="cypress" />

/**
 * Custom Cypress commands for Password Manager E2E tests
 */

/**
 * Login command - authenticates a user
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  
  // Wait for redirect to vault
  cy.url().should('include', '/vault');
});

/**
 * Register command - creates a new user account
 */
Cypress.Commands.add('register', (email: string, password: string) => {
  cy.visit('/register');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('input[name="confirmPassword"]').type(password);
  cy.get('button[type="submit"]').click();
  
  // Wait for recovery key display or redirect
  cy.url().should('match', /\/(vault|register)/);
});

/**
 * Clear IndexedDB - cleans up local storage between tests
 */
Cypress.Commands.add('clearIndexedDB', () => {
  cy.window().then((win) => {
    return new Promise<void>((resolve) => {
      const databases = ['PasswordManagerDB'];
      let completed = 0;
      
      databases.forEach((dbName) => {
        const request = win.indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => {
          completed++;
          if (completed === databases.length) {
            resolve();
          }
        };
        request.onerror = () => {
          completed++;
          if (completed === databases.length) {
            resolve();
          }
        };
      });
      
      // Fallback if no databases
      if (databases.length === 0) {
        resolve();
      }
    });
  });
});

/**
 * Wait for sync to complete
 */
Cypress.Commands.add('waitForSync', () => {
  // Wait for sync indicator to appear and disappear
  cy.get('[data-testid="sync-status"]', { timeout: 10000 }).should('exist');
  cy.get('[data-testid="sync-status"]').should('not.have.attr', 'data-syncing', 'true');
});

export {};
