/**
 * Native (iOS + Android) Google Sign-In configuration.
 *
 * Uses @react-native-google-signin/google-signin which requires native modules.
 * All access is via lazy require() to avoid crashes in Expo Go
 * (same pattern as expo-notifications).
 */
import { Platform } from 'react-native';
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
} from '../constants/googleAuth';

/**
 * Configure Google Sign-In — call once on app startup (e.g. in _layout.tsx).
 */
export function configureGoogleSignIn(): void {
  try {
    const { GoogleSignin } =
      require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');

    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      ...(Platform.OS === 'ios' ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
      offlineAccess: false,
    });
  } catch (error) {
    // Native module not available (e.g. Expo Go) — Google Sign-In will be disabled
    console.warn('[GoogleSignIn] configure failed — native module not available:', error);
  }
}

/**
 * Trigger the native Google Sign-In flow.
 * @returns Google ID token string, or null if cancelled/failed.
 */
/**
 * Sign out from Google — clears cached account so the account picker
 * shows up on the next sign-in attempt.
 * Call this during app logout.
 */
export async function googleSignOut(): Promise<void> {
  try {
    const { GoogleSignin } =
      require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
    await GoogleSignin.signOut();
  } catch {
    // Ignore — not signed in or native module unavailable
  }
}

export async function nativeGoogleSignIn(): Promise<string | null> {
  try {
    const { GoogleSignin, statusCodes } =
      require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    // v16+ returns { data: { idToken } } instead of { idToken }
    const idToken = (response as any).data?.idToken ?? (response as any).idToken ?? null;

    return idToken;
  } catch (error: any) {
    const { statusCodes } =
      require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // User cancelled — not an error
      return null;
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      // Sign-in already in progress
      return null;
    }
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.warn('[GoogleSignIn] Play Services not available');
      return null;
    }
    throw error;
  }
}
