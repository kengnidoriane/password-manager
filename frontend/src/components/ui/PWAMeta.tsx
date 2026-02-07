'use client';

import Head from 'next/head';
import { pwaConfig } from '@/lib/pwa-config';

/**
 * PWA Meta Tags Component
 * Adds all necessary meta tags for PWA functionality
 */
export function PWAMeta() {
  return (
    <Head>
      {/* Basic PWA meta tags */}
      <meta name="application-name" content={pwaConfig.name} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={pwaConfig.shortName} />
      <meta name="description" content={pwaConfig.description} />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      <meta name="msapplication-TileColor" content={pwaConfig.themeColor} />
      <meta name="msapplication-tap-highlight" content="no" />
      <meta name="theme-color" content={pwaConfig.themeColor} />

      {/* Viewport meta tag for responsive design */}
      <meta
        name="viewport"
        content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
      />

      {/* Apple touch icons */}
      <link rel="apple-touch-icon" href="/icon-152x152.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />

      {/* Apple splash screens */}
      <link
        rel="apple-touch-startup-image"
        href="/splash-2048x2732.svg"
        media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-1668x2388.svg"
        media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-1668x2224.svg"
        media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-1620x2160.svg"
        media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-1488x2266.svg"
        media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-1536x2048.svg"
        media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-1284x2778.svg"
        media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-1170x2532.svg"
        media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-1080x2340.svg"
        media="(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-1125x2436.svg"
        media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-1242x2208.svg"
        media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-828x1792.svg"
        media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-750x1334.svg"
        media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      />

      {/* Standard favicon and icons */}
      <link rel="icon" type="image/png" sizes="32x32" href="/icon-96x96.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/icon-72x72.png" />
      <link rel="icon" href="/icon-96x96.png" />

      {/* Manifest */}
      <link rel="manifest" href="/manifest.json" />

      {/* Preload critical resources */}
      <link rel="preload" href="/icon-192x192.png" as="image" />
      <link rel="preload" href="/icon-512.svg" as="image" />
    </Head>
  );
}

export default PWAMeta;