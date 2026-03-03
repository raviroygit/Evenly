import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import evenlyApiClient from './EvenlyApiClient';

const PUSH_TOKEN_STORAGE_KEY = '@evenly_push_token';

/**
 * Check if expo-notifications native module is available.
 * Returns false in Expo Go (native module not linked).
 *
 * expo-notifications v0.32+ uses the new Expo Modules architecture
 * (`requireNativeModule` from expo-modules-core), NOT React Native's
 * `NativeModules`. We use `requireOptionalNativeModule` which returns
 * null instead of crashing if the module isn't linked.
 */
function isNotificationsAvailable(): boolean {
  try {
    const pushTokenManager = requireOptionalNativeModule('ExpoPushTokenManager');
    const emitter = requireOptionalNativeModule('ExpoNotificationsEmitter');
    const available = !!pushTokenManager || !!emitter;
    console.log('[PushNotification] isNotificationsAvailable:', available, {
      ExpoPushTokenManager: !!pushTokenManager,
      ExpoNotificationsEmitter: !!emitter,
    });
    return available;
  } catch {
    console.log('[PushNotification] isNotificationsAvailable: false (module check threw)');
    return false;
  }
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
 * Register for push notifications: request permissions, get native device
 * push token (APNs on iOS, FCM on Android), create Android notification
 * channel, and send token to backend.
 * Returns the native device token string, or null if registration fails.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!isNotificationsAvailable()) {
    console.log('[PushNotification] Native module not available (Expo Go?), skipping');
    return null;
  }

  try {
    const Notifications = require('expo-notifications');
    const Device = require('expo-device');

    console.log('[PushNotification] Starting registration... isDevice:', Device.isDevice, 'platform:', Platform.OS);

    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      console.log('[PushNotification] Not a physical device, skipping registration');
      return null;
    }

    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    console.log('[PushNotification] Existing permission status:', existingStatus);

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('[PushNotification] Requested permission, new status:', status);
    }

    if (finalStatus !== 'granted') {
      console.log('[PushNotification] Permission not granted, final status:', finalStatus);
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

    // Get the native device push token (APNs on iOS, FCM on Android)
    console.log('[PushNotification] Getting native device push token...');
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData.data;
    console.log('[PushNotification] Got device push token:', token);

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
    console.log('[PushNotification] Registering token with backend...', { token: token.substring(0, 30) + '...', platform: Platform.OS });
    const result = await evenlyApiClient.post('/notifications/register-token', {
      token,
      platform: Platform.OS as 'ios' | 'android',
    });
    console.log('[PushNotification] Token registered successfully:', result);
  } catch (error: any) {
    console.error('[PushNotification] registerTokenWithBackend FAILED:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      url: error?.config?.url,
      baseURL: error?.config?.baseURL,
    });
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
