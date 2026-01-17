#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();

const { manageSecrets, getSecretsForDeployment, parseEnvFile, isSensitiveVariable } = require('./manage-secrets');

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

// Get all environment variables dynamically
const allEnvVars = parseEnvFile();

// Reserved env vars that Cloud Run sets automatically
const RESERVED_ENV_VARS = ['PORT', 'K_SERVICE', 'K_REVISION', 'K_CONFIGURATION'];

// Separate secrets from regular env vars
const regularEnvVars = [];
Object.entries(allEnvVars).forEach(([key, value]) => {
  // Skip sensitive variables, reserved variables, and empty values
  if (!isSensitiveVariable(key) && !RESERVED_ENV_VARS.includes(key) && value) {
    // Override NODE_ENV to production for Cloud Run deployment
    if (key === 'NODE_ENV') {
      regularEnvVars.push(`${key}=production`);
    } else {
      regularEnvVars.push(`${key}=${value}`);
    }
  }
});

// Add required env vars if not already present
if (!allEnvVars.HOST) {
  regularEnvVars.push('HOST=0.0.0.0');
}
if (!allEnvVars.NODE_ENV) {
  regularEnvVars.push('NODE_ENV=production');
}

// Remove duplicates
const uniqueEnvVars = [...new Set(regularEnvVars)];

// Write env vars to a file (Cloud Run YAML format)
const fs = require('fs');
const envVarsFile = path.join(__dirname, '..', '.env.yaml');
const envVarsContent = uniqueEnvVars.map(envVar => {
  const [key, ...valueParts] = envVar.split('=');
  const value = valueParts.join('='); // Handle values with = in them
  return `${key}: "${value.replace(/"/g, '\\"')}"`;  // Escape quotes
}).join('\n');

fs.writeFileSync(envVarsFile, envVarsContent);
console.log(`📝 Created env vars file: ${envVarsFile}`);

// Get all secrets dynamically
const secretNames = getSecretsForDeployment();
const secrets = secretNames.map(name => `${name}=${name}:latest`).join(',');

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
  '--cpu-boost',  // Speed up container startup
  `--env-vars-file="${envVarsFile}"`,  // Use file instead of inline
  secrets ? `--set-secrets "${secrets}"` : ''
].filter(Boolean).join(' ');

console.log('🚀 Starting Evenly Backend deployment...');
console.log(`📦 Project: ${config.projectId}`);
console.log(`🌍 Region: ${config.region}`);
console.log(`🔧 Service: ${config.serviceName}`);
console.log(`🖼️  Image: ${imageName}`);
console.log('');

try {
  // Step 1: Manage Secrets (create missing ones, skip existing)
  console.log('🔐 Managing secrets in Google Cloud Secret Manager...');
  const { results } = manageSecrets({ updateExisting: false });

  if (results.failed.length > 0) {
    throw new Error(`Failed to create/update ${results.failed.length} secret(s)`);
  }

  console.log('✅ Secrets management completed\n');

  // Step 2: Build TypeScript
  console.log('📝 Building TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ TypeScript build completed\n');

  // Step 3: Build Docker image
  console.log('🐳 Building Docker image...');
  execSync('gcloud builds submit --config cloudbuild.yaml', { stdio: 'inherit' });
  console.log('✅ Docker build completed\n');

  // Step 4: Deploy to Cloud Run
  console.log('🚀 Deploying to Cloud Run...');
  console.log(`📋 Environment Variables: ${regularEnvVars.length} vars`);
  console.log(`🔒 Secrets: ${secretNames.length} secrets`);
  console.log('');

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
