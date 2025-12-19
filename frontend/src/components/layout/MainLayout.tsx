'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { NotificationContainer } from '../ui/NotificationContainer';
import { ClipboardStatus } from '../ui/ClipboardStatus';

/**
 * Main Layout Component
 * Wraps authenticated pages with header, sidebar, and notifications
 */

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated } = useAuthStore();
  const { setOnlineStatus } = useUIStore();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial status
    setOnlineStatus(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  return (
    <div className="flex h-screen flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {isAuthenticated && <Sidebar />}
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          {children}
        </main>
      </div>

      <NotificationContainer />
      <ClipboardStatus />
    </div>
  );
}
