'use client';

import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useResponsiveClasses } from '@/hooks/useResponsive';

/**
 * Header Component
 * Main application header with navigation and user menu
 * Responsive design with mobile-first approach
 */
export function Header() {
  const { user, isAuthenticated } = useAuthStore();
  const { toggleSidebar, isOnline } = useUIStore();
  const { isMobile, getTouchTargetClasses } = useResponsiveClasses();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className={`flex h-16 items-center justify-between ${isMobile ? 'px-4' : 'px-6'}`}>
        {/* Left section */}
        <div className="flex items-center gap-2 md:gap-4">
          {isAuthenticated && (
            <button
              onClick={toggleSidebar}
              className={`rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${getTouchTargetClasses()}`}
              aria-label="Toggle sidebar"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
          
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-600 p-2">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className={`font-bold text-gray-900 dark:text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {isMobile ? 'PassManager' : 'Password Manager'}
            </h1>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Online status indicator */}
          {isAuthenticated && (
            <div className={`flex items-center gap-2 text-sm ${isMobile ? 'hidden sm:flex' : ''}`}>
              <span
                className={`h-2 w-2 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          )}

          {/* User menu */}
          {isAuthenticated && user && (
            <div className={`flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800 ${getTouchTargetClasses()}`}>
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {user.email.charAt(0).toUpperCase()}
              </div>
              {!isMobile && (
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                  {user.email}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
