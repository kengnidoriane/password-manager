'use client';

import { useEffect } from 'react';
import { preloadPWAAssets, isPWA } from '@/lib/pwa-config';

interface PWAProviderProps {
  children: React.ReactNode;
}

/**
 * PWA Provider component that initializes PWA features
 * Handles asset preloading and PWA-specific initialization
 */
export function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // Preload critical PWA assets
    preloadPWAAssets();
    
    // Add PWA class to body if running as PWA
    if (isPWA()) {
      document.body.classList.add('pwa-mode');
    }
    
    // Handle PWA display mode changes
    const handleDisplayModeChange = () => {
      if (isPWA()) {
        document.body.classList.add('pwa-mode');
      } else {
        document.body.classList.remove('pwa-mode');
      }
    };
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', handleDisplayModeChange);
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  return <>{children}</>;
}