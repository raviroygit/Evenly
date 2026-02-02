#!/usr/bin/env node
/**
 * One-time setup: copy keystore.properties.example to keystore.properties
 * if it doesn't exist, so you can edit with real credentials.
 * Run from app root.
 */

const fs = require('fs');
const path = require('path');

const APP_ROOT = path.resolve(__dirname, '..');
const EXAMPLE = path.join(APP_ROOT, 'keystore.properties.example');
const TARGET = path.join(APP_ROOT, 'keystore.properties');

if (!fs.existsSync(EXAMPLE)) {
  console.warn('keystore.properties.example not found.');
  process.exit(1);
}

if (fs.existsSync(TARGET)) {
  console.log('keystore.properties already exists.');
  process.exit(0);
}

fs.copyFileSync(EXAMPLE, TARGET);
console.log('Created keystore.properties from example. Edit it with your storePassword, keyPassword, keyAlias.');
