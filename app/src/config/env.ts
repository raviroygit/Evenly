// Environment configuration for Evenly app
export const ENV = {
  // API URLs
  AUTH_SERVICE_URL: process.env.EXPO_PUBLIC_AUTH_SERVICE_URL,
  EVENLY_BACKEND_URL: process.env.EXPO_PUBLIC_EVENLY_BACKEND_URL,
  VOAGENTS_API_URL: process.env.EXPO_PUBLIC_VOAGENTS_API_URL,
  VOAGENTS_AGENT_ID: process.env.EXPO_PUBLIC_VOAGENTS_AGENT_ID,
  
  // App configuration
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Evenly',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_PROD: process.env.NODE_ENV === 'production',
} as const;


// Validation
if (!ENV.AUTH_SERVICE_URL) {
  throw new Error('EXPO_PUBLIC_AUTH_SERVICE_URL is required');
}

if (!ENV.EVENLY_BACKEND_URL) {
  throw new Error('EXPO_PUBLIC_EVENLY_BACKEND_URL is required');
}

if (!ENV.VOAGENTS_API_URL) {
  throw new Error('EXPO_PUBLIC_VOAGENTS_API_URL is required');
}

if (!ENV.VOAGENTS_AGENT_ID) {
  throw new Error('EXPO_PUBLIC_VOAGENTS_AGENT_ID is required');
}

export default ENV;
