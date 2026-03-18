/**
 * Google OAuth Client IDs for Evenly app.
 *
 * These must be created in Google Cloud Console (project 374738393915)
 * for the Evenly bundle/package identifiers:
 *   iOS:     com.nxtgenaidev.evenly
 *   Android: com.nxtgenaidev.evenly
 *
 * Steps:
 * 1. Go to https://console.cloud.google.com/apis/credentials?project=374738393915
 * 2. Create an "OAuth 2.0 Client ID" of type "iOS" with bundle ID "com.nxtgenaidev.evenly"
 * 3. Create an "OAuth 2.0 Client ID" of type "Android" with package "com.nxtgenaidev.evenly"
 *    and your signing certificate SHA-1 fingerprint
 * 4. The "Web" client ID is shared across apps in the same project — reuse the existing one.
 * 5. Paste the IDs below.
 */

// Web client ID — shared across all apps in this GCP project.
// Used as the "audience" when verifying ID tokens on the backend.
export const GOOGLE_WEB_CLIENT_ID =
  '374738393915-fbmvsnf3fdtt6ehhkp679n2bv5rh769f.apps.googleusercontent.com';

// iOS OAuth client ID — specific to bundle ID com.nxtgenaidev.evenly
export const GOOGLE_IOS_CLIENT_ID =
  '374738393915-idtpnkmgkfk9tmh9h8pe2aqadhiga5n0.apps.googleusercontent.com';

// Android OAuth client ID
export const GOOGLE_ANDROID_CLIENT_ID =
  '374738393915-6k544gnebrtvj32qkoj7m0a6gjgdvmlv.apps.googleusercontent.com';
