#!/usr/bin/env node

/**
 * Browser Compatibility Testing Script
 * 
 * This script runs automated browser compatibility tests using Playwright
 * to verify the PWA works correctly across different browsers.
 */

const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';
const RESULTS_DIR = path.join(__dirname, '../test-results/browser-compatibility');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Test results storage
const results = {
  timestamp: new Date().toISOString(),
  testUrl: TEST_URL,
  browsers: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

/**
 * Run tests for a specific browser
 */
async function testBrowser(browserType, browserName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${browserName}...`);
  console.log('='.repeat(60));

  const browserResults = {
    name: browserName,
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0
  };

  let browser;
  let context;
  let page;

  try {
    // Launch browser
    browser = await browserType.launch({
      headless: true,
      args: ['--disable-dev-shm-usage']
    });

    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      permissions: ['clipboard-read', 'clipboard-write']
    });

    page = await context.newPage();

    // Test 1: Page loads successfully
    await runTest(browserResults, 'Page loads successfully', async () => {
      const response = await page.goto(TEST_URL, { waitUntil: 'networkidle' });
      if (!response || response.status() !== 200) {
        throw new Error(`Failed to load page: ${response?.status()}`);
      }
    });

    // Test 2: Web Crypto API available
    await runTest(browserResults, 'Web Crypto API available', async () => {
      const hasCrypto = await page.evaluate(() => {
        return typeof window.crypto !== 'undefined' && 
               typeof window.crypto.subtle !== 'undefined';
      });
      if (!hasCrypto) {
        throw new Error('Web Crypto API not available');
      }
    });

    // Test 3: IndexedDB available
    await runTest(browserResults, 'IndexedDB available', async () => {
      const hasIndexedDB = await page.evaluate(() => {
        return typeof window.indexedDB !== 'undefined';
      });
      if (!hasIndexedDB) {
        throw new Error('IndexedDB not available');
      }
    });

    // Test 4: Service Worker support
    await runTest(browserResults, 'Service Worker support', async () => {
      const hasServiceWorker = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      if (!hasServiceWorker) {
        throw new Error('Service Worker not supported');
      }
    });

    // Test 5: Web Authentication API available
    await runTest(browserResults, 'Web Authentication API available', async () => {
      const hasWebAuthn = await page.evaluate(() => {
        return typeof window.PublicKeyCredential !== 'undefined';
      });
      if (!hasWebAuthn) {
        throw new Error('Web Authentication API not available');
      }
    });

    // Test 6: Clipboard API available
    await runTest(browserResults, 'Clipboard API available', async () => {
      const hasClipboard = await page.evaluate(() => {
        return typeof navigator.clipboard !== 'undefined';
      });
      if (!hasClipboard) {
        throw new Error('Clipboard API not available');
      }
    });

    // Test 7: PWA manifest loads
    await runTest(browserResults, 'PWA manifest loads', async () => {
      const manifestLink = await page.$('link[rel="manifest"]');
      if (!manifestLink) {
        throw new Error('Manifest link not found');
      }
      const href = await manifestLink.getAttribute('href');
      const manifestResponse = await page.goto(new URL(href, TEST_URL).href);
      if (!manifestResponse || manifestResponse.status() !== 200) {
        throw new Error('Manifest failed to load');
      }
    });

    // Test 8: Registration form renders
    await runTest(browserResults, 'Registration form renders', async () => {
      await page.goto(`${TEST_URL}/register`);
      const form = await page.$('form');
      if (!form) {
        throw new Error('Registration form not found');
      }
    });

    // Test 9: Login form renders
    await runTest(browserResults, 'Login form renders', async () => {
      await page.goto(`${TEST_URL}/login`);
      const form = await page.$('form');
      if (!form) {
        throw new Error('Login form not found');
      }
    });

    // Test 10: No console errors on page load
    await runTest(browserResults, 'No console errors on page load', async () => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(TEST_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000); // Wait for any delayed errors
      
      if (errors.length > 0) {
        throw new Error(`Console errors found: ${errors.join(', ')}`);
      }
    });

    // Test 11: Responsive design - Mobile viewport
    await runTest(browserResults, 'Responsive design - Mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(TEST_URL);
      
      // Check if layout adapts
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      if (hasOverflow) {
        throw new Error('Horizontal overflow detected on mobile viewport');
      }
    });

    // Test 12: Responsive design - Tablet viewport
    await runTest(browserResults, 'Responsive design - Tablet viewport', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(TEST_URL);
      
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      if (hasOverflow) {
        throw new Error('Horizontal overflow detected on tablet viewport');
      }
    });

    // Test 13: Performance - Initial load time
    await runTest(browserResults, 'Performance - Initial load time < 3s', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      const startTime = Date.now();
      await page.goto(TEST_URL, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      if (loadTime > 3000) {
        throw new Error(`Load time ${loadTime}ms exceeds 3000ms threshold`);
      }
    });

  } catch (error) {
    console.error(`\n❌ Browser test failed: ${error.message}`);
    browserResults.tests.push({
      name: 'Browser initialization',
      status: 'failed',
      error: error.message
    });
    browserResults.failed++;
  } finally {
    // Cleanup
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  }

  results.browsers[browserName] = browserResults;
  results.summary.total += browserResults.tests.length;
  results.summary.passed += browserResults.passed;
  results.summary.failed += browserResults.failed;
  results.summary.skipped += browserResults.skipped;

  console.log(`\n${browserName} Results:`);
  console.log(`  ✅ Passed: ${browserResults.passed}`);
  console.log(`  ❌ Failed: ${browserResults.failed}`);
  console.log(`  ⏭️  Skipped: ${browserResults.skipped}`);
}

/**
 * Run a single test
 */
async function runTest(browserResults, testName, testFn) {
  process.stdout.write(`  Testing: ${testName}... `);
  
  try {
    await testFn();
    console.log('✅ PASSED');
    browserResults.tests.push({
      name: testName,
      status: 'passed'
    });
    browserResults.passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    browserResults.tests.push({
      name: testName,
      status: 'failed',
      error: error.message
    });
    browserResults.failed++;
  }
}

/**
 * Generate HTML report
 */
function generateHtmlReport() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Browser Compatibility Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #333; }
    .summary {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-stats {
      display: flex;
      gap: 20px;
      margin-top: 15px;
    }
    .stat {
      flex: 1;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
    }
    .stat.passed { background: #d4edda; color: #155724; }
    .stat.failed { background: #f8d7da; color: #721c24; }
    .stat.skipped { background: #fff3cd; color: #856404; }
    .stat-value { font-size: 32px; font-weight: bold; }
    .stat-label { font-size: 14px; margin-top: 5px; }
    .browser-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .browser-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 2px solid #eee;
    }
    .browser-name { font-size: 24px; font-weight: bold; }
    .browser-stats { display: flex; gap: 15px; }
    .browser-stat { font-size: 14px; }
    .test-list { list-style: none; padding: 0; }
    .test-item {
      padding: 10px;
      margin: 5px 0;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .test-item.passed { background: #d4edda; }
    .test-item.failed { background: #f8d7da; }
    .test-item.skipped { background: #fff3cd; }
    .test-status {
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .test-status.passed { background: #28a745; color: white; }
    .test-status.failed { background: #dc3545; color: white; }
    .test-status.skipped { background: #ffc107; color: #333; }
    .error-message {
      margin-top: 5px;
      padding: 8px;
      background: #fff;
      border-left: 3px solid #dc3545;
      font-size: 12px;
      font-family: monospace;
    }
    .timestamp {
      color: #666;
      font-size: 14px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <h1>🌐 Browser Compatibility Test Report</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Test URL:</strong> ${results.testUrl}</p>
    <p class="timestamp"><strong>Generated:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
    
    <div class="summary-stats">
      <div class="stat passed">
        <div class="stat-value">${results.summary.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat failed">
        <div class="stat-value">${results.summary.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat skipped">
        <div class="stat-value">${results.summary.skipped}</div>
        <div class="stat-label">Skipped</div>
      </div>
    </div>
  </div>

  ${Object.values(results.browsers).map(browser => `
    <div class="browser-section">
      <div class="browser-header">
        <div class="browser-name">${browser.name}</div>
        <div class="browser-stats">
          <span class="browser-stat">✅ ${browser.passed} passed</span>
          <span class="browser-stat">❌ ${browser.failed} failed</span>
          <span class="browser-stat">⏭️ ${browser.skipped} skipped</span>
        </div>
      </div>
      
      <ul class="test-list">
        ${browser.tests.map(test => `
          <li class="test-item ${test.status}">
            <span>${test.name}</span>
            <span class="test-status ${test.status}">${test.status.toUpperCase()}</span>
          </li>
          ${test.error ? `<div class="error-message">${test.error}</div>` : ''}
        `).join('')}
      </ul>
    </div>
  `).join('')}
</body>
</html>
  `;

  const reportPath = path.join(RESULTS_DIR, 'report.html');
  fs.writeFileSync(reportPath, html);
  console.log(`\n📄 HTML report generated: ${reportPath}`);
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 Starting Browser Compatibility Tests...');
  console.log(`Test URL: ${TEST_URL}\n`);

  try {
    // Test Chromium (Chrome/Edge)
    await testBrowser(chromium, 'Chromium (Chrome/Edge)');

    // Test Firefox
    await testBrowser(firefox, 'Firefox');

    // Test WebKit (Safari)
    await testBrowser(webkit, 'WebKit (Safari)');

    // Save results to JSON
    const jsonPath = path.join(RESULTS_DIR, 'results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`\n📊 Results saved to: ${jsonPath}`);

    // Generate HTML report
    generateHtmlReport();

    // Print final summary
    console.log('\n' + '='.repeat(60));
    console.log('FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${results.summary.total}`);
    console.log(`✅ Passed: ${results.summary.passed}`);
    console.log(`❌ Failed: ${results.summary.failed}`);
    console.log(`⏭️  Skipped: ${results.summary.skipped}`);
    console.log('='.repeat(60));

    // Exit with appropriate code
    process.exit(results.summary.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests
main();
