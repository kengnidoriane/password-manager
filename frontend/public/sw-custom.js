/**
 * Custom Service Worker for Password Manager PWA
 * Handles background sync, push notifications, and offline functionality
 * Requirements: 22.4, 13.1
 */

// Import Workbox libraries
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');

if (workbox) {
  console.log('Workbox loaded successfully');
  
  // Configure workbox
  workbox.setConfig({
    debug: false
  });

  // Skip waiting and claim clients immediately
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // Precache static assets
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

  // Background Sync for vault operations
  const bgSync = new workbox.backgroundSync.BackgroundSync('vault-sync-queue', {
    maxRetentionTime: 24 * 60 // 24 hours in minutes
  });

  // Register background sync for vault operations
  workbox.routing.registerRoute(
    /\/api\/v1\/vault\/.*/,
    new workbox.strategies.NetworkOnly({
      plugins: [bgSync]
    }),
    'POST'
  );

  workbox.routing.registerRoute(
    /\/api\/v1\/vault\/.*/,
    new workbox.strategies.NetworkOnly({
      plugins: [bgSync]
    }),
    'PUT'
  );

  workbox.routing.registerRoute(
    /\/api\/v1\/vault\/.*/,
    new workbox.strategies.NetworkOnly({
      plugins: [bgSync]
    }),
    'DELETE'
  );

  // Cache API responses with network-first strategy
  workbox.routing.registerRoute(
    /\/api\/v1\/.*/,
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        {
          // Don't cache authenticated requests
          cacheKeyWillBeUsed: async ({ request }) => {
            if (request.headers.get('Authorization')) {
              return null;
            }
            return request.url;
          }
        }
      ],
      networkTimeoutSeconds: 10,
    })
  );

  // Cache static assets
  workbox.routing.registerRoute(
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    new workbox.strategies.CacheFirst({
      cacheName: 'images-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        }),
      ],
    })
  );

  // Cache fonts
  workbox.routing.registerRoute(
    /\.(?:woff|woff2|eot|ttf|otf)$/,
    new workbox.strategies.CacheFirst({
      cacheName: 'fonts-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        }),
      ],
    })
  );

  // Cache CSS and JS with stale-while-revalidate
  workbox.routing.registerRoute(
    /\.(?:css|js)$/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
        }),
      ],
    })
  );

  // Offline fallback
  workbox.routing.setDefaultHandler(
    new workbox.strategies.NetworkFirst({
      cacheName: 'default-cache',
    })
  );

  workbox.routing.setCatchHandler(({ event }) => {
    if (event.request.destination === 'document') {
      return caches.match('/offline');
    }
    return Response.error();
  });

} else {
  console.error('Workbox failed to load');
}

// Background Sync Event Handler
self.addEventListener('sync', event => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'vault-sync') {
    event.waitUntil(handleVaultSync());
  }
});

// Push Notification Event Handler
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Password Manager',
    body: 'You have a new notification',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: 'general',
    requireInteraction: false,
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Failed to parse push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions || [],
      data: notificationData.data || {},
    })
  );
});

// Notification Click Event Handler
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'refresh') {
    // Refresh the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        if (clientList.length > 0) {
          return clientList[0].navigate('/').then(client => client.focus());
        }
        return clients.openWindow('/');
      })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === self.location.origin && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Message Event Handler
self.addEventListener('message', event => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});

// Install Event Handler
self.addEventListener('install', event => {
  console.log('Service worker installing...');
  
  // Pre-cache critical resources
  event.waitUntil(
    caches.open('critical-cache-v1').then(cache => {
      return cache.addAll([
        '/',
        '/offline',
        '/manifest.json',
        '/icon-192.svg',
        '/icon-512.svg'
      ]);
    })
  );
});

// Activate Event Handler
self.addEventListener('activate', event => {
  console.log('Service worker activating...');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('critical-cache-') && cacheName !== 'critical-cache-v1') {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event Handler for offline support
self.addEventListener('fetch', event => {
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline');
      })
    );
    return;
  }

  // Handle API requests with offline queue
  if (event.request.url.includes('/api/v1/vault/') && 
      ['POST', 'PUT', 'DELETE'].includes(event.request.method)) {
    
    event.respondWith(
      fetch(event.request).catch(error => {
        console.log('API request failed, queuing for background sync:', error);
        
        // Store request for background sync
        return storeRequestForSync(event.request).then(() => {
          return new Response(
            JSON.stringify({ 
              success: false, 
              queued: true, 
              message: 'Request queued for sync when online' 
            }),
            {
              status: 202,
              statusText: 'Accepted',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        });
      })
    );
  }
});

/**
 * Handle vault synchronization in background
 */
async function handleVaultSync() {
  try {
    console.log('Handling vault sync...');
    
    // Get queued requests from IndexedDB
    const queuedRequests = await getQueuedRequests();
    
    if (queuedRequests.length === 0) {
      console.log('No queued requests to sync');
      return;
    }

    // Process each queued request
    const results = await Promise.allSettled(
      queuedRequests.map(async (requestData) => {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        if (response.ok) {
          await removeQueuedRequest(requestData.id);
          return { success: true, id: requestData.id };
        } else {
          throw new Error(`Request failed: ${response.status}`);
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Sync completed: ${successful} successful, ${failed} failed`);

    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_VAULT',
        payload: { successful, failed, total: results.length }
      });
    });

  } catch (error) {
    console.error('Vault sync failed:', error);
  }
}

/**
 * Store request for background sync
 */
async function storeRequestForSync(request) {
  const requestData = {
    id: Date.now() + Math.random(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now()
  };

  // Store in IndexedDB (simplified implementation)
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('sync-queue', 1);
    
    dbRequest.onerror = () => reject(dbRequest.error);
    
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');
      
      const addRequest = store.add(requestData);
      addRequest.onsuccess = () => resolve(requestData);
      addRequest.onerror = () => reject(addRequest.error);
    };
    
    dbRequest.onupgradeneeded = () => {
      const db = dbRequest.result;
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Get queued requests from IndexedDB
 */
async function getQueuedRequests() {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('sync-queue', 1);
    
    dbRequest.onerror = () => reject(dbRequest.error);
    
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction(['requests'], 'readonly');
      const store = transaction.objectStore('requests');
      
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

/**
 * Remove queued request from IndexedDB
 */
async function removeQueuedRequest(id) {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('sync-queue', 1);
    
    dbRequest.onerror = () => reject(dbRequest.error);
    
    dbRequest.onsuccess = () => {
      const db = dbRequest.result;
      const transaction = db.transaction(['requests'], 'readwrite');
      const store = transaction.objectStore('requests');
      
      const deleteRequest = store.delete(id);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}