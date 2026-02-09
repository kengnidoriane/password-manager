/**
 * E2E Test: Complete User Journey
 * Tests: register → add credential → logout → login → retrieve
 * Validates: Requirements 1.1, 2.1, 3.1, 3.2, 5.1
 */

describe('Complete User Journey', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecureP@ssw0rd123!';
  let recoveryKey: string;

  beforeEach(() => {
    // Clear all data before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.clearIndexedDB();
  });

  it('should complete full user journey: register → add credential → logout → login → retrieve', () => {
    // Step 1: Register a new account
    cy.visit('/register');
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('input[name="confirmPassword"]').type(testPassword);
    
    // Check password strength indicator
    cy.get('[data-testid="password-strength"]').should('be.visible');
    
    cy.get('button[type="submit"]').click();
    
    // Should show recovery key
    cy.contains('Recovery Key', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="recovery-key"]').invoke('text').then((text) => {
      recoveryKey = text.trim();
      expect(recoveryKey).to.have.length.greaterThan(20);
    });
    
    // Acknowledge recovery key and proceed
    cy.get('button').contains('I have saved my recovery key').click();
    
    // Should redirect to vault
    cy.url().should('include', '/vault');
    cy.contains('Your Vault').should('be.visible');

    // Step 2: Add a credential
    cy.get('button').contains('Add Credential').click();
    
    cy.get('input[name="title"]').type('GitHub Account');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('MyGitHubP@ss123');
    cy.get('input[name="url"]').type('https://github.com');
    cy.get('textarea[name="notes"]').type('My GitHub account for work projects');
    
    cy.get('button[type="submit"]').contains('Save').click();
    
    // Verify credential appears in vault
    cy.contains('GitHub Account').should('be.visible');
    cy.contains('testuser').should('be.visible');
    cy.contains('github.com').should('be.visible');

    // Step 3: Logout
    cy.get('[data-testid="user-menu"]').click();
    cy.get('button').contains('Logout').click();
    
    // Should redirect to login
    cy.url().should('include', '/login');

    // Step 4: Login again
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type(testPassword);
    cy.get('button[type="submit"]').click();
    
    // Should redirect to vault
    cy.url().should('include', '/vault');

    // Step 5: Retrieve the credential
    cy.contains('GitHub Account').should('be.visible');
    
    // Click on credential to view details
    cy.contains('GitHub Account').click();
    
    // Verify all fields are present
    cy.contains('testuser').should('be.visible');
    cy.contains('github.com').should('be.visible');
    cy.contains('My GitHub account for work projects').should('be.visible');
    
    // Test password reveal
    cy.get('[data-testid="password-field"]').should('have.attr', 'type', 'password');
    cy.get('[data-testid="toggle-password-visibility"]').click();
    cy.get('[data-testid="password-field"]').should('have.attr', 'type', 'text');
    cy.get('[data-testid="password-field"]').should('have.value', 'MyGitHubP@ss123');
    
    // Test copy to clipboard
    cy.get('[data-testid="copy-password"]').click();
    cy.contains('Copied to clipboard').should('be.visible');
  });

  it('should handle invalid login credentials', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('nonexistent@example.com');
    cy.get('input[name="password"]').type('WrongPassword123!');
    cy.get('button[type="submit"]').click();
    
    // Should show error message
    cy.contains('Invalid credentials').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('should enforce session timeout', () => {
    // Register and login
    cy.register(testEmail, testPassword);
    
    // Mock time passing (15 minutes)
    cy.clock();
    cy.tick(15 * 60 * 1000 + 1000); // 15 minutes + 1 second
    
    // Try to access vault
    cy.visit('/vault');
    
    // Should redirect to login due to session timeout
    cy.url().should('include', '/login');
    cy.contains('Session expired').should('be.visible');
  });
});
