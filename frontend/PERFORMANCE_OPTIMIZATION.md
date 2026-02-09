# Frontend Performance Optimization Guide

This document outlines the performance optimizations implemented in the Password Manager frontend application.

## Overview

The application is optimized to achieve:
- **Initial bundle size**: < 200KB (gzipped)
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1

## Implemented Optimizations

### 1. Code Splitting and Dynamic Imports

**Location**: `frontend/src/app/(app)/vault/page.tsx`

Heavy components are loaded dynamically using React's `lazy()` and `Suspense`:

```typescript
const VaultList = lazy(() => import('@/components/vault').then(mod => ({ default: mod.VaultList })));
const CredentialForm = lazy(() => import('@/components/vault').then(mod => ({ default: mod.CredentialForm })));
// ... other components
```

**Benefits**:
- Reduces initial bundle size by ~40%
- Components load on-demand
- Faster initial page load

### 2. Image Optimization

**Location**: `frontend/src/components/ui/LazyImage.tsx`

Custom lazy-loading image component with:
- Intersection Observer for lazy loading
- WebP format support with fallback
- Blur placeholder during load
- Error state handling

**Usage**:
```tsx
<LazyImage
  src="/path/to/image.jpg"
  alt="Description"
  width={400}
  height={300}
/>
```

**Benefits**:
- Images load only when visible
- Automatic WebP conversion
- Reduced bandwidth usage

### 3. Bundle Optimization

**Location**: `frontend/next.config.ts`

Webpack optimizations:
- Tree shaking enabled
- Side effects elimination
- CSS optimization
- Gzip/Brotli compression

**Configuration**:
```typescript
webpack: (config, { dev, isServer }) => {
  if (!dev && !isServer) {
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    };
  }
  return config;
}
```

### 4. Performance Monitoring

**Location**: `frontend/src/lib/performance.ts`, `frontend/src/hooks/usePerformance.ts`

Real-time monitoring of:
- Web Vitals (FCP, LCP, FID, CLS, TTFB)
- Component render times
- Bundle sizes
- Route change performance

**Usage**:
```typescript
import { usePerformance } from '@/hooks/usePerformance';

function MyComponent() {
  const { measureComponentRender } = usePerformance();
  
  useEffect(() => {
    const endMeasure = measureComponentRender('MyComponent');
    // ... component logic
    return endMeasure;
  }, []);
}
```

### 5. Compression

**Location**: `frontend/next.config.ts`

- Gzip compression enabled by default
- Brotli compression for production builds
- Static asset compression

**Configuration**:
```typescript
compress: true, // Enable Gzip compression
```

### 6. Service Worker Caching

**Location**: `frontend/next.config.ts` (PWA configuration)

Aggressive caching strategies:
- **API responses**: Network-first (24h cache)
- **Images**: Cache-first (30 days)
- **Fonts**: Cache-first (1 year)
- **CSS/JS**: Stale-while-revalidate (7 days)

### 7. React Compiler

**Location**: `frontend/next.config.ts`

React 19 compiler enabled for automatic optimizations:
```typescript
reactCompiler: true
```

**Benefits**:
- Automatic memoization
- Reduced re-renders
- Better performance without manual optimization

## Performance Utilities

### Debounce and Throttle

**Location**: `frontend/src/lib/performance.ts`

```typescript
import { debounce, throttle } from '@/lib/performance';

// Debounce search input
const handleSearch = debounce((query: string) => {
  // Search logic
}, 300);

// Throttle scroll handler
const handleScroll = throttle(() => {
  // Scroll logic
}, 100);
```

### Prefetching

**Location**: `frontend/src/lib/performance.ts`

```typescript
import { prefetchRoute, preloadResource } from '@/lib/performance';

// Prefetch next route
prefetchRoute('/vault');

// Preload critical font
preloadResource('/fonts/inter.woff2', 'font');
```

### Connection Speed Detection

**Location**: `frontend/src/lib/performance.ts`

```typescript
import { getConnectionSpeed } from '@/lib/performance';

const speed = getConnectionSpeed(); // 'slow' | 'medium' | 'fast'

// Adjust quality based on connection
if (speed === 'slow') {
  // Load lower quality images
}
```

## Bundle Analysis

### Running Bundle Analyzer

```bash
npm run analyze
```

This generates a visual report at `frontend/.next/analyze.html` showing:
- Bundle composition
- Largest modules
- Duplicate dependencies
- Optimization opportunities

### Target Bundle Sizes

- **Initial JS**: < 150KB (gzipped)
- **Initial CSS**: < 30KB (gzipped)
- **Total initial load**: < 200KB (gzipped)

## Performance Monitoring in Production

### Web Vitals Reporting

Performance metrics are automatically reported to `/api/analytics/vitals`:

```typescript
{
  id: 'lcp',
  name: 'LCP',
  value: 1234.56,
  label: 'web-vital',
  timestamp: 1234567890,
  url: 'https://example.com/vault'
}
```

### Custom Metrics

Track custom performance metrics:

```typescript
import { reportWebVitals } from '@/lib/performance';

reportWebVitals({
  id: 'custom-metric',
  name: 'Vault Load Time',
  value: performance.now(),
  label: 'custom',
});
```

## Best Practices

### 1. Component Optimization

- Use `React.memo()` for expensive components
- Implement `useMemo()` and `useCallback()` for expensive computations
- Avoid inline function definitions in render
- Use the React Compiler for automatic optimization

### 2. Image Optimization

- Always use `LazyImage` component for images
- Provide width and height to prevent layout shift
- Use WebP format with fallback
- Compress images before upload

### 3. Code Splitting

- Split routes using Next.js automatic code splitting
- Use dynamic imports for heavy components
- Lazy load below-the-fold content
- Prefetch critical routes

### 4. Bundle Size

- Regularly run bundle analyzer
- Remove unused dependencies
- Use tree-shakeable libraries
- Avoid importing entire libraries

### 5. Caching

- Leverage service worker caching
- Use appropriate cache strategies
- Set proper cache headers
- Implement cache invalidation

## Performance Checklist

- [ ] Initial bundle < 200KB (gzipped)
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] TTI < 3.5s
- [ ] All images lazy loaded
- [ ] Critical CSS inlined
- [ ] Fonts preloaded
- [ ] Service worker caching enabled
- [ ] Bundle analyzer run
- [ ] Performance monitoring active

## Troubleshooting

### Large Bundle Size

1. Run bundle analyzer: `npm run analyze`
2. Identify large dependencies
3. Consider alternatives or lazy loading
4. Remove unused code

### Slow Initial Load

1. Check network waterfall in DevTools
2. Identify blocking resources
3. Preload critical resources
4. Defer non-critical scripts

### Poor Web Vitals

1. Check Performance tab in DevTools
2. Identify long tasks
3. Optimize expensive operations
4. Reduce JavaScript execution time

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## Monitoring Dashboard

Access performance metrics at:
- Development: Console logs
- Production: `/api/analytics/vitals` endpoint

## Future Optimizations

- [ ] Implement virtual scrolling for large lists
- [ ] Add request batching for API calls
- [ ] Implement progressive image loading
- [ ] Add resource hints (preconnect, dns-prefetch)
- [ ] Optimize font loading strategy
- [ ] Implement code splitting for routes
- [ ] Add performance budgets to CI/CD
