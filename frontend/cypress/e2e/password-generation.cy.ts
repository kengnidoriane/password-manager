/**
 * E2E Test: Password Generation and Save Flow
 * Tests: Password generator with various options and saving to vault
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

describe('Password Generation and Save Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecureP@ssw0rd123!';

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.clearIndexedDB();
    
    // Register and login
    cy.register(testEmail, testPassword);
  });

  it('should generate password with default settings', () => {
    cy.visit('/generator');
    
    // Should show password generator
    cy.contains('Password Generator').should('be.visible');
    
    // Generate button should be visible
    cy.get('button').contains('Generate').click();
    
    // Should display generated password
    cy.get('[data-testid="generated-password"]').should('be.visible');
    cy.get('[data-testid="generated-password"]').invoke('text').then((password) => {
      expect(password).to.have.length.greaterThan(0);
    });
    
    // Should show strength meter
    cy.get('[data-testid="strength-meter"]').should('be.visible');
    cy.get('[data-testid="entropy-score"]').should('be.visible');
    cy.get('[data-testid="crack-time"]').should('be.visible');
  });

  it('should generate password with custom length', () => {
    cy.visit('/generator');
    
    // Set length to 20
    cy.get('input[name="length"]').clear().type('20');
    cy.get('button').contains('Generate').click();
    
    cy.get('[data-testid="generated-password"]').invoke('text').then((password) => {
      expect(password).to.have.length(20);
    });
  });

  it('should generate password with specific character types', () => {
    cy.visit('/generator');
    
    // Uncheck all except lowercase
    cy.get('input[name="includeUppercase"]').uncheck();
    cy.get('input[name="includeNumbers"]').uncheck();
    cy.get('input[name="includeSymbols"]').uncheck();
    cy.get('input[name="includeLowercase"]').check();
    
    cy.get('button').contains('Generate').click();
    
    cy.get('[data-testid="generated-password"]').invoke('text').then((password) => {
      // Should only contain lowercase letters
      expect(password).to.match(/^[a-z]+$/);
    });
  });

  it('should generate password with uppercase, numbers, and symbols', () => {
    cy.visit('/generator');
    
    // Check all character types
    cy.get('input[name="includeUppercase"]').check();
    cy.get('input[name="includeLowercase"]').check();
    cy.get('input[name="includeNumbers"]').check();
    cy.get('input[name="includeSymbols"]').check();
    
    cy.get('button').contains('Generate').click();
    
    cy.get('[data-testid="generated-password"]').invoke('text').then((password) => {
      // Should contain at least one of each type
      expect(password).to.match(/[A-Z]/); // uppercase
      expect(password).to.match(/[a-z]/); // lowercase
      expect(password).to.match(/[0-9]/); // numbers
      expect(password).to.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/); // symbols
    });
  });

  it('should exclude ambiguous characters when option is selected', () => {
    cy.visit('/generator');
    
    cy.get('input[name="excludeAmbiguous"]').check();
    cy.get('button').contains('Generate').click();
    
    cy.get('[data-testid="generated-password"]').invoke('text').then((password) => {
      // Should not contain ambiguous characters: 0, O, l, I, 1
      expect(password).to.not.match(/[0OlI1]/);
    });
  });

  it('should copy generated password to clipboard', () => {
    cy.visit('/generator');
    
    cy.get('button').contains('Generate').click();
    
    // Copy password
    cy.get('[data-testid="copy-generated-password"]').click();
    cy.contains('Copied to clipboard').should('be.visible');
  });

  it('should save generated password to new credential', () => {
    cy.visit('/generator');
    
    // Generate password
    cy.get('button').contains('Generate').click();
    
    let generatedPassword: string;
    cy.get('[data-testid="generated-password"]').invoke('text').then((password) => {
      generatedPassword = password;
    });
    
    // Click save to vault
    cy.get('button').contains('Save to Vault').click();
    
    // Should open credential form with password pre-filled
    cy.get('input[name="title"]').type('New Account');
    cy.get('input[name="username"]').type('newuser');
    cy.get('input[name="url"]').type('https://example.com');
    
    // Password should be pre-filled
    cy.get('input[name="password"]').should(($input) => {
      expect($input.val()).to.equal(generatedPassword);
    });
    
    cy.get('button[type="submit"]').contains('Save').click();
    
    // Should redirect to vault
    cy.url().should('include', '/vault');
    cy.contains('New Account').should('be.visible');
  });

  it('should regenerate different passwords each time', () => {
    cy.visit('/generator');
    
    const passwords: string[] = [];
    
    // Generate 5 passwords
    for (let i = 0; i < 5; i++) {
      cy.get('button').contains('Generate').click();
      cy.get('[data-testid="generated-password"]').invoke('text').then((password) => {
        passwords.push(password);
      });
    }
    
    // All passwords should be unique
    cy.wrap(passwords).then((pwds) => {
      const uniquePasswords = new Set(pwds);
      expect(uniquePasswords.size).to.equal(5);
    });
  });

  it('should enforce minimum length of 8 characters', () => {
    cy.visit('/generator');
    
    cy.get('input[name="length"]').clear().type('5');
    cy.get('button').contains('Generate').click();
    
    // Should show validation error
    cy.contains('Minimum length is 8').should('be.visible');
  });

  it('should enforce maximum length of 128 characters', () => {
    cy.visit('/generator');
    
    cy.get('input[name="length"]').clear().type('150');
    cy.get('button').contains('Generate').click();
    
    // Should show validation error
    cy.contains('Maximum length is 128').should('be.visible');
  });
});
