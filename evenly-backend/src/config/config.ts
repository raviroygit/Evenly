import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || '',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
  auth: {
    serviceUrl: process.env.AUTH_SERVICE_URL || 'https://nxtgenaidev-auth-2.onrender.com/api/v1/auth',
    apiKey: process.env.AUTH_SERVICE_API_KEY || '',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '',
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
    supportEmail: process.env.SUPPORT_EMAIL || 'support@evenly.com',
  },
  app: {
    baseUrl: process.env.APP_BASE_URL || 'https://b98351f842e5.ngrok-free.app',
  },
};
