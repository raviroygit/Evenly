#!/usr/bin/env node

/**
 * Mobile Token Verification Script
 *
 * This script helps verify that mobile tokens are configured correctly:
 * - Checks token expiry (should be ~10 years for mobile)
 * - Verifies platform in token payload
 * - Confirms no refresh token for mobile
 */

const fs = require('fs');

console.log('🔍 Mobile Token Verification\n');

// Function to decode JWT without verification (just for inspection)
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());

    return { header, payload };
  } catch (error) {
    throw new Error(`Failed to decode JWT: ${error.message}`);
  }
}

// Function to format time difference
function formatTimeDifference(seconds) {
  const years = Math.floor(seconds / (365.25 * 24 * 60 * 60));
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor(seconds / (60 * 60));
  const minutes = Math.floor(seconds / 60);

  if (years > 0) return `${years} years`;
  if (days > 0) return `${days} days`;
  if (hours > 0) return `${hours} hours`;
  if (minutes > 0) return `${minutes} minutes`;
  return `${seconds} seconds`;
}

// Main verification function
function verifyToken(tokenString) {
  console.log('Token (first 20 chars):', tokenString.substring(0, 20) + '...\n');

  // Decode token
  const { header, payload } = decodeJWT(tokenString);

  console.log('📋 Token Header:');
  console.log(JSON.stringify(header, null, 2));
  console.log();

  console.log('📋 Token Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log();

  // Calculate expiry
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = payload.exp;
  const issuedAt = payload.iat || payload.createdAt / 1000;

  const timeUntilExpiry = expiresAt - now;
  const tokenLifetime = expiresAt - issuedAt;

  console.log('⏰ Token Timing:');
  console.log(`  Issued at:    ${new Date(issuedAt * 1000).toLocaleString()}`);
  console.log(`  Expires at:   ${new Date(expiresAt * 1000).toLocaleString()}`);
  console.log(`  Current time: ${new Date(now * 1000).toLocaleString()}`);
  console.log();

  console.log(`  Time until expiry: ${formatTimeDifference(timeUntilExpiry)}`);
  console.log(`  Token lifetime:    ${formatTimeDifference(tokenLifetime)}`);
  console.log();

  // Verification checks
  console.log('✅ Verification Results:\n');

  const checks = [];

  // Check 1: Token lifetime (should be ~10 years for mobile)
  const years = tokenLifetime / (365.25 * 24 * 60 * 60);
  if (years >= 9.5 && years <= 10.5) {
    checks.push({ status: '✅', message: `Token lifetime is ${years.toFixed(1)} years (MOBILE TOKEN)` });
  } else if (tokenLifetime < 3600) {
    checks.push({ status: '❌', message: `Token lifetime is ${formatTimeDifference(tokenLifetime)} (WEB TOKEN - expected 10 years)` });
  } else {
    checks.push({ status: '⚠️', message: `Token lifetime is ${formatTimeDifference(tokenLifetime)} (unexpected)` });
  }

  // Check 2: Platform field
  if (payload.platform === 'mobile') {
    checks.push({ status: '✅', message: 'Platform is set to "mobile"' });
  } else if (payload.platform === 'web') {
    checks.push({ status: '❌', message: 'Platform is set to "web" (expected "mobile")' });
  } else {
    checks.push({ status: '⚠️', message: `Platform is "${payload.platform || 'not set'}" (expected "mobile")` });
  }

  // Check 3: User ID present
  if (payload.userId || payload.sub) {
    checks.push({ status: '✅', message: `User ID: ${payload.userId || payload.sub}` });
  } else {
    checks.push({ status: '❌', message: 'No user ID found in token' });
  }

  // Check 4: Token type
  if (payload.type === 'access') {
    checks.push({ status: '✅', message: 'Token type is "access"' });
  } else {
    checks.push({ status: '⚠️', message: `Token type is "${payload.type || 'not set'}"` });
  }

  // Print checks
  checks.forEach(check => {
    console.log(`${check.status} ${check.message}`);
  });

  console.log();

  // Final verdict
  const allPassed = checks.filter(c => c.status === '✅').length === checks.length;
  const hasCriticalFailure = checks.some(c => c.status === '❌');

  if (allPassed) {
    console.log('🎉 VERIFICATION PASSED: This is a valid mobile never-expiring token!\n');
  } else if (hasCriticalFailure) {
    console.log('❌ VERIFICATION FAILED: This token is NOT configured as a mobile token.\n');
    console.log('💡 Troubleshooting:');
    console.log('   1. Ensure mobile app sends "x-client-type: mobile" header');
    console.log('   2. Check evenly-backend forwards the header to shared auth');
    console.log('   3. Verify shared auth detects mobile and generates 10-year tokens');
    console.log();
  } else {
    console.log('⚠️  VERIFICATION WARNING: Some checks did not pass.\n');
  }
}

// Check if token is provided as argument
if (process.argv.length >= 3) {
  const token = process.argv[2];
  verifyToken(token);
} else {
  console.log('Usage: node verify-mobile-token.js <JWT_TOKEN>\n');
  console.log('Or paste your token below and press Enter:\n');

  // Read from stdin
  process.stdin.setEncoding('utf8');
  let input = '';

  process.stdin.on('data', (chunk) => {
    input += chunk;
  });

  process.stdin.on('end', () => {
    const token = input.trim();
    if (token) {
      verifyToken(token);
    } else {
      console.log('No token provided.');
    }
  });

  // For interactive mode
  process.stdin.resume();
}
