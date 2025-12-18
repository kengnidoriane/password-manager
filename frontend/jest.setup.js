// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill Web Crypto API and TextEncoder/TextDecoder for Node.js environment
const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

// Properly set up crypto with subtle
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: webcrypto.subtle,
    getRandomValues: (arr) => webcrypto.getRandomValues(arr),
  },
});

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
