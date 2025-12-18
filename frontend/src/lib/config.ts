/**
 * Application Configuration
 * Centralized access to environment variables with type safety
 */

export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10)
  },
  
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Password Manager',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    env: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development'
  },
  
  pwa: {
    enabled: process.env.NEXT_PUBLIC_PWA_ENABLED === 'true'
  },
  
  security: {
    sessionTimeout: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS || '900000', 10),
    clipboardTimeout: parseInt(process.env.NEXT_PUBLIC_CLIPBOARD_TIMEOUT_MS || '60000', 10),
    pbkdf2Iterations: parseInt(process.env.NEXT_PUBLIC_PBKDF2_ITERATIONS || '100000', 10)
  },
  
  features: {
    biometric: process.env.NEXT_PUBLIC_ENABLE_BIOMETRIC === 'true',
    twoFactor: process.env.NEXT_PUBLIC_ENABLE_2FA === 'true',
    sharing: process.env.NEXT_PUBLIC_ENABLE_SHARING === 'true'
  }
} as const;

export type Config = typeof config;
