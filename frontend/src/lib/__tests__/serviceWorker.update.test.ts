/**
 * @jest-environment jsdom
 */

import { serviceWorkerManager } from '../serviceWorker';

describe('ServiceWorkerManager Update Mechanism', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should be supported in browser environment', () => {
    expect(serviceWorkerManager.isServiceWorkerSupported()).toBe(true);
  });

  test('should provide update status information', () => {
    const status = serviceWorkerManager.getUpdateStatus();
    expect(status).toHaveProperty('hasUpdate');
    expect(status).toHaveProperty('isWaiting');
    expect(status).toHaveProperty('isInstalling');
  });

  test('should handle update checks gracefully when no registration exists', async () => {
    const result = await serviceWorkerManager.checkForUpdates();
    expect(typeof result).toBe('boolean');
  });
});