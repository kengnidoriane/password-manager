'use client';

/**
 * ResponsiveLayout Component
 * 
 * Provides responsive layout wrapper with proper spacing and orientation handling
 */

import { useResponsive, useViewportPreservation } from '@/hooks/useResponsive';
import { ReactNode, useEffect } from 'react';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
  preserveState?: boolean;
}

export function ResponsiveLayout({ 
  children, 
  className = '', 
  preserveState = true 
}: ResponsiveLayoutProps) {
  const { isMobile, isTablet, orientation, screenWidth, screenHeight } = useResponsive();
  
  // Preserve layout state across orientation changes
  const [layoutState, updateLayoutState] = useViewportPreservation({
    scrollPosition: 0,
    focusedElement: null,
  });

  // Handle orientation changes
  useEffect(() => {
    if (preserveState) {
      // Save scroll position
      const scrollPosition = window.scrollY;
      updateLayoutState(prev => ({ ...prev, scrollPosition }));
      
      // Restore scroll position after orientation change
      const timer = setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [orientation, preserveState, updateLayoutState]);

  // Dynamic classes based on screen size
  const getLayoutClasses = () => {
    const baseClasses = 'responsive-transition';
    const spacingClasses = isMobile 
      ? 'p-4 gap-4' 
      : isTablet 
        ? 'p-6 gap-6' 
        : 'p-8 gap-8';
    
    const orientationClasses = orientation === 'landscape' 
      ? 'landscape-adjust' 
      : 'portrait-adjust';
    
    return `${baseClasses} ${spacingClasses} ${orientationClasses} ${className}`;
  };

  return (
    <div 
      className={getLayoutClasses()}
      style={{
        minHeight: isMobile ? '100vh' : 'auto',
        maxWidth: '100vw',
        overflowX: 'hidden',
      }}
    >
      {children}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
          <div>Screen: {screenWidth}x{screenHeight}</div>
          <div>Device: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</div>
          <div>Orientation: {orientation}</div>
        </div>
      )}
    </div>
  );
}

/**
 * ResponsiveGrid Component
 * 
 * Provides responsive grid layout with automatic column adjustment
 */
interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  minItemWidth?: number;
  gap?: number;
}

export function ResponsiveGrid({ 
  children, 
  className = '',
  minItemWidth = 300,
  gap = 16
}: ResponsiveGridProps) {
  const { screenWidth } = useResponsive();
  
  // Calculate optimal number of columns
  const getColumns = () => {
    const availableWidth = screenWidth - (gap * 2); // Account for container padding
    const columns = Math.floor(availableWidth / (minItemWidth + gap));
    return Math.max(1, columns);
  };

  const columns = getColumns();

  return (
    <div 
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * ResponsiveContainer Component
 * 
 * Provides responsive container with max-width constraints
 */
interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ResponsiveContainer({ 
  children, 
  className = '',
  size = 'lg'
}: ResponsiveContainerProps) {
  const { isMobile } = useResponsive();

  const getMaxWidth = () => {
    if (isMobile) return '100%';
    
    switch (size) {
      case 'sm': return '640px';
      case 'md': return '768px';
      case 'lg': return '1024px';
      case 'xl': return '1280px';
      case 'full': return '100%';
      default: return '1024px';
    }
  };

  return (
    <div 
      className={`mx-auto w-full ${className}`}
      style={{ maxWidth: getMaxWidth() }}
    >
      {children}
    </div>
  );
}