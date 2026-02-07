/**
 * useResponsive Hook
 * 
 * Provides responsive design utilities including breakpoint detection,
 * orientation handling, and touch gesture support.
 */

import { useState, useEffect, useCallback } from 'react';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
  touchSupported: boolean;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
}

export function useResponsive() {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape',
    screenWidth: 1024,
    screenHeight: 768,
    touchSupported: false,
  });

  const updateResponsiveState = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setState({
      isMobile: width <= 768,
      isTablet: width > 768 && width <= 1024,
      isDesktop: width > 1024,
      orientation: width > height ? 'landscape' : 'portrait',
      screenWidth: width,
      screenHeight: height,
      touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    });
  }, []);

  useEffect(() => {
    // Initial state
    updateResponsiveState();

    // Listen for resize events
    const handleResize = () => {
      updateResponsiveState();
    };

    // Listen for orientation changes
    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(updateResponsiveState, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateResponsiveState]);

  return state;
}

/**
 * Hook for handling swipe gestures on touch devices
 */
export function useSwipeGesture(
  onSwipe?: (gesture: SwipeGesture) => void,
  threshold: number = 50,
  velocityThreshold: number = 0.3
) {
  const [startTouch, setStartTouch] = useState<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartTouch({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    });
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!startTouch) return;

    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - startTouch.x;
    const deltaY = endY - startTouch.y;
    const deltaTime = endTime - startTouch.time;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // Check if swipe meets threshold requirements
    if (distance < threshold || velocity < velocityThreshold) {
      setStartTouch(null);
      return;
    }

    // Determine swipe direction
    let direction: SwipeGesture['direction'];
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const gesture: SwipeGesture = {
      direction,
      distance,
      velocity,
    };

    onSwipe?.(gesture);
    setStartTouch(null);
  }, [startTouch, onSwipe, threshold, velocityThreshold]);

  const handleTouchCancel = useCallback(() => {
    setStartTouch(null);
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };
}

/**
 * Hook for managing responsive layout classes
 */
export function useResponsiveClasses() {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getResponsiveClasses = useCallback((
    mobileClasses: string = '',
    tabletClasses: string = '',
    desktopClasses: string = ''
  ) => {
    if (isMobile) return mobileClasses;
    if (isTablet) return tabletClasses;
    return desktopClasses;
  }, [isMobile, isTablet, isDesktop]);

  const getGridClasses = useCallback(() => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    return 'grid-cols-3';
  }, [isMobile, isTablet]);

  const getSpacingClasses = useCallback(() => {
    if (isMobile) return 'p-4 gap-4';
    if (isTablet) return 'p-6 gap-6';
    return 'p-8 gap-8';
  }, [isMobile, isTablet]);

  const getTouchTargetClasses = useCallback(() => {
    return isMobile ? 'min-h-[44px] min-w-[44px] touch-manipulation' : '';
  }, [isMobile]);

  return {
    getResponsiveClasses,
    getGridClasses,
    getSpacingClasses,
    getTouchTargetClasses,
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * Hook for handling viewport changes without data loss
 */
export function useViewportPreservation<T>(initialData: T) {
  const [preservedData, setPreservedData] = useState<T>(initialData);
  const { screenWidth, screenHeight, orientation } = useResponsive();

  // Update preserved data when it changes
  const updateData = useCallback((newData: T) => {
    setPreservedData(newData);
  }, []);

  // Data is preserved across viewport changes
  useEffect(() => {
    // This effect runs when viewport changes but doesn't reset the data
    // The data persists through orientation and size changes
  }, [screenWidth, screenHeight, orientation]);

  return [preservedData, updateData] as const;
}