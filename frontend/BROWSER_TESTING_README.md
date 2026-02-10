# Browser Compatibility Testing

This directory contains tools and documentation for testing the Password Manager PWA across different browsers and platforms.

## Quick Start

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

### Running Browser Compatibility Tests

#### Automated Tests (Playwright)

Run automated browser compatibility tests across Chrome, Firefox, and Safari:

```bash
npm run test:browsers
```

This will:
- Test core functionality on all browsers
- Check Web API compatibility
- Verify PWA features
- Generate an HTML report in `test-results/browser-compatibility/`

#### Manual Testing

Use the browser compatibility checklist:
1. Open `../../BROWSER_COMPATIBILITY_CHECKLIST.md`
2. Follow the testing procedures for each browser
3. Document results in the checklist

### Check Browser Feature Support

To check if required Web APIs are supported in your current browser:

```bash
npm run check:features
```

Or open the browser console and run the feature detection script.

## Testing Documentation

### Main Documents

1. **BROWSER_COMPATIBILITY_TESTING.md** - Comprehensive testing guide
   - Test matrix and categories
   - Browser-specific test cases
   - Testing procedures
   - Issue reporting templates

2. **BROWSER_COMPATIBILITY_CHECKLIST.md** - Manual testing checklist
   - Printable checklist for each browser
   - Core functionality tests
   - PWA feature tests
   - Sign-off sections

3. **BROWSER_COMPATIBILITY_TEST_REPORT.md** - Report template
   - Executive summary template
   - Detailed results sections
   - Performance metrics
   - Issues summary

## Browser Support Matrix

### Desktop Browsers

| Browser | Versions | Status | Notes |
|---------|----------|--------|-------|
| Chrome | Latest 2 | ✅ Full Support | Recommended browser |
| Edge | Latest 2 | ✅ Full Support | Chromium-based |
| Firefox | Latest 2 | ✅ Full Support | No background sync |
| Safari | Latest 2 | ⚠️ Limited | Service worker limitations |

### Mobile Browsers

| Browser | Versions | Status | Notes |
|---------|----------|--------|-------|
| Mobile Safari | iOS 14+ | ⚠️ Limited | No push notifications in PWA |
| Chrome Mobile | Android 10+ | ✅ Full Support | Recommended mobile browser |

## Test Categories

### 1. Core Functionality
- Authentication (registration, login, 2FA)
- Vault operations (CRUD)
- Password generation
- Search and filtering
- Import/Export
- Clipboard operations

### 2. PWA Features
- Installation
- Standalone mode
- Offline functionality
- Service worker
- Update mechanism

### 3. Web API Compatibility
- Web Crypto API
- IndexedDB
- Service Workers
- Web Authentication (WebAuthn)
- Clipboard API
- Notifications API

### 4. Responsive Design
- Desktop viewports (1920x1080, 1366x768, 1280x720)
- Tablet viewports (768x1024, 1024x768)
- Mobile viewports (375x667, 390x844, 360x640)

### 5. Performance
- Initial load time < 3 seconds
- Time to interactive < 5 seconds
- Smooth scrolling (60fps)
- Memory usage

### 6. Accessibility
- Keyboard navigation
- Screen reader compatibility
- WCAG 2.1 AA compliance

## Testing Tools

### Automated Testing
- **Playwright** - Cross-browser automation
- **Lighthouse** - PWA audit and performance
- **Cypress** - E2E testing

### Manual Testing Tools
- **Chrome DevTools** - Debugging and performance
- **Firefox Developer Tools** - Debugging
- **Safari Web Inspector** - Debugging
- **BrowserStack** - Real device testing (optional)

### Feature Detection
- Custom feature detection script
- Can I Use website
- MDN Browser Compatibility Data

## Common Issues and Solutions

### Safari/Mobile Safari

**Issue:** Service worker not updating
**Solution:** Clear Safari cache and reload

**Issue:** IndexedDB data cleared
**Solution:** Expected behavior - document storage limitations

**Issue:** No push notifications
**Solution:** Not supported in PWA mode - document limitation

### Firefox

**Issue:** PWA installation prompt different
**Solution:** Use Firefox-specific installation flow

**Issue:** Background sync not working
**Solution:** Not supported - use alternative sync strategy

### Chrome Mobile (Android)

**Issue:** Behavior varies by device
**Solution:** Test on multiple Android versions and manufacturers

## Testing Workflow

### 1. Pre-Test Setup
- Clear browser data (cache, cookies, storage)
- Prepare test data (accounts, credentials)
- Document environment (browser version, OS, device)

### 2. Test Execution
- Follow test checklist systematically
- Document issues with screenshots
- Test edge cases (slow network, offline, large datasets)

### 3. Issue Reporting
- Use issue template in BROWSER_COMPATIBILITY_TESTING.md
- Include browser version, steps to reproduce, screenshots
- Log console errors

### 4. Report Generation
- Fill out BROWSER_COMPATIBILITY_TEST_REPORT.md
- Include performance metrics
- Document browser-specific limitations
- Provide recommendations

## Performance Targets

- ✅ Initial load < 3 seconds
- ✅ Time to interactive < 5 seconds
- ✅ Lighthouse score > 90
- ✅ Smooth scrolling (60fps)
- ✅ Transitions < 300ms

## Accessibility Targets

- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Color contrast ratios met
- ✅ Zoom to 200% works

## CI/CD Integration

Browser compatibility tests can be integrated into CI/CD pipeline:

```yaml
# .github/workflows/browser-tests.yml
name: Browser Compatibility Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test:browsers
      - uses: actions/upload-artifact@v3
        with:
          name: browser-test-results
          path: test-results/
```

## Resources

- [Can I Use](https://caniuse.com/) - Browser compatibility tables
- [MDN Web Docs](https://developer.mozilla.org/) - Web API documentation
- [PWA Builder](https://www.pwabuilder.com/) - PWA testing tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - PWA audit
- [Playwright Docs](https://playwright.dev/) - Automation framework

## Support

For questions or issues with browser compatibility testing:
1. Check the testing documentation
2. Review known issues in BROWSER_COMPATIBILITY_TESTING.md
3. Create an issue with browser details and reproduction steps

## Contributing

When adding new features:
1. Update browser compatibility tests
2. Document any browser-specific behavior
3. Update the compatibility matrix
4. Test on all supported browsers before merging
