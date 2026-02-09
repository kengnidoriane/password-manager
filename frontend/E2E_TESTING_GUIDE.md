# End-to-End Testing Guide

This guide provides comprehensive information about E2E testing for the Password Manager application using Cypress.

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Writing Tests](#writing-tests)
4. [Best Practices](#best-practices)
5. [Common Patterns](#common-patterns)
6. [Debugging](#debugging)
7. [CI/CD Integration](#cicd-integration)

## Overview

End-to-end tests validate the complete user workflows from the browser perspective. They test the integration between frontend, backend, and database, ensuring the application works as expected from a user's point of view.

### Test Coverage

Our E2E test suite covers:

- **User Authentication**: Registration, login, logout, session management
- **Vault Operations**: CRUD operations for credentials, folders, tags
- **Password Generation**: Various configurations and saving to vault
- **Offline Mode**: Offline functionality and synchronization
- **Import/Export**: Data portability and migration
- **Security Features**: Security dashboard, breach detection, password analysis

## Setup

### Prerequisites

```bash
# Install dependencies
cd frontend
npm install

# Ensure backend is running
cd ../backend
mvn spring-boot:run

# Ensure frontend is running
cd ../frontend
npm run dev
```

### Configuration

Cypress configuration is in `cypress.config.ts`:

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
  },
  env: {
    apiUrl: 'http://localhost:8080/api/v1',
  },
});
```

## Writing Tests

### Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.clearIndexedDB();
  });

  it('should perform specific action', () => {
    // Arrange
    cy.visit('/page');
    
    // Act
    cy.get('button').click();
    
    // Assert
    cy.contains('Expected Result').should('be.visible');
  });
});
```

### Using Custom Commands

```typescript
// Login
cy.login('test@example.com', 'password123');

// Register
cy.register('newuser@example.com', 'password123');

// Clear data
cy.clearIndexedDB();

// Wait for sync
cy.waitForSync();
```

### Test Data

Use dynamic test data to avoid conflicts:

```typescript
import { generateTestEmail, generateStrongPassword } from '../support/test-data';

const email = generateTestEmail();
const password = generateStrongPassword();
```

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on other tests:

```typescript
beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.clearIndexedDB();
});
```

### 2. Use data-testid Attributes

Prefer `data-testid` over CSS classes or IDs:

```typescript
// Good
cy.get('[data-testid="login-button"]').click();

// Avoid
cy.get('.btn-primary').click();
cy.get('#loginBtn').click();
```

### 3. Explicit Waits

Use explicit waits instead of arbitrary timeouts:

```typescript
// Good
cy.get('[data-testid="vault"]', { timeout: 10000 }).should('be.visible');

// Avoid
cy.wait(5000);
```

### 4. Assertions

Always include assertions to verify expected behavior:

```typescript
cy.get('[data-testid="credential-title"]')
  .should('be.visible')
  .and('contain', 'GitHub');
```

### 5. Network Stubbing

Stub external API calls when appropriate:

```typescript
cy.intercept('GET', '**/api/v1/vault', {
  statusCode: 200,
  body: { credentials: [] },
}).as('getVault');

cy.visit('/vault');
cy.wait('@getVault');
```

### 6. Error Handling

Test both success and failure scenarios:

```typescript
it('should handle invalid credentials', () => {
  cy.visit('/login');
  cy.get('input[name="email"]').type('invalid@example.com');
  cy.get('input[name="password"]').type('wrongpassword');
  cy.get('button[type="submit"]').click();
  
  cy.contains('Invalid credentials').should('be.visible');
});
```

## Common Patterns

### Authentication Flow

```typescript
describe('Authentication', () => {
  it('should complete registration and login', () => {
    const email = generateTestEmail();
    const password = generateStrongPassword();
    
    // Register
    cy.register(email, password);
    cy.url().should('include', '/vault');
    
    // Logout
    cy.get('[data-testid="user-menu"]').click();
    cy.get('button').contains('Logout').click();
    
    // Login
    cy.login(email, password);
    cy.url().should('include', '/vault');
  });
});
```

### Form Submission

```typescript
it('should add credential', () => {
  cy.visit('/vault');
  cy.get('button').contains('Add Credential').click();
  
  fillCredentialForm({
    title: 'Test Credential',
    username: 'testuser',
    password: 'TestP@ss123',
    url: 'https://example.com',
  });
  
  cy.get('button[type="submit"]').click();
  cy.contains('Test Credential').should('be.visible');
});
```

### File Upload

```typescript
it('should import credentials', () => {
  cy.writeFile('cypress/fixtures/import.csv', csvContent);
  
  cy.visit('/settings');
  cy.get('button').contains('Import').click();
  cy.get('input[type="file"]').selectFile('cypress/fixtures/import.csv');
  cy.get('button').contains('Import').click();
  
  cy.contains('Import successful').should('be.visible');
});
```

### Offline Testing

```typescript
it('should work offline', () => {
  cy.visit('/vault');
  
  // Go offline
  cy.window().then((win) => {
    cy.stub(win.navigator, 'onLine').value(false);
    win.dispatchEvent(new Event('offline'));
  });
  
  cy.get('[data-testid="offline-indicator"]').should('be.visible');
});
```

## Debugging

### Interactive Mode

Run tests in interactive mode for debugging:

```bash
npm run cypress:open
```

Features:
- Visual test execution
- Time-travel debugging
- Automatic reloading
- Screenshot capture
- Network inspection

### Debug Commands

```typescript
// Pause execution
cy.debug();

// Log to console
cy.log('Debug message');

// Take screenshot
cy.screenshot('debug-screenshot');

// Inspect element
cy.get('[data-testid="element"]').then(($el) => {
  console.log($el);
});
```

### Common Issues

#### Element Not Found

```typescript
// Add explicit wait
cy.get('[data-testid="element"]', { timeout: 10000 })
  .should('be.visible');
```

#### Flaky Tests

```typescript
// Wait for network requests
cy.intercept('POST', '**/api/v1/vault').as('saveVault');
cy.get('button').click();
cy.wait('@saveVault');
```

#### Timing Issues

```typescript
// Use retry-ability
cy.get('[data-testid="status"]')
  .should('have.text', 'Complete');
```

## CI/CD Integration

### GitHub Actions

The E2E tests run automatically in CI:

```yaml
- name: Run E2E Tests
  uses: cypress-io/github-action@v6
  with:
    working-directory: frontend
    browser: chrome
    wait-on: 'http://localhost:3000'
```

### Running Locally

Simulate CI environment:

```bash
# Start services
docker-compose up -d

# Run tests
npm run test:e2e

# Stop services
docker-compose down
```

### Test Reports

Test results are uploaded as artifacts:
- Screenshots (on failure)
- Videos (optional)
- Test reports (JSON/HTML)

## Performance Optimization

### Parallel Execution

Run tests in parallel for faster execution:

```bash
npx cypress run --parallel --record --key <key>
```

### Selective Testing

Run specific test files:

```bash
npx cypress run --spec "cypress/e2e/user-journey.cy.ts"
```

### Skip Tests

Temporarily skip tests:

```typescript
it.skip('should be implemented later', () => {
  // Test code
});
```

## Maintenance

### Updating Tests

When updating tests:
1. Ensure tests are isolated
2. Update documentation
3. Run full test suite
4. Check CI pipeline

### Adding New Tests

When adding new tests:
1. Follow existing patterns
2. Use custom commands
3. Add to appropriate test file
4. Update README

### Removing Tests

When removing tests:
1. Verify coverage is maintained
2. Update documentation
3. Check for dependencies

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library](https://testing-library.com/docs/cypress-testing-library/intro/)
- [Cypress Examples](https://github.com/cypress-io/cypress-example-recipes)

## Support

For issues or questions:
1. Check this guide
2. Review Cypress documentation
3. Check existing tests for examples
4. Ask the team

## Contributing

When contributing E2E tests:
1. Follow the style guide
2. Write descriptive test names
3. Add comments for complex logic
4. Ensure tests pass locally
5. Update documentation
