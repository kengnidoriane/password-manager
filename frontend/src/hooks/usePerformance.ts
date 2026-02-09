'use client';

import { useEffect, useCallback } from 'react';
import { reportWebVitals, getPerformanceMetrics, logBundleSize } from '@/lib/performance';

/**
 * Hook to monitor and report performance metrics
 */
export function usePerformance() {
  useEffect(() => {
    // Log bundle size in development
    if (process.env.NODE_ENV === 'development') {
      logBundleSize();
    }

    // Report Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Observe Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          reportWebVitals({
            id: 'lcp',
            name: 'LCP',
            value: lastEntry.startTime,
            label: 'web-vital',
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }

      // Observe First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            reportWebVitals({
              id: 'fid',
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              label: 'web-vital',
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // FID not supported
      }

      // Observe Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          reportWebVitals({
            id: 'cls',
            name: 'CLS',
            value: clsValue,
            label: 'web-vital',
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS not supported
      }
    }

    // Report initial metrics
    const metrics = getPerformanceMetrics();
    if (metrics.fcp) {
      reportWebVitals({
        id: 'fcp',
        name: 'FCP',
        value: metrics.fcp,
        label: 'web-vital',
      });
    }
    if (metrics.ttfb) {
      reportWebVitals({
        id: 'ttfb',
        name: 'TTFB',
        value: metrics.ttfb,
        label: 'web-vital',
      });
    }
  }, []);

  const measureComponentRender = useCallback((componentName: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Render] ${componentName}: ${duration.toFixed(2)}ms`);
      }
    };
  }, []);

  return {
    measureComponentRender,
  };
}

/**
 * Hook to track route changes and report navigation timing
 */
export function useRoutePerformance() {
  useEffect(() => {
    const handleRouteChange = () => {
      // Report route change timing
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        reportWebVitals({
          id: 'route-change',
          name: 'Route Change',
          value: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
          label: 'custom',
        });
      }
    };

    // Listen for route changes (Next.js specific)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
}
