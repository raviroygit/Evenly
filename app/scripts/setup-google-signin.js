#!/usr/bin/env node
/**
 * Post-prebuild script: preserves a stable debug keystore across prebuilds
 * so the SHA-1 fingerprint stays constant for Google Sign-In.
 *
 * expo prebuild regenerates android/app/debug.keystore with a fresh SHA-1
 * each time, which breaks Google Sign-In (GCP rejects unknown fingerprints).
 *
 * This script:
 *   1. Copies a known debug.keystore from app root → android/app/ (if it exists)
 *   2. Or saves the freshly generated one to app root (first-time setup)
 *   3. Prints the debug keystore SHA-1 for GCP registration
 *
 * Run automatically via: npm run prebuild
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APP_ROOT = path.resolve(__dirname, '..');
const DEBUG_KEYSTORE_SOURCE = path.join(APP_ROOT, 'debug.keystore');
const DEBUG_KEYSTORE_DEST = path.join(APP_ROOT, 'android', 'app', 'debug.keystore');

function main() {
  console.log('\n=== Google Sign-In: debug keystore setup ===\n');

  // 1. Copy stable debug keystore if it exists at app root
  if (fs.existsSync(DEBUG_KEYSTORE_SOURCE)) {
    if (fs.existsSync(path.join(APP_ROOT, 'android', 'app'))) {
      fs.copyFileSync(DEBUG_KEYSTORE_SOURCE, DEBUG_KEYSTORE_DEST);
      console.log('Copied stable debug.keystore → android/app/');
    } else {
      console.log('android/app/ not found — skipping keystore copy (run prebuild with --platform android).');
      return;
    }
  } else {
    // First time: save the generated one to app root for future prebuilds
    if (fs.existsSync(DEBUG_KEYSTORE_DEST)) {
      fs.copyFileSync(DEBUG_KEYSTORE_DEST, DEBUG_KEYSTORE_SOURCE);
      console.log('First run: saved android/app/debug.keystore → app root for future prebuilds.');
    } else {
      console.log('No debug.keystore found. Run prebuild with --platform android first.');
      return;
    }
  }

  // 2. Print debug keystore SHA-1 for GCP registration
  const keystorePath = fs.existsSync(DEBUG_KEYSTORE_DEST) ? DEBUG_KEYSTORE_DEST : DEBUG_KEYSTORE_SOURCE;
  if (fs.existsSync(keystorePath)) {
    try {
      const output = execSync(
        `keytool -list -v -keystore "${keystorePath}" -storepass android -alias androiddebugkey 2>&1`,
        { encoding: 'utf8' }
      );
      const sha1Match = output.match(/SHA1:\s*([\w:]+)/);
      const sha256Match = output.match(/SHA-256:\s*([\w:]+)/);

      console.log('\nDebug keystore fingerprints:');
      if (sha1Match) console.log('  SHA-1:   ', sha1Match[1]);
      if (sha256Match) console.log('  SHA-256: ', sha256Match[1]);
      console.log('\nRegister the SHA-1 above in GCP Console (project 374738393915):');
      console.log('  → APIs & Services → Credentials → Android OAuth client');
      console.log('  → Package: com.nxtgenaidev.evenly\n');
    } catch (e) {
      console.warn('Could not read debug keystore fingerprints (keytool not found?):', e.message);
    }
  }
}

main();
