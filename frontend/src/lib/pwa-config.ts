/**
 * PWA Configuration utilities
 * Handles PWA-related functionality and asset generation
 */

export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  startUrl: string;
  scope: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'portrait-primary' | 'portrait' | 'landscape' | 'any';
  lang: string;
  dir: 'ltr' | 'rtl' | 'auto';
}

export const pwaConfig: PWAConfig = {
  name: 'Password Manager',
  shortName: 'PassManager',
  description: 'Secure password manager with zero-knowledge encryption',
  themeColor: '#3b82f6',
  backgroundColor: '#ffffff',
  startUrl: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait-primary',
  lang: 'en',
  dir: 'ltr'
};

/**
 * Icon sizes required for comprehensive PWA support
 */
export const iconSizes = [
  { size: 72, purpose: 'any' },
  { size: 96, purpose: 'any' },
  { size: 128, purpose: 'any' },
  { size: 144, purpose: 'any' },
  { size: 152, purpose: 'any' },
  { size: 192, purpose: 'any' },
  { size: 384, purpose: 'any' },
  { size: 512, purpose: 'any' },
  { size: 512, purpose: 'maskable' }
];

/**
 * Splash screen dimensions for different devices
 */
export const splashScreens = [
  // iPhone 14 Pro Max, 13 Pro Max, 12 Pro Max
  { width: 1284, height: 2778, deviceWidth: 428, deviceHeight: 926, pixelRatio: 3, name: 'iPhone 14 Pro Max' },
  // iPhone 14 Pro, 13 Pro, 12 Pro, 13, 12
  { width: 1170, height: 2532, deviceWidth: 390, deviceHeight: 844, pixelRatio: 3, name: 'iPhone 14 Pro' },
  // iPhone 13 mini, 12 mini
  { width: 1080, height: 2340, deviceWidth: 360, deviceHeight: 780, pixelRatio: 3, name: 'iPhone 13 mini' },
  // iPhone 11 Pro Max, XS Max
  { width: 1242, height: 2688, deviceWidth: 414, deviceHeight: 896, pixelRatio: 3, name: 'iPhone 11 Pro Max' },
  // iPhone 11 Pro, X, XS
  { width: 1125, height: 2436, deviceWidth: 375, deviceHeight: 812, pixelRatio: 3, name: 'iPhone 11 Pro' },
  // iPhone 11, XR
  { width: 828, height: 1792, deviceWidth: 414, deviceHeight: 896, pixelRatio: 2, name: 'iPhone 11' },
  // iPhone 8 Plus, 7 Plus, 6s Plus, 6 Plus
  { width: 1242, height: 2208, deviceWidth: 414, deviceHeight: 736, pixelRatio: 3, name: 'iPhone 8 Plus' },
  // iPhone 8, 7, 6s, 6, SE (2nd gen)
  { width: 750, height: 1334, deviceWidth: 375, deviceHeight: 667, pixelRatio: 2, name: 'iPhone 8' },
  // iPad Pro 12.9" (5th gen)
  { width: 2048, height: 2732, deviceWidth: 1024, deviceHeight: 1366, pixelRatio: 2, name: 'iPad Pro 12.9"' },
  // iPad Pro 11" (3rd gen), iPad Air (4th gen)
  { width: 1668, height: 2388, deviceWidth: 834, deviceHeight: 1194, pixelRatio: 2, name: 'iPad Pro 11"' },
  // iPad Pro 10.5", iPad Air (3rd gen)
  { width: 1668, height: 2224, deviceWidth: 834, deviceHeight: 1112, pixelRatio: 2, name: 'iPad Pro 10.5"' },
  // iPad (9th gen), iPad (8th gen), iPad (7th gen)
  { width: 1620, height: 2160, deviceWidth: 810, deviceHeight: 1080, pixelRatio: 2, name: 'iPad 9th gen' },
  // iPad mini (6th gen)
  { width: 1488, height: 2266, deviceWidth: 744, deviceHeight: 1133, pixelRatio: 2, name: 'iPad mini 6th gen' },
  // iPad, iPad 2, iPad mini
  { width: 1536, height: 2048, deviceWidth: 768, deviceHeight: 1024, pixelRatio: 2, name: 'iPad' }
];

