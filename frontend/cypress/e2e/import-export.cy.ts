/**
 * E2E Test: Import and Export Flows
 * Tests: Vault import and export functionality
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5
 */

describe('Import and Export Flows', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecureP@ssw0rd123!';

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.clearIndexedDB();
    
    // Register and login
    cy.register(testEmail, testPassword);
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      // Add some test credentials
      cy.visit('/vault');
      
      cy.get('button').contains('Add Credential').click();
      cy.get('input[name="title"]').type('Export Test 1');
      cy.get('input[name="username"]').type('user1');
      cy.get('input[name="password"]').type('Pass1@123');
      cy.get('input[name="url"]').type('https://example1.com');
      cy.get('button[type="submit"]').click();
      
      cy.waitForSync();
      
      cy.get('button').contains('Add Credential').click();
      cy.get('input[name="title"]').type('Export Test 2');
      cy.get('input[name="username"]').type('user2');
      cy.get('input[name="password"]').type('Pass2@123');
      cy.get('input[name="url"]').type('https://example2.com');
      cy.get('button[type="submit"]').click();
      
      cy.waitForSync();
    });

    it('should require master password re-authentication for export', () => {
      cy.visit('/settings');
      cy.get('button').contains('Export Vault').click();
      
      // Should show re-authentication dialog
      cy.contains('Confirm Master Password').should('be.visible');
      cy.get('input[name="masterPassword"]').should('be.visible');
    });

    it('should export vault in CSV format', () => {
      cy.visit('/settings');
      cy.get('button').contains('Export Vault').click();
      
      // Re-authenticate
      cy.get('input[name="masterPassword"]').type(testPassword);
      cy.get('button').contains('Confirm').click();
      
      // Select CSV format
      cy.get('select[name="format"]').select('CSV');
      cy.get('button').contains('Export').click();
      
      // Should download file
      cy.readFile('cypress/downloads/vault-export.csv', { timeout: 10000 }).should('exist');
    });

    it('should export vault in JSON format', () => {
      cy.visit('/settings');
      cy.get('button').contains('Export Vault').click();
      
      // Re-authenticate
      cy.get('input[name="masterPassword"]').type(testPassword);
      cy.get('button').contains('Confirm').click();
      
      // Select JSON format
      cy.get('select[name="format"]').select('JSON');
      cy.get('button').contains('Export').click();
      
      // Should download file
      cy.readFile('cypress/downloads/vault-export.json', { timeout: 10000 }).should('exist');
    });

    it('should export with encryption', () => {
      cy.visit('/settings');
      cy.get('button').contains('Export Vault').click();
      
      // Re-authenticate
      cy.get('input[name="masterPassword"]').type(testPassword);
      cy.get('button').contains('Confirm').click();
      
      // Enable encryption
      cy.get('input[name="encrypted"]').check();
      cy.get('input[name="exportPassword"]').type('ExportP@ss123');
      cy.get('input[name="confirmExportPassword"]').type('ExportP@ss123');
      
      cy.get('button').contains('Export').click();
      
      // Should download encrypted file
      cy.readFile('cypress/downloads/vault-export.encrypted', { timeout: 10000 }).should('exist');
    });

    it('should show security warning for unencrypted export', () => {
      cy.visit('/settings');
      cy.get('button').contains('Export Vault').click();
      
      // Re-authenticate
      cy.get('input[name="masterPassword"]').type(testPassword);
      cy.get('button').contains('Confirm').click();
      
      // Uncheck encryption
      cy.get('input[name="encrypted"]').uncheck();
      
      // Should show warning
      cy.contains('Security Warning').should('be.visible');
      cy.contains('unencrypted').should('be.visible');
    });

    it('should log export event to audit log', () => {
      cy.visit('/settings');
      cy.get('button').contains('Export Vault').click();
      
      // Re-authenticate and export
      cy.get('input[name="masterPassword"]').type(testPassword);
      cy.get('button').contains('Confirm').click();
      cy.get('button').contains('Export').click();
      
      // Check audit log
      cy.visit('/audit');
      cy.contains('Vault exported').should('be.visible');
    });
  });

  describe('Import Functionality', () => {
    it('should import credentials from CSV file', () => {
      // Create test CSV file
      const csvContent = `title,username,password,url,notes
Import Test 1,importuser1,ImportP@ss1,https://import1.com,Test note 1
Import Test 2,importuser2,ImportP@ss2,https://import2.com,Test note 2`;
      
      cy.writeFile('cypress/fixtures/import-test.csv', csvContent);
      
      cy.visit('/settings');
      cy.get('button').contains('Import').click();
      
      // Upload file
      cy.get('input[type="file"]').selectFile('cypress/fixtures/import-test.csv');
      cy.get('button').contains('Import').click();
      
      // Should show import summary
      cy.contains('Import Summary').should('be.visible');
      cy.contains('2 credentials imported').should('be.visible');
      
      // Verify credentials in vault
      cy.visit('/vault');
      cy.contains('Import Test 1').should('be.visible');
      cy.contains('Import Test 2').should('be.visible');
    });

    it('should detect and handle duplicate credentials', () => {
      // Add existing credential
      cy.visit('/vault');
      cy.get('button').contains('Add Credential').click();
      cy.get('input[name="title"]').type('Duplicate Test');
      cy.get('input[name="username"]').type('dupuser');
      cy.get('input[name="password"]').type('DupP@ss123');
      cy.get('input[name="url"]').type('https://duplicate.com');
      cy.get('button[type="submit"]').click();
      
      cy.waitForSync();
      
      // Import file with duplicate
      const csvContent = `title,username,password,url,notes
Duplicate Test,dupuser,DupP@ss123,https://duplicate.com,Same credential`;
      
      cy.writeFile('cypress/fixtures/duplicate-test.csv', csvContent);
      
      cy.visit('/settings');
      cy.get('button').contains('Import').click();
      cy.get('input[type="file"]').selectFile('cypress/fixtures/duplicate-test.csv');
      cy.get('button').contains('Import').click();
      
      // Should show duplicate detection
      cy.contains('Duplicate detected').should('be.visible');
      
      // Should offer options
      cy.contains('Skip').should('be.visible');
      cy.contains('Merge').should('be.visible');
    });

    it('should validate imported entries', () => {
      // Create invalid CSV
      const csvContent = `title,username,password,url,notes
,invaliduser,Pass123,not-a-url,Invalid entry`;
      
      cy.writeFile('cypress/fixtures/invalid-test.csv', csvContent);
      
      cy.visit('/settings');
      cy.get('button').contains('Import').click();
      cy.get('input[type="file"]').selectFile('cypress/fixtures/invalid-test.csv');
      cy.get('button').contains('Import').click();
      
      // Should show validation errors
      cy.contains('Import Summary').should('be.visible');
      cy.contains('1 error').should('be.visible');
      cy.contains('Title is required').should('be.visible');
    });

    it('should encrypt imported credentials', () => {
      const csvContent = `title,username,password,url,notes
Encryption Test,encuser,EncP@ss123,https://encrypt.com,Test encryption`;
      
      cy.writeFile('cypress/fixtures/encrypt-test.csv', csvContent);
      
      cy.visit('/settings');
      cy.get('button').contains('Import').click();
      cy.get('input[type="file"]').selectFile('cypress/fixtures/encrypt-test.csv');
      cy.get('button').contains('Import').click();
      
      // Verify credential is encrypted in storage
      cy.window().then((win) => {
        const db = win.indexedDB.open('PasswordManagerDB');
        db.onsuccess = () => {
          const transaction = db.result.transaction(['credentials'], 'readonly');
          const store = transaction.objectStore('credentials');
          const request = store.getAll();
          
          request.onsuccess = () => {
            const credentials = request.result;
            const imported = credentials.find((c: any) => c.title === 'Encryption Test');
            
            // Password should be encrypted (not plain text)
            expect(imported.encryptedData).to.exist;
            expect(imported.encryptedData).to.not.equal('EncP@ss123');
          };
        };
      });
    });

    it('should support import from major password managers', () => {
      // Test Chrome CSV format
      const chromeCSV = `name,url,username,password
Chrome Test,https://chrome.com,chromeuser,ChromeP@ss123`;
      
      cy.writeFile('cypress/fixtures/chrome-import.csv', chromeCSV);
      
      cy.visit('/settings');
      cy.get('button').contains('Import').click();
      cy.get('select[name="source"]').select('Chrome');
      cy.get('input[type="file"]').selectFile('cypress/fixtures/chrome-import.csv');
      cy.get('button').contains('Import').click();
      
      cy.contains('1 credential imported').should('be.visible');
      
      cy.visit('/vault');
      cy.contains('Chrome Test').should('be.visible');
    });

    it('should show import progress for large files', () => {
      // Create large CSV with 100 entries
      let csvContent = 'title,username,password,url,notes\n';
      for (let i = 1; i <= 100; i++) {
        csvContent += `Entry ${i},user${i},Pass${i}@123,https://example${i}.com,Note ${i}\n`;
      }
      
      cy.writeFile('cypress/fixtures/large-import.csv', csvContent);
      
      cy.visit('/settings');
      cy.get('button').contains('Import').click();
      cy.get('input[type="file"]').selectFile('cypress/fixtures/large-import.csv');
      cy.get('button').contains('Import').click();
      
      // Should show progress indicator
      cy.get('[data-testid="import-progress"]').should('be.visible');
      cy.contains('Importing...').should('be.visible');
      
      // Should complete
      cy.contains('100 credentials imported', { timeout: 30000 }).should('be.visible');
    });
  });

  describe('Export and Re-import', () => {
    it('should successfully export and re-import vault', () => {
      // Add credentials
      cy.visit('/vault');
      cy.get('button').contains('Add Credential').click();
      cy.get('input[name="title"]').type('Round Trip Test');
      cy.get('input[name="username"]').type('roundtripuser');
      cy.get('input[name="password"]').type('RoundTripP@ss123');
      cy.get('input[name="url"]').type('https://roundtrip.com');
      cy.get('textarea[name="notes"]').type('Test round trip');
      cy.get('button[type="submit"]').click();
      
      cy.waitForSync();
      
      // Export
      cy.visit('/settings');
      cy.get('button').contains('Export Vault').click();
      cy.get('input[name="masterPassword"]').type(testPassword);
      cy.get('button').contains('Confirm').click();
      cy.get('select[name="format"]').select('JSON');
      cy.get('button').contains('Export').click();
      
      // Clear vault
      cy.visit('/vault');
      cy.contains('Round Trip Test').click();
      cy.get('button').contains('Delete').click();
      cy.get('button').contains('Confirm').click();
      
      // Re-import
      cy.visit('/settings');
      cy.get('button').contains('Import').click();
      cy.get('input[type="file"]').selectFile('cypress/downloads/vault-export.json');
      cy.get('button').contains('Import').click();
      
      // Verify credential is back
      cy.visit('/vault');
      cy.contains('Round Trip Test').should('be.visible');
      cy.contains('roundtripuser').should('be.visible');
    });
  });
});
