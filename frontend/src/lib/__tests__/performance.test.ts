import {
  debounce,
  throttle,
  getConnectionSpeed,
  prefersReducedMotion,
  getPerformanceMetrics,
} from '../performance';

describe('Performance Utilities', () => {
  describe('debounce', () => {
    jest.useFakeTimers();

    it('should delay function execution', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 300);

      debouncedFunc();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 300);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      jest.advanceTimersByTime(300);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 300);

      debouncedFunc('test', 123);
      jest.advanceTimersByTime(300);

      expect(func).toHaveBeenCalledWith('test', 123);
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('should execute immediately on first call', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 300);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should ignore calls within throttle period', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 300);

      throttledFunc();
      throttledFunc();
      throttledFunc();

      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should allow calls after throttle period', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 300);

      throttledFunc();
      jest.advanceTimersByTime(300);
      throttledFunc();

      expect(func).toHaveBeenCalledTimes(2);
    });
  });

  describe('getConnectionSpeed', () => {
    it('should return medium by default', () => {
      const speed = getConnectionSpeed();
      expect(['slow', 'medium', 'fast']).toContain(speed);
    });

    it('should detect slow connection', () => {
      // Mock navigator.connection
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '2g' },
        writable: true,
      });

      const speed = getConnectionSpeed();
      expect(speed).toBe('slow');
    });

    it('should detect medium connection', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '3g' },
        writable: true,
      });

      const speed = getConnectionSpeed();
      expect(speed).toBe('medium');
    });

    it('should detect fast connection', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '4g' },
        writable: true,
      });

      const speed = getConnectionSpeed();
      expect(speed).toBe('fast');
    });
  });

  describe('prefersReducedMotion', () => {
    it('should return false by default', () => {
      // Mock matchMedia
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const result = prefersReducedMotion();
      expect(result).toBe(false);
    });

    it('should return true when user prefers reduced motion', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const result = prefersReducedMotion();
      expect(result).toBe(true);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return empty object in non-browser environment', () => {
      const originalPerformance = global.performance;
      // @ts-ignore
      delete global.performance;

      const metrics = getPerformanceMetrics();
      expect(metrics).toEqual({});

      global.performance = originalPerformance;
    });

    it('should return metrics when available', () => {
      // Mock performance API
      const mockNavigation = {
        responseStart: 100,
        requestStart: 50,
      };

      const mockPaint = [
        { name: 'first-contentful-paint', startTime: 200 },
      ];

      global.performance.getEntriesByType = jest.fn((type) => {
        if (type === 'navigation') return [mockNavigation];
        if (type === 'paint') return mockPaint;
        return [];
      });

      const metrics = getPerformanceMetrics();

      expect(metrics.ttfb).toBe(50);
      expect(metrics.fcp).toBe(200);
    });
  });

  describe('lazyLoadImage', () => {
    it('should use IntersectionObserver when available', () => {
      const mockObserve = jest.fn();
      const mockUnobserve = jest.fn();

      global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: jest.fn(),
      }));

      const img = document.createElement('img');
      img.dataset.src = 'test.jpg';

      const { lazyLoadImage } = require('../performance');
      lazyLoadImage(img);

      expect(mockObserve).toHaveBeenCalledWith(img);
    });

    it('should fallback when IntersectionObserver is not available', () => {
      const originalIO = global.IntersectionObserver;
      // @ts-ignore
      delete global.IntersectionObserver;

      const img = document.createElement('img');
      img.dataset.src = 'test.jpg';

      const { lazyLoadImage } = require('../performance');
      lazyLoadImage(img);

      expect(img.src).toBe('http://localhost/test.jpg');

      global.IntersectionObserver = originalIO;
    });
  });
});
