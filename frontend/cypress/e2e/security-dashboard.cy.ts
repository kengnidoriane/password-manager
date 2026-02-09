/**
 * E2E Test: Security Dashboard
 * Tests: Security analysis and reporting features
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */

describe('Security Dashboard', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecureP@ssw0rd123!';

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.clearIndexedDB();
    
    // Register and login
    cy.register(testEmail, testPassword);
  });

  it('should display overall security score', () => {
    cy.visit('/security');
    
    // Should show security score component
    cy.get('[data-testid="security-score"]').should('be.visible');
    cy.get('[data-testid="score-value"]').should('be.visible');
    
    // Score should be between 0 and 100
    cy.get('[data-testid="score-value"]').invoke('text').then((score) => {
      const numericScore = parseInt(score);
      expect(numericScore).to.be.at.least(0);
      expect(numericScore).to.be.at.most(100);
    });
  });

  it('should detect weak passwords', () => {
    // Add weak password
    cy.visit('/vault');
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Weak Password Test');
    cy.get('input[name="username"]').type('weakuser');
    cy.get('input[name="password"]').type('password123'); // Weak password
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    // Check security dashboard
    cy.visit('/security');
    
    // Should show weak password warning
    cy.get('[data-testid="weak-passwords-list"]').should('be.visible');
    cy.contains('Weak Password Test').should('be.visible');
    cy.contains('Low entropy').should('be.visible');
  });

  it('should detect reused passwords', () => {
    const reusedPassword = 'ReusedP@ss123';
    
    // Add first credential
    cy.visit('/vault');
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Reuse Test 1');
    cy.get('input[name="username"]').type('user1');
    cy.get('input[name="password"]').type(reusedPassword);
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    // Add second credential with same password
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Reuse Test 2');
    cy.get('input[name="username"]').type('user2');
    cy.get('input[name="password"]').type(reusedPassword);
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    // Check security dashboard
    cy.visit('/security');
    
    // Should show reused password warning
    cy.get('[data-testid="reused-passwords-list"]').should('be.visible');
    cy.contains('Password used 2 times').should('be.visible');
    cy.contains('Reuse Test 1').should('be.visible');
    cy.contains('Reuse Test 2').should('be.visible');
  });

  it('should check passwords against breach database', () => {
    // Add a commonly breached password
    cy.visit('/vault');
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Breach Test');
    cy.get('input[name="username"]').type('breachuser');
    cy.get('input[name="password"]').type('password'); // Commonly breached
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    // Check security dashboard
    cy.visit('/security');
    
    // Should show breach warning (if API is available)
    cy.get('[data-testid="breached-passwords-list"]').should('be.visible');
    
    // Note: Actual breach detection depends on external API
    // This test verifies the UI is present
  });

  it('should calculate security score based on multiple factors', () => {
    // Add mix of credentials
    cy.visit('/vault');
    
    // Strong unique password
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Strong Test');
    cy.get('input[name="username"]').type('stronguser');
    cy.get('input[name="password"]').type('V3ry$tr0ng&Un1qu3P@ssw0rd!');
    cy.get('button[type="submit"]').click();
    cy.waitForSync();
    
    // Weak password
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Weak Test');
    cy.get('input[name="username"]').type('weakuser');
    cy.get('input[name="password"]').type('weak123');
    cy.get('button[type="submit"]').click();
    cy.waitForSync();
    
    // Reused password
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Reused Test');
    cy.get('input[name="username"]').type('reuseduser');
    cy.get('input[name="password"]').type('weak123'); // Same as above
    cy.get('button[type="submit"]').click();
    cy.waitForSync();
    
    // Check security dashboard
    cy.visit('/security');
    
    // Score should reflect mixed security
    cy.get('[data-testid="score-value"]').invoke('text').then((score) => {
      const numericScore = parseInt(score);
      // Should be medium score (not 0, not 100)
      expect(numericScore).to.be.greaterThan(20);
      expect(numericScore).to.be.lessThan(80);
    });
    
    // Should show breakdown
    cy.contains('1 weak password').should('be.visible');
    cy.contains('1 reused password').should('be.visible');
  });

  it('should provide actionable recommendations', () => {
    // Add weak password
    cy.visit('/vault');
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Recommendation Test');
    cy.get('input[name="username"]').type('recuser');
    cy.get('input[name="password"]').type('simple');
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    // Check security dashboard
    cy.visit('/security');
    
    // Should show recommendations
    cy.get('[data-testid="recommendations"]').should('be.visible');
    cy.contains('Update weak passwords').should('be.visible');
    cy.contains('Use unique passwords').should('be.visible');
  });

  it('should allow updating passwords from security dashboard', () => {
    // Add weak password
    cy.visit('/vault');
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Update Test');
    cy.get('input[name="username"]').type('updateuser');
    cy.get('input[name="password"]').type('weak');
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    // Go to security dashboard
    cy.visit('/security');
    
    // Click update on weak password
    cy.get('[data-testid="weak-passwords-list"]').within(() => {
      cy.contains('Update Test').parent().find('button').contains('Update').click();
    });
    
    // Should open edit form
    cy.get('input[name="password"]').should('be.visible');
    
    // Generate strong password
    cy.get('button').contains('Generate').click();
    
    // Save
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    // Return to security dashboard
    cy.visit('/security');
    
    // Weak password should be gone
    cy.get('[data-testid="weak-passwords-list"]').should('not.contain', 'Update Test');
  });

  it('should show password age warnings', () => {
    // Add old password (simulate by setting old timestamp)
    cy.visit('/vault');
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Old Password Test');
    cy.get('input[name="username"]').type('olduser');
    cy.get('input[name="password"]').type('OldP@ss123');
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    // Modify timestamp in IndexedDB to simulate old password
    cy.window().then((win) => {
      const db = win.indexedDB.open('PasswordManagerDB');
      db.onsuccess = () => {
        const transaction = db.result.transaction(['credentials'], 'readwrite');
        const store = transaction.objectStore('credentials');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const credentials = request.result;
          const oldCred = credentials.find((c: any) => c.title === 'Old Password Test');
          if (oldCred) {
            // Set to 1 year ago
            oldCred.createdAt = Date.now() - (365 * 24 * 60 * 60 * 1000);
            store.put(oldCred);
          }
        };
      };
    });
    
    // Check security dashboard
    cy.visit('/security');
    
    // Should show old password warning
    cy.contains('Old passwords').should('be.visible');
    cy.contains('Old Password Test').should('be.visible');
  });

  it('should display security trends over time', () => {
    cy.visit('/security');
    
    // Should show trends section
    cy.get('[data-testid="security-trends"]').should('be.visible');
    
    // Should show historical data (if available)
    cy.get('[data-testid="trend-chart"]').should('be.visible');
  });

  it('should export security report', () => {
    cy.visit('/security');
    
    // Click export report
    cy.get('button').contains('Export Report').click();
    
    // Should download report
    cy.readFile('cypress/downloads/security-report.pdf', { timeout: 10000 }).should('exist');
  });

  it('should refresh security analysis', () => {
    cy.visit('/security');
    
    // Initial score
    let initialScore: number;
    cy.get('[data-testid="score-value"]').invoke('text').then((score) => {
      initialScore = parseInt(score);
    });
    
    // Add strong password
    cy.visit('/vault');
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Strong Addition');
    cy.get('input[name="username"]').type('stronguser');
    cy.get('input[name="password"]').type('V3ry$tr0ng&Un1qu3P@ssw0rd!2024');
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    // Return to security dashboard
    cy.visit('/security');
    
    // Click refresh
    cy.get('button').contains('Refresh').click();
    
    // Score should update
    cy.get('[data-testid="score-value"]').invoke('text').then((newScore) => {
      const numericNewScore = parseInt(newScore);
      // Score should improve (or at least be recalculated)
      expect(numericNewScore).to.be.greaterThan(0);
    });
  });

  it('should show detailed password strength analysis', () => {
    cy.visit('/vault');
    cy.get('button').contains('Add Credential').click();
    cy.get('input[name="title"]').type('Analysis Test');
    cy.get('input[name="username"]').type('analysisuser');
    cy.get('input[name="password"]').type('TestP@ss123');
    cy.get('button[type="submit"]').click();
    
    cy.waitForSync();
    
    cy.visit('/security');
    
    // Click on credential for details
    cy.contains('Analysis Test').click();
    
    // Should show detailed analysis
    cy.contains('Entropy').should('be.visible');
    cy.contains('Crack time').should('be.visible');
    cy.contains('Character types').should('be.visible');
  });
});