/**
 * App shortcuts for quick actions
 */
export const appShortcuts = [
  {
    name: 'Add Password',
    shortName: 'Add',
    description: 'Add a new password to your vault',
    url: '/vault?action=add',
    icon: '/icon-add.svg'
  },
  {
    name: 'Generate Password',
    shortName: 'Generate',
    description: 'Generate a secure password',
    url: '/generator',
    icon: '/icon-generate.svg'
  },
  {
    name: 'Security Report',
    shortName: 'Security',
    description: 'View your vault security report',
    url: '/security',
    icon: '/icon-security.svg'
  },
  {
    name: 'Settings',
    shortName: 'Settings',
    description: 'Manage your account settings',
    url: '/settings',
    icon: '/icon-settings.svg'
  }
];

/**
 * Generate manifest.json content
 */
export function generateManifest(): object {
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
    icons: iconSizes.map(({ size, purpose }) => ({
      src: purpose === 'maskable' ? '/icon-maskable.svg' : 
           size === 192 || size === 512 ? `/icon-${size}.svg` :
           `/icon-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: (size === 192 || size === 512 || purpose === 'maskable') ? 'image/svg+xml' : 'image/png',
      purpose
    })),
    categories: ['productivity', 'utilities', 'security'],
    screenshots: [
      {
        src: '/screenshot-desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Password Manager Desktop View'
      },
      {
        src: '/screenshot-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Password Manager Mobile View'
      }
    ],
    shortcuts: appShortcuts.map(shortcut => ({
      name: shortcut.name,
      short_name: shortcut.shortName,
      description: shortcut.description,
      url: shortcut.url,
      icons: [
        {
          src: shortcut.icon,
          sizes: '96x96',
          type: 'image/svg+xml'
        }
      ]
    })),
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

/**
 * Check if the app is running as a PWA
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if PWA installation is available
 */
export function canInstallPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
}

/**
 * Get PWA installation prompt
 */
export function getPWAInstallPrompt(): Promise<any> {
  return new Promise((resolve, reject) => {
    let prompted = false;
    
    const handlePrompt = (e: Event) => {
      if (!prompted) {
        e.preventDefault();
        prompted = true;
        resolve(e);
      }
    };
    
    window.addEventListener('beforeinstallprompt', handlePrompt);
    
    // Timeout after 5 seconds if no prompt event
    setTimeout(() => {
      if (!prompted) {
        window.removeEventListener('beforeinstallprompt', handlePrompt);
        reject(new Error('Install prompt not available'));
      }
    }, 5000);
  });
}

/**
 * Get device-specific splash screen
 */
export function getSplashScreen(): string | null {
  if (typeof window === 'undefined') return null;
  
  const { innerWidth, innerHeight, devicePixelRatio } = window;
  const deviceWidth = innerWidth;
  const deviceHeight = innerHeight;
  const pixelRatio = devicePixelRatio || 1;
  
  // Find the best matching splash screen
  const match = splashScreens.find(screen => 
    Math.abs(screen.deviceWidth - deviceWidth) <= 50 &&
    Math.abs(screen.deviceHeight - deviceHeight) <= 50 &&
    Math.abs(screen.pixelRatio - pixelRatio) <= 0.5
  );
  
  if (match) {
    return `/splash-${match.width}x${match.height}.svg`;
  }
  
  // Fallback to default splash screen
  return '/splash-1170x2532.svg';
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
    getSplashScreen()
  ].filter(Boolean);
  
  criticalAssets.forEach(asset => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = asset!;
    link.as = asset!.endsWith('.svg') ? 'image' : 'image';
    document.head.appendChild(link);
  });
}