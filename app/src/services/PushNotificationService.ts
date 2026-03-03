import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import evenlyApiClient from './EvenlyApiClient';

const PUSH_TOKEN_STORAGE_KEY = '@evenly_push_token';

/**
 * Check if expo-notifications native module is available.
 * Returns false in Expo Go (native module not linked).
 *
 * `require('expo-notifications')` always resolves (JS package is installed),
 * but the underlying native modules (ExpoPushTokenManager, ExpoDevice) are
 * only present in a dev-client / standalone build, NOT in Expo Go.
 * We check NativeModules directly to avoid the crash.
 */
function isNotificationsAvailable(): boolean {
  return (
    !!NativeModules.ExpoPushTokenManager ||
    !!NativeModules.ExpoNotificationsEmitter
  );
}

/**
 * Set up the foreground notification handler.
 * Call once at app startup — safe to call even if native module is missing.
 */
export function setupNotificationHandler(): void {
  if (!isNotificationsAvailable()) return;
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn('[PushNotification] setupNotificationHandler skipped:', error);
  }
}

/**
 * Register for push notifications: request permissions, get Expo push token,
 * create Android notification channel, and send token to backend.
 * Returns the Expo push token string, or null if registration fails.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!isNotificationsAvailable()) {
    console.log('[PushNotification] Native module not available (Expo Go?), skipping');
    return null;
  }

  try {
    const Notifications = require('expo-notifications');
    const Device = require('expo-device');
    const Constants = require('expo-constants').default;

    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      console.log('[PushNotification] Not a physical device, skipping registration');
      return null;
    }

    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PushNotification] Permission not granted');
      return null;
    }

    // Create Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
      });
    }

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    // Store token locally
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);

    return token;
  } catch (error) {
    console.error('[PushNotification] registerForPushNotifications error:', error);
    return null;
  }
}

/**
 * Send the push token to the backend for the authenticated user.
 */
export async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    await evenlyApiClient.post('/notifications/register-token', {
      token,
      platform: Platform.OS as 'ios' | 'android',
    });
  } catch (error) {
    console.error('[PushNotification] registerTokenWithBackend error:', error);
  }
}

/**
 * Unregister the push token from the backend.
 */
export async function unregisterTokenFromBackend(token: string): Promise<void> {
  try {
    await evenlyApiClient.post('/notifications/unregister-token', { token });
  } catch (error) {
    console.error('[PushNotification] unregisterTokenFromBackend error:', error);
  }
}

/**
 * Get the locally stored push token (used during logout).
 */
export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear the locally stored push token.
 */
export async function clearStoredPushToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Add a notification received listener (foreground). Returns a remove function.
 */
export function addNotificationReceivedListener(callback: (notification: any) => void): (() => void) | null {
  if (!isNotificationsAvailable()) return null;
  try {
    const Notifications = require('expo-notifications');
    const subscription = Notifications.addNotificationReceivedListener(callback);
    return () => subscription.remove();
  } catch {
    return null;
  }
}

/**
 * Add a notification response listener (user tapped notification). Returns a remove function.
 */
export function addNotificationResponseReceivedListener(callback: (response: any) => void): (() => void) | null {
  if (!isNotificationsAvailable()) return null;
  try {
    const Notifications = require('expo-notifications');
    const subscription = Notifications.addNotificationResponseReceivedListener(callback);
    return () => subscription.remove();
  } catch {
    return null;
  }
}

/**
 * Get the last notification response (cold start). Returns null if unavailable.
 */
export function getLastNotificationResponse(): any | null {
  if (!isNotificationsAvailable()) return null;
  try {
    const Notifications = require('expo-notifications');
    return Notifications.getLastNotificationResponse();
  } catch {
    return null;
  }
}
