'use client';

import { useEffect } from 'react';
import { usePerformance, useRoutePerformance } from '@/hooks/usePerformance';

/**
 * Performance monitoring component
 * Should be included in the root layout
 */
export function PerformanceMonitor() {
  usePerformance();
  useRoutePerformance();

  useEffect(() => {
    // Log performance metrics on mount
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance Monitor] Initialized');
    }
  }, []);

  return null; // This component doesn't render anything
}
