/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login a user
     * @example cy.login('test@example.com', 'password123')
     */
    login(email: string, password: string): Chainable<void>;

    /**
     * Custom command to register a new user
     * @example cy.register('test@example.com', 'password123')
     */
    register(email: string, password: string): Chainable<void>;

    /**
     * Custom command to clear IndexedDB databases
     * @example cy.clearIndexedDB()
     */
    clearIndexedDB(): Chainable<void>;

    /**
     * Custom command to wait for sync to complete
     * @example cy.waitForSync()
     */
    waitForSync(): Chainable<void>;
  }
}

export {};
