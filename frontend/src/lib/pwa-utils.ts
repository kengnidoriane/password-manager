/**
 * PWA Utility Functions
 * Helper functions for PWA functionality
 */

import { pwaConfig, splashScreens } from './pwa-config';

/**
 * Check if the current environment supports PWA features
 */
export function isPWASupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Check if the app is currently running as a PWA
 */
export function isRunningAsPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check for iOS Safari standalone mode
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  // Check for Android Chrome PWA
  if (document.referrer.includes('android-app://')) {
    return true;
  }
  
  return false;
}

/**
 * Get the appropriate splash screen for the current device
 */
export function getCurrentSplashScreen(): string {
  if (typeof window === 'undefined') {
    return '/splash-1170x2532.svg'; // Default fallback
  }
  
  const { innerWidth, innerHeight, devicePixelRatio } = window;
  const deviceWidth = innerWidth;
  const deviceHeight = innerHeight;
  const pixelRatio = devicePixelRatio || 1;
  
  // Find the best matching splash screen
  const match = splashScreens.find(screen => {
    const widthDiff = Math.abs(screen.deviceWidth - deviceWidth);
    const heightDiff = Math.abs(screen.deviceHeight - deviceHeight);
    const ratioDiff = Math.abs(screen.pixelRatio - pixelRatio);
    
    return widthDiff <= 50 && heightDiff <= 50 && ratioDiff <= 0.5;
  });
  
  if (match) {
    return `/splash-${match.width}x${match.height}.svg`;
  }
  
  // Fallback to default splash screen
  return '/splash-1170x2532.svg';
}

/**
 * Get device information for PWA analytics
 */
export function getDeviceInfo(): {
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  isPWA: boolean;
  isStandalone: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      platform: '',
      screenWidth: 0,
      screenHeight: 0,
      pixelRatio: 1,
      isPWA: false,
      isStandalone: false
    };
  }
  
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio || 1,
    isPWA: isPWASupported(),
    isStandalone: isRunningAsPWA()
  };
}

/**
 * Preload critical PWA assets
 */
export function preloadPWAAssets(): void {
  if (typeof window === 'undefined') return;
  
  const criticalAssets = [
    '/icon-192x192.png',
    '/icon-512.svg',
    '/icon-maskable.svg',
    getCurrentSplashScreen(),
    '/manifest.json'
  ];
  
  criticalAssets.forEach(asset => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = asset;
    
    if (asset.endsWith('.svg') || asset.endsWith('.png')) {
      link.as = 'image';
    } else if (asset.endsWith('.json')) {
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Add PWA install prompt event listener
 */
export function addInstallPromptListener(
  callback: (event: Event) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    callback(e);
  };
  
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  };
}

/**
 * Show PWA install prompt
 */
export async function showInstallPrompt(
  deferredPrompt: any
): Promise<{ outcome: 'accepted' | 'dismissed' }> {
  if (!deferredPrompt) {
    throw new Error('No install prompt available');
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  
  return { outcome };
}

/**
 * Check if PWA update is available
 */
export function checkForPWAUpdate(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!('serviceWorker' in navigator)) {
      resolve(false);
      return;
    }
    
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) {
        resolve(false);
        return;
      }
      
      // Check if there's a waiting service worker
      if (registration.waiting) {
        resolve(true);
        return;
      }
      
      // Listen for new service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              resolve(true);
            }
          });
        }
      });
      
      // No update available
      resolve(false);
    }).catch(() => {
      resolve(false);
    });
  });
}

/**
 * Apply PWA update
 */
export function applyPWAUpdate(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('serviceWorker' in navigator)) {
      reject(new Error('Service Worker not supported'));
      return;
    }
    
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration || !registration.waiting) {
        reject(new Error('No update available'));
        return;
      }
      
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Listen for the controlling service worker to change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        resolve();
      });
    }).catch(reject);
  });
}

/**
 * Get PWA installation status
 */
export function getPWAInstallationStatus(): {
  canInstall: boolean;
  isInstalled: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
} {
  if (typeof window === 'undefined') {
    return {
      canInstall: false,
      isInstalled: false,
      platform: 'unknown'
    };
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  let platform: 'ios' | 'android' | 'desktop' | 'unknown' = 'unknown';
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    platform = 'ios';
  } else if (/android/.test(userAgent)) {
    platform = 'android';
  } else if (/windows|mac|linux/.test(userAgent)) {
    platform = 'desktop';
  }
  
  const isInstalled = isRunningAsPWA();
  const canInstall = isPWASupported() && !isInstalled;
  
  return {
    canInstall,
    isInstalled,
    platform
  };
}

/**
 * Generate dynamic manifest based on current configuration
 */
export function generateDynamicManifest(): object {
  return {
    name: pwaConfig.name,
    short_name: pwaConfig.shortName,
    description: pwaConfig.description,
    start_url: pwaConfig.startUrl,
    scope: pwaConfig.scope,
    display: pwaConfig.display,
    background_color: pwaConfig.backgroundColor,
    theme_color: pwaConfig.themeColor,
    orientation: pwaConfig.orientation,
    lang: pwaConfig.lang,
    dir: pwaConfig.dir,
    icons: [
      {
        src: '/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icon-maskable.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ],
    categories: ['productivity', 'utilities', 'security'],
    shortcuts: [
      {
        name: 'Add Password',
        short_name: 'Add',
        description: 'Add a new password to your vault',
        url: '/vault?action=add',
        icons: [
          {
            src: '/icon-add.svg',
            sizes: '96x96',
            type: 'image/svg+xml'
          }
        ]
      },
      {
        name: 'Generate Password',
        short_name: 'Generate',
        description: 'Generate a secure password',
        url: '/generator',
        icons: [
          {
            src: '/icon-generate.svg',
            sizes: '96x96',
            type: 'image/svg+xml'
          }
        ]
      },
      {
        name: 'Security Report',
        short_name: 'Security',
        description: 'View your vault security report',
        url: '/security',
        icons: [
          {
            src: '/icon-security.svg',
            sizes: '96x96',
            type: 'image/svg+xml'
          }
        ]
      },
      {
        name: 'Settings',
        short_name: 'Settings',
        description: 'Manage your account settings',
        url: '/settings',
        icons: [
          {
            src: '/icon-settings.svg',
            sizes: '96x96',
            type: 'image/svg+xml'
          }
        ]
      }
    ],
    prefer_related_applications: false,
    related_applications: [],
    edge_side_panel: {
      preferred_width: 400
    },
    launch_handler: {
      client_mode: 'focus-existing'
    },
    handle_links: 'preferred',
    protocol_handlers: [
      {
        protocol: 'web+passwordmanager',
        url: '/import?url=%s'
      }
    ]
  };
}