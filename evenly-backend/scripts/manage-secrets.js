#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;

// Patterns to identify sensitive environment variables that should be secrets
const SENSITIVE_PATTERNS = [
  /SECRET/i,
  /PASSWORD/i,
  /_PASS$/i,
  /_KEY$/i,
  /API_KEY/i,
  /TOKEN/i,
  /DATABASE_URL/i,
  /DB_URL/i,
  /CLOUDINARY/i
];

// Variables to exclude from being secrets (non-sensitive config)
const EXCLUDE_PATTERNS = [
  /^PORT$/,
  /^HOST$/,
  /^NODE_ENV$/,
  /^GOOGLE_CLOUD_PROJECT$/,
  /^REGION$/,
  /^SERVICE_NAME$/,
  /^BASE_URL$/,
  /^DOMAIN$/,
  /^ORIGIN/,
  /^CORS_ORIGIN/,
  /^EMAIL_HOST$/,
  /^EMAIL_PORT$/,
  /^EMAIL_SECURE$/,
  /^EMAIL_USER$/,
  /^SUPPORT_EMAIL$/,
  /^RATE_LIMIT/,
  /^SWAGGER/,
  /^APP_BASE_URL$/,
  /EXPIRES_IN$/,
  /^EVENLY_ORGANIZATION_ID$/
];

// Parse .env file and extract all variables
function parseEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found');
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key && value) {
        envVars[key] = value;
      }
    }
  });

  return envVars;
}

// Check if a variable should be a secret
function isSensitiveVariable(key) {
  // Check if it matches exclude patterns
  if (EXCLUDE_PATTERNS.some(pattern => pattern.test(key))) {
    return false;
  }

  // Check if it matches sensitive patterns
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

// Check if a secret exists in Google Cloud Secret Manager
function secretExists(secretName) {
  try {
    execSync(`gcloud secrets describe ${secretName} --project=${PROJECT_ID}`, {
      stdio: 'pipe'
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Create a new secret in Google Cloud Secret Manager
function createSecret(secretName, secretValue) {
  try {
    const tempFile = `/tmp/${secretName}_${Date.now()}`;
    fs.writeFileSync(tempFile, secretValue);

    execSync(
      `gcloud secrets create ${secretName} --project=${PROJECT_ID} --replication-policy="automatic" --data-file=${tempFile}`,
      { stdio: 'pipe' }
    );

    fs.unlinkSync(tempFile);
    console.log(`  ✅ Created: ${secretName}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to create ${secretName}: ${error.message}`);
    return false;
  }
}

// Update an existing secret with a new version
function updateSecret(secretName, secretValue) {
  try {
    const tempFile = `/tmp/${secretName}_${Date.now()}`;
    fs.writeFileSync(tempFile, secretValue);

    execSync(
      `gcloud secrets versions add ${secretName} --project=${PROJECT_ID} --data-file=${tempFile}`,
      { stdio: 'pipe' }
    );

    fs.unlinkSync(tempFile);
    console.log(`  ✅ Updated: ${secretName}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to update ${secretName}: ${error.message}`);
    return false;
  }
}

// Main function to manage all secrets
function manageSecrets(options = {}) {
  const { createOnly = false, updateExisting = false } = options;

  console.log('🔐 Managing Google Cloud Secrets...\n');
  console.log(`📦 Project: ${PROJECT_ID}\n`);

  // Parse .env file
  const envVars = parseEnvFile();
  console.log(`📄 Found ${Object.keys(envVars).length} environment variables in .env file\n`);

  // Identify sensitive variables
  const sensitiveVars = {};
  const regularVars = {};

  Object.entries(envVars).forEach(([key, value]) => {
    if (isSensitiveVariable(key)) {
      sensitiveVars[key] = value;
    } else {
      regularVars[key] = value;
    }
  });

  console.log(`🔒 Identified ${Object.keys(sensitiveVars).length} sensitive variables (will be secrets):`);
  Object.keys(sensitiveVars).forEach(key => console.log(`   - ${key}`));
  console.log('');

  console.log(`📋 Identified ${Object.keys(regularVars).length} regular variables (will be env vars):`);
  Object.keys(regularVars).forEach(key => console.log(`   - ${key}`));
  console.log('');

  // Process each sensitive variable
  const results = {
    created: [],
    updated: [],
    skipped: [],
    failed: []
  };

  console.log('🚀 Processing secrets...\n');

  Object.entries(sensitiveVars).forEach(([key, value]) => {
    const exists = secretExists(key);

    if (exists) {
      if (updateExisting) {
        if (updateSecret(key, value)) {
          results.updated.push(key);
        } else {
          results.failed.push(key);
        }
      } else {
        console.log(`  ⏭️  Skipped: ${key} (already exists, use --update to update)`);
        results.skipped.push(key);
      }
    } else {
      if (createSecret(key, value)) {
        results.created.push(key);
      } else {
        results.failed.push(key);
      }
    }
  });

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Created: ${results.created.length}`);
  if (results.created.length > 0) {
    results.created.forEach(key => console.log(`   - ${key}`));
  }

  console.log(`\n📝 Updated: ${results.updated.length}`);
  if (results.updated.length > 0) {
    results.updated.forEach(key => console.log(`   - ${key}`));
  }

  console.log(`\n⏭️  Skipped: ${results.skipped.length}`);
  if (results.skipped.length > 0) {
    results.skipped.forEach(key => console.log(`   - ${key}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(key => console.log(`   - ${key}`));
  }

  console.log('='.repeat(60));

  // Return list of all secret names for deployment
  return {
    secrets: Object.keys(sensitiveVars),
    envVars: regularVars,
    results
  };
}

// Get list of all secrets for deployment (without managing them)
function getSecretsForDeployment() {
  const envVars = parseEnvFile();
  const secrets = [];

  Object.keys(envVars).forEach(key => {
    if (isSensitiveVariable(key)) {
      secrets.push(key);
    }
  });

  return secrets;
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const updateExisting = args.includes('--update') || args.includes('-u');
  const listOnly = args.includes('--list') || args.includes('-l');

  if (listOnly) {
    const secrets = getSecretsForDeployment();
    console.log('🔒 Secrets that will be used in deployment:');
    secrets.forEach(key => console.log(`   - ${key}`));
    process.exit(0);
  }

  try {
    manageSecrets({ updateExisting });
    console.log('\n✅ Secret management completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = { manageSecrets, getSecretsForDeployment, parseEnvFile, isSensitiveVariable };
