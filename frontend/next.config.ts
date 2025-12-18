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
  }
})(nextConfig);
