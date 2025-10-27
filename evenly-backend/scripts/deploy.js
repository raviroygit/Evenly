#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

// Configuration - All values from environment variables
const config = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  region: process.env.REGION,
  serviceName: process.env.SERVICE_NAME,
  baseUrl: process.env.BASE_URL,
  domain: process.env.DOMAIN,
  origins: [
    process.env.ORIGIN1,
    process.env.ORIGIN2,
    "http://localhost:3000"
  ],
  authServiceUrl: process.env.AUTH_SERVICE_URL,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  rateLimitMax: process.env.RATE_LIMIT_MAX,
  rateLimitTimeWindow: process.env.RATE_LIMIT_TIME_WINDOW,
  emailHost: process.env.EMAIL_HOST,
  emailPort: process.env.EMAIL_PORT,
  emailUser: process.env.EMAIL_USER,
  supportEmail: process.env.SUPPORT_EMAIL
};

// Build image name
const imageName = `gcr.io/${config.projectId}/${config.serviceName}:latest`;

// Environment variables - Only include if set
const envVars = [
  config.projectId ? `GOOGLE_CLOUD_PROJECT=${config.projectId}` : null,
  config.region ? `REGION=${config.region}` : null,
  config.serviceName ? `SERVICE_NAME=${config.serviceName}` : null,
  config.baseUrl ? `BASE_URL=${config.baseUrl}` : null,
  config.domain ? `DOMAIN=${config.domain}` : null,
  config.origins[0] ? `ORIGIN1=${config.origins[0]}` : null,
  config.origins[1] ? `ORIGIN2=${config.origins[1]}` : null,
  'HOST=0.0.0.0',
  'NODE_ENV=production',
  config.origins[0] ? `CORS_ORIGIN=${config.origins[0]}` : null,
  config.authServiceUrl ? `AUTH_SERVICE_URL=${config.authServiceUrl}` : null,
  config.jwtExpiresIn ? `JWT_EXPIRES_IN=${config.jwtExpiresIn}` : null,
  config.rateLimitMax ? `RATE_LIMIT_MAX=${config.rateLimitMax}` : null,
  config.rateLimitTimeWindow ? `RATE_LIMIT_TIME_WINDOW=${config.rateLimitTimeWindow}` : null,
  config.domain ? `SWAGGER_HOST=${config.domain}` : null,
  'SWAGGER_SCHEMES=https',
  config.emailHost ? `EMAIL_HOST=${config.emailHost}` : null,
  config.emailPort ? `EMAIL_PORT=${config.emailPort}` : null,
  'EMAIL_SECURE=true',
  config.emailUser ? `EMAIL_USER=${config.emailUser}` : null,
  config.supportEmail ? `SUPPORT_EMAIL=${config.supportEmail}` : null,
  config.baseUrl ? `APP_BASE_URL=${config.baseUrl}/api/v1` : null
].filter(Boolean).join(',');

// Secrets
const secrets = [
  'EVENLY_DATABASE_URL=EVENLY_DATABASE_URL:latest',
  'AUTH_SERVICE_API_KEY=AUTH_SERVICE_API_KEY:latest',
  'JWT_SECRET=JWT_SECRET:latest',
  'EMAIL_PASS=EMAIL_PASS:latest'
].join(',');

// Build gcloud command with minimal resources for free tier
const deployCommand = [
  'gcloud run deploy',
  config.serviceName,
  `--image ${imageName}`,
  '--platform managed',
  `--region ${config.region}`,
  '--allow-unauthenticated',
  '--cpu 1',
  '--memory 512Mi',
  '--min-instances 0',
  '--max-instances 10',
  '--concurrency 1000',
  '--timeout 300',
  `--set-env-vars ${envVars}`,
  `--set-secrets ${secrets}`
].join(' ');

console.log('🚀 Starting Evenly Backend deployment...');
console.log(`📦 Project: ${config.projectId}`);
console.log(`🌍 Region: ${config.region}`);
console.log(`🔧 Service: ${config.serviceName}`);
console.log(`🖼️  Image: ${imageName}`);
console.log('');

try {
  // Step 1: Build TypeScript
  console.log('📝 Building TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ TypeScript build completed\n');

  // Step 2: Build Docker image
  console.log('🐳 Building Docker image...');
  execSync('gcloud builds submit --config cloudbuild.yaml', { stdio: 'inherit' });
  console.log('✅ Docker build completed\n');

  // Step 3: Deploy to Cloud Run
  console.log('🚀 Deploying to Cloud Run...');
  execSync(deployCommand, { stdio: 'inherit' });
  console.log('✅ Deployment completed\n');

  console.log('🎉 Evenly Backend deployment successful!');
  console.log(`📖 API Documentation: https://${config.domain}/docs`);
  console.log(`🔍 Health Check: https://${config.domain}/health`);
  console.log(`🌐 API Base URL: https://${config.domain}/api`);

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
