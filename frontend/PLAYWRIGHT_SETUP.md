# Playwright Setup for Browser Compatibility Testing

## Quick Setup

### 1. Install Dependencies

The Playwright packages are already added to `package.json`. Install them:

```bash
npm install
```

### 2. Install Playwright Browsers

Playwright needs to download browser binaries for Chrome, Firefox, and Safari (WebKit):

```bash
npx playwright install
```

This will download:
- Chromium (for Chrome/Edge testing)
- Firefox
- WebKit (for Safari testing)

**Note:** This is a one-time setup and downloads ~300MB of browser binaries.

### 3. Verify Installation

Check that browsers are installed:

```bash
npx playwright --version
```

## Running Browser Compatibility Tests

### Start Development Server

In one terminal:
```bash
npm run dev
```

### Run Tests

In another terminal:
```bash
npm run test:browsers
```

### View Results

After tests complete:
- **HTML Report:** `test-results/browser-compatibility/report.html`
- **JSON Results:** `test-results/browser-compatibility/results.json`

Open the HTML report in your browser:
```bash
# Windows
start test-results/browser-compatibility/report.html

# macOS
open test-results/browser-compatibility/report.html

# Linux
xdg-open test-results/browser-compatibility/report.html
```

## Test Configuration

### Environment Variables

Set custom test URL:
```bash
TEST_URL=http://localhost:3000 npm run test:browsers
```

### Headless vs Headed Mode

By default, tests run in headless mode. To see the browser:

Edit `frontend/scripts/browser-compatibility-test.js`:
```javascript
browser = await browserType.launch({
  headless: false,  // Change to false
  args: ['--disable-dev-shm-usage']
});
```

## Troubleshooting

### Issue: Browsers not found

**Solution:** Run `npx playwright install`

### Issue: Port 3000 not available

**Solution:** 
1. Change port in `next.config.ts`
2. Set `TEST_URL` environment variable

### Issue: Tests timeout

**Solution:**
1. Ensure dev server is running
2. Increase timeout in test script
3. Check network connectivity

### Issue: WebKit fails on Linux

**Solution:** Install system dependencies:
```bash
npx playwright install-deps webkit
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Browser Compatibility Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        
      - name: Build application
        run: npm run build
        
      - name: Start server
        run: npm start &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3000
        
      - name: Run browser tests
        run: npm run test:browsers
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: browser-test-results
          path: frontend/test-results/
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Browser Compatibility Testing Guide](../BROWSER_COMPATIBILITY_TESTING.md)
