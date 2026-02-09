# Cypress End-to-End Tests

This directory contains end-to-end tests for the Password Manager application using Cypress.

## Test Coverage

The E2E test suite covers the following scenarios:

### 1. Complete User Journey (`user-journey.cy.ts`)
- User registration with master password
- Recovery key generation and display
- Adding credentials to vault
- Logout and login flow
- Credential retrieval and viewing
- Password reveal functionality
- Copy to clipboard
- Session timeout enforcement
- Invalid login handling

**Validates Requirements:** 1.1, 2.1, 2.5, 3.1, 3.2, 5.1

### 2. Password Generation (`password-generation.cy.ts`)
- Password generation with default settings
- Custom length configuration (8-128 characters)
- Character type selection (uppercase, lowercase, numbers, symbols)
- Excluding ambiguous characters
- Password strength analysis
- Entropy and crack time display
- Copy generated password
- Save generated password to vault
- Uniqueness of generated passwords
- Length validation

**Validates Requirements:** 4.1, 4.2, 4.3, 4.4, 4.5

### 3. Offline Mode and Sync (`offline-sync.cy.ts`)
- Offline indicator display
- Reading cached credentials offline
- Queueing changes when offline
- Automatic sync when back online
- Editing credentials offline
- Deleting credentials offline
- Conflict resolution (last-write-wins)
- Multi-device synchronization
- Sync status indicator
- Network error handling

**Validates Requirements:** 6.1, 6.2, 6.3, 6.4, 13.1, 13.2, 13.3, 13.4

### 4. Import and Export (`import-export.cy.ts`)
- Master password re-authentication for export
- CSV export format
- JSON export format
- Encrypted export with password
- Unencrypted export with security warning
- Audit logging of exports
- CSV import from various sources
- Duplicate credential detection
- Import validation
- Encryption of imported credentials
- Support for major password managers (Chrome, Firefox, etc.)
- Import progress indicator
- Export and re-import round trip

**Validates Requirements:** 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5

### 5. Security Dashboard (`security-dashboard.cy.ts`)
- Overall security score display
- Weak password detection
- Reused password detection
- Breach database checking
- Multi-factor security score calculation
- Actionable recommendations
- Password update workflow from dashboard
- Password age warnings
- Security trends over time
- Security report export
- Refresh security analysis
- Detailed password strength analysis

**Validates Requirements:** 8.1, 8.2, 8.3, 8.4, 8.5

## Running Tests

### Prerequisites

1. Ensure the backend server is running on `http://localhost:8080`
2. Ensure the frontend dev server is running on `http://localhost:3000`
3. Database should be accessible and migrations applied

### Commands

```bash
# Open Cypress Test Runner (interactive mode)
npm run cypress:open
# or
npm run test:e2e:open

# Run all tests headlessly
npm run cypress:headless
# or
npm run test:e2e

# Run specific test file
npx cypress run --spec "cypress/e2e/user-journey.cy.ts"

# Run tests in specific browser
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge
```

### Interactive Mode

The Cypress Test Runner provides:
- Visual test execution
- Time-travel debugging
- Automatic reloading on file changes
- Screenshot and video capture
- Network request inspection

### Headless Mode

Headless mode is ideal for:
- CI/CD pipelines
- Automated testing
- Performance testing
- Batch test execution

## Test Structure

```
cypress/
├── e2e/                          # Test files
│   ├── user-journey.cy.ts        # Complete user flow
│   ├── password-generation.cy.ts # Password generator
│   ├── offline-sync.cy.ts        # Offline and sync
│   ├── import-export.cy.ts       # Import/export flows
│   └── security-dashboard.cy.ts  # Security features
├── fixtures/                     # Test data files
├── support/                      # Custom commands and setup
│   ├── commands.ts               # Custom Cypress commands
│   └── e2e.ts                    # Global configuration
└── downloads/                    # Downloaded files during tests
```

## Custom Commands

The test suite includes custom Cypress commands for common operations:

### `cy.login(email, password)`
Logs in a user with the provided credentials.

```typescript
cy.login('test@example.com', 'SecureP@ssw0rd123!');
```

### `cy.register(email, password)`
Registers a new user account.

```typescript
cy.register('newuser@example.com', 'SecureP@ssw0rd123!');
```

### `cy.clearIndexedDB()`
Clears all IndexedDB databases used by the application.

```typescript
cy.clearIndexedDB();
```

### `cy.waitForSync()`
Waits for synchronization to complete.

```typescript
cy.waitForSync();
```

## Test Data

Tests use dynamically generated test data to avoid conflicts:

```typescript
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'SecureP@ssw0rd123!';
```

This ensures each test run uses unique credentials.

## Best Practices

1. **Isolation**: Each test is independent and cleans up after itself
2. **Deterministic**: Tests produce consistent results
3. **Fast**: Tests are optimized for speed
4. **Readable**: Tests are well-documented and easy to understand
5. **Maintainable**: Tests use custom commands and page objects

## Debugging

### Screenshots
Failed tests automatically capture screenshots in `cypress/screenshots/`

### Videos
Test runs are recorded and saved in `cypress/videos/` (disabled by default for speed)

### Browser DevTools
Use `.debug()` to pause test execution:

```typescript
cy.get('[data-testid="vault"]').debug();
```

### Logs
Cypress provides detailed command logs in the Test Runner

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run E2E Tests
  run: |
    npm run dev &
    npm run test:e2e
```

## Troubleshooting

### Tests Timing Out
- Increase timeout in `cypress.config.ts`
- Check if backend/frontend servers are running
- Verify network connectivity

### Flaky Tests
- Add explicit waits: `cy.wait()`
- Use `cy.waitForSync()` after mutations
- Check for race conditions

### Element Not Found
- Verify `data-testid` attributes exist
- Check if element is visible: `.should('be.visible')`
- Wait for element: `{ timeout: 10000 }`

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use descriptive test names
3. Add comments for complex scenarios
4. Update this README with new test coverage
5. Ensure tests are isolated and repeatable

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library Cypress](https://testing-library.com/docs/cypress-testing-library/intro/)
