import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    // Cloud Run sets PORT=8080 automatically, fallback to 3001 for local dev
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.EVENLY_DATABASE_URL || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
  auth: {
    serviceUrl: process.env.AUTH_SERVICE_URL || 'https://nxgenaidev-auth-api-374738393915.us-central1.run.app/api/v1/auth',
    apiKey: process.env.AUTH_SERVICE_API_KEY || '',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    /** Evenly app org id – fixed for EvenlySplit (env EVENLY_ORGANIZATION_ID or default) */
    evenlyOrganizationId: process.env.EVENLY_ORGANIZATION_ID || '696fc87397e67400b0335682',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '',
    CORS_ORIGIN1: process.env.CORS_ORIGIN1 || '',
  },
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '10000', 10), // Increased from 100 to 10000
    timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '60000', 10), // 1 minute
  },
  swagger: {
    host: process.env.SWAGGER_HOST || 'localhost:3001',
    schemes: (process.env.SWAGGER_SCHEMES || 'http,https').split(','),
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.zoho.in',
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'no-reply@nxtgenaidev.com',
      pass: process.env.EMAIL_PASS || 'a3A3CDqpuBhf',
    },
    supportEmail: process.env.SUPPORT_EMAIL || 'ravi140398@gmail.com',
  },
  app: {
    baseUrl: process.env.APP_BASE_URL || 'https://evenly-backend-374738393915.us-central1.run.app/api/v1',
    /** Root domain without /api/v1 path — used for smart redirect links */
    baseUrlRoot: process.env.BASE_URL || process.env.DOMAIN || (process.env.APP_BASE_URL ? process.env.APP_BASE_URL.replace(/\/api\/v1$/, '') : 'https://evenly-backend-374738393915.us-central1.run.app'),
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  push: {
    apns: {
      keyPath: process.env.APNS_KEY_PATH || './certs/apns-key.p8',
      keyId: process.env.APNS_KEY_ID || '9TB3SV933G',
      teamId: process.env.APNS_TEAM_ID || '3ZGW2224V2',
      bundleId: process.env.APNS_BUNDLE_ID || 'com.nxtgenaidev.evenly',
      production: process.env.NODE_ENV === 'production',
    },
    fcm: {
      projectId: process.env.FCM_PROJECT_ID || 'nextgenai-f6743',
    },
  },
};
