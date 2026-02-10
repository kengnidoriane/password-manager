#!/usr/bin/env node

/**
 * Browser Feature Detection Script
 * Checks if required Web APIs are supported in the current browser
 */

const features = {
  'Web Crypto API': () => typeof window.crypto !== 'undefined' && typeof window.crypto.subtle !== 'undefined',
  'IndexedDB': () => typeof window.indexedDB !== 'undefined',
  'Service Workers': () => 'serviceWorker' in navigator,
  'Web Authentication': () => typeof window.PublicKeyCredential !== 'undefined',
  'Clipboard API': () => typeof navigator.clipboard !== 'undefined',
  'Notifications API': () => 'Notification' in window,
  'Push API': () => 'PushManager' in window,
  'Background Sync': () => 'sync' in ServiceWorkerRegistration.prototype,
  'Web App Manifest': () => 'onbeforeinstallprompt' in window,
  'Local Storage': () => typeof window.localStorage !== 'undefined',
  'Session Storage': () => typeof window.sessionStorage !== 'undefined',
  'Fetch API': () => typeof window.fetch !== 'undefined',
  'Promises': () => typeof Promise !== 'undefined',
  'Async/Await': () => {
    try {
      eval('(async () => {})');
      return true;
    } catch (e) {
      return false;
    }
  },
  'ES6 Modules': () => 'noModule' in document.createElement('script'),
  'WebP Support': () => {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
};

console.log('Browser Feature Support Check\n');
console.log('='.repeat(60));

Object.entries(features).forEach(([name, check]) => {
  const supported = check();
  console.log(`${supported ? '✅' : '❌'} ${name}`);
});

console.log('='.repeat(60));
