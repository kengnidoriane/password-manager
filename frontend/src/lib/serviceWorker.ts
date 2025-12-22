/**
 * Service Worker utilities for PWA functionality
 * Handles registration, background sync, and push notifications
 * Requirements: 22.4, 13.1
 */

import { syncService } from '@/services/syncService';

export interface ServiceWorkerMessage {
  type: 'SYNC_VAULT' | 'CACHE_UPDATE' | 'PUSH_NOTIFICATION';
  payload?: any;
}

/**
 * Service Worker Manager class
 */
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  private constructor() {
    this.isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;
  }

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  /**
   * Initialize service worker
   */
  async initialize(): Promise<void> {
    if (!this.isSupported) {
      console.warn('Service Worker not supported in this browser');
      return;
    }

    try {
      // Register service worker (handled by next-pwa)
      this.registration = await navigator.serviceWorker.ready;
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      
      // Listen for service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              this.notifyUpdate();
            }
          });
        }
      });

      console.log('Service Worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Service Worker:', error);
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent<ServiceWorkerMessage>): void {
    const { type, payload } = event.data;

    switch (type) {
      case 'SYNC_VAULT':
        this.handleBackgroundSync(payload);
        break;
      case 'CACHE_UPDATE':
        this.handleCacheUpdate(payload);
        break;
      case 'PUSH_NOTIFICATION':
        this.handlePushNotification(payload);
        break;
      default:
        console.log('Unknown service worker message:', type);
    }
  }

  /**
   * Handle background sync event
   */
  private async handleBackgroundSync(payload: any): Promise<void> {
    try {
      console.log('Background sync triggered:', payload);
      
      // Trigger sync service
      await syncService.manualSync();
      
      // Notify user if sync completed successfully
      this.showNotification('Sync Complete', {
        body: 'Your vault has been synchronized.',
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        tag: 'sync-complete',
        requireInteraction: false,
      });
    } catch (error) {
      console.error('Background sync failed:', error);
      
      // Notify user of sync failure
      this.showNotification('Sync Failed', {
        body: 'Failed to sync your vault. Will retry when online.',
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        tag: 'sync-failed',
        requireInteraction: false,
      });
    }
  }

  /**
   * Handle cache update event
   */
  private handleCacheUpdate(payload: any): void {
    console.log('Cache updated:', payload);
    
    // Optionally notify user of cache updates
    if (payload.critical) {
      this.showNotification('App Updated', {
        body: 'The app has been updated with new features.',
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        tag: 'app-update',
        requireInteraction: true,
        actions: [
          {
            action: 'refresh',
            title: 'Refresh Now'
          },
          {
            action: 'dismiss',
            title: 'Later'
          }
        ]
      });
    }
  }

  /**
   * Handle push notification
   */
  private handlePushNotification(payload: any): void {
    console.log('Push notification received:', payload);
    
    // Handle different types of push notifications
    switch (payload.type) {
      case 'security-alert':
        this.showNotification('Security Alert', {
          body: payload.message,
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          tag: 'security-alert',
          requireInteraction: true,
        });
        break;
      case 'sync-reminder':
        this.showNotification('Sync Reminder', {
          body: 'You have unsaved changes. Connect to sync your vault.',
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          tag: 'sync-reminder',
          requireInteraction: false,
        });
        break;
      default:
        this.showNotification(payload.title || 'Password Manager', {
          body: payload.message,
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          tag: payload.tag || 'general',
          requireInteraction: false,
        });
    }
  }

  /**
   * Show notification to user
   */
  private async showNotification(title: string, options: NotificationOptions): Promise<void> {
    if (!this.registration || !('showNotification' in this.registration)) {
      console.warn('Notifications not supported');
      return;
    }

    try {
      // Request permission if not granted
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (Notification.permission === 'granted') {
        await this.registration.showNotification(title, options);
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Request background sync
   */
  async requestBackgroundSync(tag: string = 'vault-sync'): Promise<void> {
    if (!this.registration || !('sync' in this.registration)) {
      console.warn('Background Sync not supported');
      return;
    }

    try {
      await this.registration.sync.register(tag);
      console.log('Background sync registered:', tag);
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  }

  /**
   * Send message to service worker
   */
  async sendMessage(message: ServiceWorkerMessage): Promise<void> {
    if (!this.registration || !this.registration.active) {
      console.warn('No active service worker to send message to');
      return;
    }

    this.registration.active.postMessage(message);
  }

  /**
   * Check if service worker is supported
   */
  isServiceWorkerSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Check if background sync is supported
   */
  isBackgroundSyncSupported(): boolean {
    return this.isSupported && 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
  }

  /**
   * Check if push notifications are supported
   */
  isPushNotificationSupported(): boolean {
    return this.isSupported && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * Request push notification permission
   */
  async requestPushPermission(): Promise<NotificationPermission> {
    if (!this.isPushNotificationSupported()) {
      throw new Error('Push notifications not supported');
    }

    return await Notification.requestPermission();
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(vapidPublicKey?: string): Promise<PushSubscription | null> {
    if (!this.registration || !this.isPushNotificationSupported()) {
      throw new Error('Push notifications not supported');
    }

    try {
      const permission = await this.requestPushPermission();
      if (permission !== 'granted') {
        throw new Error('Push notification permission denied');
      }

      const options: PushSubscriptionOptions = {
        userVisibleOnly: true,
      };

      if (vapidPublicKey) {
        options.applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);
      }

      const subscription = await this.registration.pushManager.subscribe(options);
      console.log('Push subscription created:', subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        const result = await subscription.unsubscribe();
        console.log('Push subscription removed:', result);
        return result;
      }
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Get current push subscription
   */
  async getPushSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Failed to get push subscription:', error);
      return null;
    }
  }

  /**
   * Notify user of service worker update
   */
  private notifyUpdate(): void {
    // Create custom event for app to handle
    const event = new CustomEvent('sw-update-available', {
      detail: { registration: this.registration }
    });
    window.dispatchEvent(event);

    // Show notification
    this.showNotification('App Update Available', {
      body: 'A new version of the app is available. Refresh to update.',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: 'app-update',
      requireInteraction: true,
      actions: [
        {
          action: 'refresh',
          title: 'Refresh Now'
        },
        {
          action: 'dismiss',
          title: 'Later'
        }
      ]
    });
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
      
      // Skip waiting and claim clients
      if (this.registration.waiting) {
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (error) {
      console.error('Failed to update service worker:', error);
    }
  }

  /**
   * Get cache storage usage
   */
  async getCacheUsage(): Promise<{ usage: number; quota: number } | null> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    } catch (error) {
      console.error('Failed to get cache usage:', error);
      return null;
    }
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }
}

// Export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  serviceWorkerManager.initialize();
}