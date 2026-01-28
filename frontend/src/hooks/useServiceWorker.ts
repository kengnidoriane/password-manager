/**
 * Hook for managing Service Worker functionality
 * Provides PWA features like background sync, push notifications, and updates
 * Requirements: 22.4, 13.1
 */

import { useState, useEffect, useCallback } from 'react';
import { serviceWorkerManager } from '@/lib/serviceWorker';

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isBackgroundSyncSupported: boolean;
  isPushNotificationSupported: boolean;
  pushPermission: NotificationPermission | null;
  cacheUsage: { usage: number; quota: number } | null;
  isOnline: boolean;
}

export interface ServiceWorkerActions {
  requestBackgroundSync: (tag?: string) => Promise<void>;
  requestPushPermission: () => Promise<NotificationPermission>;
  subscribeToPush: (vapidKey?: string) => Promise<PushSubscription | null>;
  unsubscribeFromPush: () => Promise<boolean>;
  updateServiceWorker: () => Promise<void>;
  clearCaches: () => Promise<void>;
  getCacheUsage: () => Promise<void>;
}

/**
 * Custom hook for Service Worker management
 */
export function useServiceWorker(): ServiceWorkerState & ServiceWorkerActions {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    isBackgroundSyncSupported: false,
    isPushNotificationSupported: false,
    pushPermission: null,
    cacheUsage: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });

  // Initialize service worker state
  useEffect(() => {
    const initializeState = async () => {
      const isSupported = serviceWorkerManager.isServiceWorkerSupported();
      const isBackgroundSyncSupported = serviceWorkerManager.isBackgroundSyncSupported();
      const isPushNotificationSupported = serviceWorkerManager.isPushNotificationSupported();
      
      let pushPermission: NotificationPermission | null = null;
      if (isPushNotificationSupported) {
        pushPermission = Notification.permission;
      }

      const cacheUsage = await serviceWorkerManager.getCacheUsage();

      setState(prev => ({
        ...prev,
        isSupported,
        isBackgroundSyncSupported,
        isPushNotificationSupported,
        pushPermission,
        cacheUsage,
        isRegistered: isSupported, // Will be true if SW is supported and next-pwa handles registration
      }));
    };

    initializeState();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for service worker updates
  useEffect(() => {
    const handleUpdateAvailable = () => {
      setState(prev => ({ ...prev, isUpdateAvailable: true }));
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  // Request background sync
  const requestBackgroundSync = useCallback(async (tag: string = 'vault-sync') => {
    try {
      await serviceWorkerManager.requestBackgroundSync(tag);
    } catch (error) {
      console.error('Failed to request background sync:', error);
      throw error;
    }
  }, []);

  // Request push notification permission
  const requestPushPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const permission = await serviceWorkerManager.requestPushPermission();
      setState(prev => ({ ...prev, pushPermission: permission }));
      return permission;
    } catch (error) {
      console.error('Failed to request push permission:', error);
      throw error;
    }
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (vapidKey?: string): Promise<PushSubscription | null> => {
    try {
      const subscription = await serviceWorkerManager.subscribeToPush(vapidKey);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    try {
      const result = await serviceWorkerManager.unsubscribeFromPush();
      if (result) {
        setState(prev => ({ ...prev, pushPermission: 'default' }));
      }
      return result;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }, []);

  // Update service worker
  const updateServiceWorker = useCallback(async (): Promise<void> => {
    try {
      await serviceWorkerManager.updateServiceWorker();
      setState(prev => ({ ...prev, isUpdateAvailable: false }));
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to update service worker:', error);
      throw error;
    }
  }, []);

  // Clear all caches
  const clearCaches = useCallback(async (): Promise<void> => {
    try {
      await serviceWorkerManager.clearCaches();
      
      // Update cache usage
      const cacheUsage = await serviceWorkerManager.getCacheUsage();
      setState(prev => ({ ...prev, cacheUsage }));
    } catch (error) {
      console.error('Failed to clear caches:', error);
      throw error;
    }
  }, []);

  // Get cache usage
  const getCacheUsage = useCallback(async (): Promise<void> => {
    try {
      const cacheUsage = await serviceWorkerManager.getCacheUsage();
      setState(prev => ({ ...prev, cacheUsage }));
    } catch (error) {
      console.error('Failed to get cache usage:', error);
    }
  }, []);

  return {
    ...state,
    requestBackgroundSync,
    requestPushPermission,
    subscribeToPush,
    unsubscribeFromPush,
    updateServiceWorker,
    clearCaches,
    getCacheUsage,
  };
}

/**
 * Hook for handling service worker updates
 */
export function useServiceWorkerUpdate() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{
    hasUpdate: boolean;
    isWaiting: boolean;
    isInstalling: boolean;
    currentVersion?: string;
    newVersion?: string;
  }>({
    hasUpdate: false,
    isWaiting: false,
    isInstalling: false,
  });

  useEffect(() => {
    const handleUpdateAvailable = (event: CustomEvent) => {
      console.log('Update available event received:', event.detail);
      setIsUpdateAvailable(true);
      if (event.detail.updateStatus) {
        setUpdateStatus(event.detail.updateStatus);
      }
    };

    const handleUpdateError = (event: CustomEvent) => {
      console.error('Update error:', event.detail);
      setIsUpdating(false);
    };

    const handleUpdateSuccess = () => {
      console.log('Update successful');
      setIsUpdating(false);
      setIsUpdateAvailable(false);
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable as EventListener);
    window.addEventListener('sw-update-error', handleUpdateError as EventListener);
    window.addEventListener('sw-update-success', handleUpdateSuccess);

    // Check for existing updates on mount
    const checkExistingUpdate = () => {
      const status = serviceWorkerManager.getUpdateStatus();
      if (status.hasUpdate) {
        setIsUpdateAvailable(true);
        setUpdateStatus(status);
      }
    };

    // Small delay to ensure service worker is initialized
    setTimeout(checkExistingUpdate, 1000);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable as EventListener);
      window.removeEventListener('sw-update-error', handleUpdateError as EventListener);
      window.removeEventListener('sw-update-success', handleUpdateSuccess);
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      console.log('Applying service worker update...');
      await serviceWorkerManager.updateServiceWorker();
      
      // The page will reload automatically via controllerchange event
      // But we'll also set a timeout as fallback
      setTimeout(() => {
        if (isUpdating) {
          console.log('Reloading page after update timeout');
          window.location.reload();
        }
      }, 3000);
      
    } catch (error) {
      console.error('Failed to apply update:', error);
      setIsUpdating(false);
      
      // Dispatch error event
      const errorEvent = new CustomEvent('sw-update-error', {
        detail: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      window.dispatchEvent(errorEvent);
    }
  }, [isUpdating]);

  const dismissUpdate = useCallback(() => {
    console.log('Dismissing update notification');
    setIsUpdateAvailable(false);
  }, []);

  const checkForUpdates = useCallback(async () => {
    try {
      console.log('Manually checking for updates...');
      const hasUpdate = await serviceWorkerManager.checkForUpdates();
      
      if (hasUpdate) {
        const status = serviceWorkerManager.getUpdateStatus();
        setIsUpdateAvailable(true);
        setUpdateStatus(status);
      }
      
      return hasUpdate;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  }, []);

  return {
    isUpdateAvailable,
    isUpdating,
    updateStatus,
    applyUpdate,
    dismissUpdate,
    checkForUpdates,
  };
}

/**
 * Hook for managing push notifications
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const supported = serviceWorkerManager.isPushNotificationSupported();
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        const currentSubscription = await serviceWorkerManager.getPushSubscription();
        setSubscription(currentSubscription);
      }
    };

    initialize();
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const newPermission = await serviceWorkerManager.requestPushPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (error) {
      console.error('Failed to request push permission:', error);
      throw error;
    }
  }, []);

  const subscribe = useCallback(async (vapidKey?: string): Promise<PushSubscription | null> => {
    try {
      const newSubscription = await serviceWorkerManager.subscribeToPush(vapidKey);
      setSubscription(newSubscription);
      return newSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const result = await serviceWorkerManager.unsubscribeFromPush();
      if (result) {
        setSubscription(null);
        setPermission('default');
      }
      return result;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }, []);

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}