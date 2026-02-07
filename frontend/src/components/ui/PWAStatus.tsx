'use client';

import { useState, useEffect } from 'react';
import { isPWA, canInstallPWA, getSplashScreen } from '@/lib/pwa-config';

interface PWAStatusInfo {
  isRunningAsPWA: boolean;
  canInstall: boolean;
  displayMode: string;
  splashScreen: string | null;
  isOnline: boolean;
}

export function PWAStatus() {
  const [pwaInfo, setPWAInfo] = useState<PWAStatusInfo>({
    isRunningAsPWA: false,
    canInstall: false,
    displayMode: 'browser',
    splashScreen: null,
    isOnline: true
  });
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const checkPWAStatus = () => {
      const isRunningAsPWA = isPWA();
      const canInstall = canInstallPWA();
      const splashScreen = getSplashScreen();
      const isOnline = navigator.onLine;
      
      // Detect display mode
      let displayMode = 'browser';
      if (window.matchMedia('(display-mode: standalone)').matches) {
        displayMode = 'standalone';
      } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        displayMode = 'minimal-ui';
      } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
        displayMode = 'fullscreen';
      }

      setPWAInfo({
        isRunningAsPWA,
        canInstall,
        displayMode,
        splashScreen,
        isOnline
      });
      
      // Show status briefly when first detected as PWA
      if (isRunningAsPWA && !sessionStorage.getItem('pwa-status-shown')) {
        setShowStatus(true);
        sessionStorage.setItem('pwa-status-shown', 'true');
        
        // Hide after 4 seconds
        setTimeout(() => {
          setShowStatus(false);
        }, 4000);
      }
    };

    checkPWAStatus();
    
    // Listen for online/offline changes
    const handleOnlineChange = () => {
      setPWAInfo(prev => ({ ...prev, isOnline: navigator.onLine }));
    };
    
    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);
    
    // Check again after a short delay to catch late PWA detection
    const timer = setTimeout(checkPWAStatus, 1000);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
    };
  }, []);

  // Show offline status
  if (!pwaInfo.isOnline) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-orange-100 border border-orange-200 rounded-lg px-4 py-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm font-medium text-orange-800">
              Offline mode - Changes will sync when online
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show PWA status
  if (!showStatus || !pwaInfo.isRunningAsPWA) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-green-100 border border-green-200 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="text-sm">
            <span className="font-medium text-green-800">
              Running as installed app
            </span>
            <div className="text-xs text-green-600 mt-1">
              Display mode: {pwaInfo.displayMode} • Offline support enabled
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}