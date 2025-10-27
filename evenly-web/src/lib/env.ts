// Environment configuration for Evenly Web
export const ENV = {
  // Backend API URL
  EVENLY_BACKEND_URL: process.env.NEXT_PUBLIC_EVENLY_BACKEND_URL || 'https://evenly-backend-374738393915.us-central1.run.app',
  
  // ReCAPTCHA Configuration
  RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
  RECAPTCHA_ENABLED: process.env.NEXT_PUBLIC_RECAPTCHA_ENABLED === 'true' || false,
  
  // App Configuration
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Evenly',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

export type EnvConfig = typeof ENV;
