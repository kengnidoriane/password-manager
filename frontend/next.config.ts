import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  
  // Turbopack configuration (required for Next.js 16+)
  turbopack: {},
  
  // PWA Configuration
  experimental: {
    optimizeCss: true,
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      // Cache API responses with network-first strategy
      {
        urlPattern: /^https:\/\/.*\/api\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
          networkTimeoutSeconds: 10,
          cacheKeyWillBeUsed: async ({ request }) => {
            // Don't cache authenticated requests
            if (request.headers.get('Authorization')) {
              return null;
            }
            return request.url;
          },
        },
      },
      // Cache static assets with cache-first strategy
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      // Cache fonts with cache-first strategy
      {
        urlPattern: /\.(?:woff|woff2|eot|ttf|otf)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      // Cache CSS and JS with stale-while-revalidate
      {
        urlPattern: /\.(?:css|js)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-resources',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
          },
        },
      },
    ],
    // Background sync for offline operations
    backgroundSync: {
      options: {
        maxRetentionTime: 24 * 60, // 24 hours in minutes
      },
    },
    // Offline fallback
    fallbacks: {
      document: '/offline',
    },
  }
})(nextConfig);
