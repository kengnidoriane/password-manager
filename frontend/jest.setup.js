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

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock IndexedDB
const indexedDB = require('fake-indexeddb');
const IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');

global.indexedDB = indexedDB;
global.IDBKeyRange = IDBKeyRange;
