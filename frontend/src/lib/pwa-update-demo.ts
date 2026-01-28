/**
 * Demo script to test PWA update mechanism
 * This demonstrates the update flow in different scenarios
 */

import { serviceWorkerManager } from './serviceWorker';

export async function demoPWAUpdateFlow() {
  console.log('=== PWA Update Mechanism Demo ===');
  
  // Check if service worker is supported
  console.log('1. Service Worker Support:', serviceWorkerManager.isServiceWorkerSupported());
  
  // Get current update status
  const status = serviceWorkerManager.getUpdateStatus();
  console.log('2. Current Update Status:', status);
  
  // Check for updates manually
  console.log('3. Checking for updates...');
  try {
    const hasUpdate = await serviceWorkerManager.checkForUpdates();
    console.log('   Update available:', hasUpdate);
  } catch (error) {
    console.log('   Update check failed:', error);
  }
  
  // Test update notification
  console.log('4. Testing update notification...');
  const updateEvent = new CustomEvent('sw-update-available', {
    detail: {
      updateStatus: {
        hasUpdate: true,
        isWaiting: true,
        isInstalling: false,
        currentVersion: 'v1.0.0',
        newVersion: 'v1.1.0',
      },
    },
  });
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(updateEvent);
    console.log('   Update notification dispatched');
  }
  
  // Test cache usage
  console.log('5. Cache Usage:');
  try {
    const cacheUsage = await serviceWorkerManager.getCacheUsage();
    console.log('   Cache info:', cacheUsage);
  } catch (error) {
    console.log('   Cache info unavailable:', error);
  }
  
  console.log('=== Demo Complete ===');
}

// Export for testing
export const testScenarios = {
  updateAvailable: () => {
    const event = new CustomEvent('sw-update-available', {
      detail: {
        updateStatus: {
          hasUpdate: true,
          isWaiting: true,
          isInstalling: false,
        },
      },
    });
    window.dispatchEvent(event);
  },
  
  updateInstalling: () => {
    const event = new CustomEvent('sw-update-available', {
      detail: {
        updateStatus: {
          hasUpdate: true,
          isWaiting: false,
          isInstalling: true,
        },
      },
    });
    window.dispatchEvent(event);
  },
  
  updateError: () => {
    const event = new CustomEvent('sw-update-error', {
      detail: {
        error: 'Failed to update service worker',
      },
    });
    window.dispatchEvent(event);
  },
  
  updateSuccess: () => {
    const event = new CustomEvent('sw-update-success');
    window.dispatchEvent(event);
  },
};