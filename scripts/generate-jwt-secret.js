#!/usr/bin/env node

/**
 * Generate a secure JWT secret for production use
 * Run: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

// Generate a 256-bit (32 bytes) random secret
const secret = crypto.randomBytes(32).toString('base64');

console.log('\n===========================================');
console.log('🔐 JWT Secret Generated');
console.log('===========================================\n');
console.log('Copy this secret to your Render environment variables:\n');
console.log(`JWT_SECRET=${secret}\n`);
console.log('⚠️  IMPORTANT: Keep this secret secure!');
console.log('⚠️  Never commit this to version control!');
console.log('===========================================\n');
