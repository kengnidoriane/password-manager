#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

const BUDGET = {
  js: 150 * 1024, // 150KB
  css: 30 * 1024, // 30KB
  total: 200 * 1024, // 200KB
};

function getFileSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    const gzipped = gzipSync(content);
    return {
      raw: content.length,
      gzipped: gzipped.length,
    };
  } catch (error) {
    return { raw: 0, gzipped: 0 };
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function checkBundleSize() {
  const buildDir = path.join(__dirname, '../.next');
  
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  console.log('📦 Checking bundle sizes...\n');

  // Check static files
  const staticDir = path.join(buildDir, 'static');
  let totalJsSize = 0;
  let totalCssSize = 0;
  let violations = [];

  // Check JS files
  const chunksDir = path.join(staticDir, 'chunks');
  if (fs.existsSync(chunksDir)) {
    const jsFiles = fs.readdirSync(chunksDir).filter(f => f.endsWith('.js'));
    
    jsFiles.forEach(file => {
      const filePath = path.join(chunksDir, file);
      const size = getFileSize(filePath);
      totalJsSize += size.gzipped;
      
      console.log(`  ${file}: ${formatBytes(size.gzipped)} (gzipped)`);
    });
  }

  // Check CSS files
  const cssDir = path.join(staticDir, 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    
    cssFiles.forEach(file => {
      const filePath = path.join(cssDir, file);
      const size = getFileSize(filePath);
      totalCssSize += size.gzipped;
      
      console.log(`  ${file}: ${formatBytes(size.gzipped)} (gzipped)`);
    });
  }

  const totalSize = totalJsSize + totalCssSize;

  console.log('\n📊 Summary:');
  console.log(`  JavaScript: ${formatBytes(totalJsSize)}`);
  console.log(`  CSS: ${formatBytes(totalCssSize)}`);
  console.log(`  Total: ${formatBytes(totalSize)}`);

  console.log('\n🎯 Budget:');
  console.log(`  JavaScript: ${formatBytes(BUDGET.js)}`);
  console.log(`  CSS: ${formatBytes(BUDGET.css)}`);
  console.log(`  Total: ${formatBytes(BUDGET.total)}`);

  // Check violations
  if (totalJsSize > BUDGET.js) {
    violations.push(`JavaScript bundle exceeds budget by ${formatBytes(totalJsSize - BUDGET.js)}`);
  }

  if (totalCssSize > BUDGET.css) {
    violations.push(`CSS bundle exceeds budget by ${formatBytes(totalCssSize - BUDGET.css)}`);
  }

  if (totalSize > BUDGET.total) {
    violations.push(`Total bundle exceeds budget by ${formatBytes(totalSize - BUDGET.total)}`);
  }

  if (violations.length > 0) {
    console.log('\n❌ Budget violations:');
    violations.forEach(v => console.log(`  - ${v}`));
    console.log('\n💡 Tips:');
    console.log('  - Run "npm run analyze" to identify large dependencies');
    console.log('  - Consider code splitting for large components');
    console.log('  - Remove unused dependencies');
    console.log('  - Use dynamic imports for heavy features');
    process.exit(1);
  } else {
    console.log('\n✅ All bundles are within budget!');
    
    const jsPercentage = ((totalJsSize / BUDGET.js) * 100).toFixed(1);
    const cssPercentage = ((totalCssSize / BUDGET.css) * 100).toFixed(1);
    const totalPercentage = ((totalSize / BUDGET.total) * 100).toFixed(1);
    
    console.log(`  JavaScript: ${jsPercentage}% of budget`);
    console.log(`  CSS: ${cssPercentage}% of budget`);
    console.log(`  Total: ${totalPercentage}% of budget`);
  }
}

checkBundleSize();
