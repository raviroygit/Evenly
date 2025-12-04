// Environment configuration for Evenly app
export const ENV = {
  // API URLs
  // AUTH_SERVICE_URL: process.env.EXPO_PUBLIC_AUTH_SERVICE_URL,
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

// Helper function to check if we're in development mode
const isDevelopment = () => {
  return ENV.NODE_ENV === 'development' || __DEV__;
};

// Validation with better error messages
const validateEnvironment = () => {
  const missingVars: string[] = [];
  
  // if (!ENV.AUTH_SERVICE_URL) {
  //   missingVars.push('EXPO_PUBLIC_AUTH_SERVICE_URL');
  // }
  
  if (!ENV.EVENLY_BACKEND_URL) {
    missingVars.push('EXPO_PUBLIC_EVENLY_BACKEND_URL');
  }
  
  if (!ENV.VOAGENTS_API_URL) {
    missingVars.push('EXPO_PUBLIC_VOAGENTS_API_URL');
  }
  
  if (!ENV.VOAGENTS_AGENT_ID) {
    missingVars.push('EXPO_PUBLIC_VOAGENTS_AGENT_ID');
  }
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}\n\n` +
      `Please create a .env file in the app root with these variables.\n` +
      `Example:\n` +
      `EXPO_PUBLIC_EVENLY_BACKEND_URL=https://your-backend.com\n` +
      `EXPO_PUBLIC_VOAGENTS_API_URL=https://your-voagents-api.com\n` +
      `EXPO_PUBLIC_VOAGENTS_AGENT_ID=your-agent-id`;
    
    if (isDevelopment()) {
      console.error('🚨 Environment Configuration Error:', errorMessage);
    }
    
    throw new Error(errorMessage);
  }
};

// Only validate in development to avoid production crashes
if (isDevelopment()) {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    // In development, we'll continue but log the error
  }
}

export default ENV;
