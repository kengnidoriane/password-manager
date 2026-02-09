#!/usr/bin/env node

/**
 * Comprehensive Accessibility Testing Runner
 * 
 * This script runs all accessibility tests and generates a comprehensive report:
 * 1. axe-core automated scanning
 * 2. Keyboard navigation tests
 * 3. Color contrast tests
 * 4. ARIA attribute validation
 * 5. Screen reader compatibility checks
 * 
 * Requirements: 20.1, 20.2, 20.3
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Comprehensive Accessibility Testing...\n');

const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
};

// Test 1: Run axe-core automated scanning
console.log('📋 Test 1: Running axe-core automated scanning...');
try {
  execSync('npm test -- accessibility.comprehensive.test.tsx --run', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  results.tests.push({
    name: 'axe-core Automated Scanning',
    status: 'passed',
    description: 'All components passed automated accessibility checks',
  });
  results.summary.passed++;
} catch (error) {
  results.tests.push({
    name: 'axe-core Automated Scanning',
    status: 'failed',
    description: 'Some components have accessibility violations',
    error: error.message,
  });
  results.summary.failed++;
}
results.summary.total++;

// Test 2: Run keyboard navigation tests
console.log('\n⌨️  Test 2: Running keyboard navigation tests...');
try {
  execSync('npm test -- keyboard-navigation.property.test.tsx --run', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  results.tests.push({
    name: 'Keyboard Navigation Tests',
    status: 'passed',
    description: 'All interactive elements are keyboard accessible',
  });
  results.summary.passed++;
} catch (error) {
  results.tests.push({
    name: 'Keyboard Navigation Tests',
    status: 'failed',
    description: 'Some keyboard navigation issues found',
    error: error.message,
  });
  results.summary.failed++;
}
results.summary.total++;

// Test 3: Run WCAG contrast tests
console.log('\n🎨 Test 3: Running WCAG contrast compliance tests...');
try {
  execSync('npm test -- wcag-contrast.property.test.tsx --run', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  results.tests.push({
    name: 'WCAG Contrast Compliance',
    status: 'passed',
    description: 'All text meets WCAG 2.1 AA contrast ratios',
  });
  results.summary.passed++;
} catch (error) {
  results.tests.push({
    name: 'WCAG Contrast Compliance',
    status: 'failed',
    description: 'Some contrast ratio issues found',
    error: error.message,
  });
  results.summary.failed++;
}
results.summary.total++;

// Test 4: Run ARIA labels tests
console.log('\n🏷️  Test 4: Running ARIA labels tests...');
try {
  execSync('npm test -- aria-labels.property.test.tsx --run', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  results.tests.push({
    name: 'ARIA Labels Validation',
    status: 'passed',
    description: 'All interactive elements have proper ARIA labels',
  });
  results.summary.passed++;
} catch (error) {
  results.tests.push({
    name: 'ARIA Labels Validation',
    status: 'failed',
    description: 'Some ARIA label issues found',
    error: error.message,
  });
  results.summary.failed++;
}
results.summary.total++;

// Test 5: Run form accessibility tests
console.log('\n📝 Test 5: Running form accessibility tests...');
try {
  execSync('npm test -- form-label-association.property.test.tsx --run', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  results.tests.push({
    name: 'Form Accessibility',
    status: 'passed',
    description: 'All form inputs have proper labels and associations',
  });
  results.summary.passed++;
} catch (error) {
  results.tests.push({
    name: 'Form Accessibility',
    status: 'failed',
    description: 'Some form accessibility issues found',
    error: error.message,
  });
  results.summary.failed++;
}
results.summary.total++;

// Test 6: Run multi-modal feedback tests
console.log('\n🔔 Test 6: Running multi-modal feedback tests...');
try {
  execSync('npm test -- multi-modal-feedback.test.tsx --run', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  results.tests.push({
    name: 'Multi-Modal Feedback',
    status: 'passed',
    description: 'All actions provide appropriate feedback',
  });
  results.summary.passed++;
} catch (error) {
  results.tests.push({
    name: 'Multi-Modal Feedback',
    status: 'failed',
    description: 'Some feedback issues found',
    error: error.message,
  });
  results.summary.failed++;
}
results.summary.total++;

// Test 7: Run responsive design tests
console.log('\n📱 Test 7: Running responsive design tests...');
try {
  execSync('npm test -- responsive.property.test.tsx --run', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  results.tests.push({
    name: 'Responsive Design',
    status: 'passed',
    description: 'All components are responsive and maintain accessibility',
  });
  results.summary.passed++;
} catch (error) {
  results.tests.push({
    name: 'Responsive Design',
    status: 'failed',
    description: 'Some responsive design issues found',
    error: error.message,
  });
  results.summary.failed++;
}
results.summary.total++;

// Test 8: Run screen reader service tests
console.log('\n🔊 Test 8: Running screen reader service tests...');
try {
  execSync('npm test -- screenReaderService.test.ts --run', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  results.tests.push({
    name: 'Screen Reader Service',
    status: 'passed',
    description: 'Screen reader announcements work correctly',
  });
  results.summary.passed++;
} catch (error) {
  results.tests.push({
    name: 'Screen Reader Service',
    status: 'failed',
    description: 'Some screen reader issues found',
    error: error.message,
  });
  results.summary.failed++;
}
results.summary.total++;

// Generate report
console.log('\n📊 Generating Accessibility Test Report...\n');

const reportPath = path.join(__dirname, '..', 'ACCESSIBILITY_TEST_REPORT.md');
const report = `# Accessibility Testing Report

**Generated:** ${results.timestamp}

## Summary

- **Total Tests:** ${results.summary.total}
- **Passed:** ${results.summary.passed} ✅
- **Failed:** ${results.summary.failed} ❌
- **Warnings:** ${results.summary.warnings} ⚠️

## Test Results

${results.tests.map((test, index) => `
### ${index + 1}. ${test.name}

**Status:** ${test.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}

**Description:** ${test.description}

${test.error ? `**Error:** \`\`\`\n${test.error}\n\`\`\`` : ''}
`).join('\n')}

## Manual Testing Checklist

The following tests require manual verification:

### Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (macOS)
- [ ] Test with TalkBack (Android)
- [ ] Verify all interactive elements are announced
- [ ] Verify form validation messages are announced
- [ ] Verify dynamic content updates are announced

### Keyboard Navigation Testing
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Test keyboard shortcuts (if any)
- [ ] Verify modal dialogs trap focus
- [ ] Test Escape key to close dialogs
- [ ] Verify Enter/Space activate buttons

### Browser Zoom Testing
- [ ] Test at 200% zoom level
- [ ] Verify no horizontal scrolling
- [ ] Verify all content is readable
- [ ] Verify no content overlap
- [ ] Test on mobile devices

### Color Contrast Testing
- [ ] Verify text contrast ratios (4.5:1 minimum)
- [ ] Verify large text contrast (3:1 minimum)
- [ ] Verify focus indicator contrast
- [ ] Test with high contrast mode
- [ ] Verify color is not the only indicator

### Additional Manual Checks
- [ ] Test with browser extensions disabled
- [ ] Test with custom fonts
- [ ] Test with reduced motion preferences
- [ ] Test with dark mode
- [ ] Verify skip navigation links work

## Recommendations

${results.summary.failed > 0 ? `
⚠️ **Action Required:** ${results.summary.failed} test(s) failed. Please review the errors above and fix the accessibility issues.
` : ''}

${results.summary.passed === results.summary.total ? `
✅ **All automated tests passed!** Please complete the manual testing checklist above.
` : ''}

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

*This report was automatically generated by the accessibility testing suite.*
`;

fs.writeFileSync(reportPath, report);

console.log(`✅ Report generated: ${reportPath}\n`);

// Print summary
console.log('═══════════════════════════════════════════════════════');
console.log('                  TEST SUMMARY                         ');
console.log('═══════════════════════════════════════════════════════');
console.log(`Total Tests:  ${results.summary.total}`);
console.log(`Passed:       ${results.summary.passed} ✅`);
console.log(`Failed:       ${results.summary.failed} ❌`);
console.log(`Warnings:     ${results.summary.warnings} ⚠️`);
console.log('═══════════════════════════════════════════════════════\n');

// Exit with appropriate code
process.exit(results.summary.failed > 0 ? 1 : 0);
