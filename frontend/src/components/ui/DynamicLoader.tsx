'use client';

import { Suspense, ComponentType, lazy } from 'react';

interface DynamicLoaderProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  loading?: ComponentType;
  error?: ComponentType<{ error: Error; reset: () => void }>;
  [key: string]: any;
}

/**
 * Loading fallback component
 */
function DefaultLoading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

/**
 * Error fallback component
 */
function DefaultError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-red-600 mb-4">Failed to load component</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Retry
      </button>
    </div>
  );
}

/**
 * Dynamic component loader with suspense and error boundary
 */
export function DynamicLoader({
  loader,
  loading: LoadingComponent = DefaultLoading,
  error: ErrorComponent = DefaultError,
  ...props
}: DynamicLoaderProps) {
  const LazyComponent = lazy(loader);

  return (
    <Suspense fallback={<LoadingComponent />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Create a dynamically imported component
 */
export function createDynamicComponent<T = any>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  options?: {
    loading?: ComponentType;
    error?: ComponentType<{ error: Error; reset: () => void }>;
  }
) {
  return (props: T) => (
    <DynamicLoader
      loader={loader}
      loading={options?.loading}
      error={options?.error}
      {...props}
    />
  );
}
