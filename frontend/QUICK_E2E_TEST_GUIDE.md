# Quick E2E Test Guide

## Prerequisites

Before running E2E tests, ensure the following services are running:

### 1. Database (PostgreSQL)
```bash
# Using Docker
docker run -d \
  --name postgres-test \
  -e POSTGRES_DB=passwordmanager \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15
```

### 2. Redis
```bash
# Using Docker
docker run -d \
  --name redis-test \
  -p 6379:6379 \
  redis:7-alpine
```

### 3. Backend Server
```bash
cd backend
mvn spring-boot:run
# Backend will start on http://localhost:8080
```

### 4. Frontend Server
```bash
cd frontend
npm run dev
# Frontend will start on http://localhost:3000
```

---

## Running Tests

### Interactive Mode (Recommended for Development)

```bash
cd frontend
npm run cypress:open
# or
npm run test:e2e:open
```

**Benefits:**
- Visual test execution
- Time-travel debugging
- Automatic reloading
- Easy debugging

### Headless Mode (CI/CD)

```bash
cd frontend
npm run cypress:headless
# or
npm run test:e2e
```

**Benefits:**
- Faster execution
- No GUI overhead
- Suitable for automation

---

## Running Specific Tests

### Single Test File

```bash
npx cypress run --spec "cypress/e2e/user-journey.cy.ts"
```

### Multiple Test Files

```bash
npx cypress run --spec "cypress/e2e/user-journey.cy.ts,cypress/e2e/password-generation.cy.ts"
```

### Specific Browser

```bash
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge
```

---

## Test Files

| File | Description | Requirements |
|------|-------------|--------------|
| `user-journey.cy.ts` | Complete user flow: register → add → logout → login → retrieve | 1.1, 2.1, 2.5, 3.1, 3.2, 5.1 |
| `password-generation.cy.ts` | Password generator with all options | 4.1, 4.2, 4.3, 4.4, 4.5 |
| `offline-sync.cy.ts` | Offline mode and synchronization | 6.1, 6.2, 6.3, 6.4, 13.1-13.4 |
| `import-export.cy.ts` | Import/export in CSV/JSON formats | 11.1-11.5, 12.1-12.5 |
| `security-dashboard.cy.ts` | Security analysis and reporting | 8.1, 8.2, 8.3, 8.4, 8.5 |

---

## Quick Troubleshooting

### Tests Fail to Start

**Problem:** Backend or frontend not running

**Solution:**
```bash
# Check if services are running
curl http://localhost:8080/actuator/health  # Backend
curl http://localhost:3000                   # Frontend

# Restart services if needed
```

### Database Connection Errors

**Problem:** PostgreSQL not accessible

**Solution:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart if needed
docker restart postgres-test
```

### Redis Connection Errors

**Problem:** Redis not accessible

**Solution:**
```bash
# Check Redis is running
docker ps | grep redis

# Restart if needed
docker restart redis-test
```

### Element Not Found Errors

**Problem:** Timing issues or missing elements

**Solution:**
- Tests already include explicit waits
- Check if frontend is fully loaded
- Verify `data-testid` attributes exist in components

### Flaky Tests

**Problem:** Tests pass sometimes, fail other times

**Solution:**
- Tests use `cy.waitForSync()` for async operations
- Check network latency
- Increase timeout if needed: `{ timeout: 10000 }`

---

## Using Docker Compose (Easiest)

### Start All Services

```bash
# From project root
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
sleep 10

# Run tests
cd frontend
npm run test:e2e
```

### Stop All Services

```bash
docker-compose -f docker-compose.dev.yml down
```

---

## Test Results

### Screenshots

Failed tests automatically capture screenshots:
```
frontend/cypress/screenshots/
```

### Videos

Test runs can be recorded (disabled by default):
```
frontend/cypress/videos/
```

To enable videos, update `cypress.config.ts`:
```typescript
video: true
```

---

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

View results in GitHub Actions:
```
https://github.com/your-repo/actions
```

---

## Custom Commands

### Login
```typescript
cy.login('test@example.com', 'SecureP@ssw0rd123!');
```

### Register
```typescript
cy.register('newuser@example.com', 'SecureP@ssw0rd123!');
```

### Clear Data
```typescript
cy.clearIndexedDB();
```

### Wait for Sync
```typescript
cy.waitForSync();
```

---

## Test Data

Tests use dynamic data to avoid conflicts:

```typescript
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'SecureP@ssw0rd123!';
```

Each test run uses unique credentials.

---

## Performance

### Execution Times

- **Single Test File:** ~30-60 seconds
- **Full Test Suite:** ~5-8 minutes
- **CI/CD Pipeline:** ~10-15 minutes (including setup)

### Optimization Tips

1. Disable video recording (default)
2. Run tests in parallel (CI/CD)
3. Use selective test running
4. Clear data efficiently

---

## Need Help?

1. Check `E2E_TESTING_GUIDE.md` for detailed documentation
2. Check `cypress/README.md` for test coverage details
3. Review Cypress documentation: https://docs.cypress.io/
4. Check test files for examples

---

## Quick Commands Reference

```bash
# Start services
docker-compose -f docker-compose.dev.yml up -d

# Run all tests (headless)
cd frontend && npm run test:e2e

# Run all tests (interactive)
cd frontend && npm run test:e2e:open

# Run specific test
npx cypress run --spec "cypress/e2e/user-journey.cy.ts"

# Stop services
docker-compose -f docker-compose.dev.yml down
```

---

## Success Checklist

Before running tests, verify:

- [ ] PostgreSQL is running on port 5432
- [ ] Redis is running on port 6379
- [ ] Backend is running on port 8080
- [ ] Frontend is running on port 3000
- [ ] Database migrations are applied
- [ ] Environment variables are set

Then run:

```bash
cd frontend
npm run test:e2e
```

All tests should pass! ✅
