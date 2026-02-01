/**
 * Backend Endpoint Verification Script
 *
 * This script tests if the backend endpoints exist and are accessible.
 * Run this before debugging the mobile app to ensure backend is working.
 *
 * Usage:
 *   node verify-backend-endpoint.js
 */

const axios = require('axios');

// Configuration - UPDATE THESE
const BACKEND_URL = 'http://localhost:8001/api'; // Change to your backend URL
const SSO_TOKEN = 'YOUR_SSO_TOKEN_HERE'; // Get from app logs or AsyncStorage

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

async function testHealthEndpoint() {
  logSection('1. Testing Health Endpoint');

  try {
    const healthUrl = BACKEND_URL.replace('/api', '') + '/health';
    log(`Testing: ${healthUrl}`, 'blue');

    const response = await axios.get(healthUrl, {
      timeout: 5000,
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (response.data.status === 'ok') {
      log('✅ Backend is running and healthy', 'green');
      return true;
    } else {
      log('⚠️  Backend responded but status is not ok', 'yellow');
      log(`Response: ${JSON.stringify(response.data)}`, 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Backend health check failed', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.code === 'ECONNREFUSED') {
      log('Backend server is not running or URL is incorrect', 'red');
    }
    return false;
  }
}

async function testCreateEndpoint() {
  logSection('2. Testing POST /khata/transactions (Create)');

  if (!SSO_TOKEN || SSO_TOKEN === 'YOUR_SSO_TOKEN_HERE') {
    log('⚠️  SSO_TOKEN not configured - skipping authenticated tests', 'yellow');
    log('Update SSO_TOKEN in this script to test authenticated endpoints', 'yellow');
    return null;
  }

  try {
    const url = `${BACKEND_URL}/khata/transactions`;
    log(`Testing: POST ${url}`, 'blue');
    log('Note: This will attempt to create a test transaction', 'yellow');

    // We won't actually create, just check if endpoint exists by sending invalid data
    // A 400/422 response means endpoint exists, 404 means it doesn't
    const response = await axios.post(url, {}, {
      timeout: 5000,
      headers: {
        'Cookie': `sso_token=${SSO_TOKEN}`,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Accept any status
    });

    if (response.status === 404) {
      log('❌ POST endpoint not found (404)', 'red');
      return false;
    } else if (response.status === 401 || response.status === 403) {
      log('⚠️  Authentication required but SSO_TOKEN might be invalid', 'yellow');
      log('Endpoint exists but authentication failed', 'yellow');
      return null;
    } else {
      log(`✅ POST endpoint exists (status: ${response.status})`, 'green');
      return true;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('❌ Backend not reachable', 'red');
    } else {
      log('❌ Error testing POST endpoint', 'red');
      log(`Error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testUpdateEndpoint() {
  logSection('3. Testing PUT /khata/transactions/:id (Update)');

  if (!SSO_TOKEN || SSO_TOKEN === 'YOUR_SSO_TOKEN_HERE') {
    log('⚠️  SSO_TOKEN not configured - skipping authenticated tests', 'yellow');
    return null;
  }

  try {
    const testId = 'test-transaction-id';
    const url = `${BACKEND_URL}/khata/transactions/${testId}`;
    log(`Testing: PUT ${url}`, 'blue');
    log('Note: Using fake transaction ID to test if endpoint exists', 'yellow');

    const response = await axios.put(url, {}, {
      timeout: 5000,
      headers: {
        'Cookie': `sso_token=${SSO_TOKEN}`,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Accept any status
    });

    if (response.status === 404) {
      log('❌ PUT endpoint not found (404)', 'red');
      log('This is likely why updates are failing!', 'red');
      return false;
    } else if (response.status === 405) {
      log('❌ Method Not Allowed (405)', 'red');
      log('Backend doesn\'t support PUT method for this endpoint', 'red');
      return false;
    } else if (response.status === 401 || response.status === 403) {
      log('⚠️  Authentication required but SSO_TOKEN might be invalid', 'yellow');
      log('Endpoint exists but authentication failed', 'yellow');
      return null;
    } else {
      log(`✅ PUT endpoint exists (status: ${response.status})`, 'green');
      return true;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('❌ Backend not reachable', 'red');
    } else {
      log('❌ Error testing PUT endpoint', 'red');
      log(`Error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testCORS() {
  logSection('4. Testing CORS Configuration');

  try {
    const url = `${BACKEND_URL}/khata/customers`;
    log(`Testing OPTIONS request: ${url}`, 'blue');

    const response = await axios.options(url, {
      timeout: 5000,
      headers: {
        'Origin': 'http://localhost:8081',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'content-type'
      },
      validateStatus: () => true
    });

    const allowedMethods = response.headers['access-control-allow-methods'];
    const allowedOrigin = response.headers['access-control-allow-origin'];

    log(`Allowed Methods: ${allowedMethods || 'Not specified'}`, 'blue');
    log(`Allowed Origin: ${allowedOrigin || 'Not specified'}`, 'blue');

    if (allowedMethods && allowedMethods.includes('PUT')) {
      log('✅ PUT method is allowed by CORS', 'green');
      return true;
    } else {
      log('⚠️  PUT method might not be allowed by CORS', 'yellow');
      return false;
    }
  } catch (error) {
    log('⚠️  Could not test CORS (this is optional)', 'yellow');
    return null;
  }
}

async function runAllTests() {
  console.log('\n');
  log('🔍 Backend Endpoint Verification Script', 'cyan');
  log('Testing backend endpoints for Evenly app', 'cyan');

  // Test 1: Health check
  const healthOk = await testHealthEndpoint();

  if (!healthOk) {
    log('\n❌ Backend is not running or not accessible', 'red');
    log('Please start the backend server and update BACKEND_URL in this script', 'red');
    return;
  }

  // Test 2: Create endpoint
  const createOk = await testCreateEndpoint();

  // Test 3: Update endpoint (THIS IS THE KEY TEST)
  const updateOk = await testUpdateEndpoint();

  // Test 4: CORS
  const corsOk = await testCORS();

  // Summary
  logSection('Summary');

  log(`✅ Health Check: ${healthOk ? 'PASS' : 'FAIL'}`, healthOk ? 'green' : 'red');

  if (createOk === null) {
    log('⚠️  Create Endpoint: SKIPPED (no SSO_TOKEN)', 'yellow');
  } else {
    log(`${createOk ? '✅' : '❌'} Create Endpoint: ${createOk ? 'EXISTS' : 'NOT FOUND'}`, createOk ? 'green' : 'red');
  }

  if (updateOk === null) {
    log('⚠️  Update Endpoint: SKIPPED (no SSO_TOKEN)', 'yellow');
  } else {
    log(`${updateOk ? '✅' : '❌'} Update Endpoint: ${updateOk ? 'EXISTS' : 'NOT FOUND'}`, updateOk ? 'green' : 'red');
  }

  if (corsOk === null) {
    log('⚠️  CORS Check: SKIPPED', 'yellow');
  } else {
    log(`${corsOk ? '✅' : '⚠️ '} CORS PUT Method: ${corsOk ? 'ALLOWED' : 'UNCERTAIN'}`, corsOk ? 'green' : 'yellow');
  }

  // Diagnosis
  if (updateOk === false) {
    logSection('🔴 DIAGNOSIS: Update Endpoint Missing!');
    log('The PUT /khata/transactions/:id endpoint does not exist in the backend', 'red');
    log('This is why transaction updates are failing with Network Error', 'red');
    log('', 'reset');
    log('📝 FIX REQUIRED IN BACKEND:', 'yellow');
    log('1. Add PUT /khata/transactions/:id endpoint in backend routes', 'yellow');
    log('2. Implement controller method to handle transaction updates', 'yellow');
    log('3. Ensure it supports multipart/form-data for image uploads', 'yellow');
    log('4. Set timeout to at least 120 seconds for image uploads', 'yellow');
  } else if (updateOk === true) {
    log('✅ Update endpoint exists. Issue might be elsewhere.', 'green');
    log('Check the debug logs from the mobile app for more details.', 'green');
  }

  console.log('\n');
}

// Run tests
runAllTests().catch(error => {
  log('\n❌ Script failed with error:', 'red');
  console.error(error);
  process.exit(1);
});
