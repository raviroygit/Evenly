import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { SilentTokenRefresh } from './silentTokenRefresh';
import { AuthStorage } from './storage';

/**
 * Background Token Refresh Manager
 *
 * Uses Expo Background Fetch to refresh tokens even when app is closed
 * Runs every 15-30 minutes (iOS minimum: 15 min, controlled by OS)
 */

const BACKGROUND_REFRESH_TASK = 'BACKGROUND_TOKEN_REFRESH';

// Define background task
TaskManager.defineTask(BACKGROUND_REFRESH_TASK, async () => {
  try {
    console.log('[Background] Task started at', new Date().toISOString());

    // Get stored tokens
    const authData = await AuthStorage.getAuthData();
    if (!authData?.accessToken) {
      console.log('[Background] No auth data, skipping');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Check if token needs urgent refresh (< 5 minutes remaining)
    const tokenInfo = SilentTokenRefresh.getTokenExpiryInfo(authData.accessToken);

    if (tokenInfo.needsUrgentRefresh) {
      console.log(`[Background] Token has ${tokenInfo.minutesUntilExpiry} minutes remaining, refreshing...`);
      const success = await SilentTokenRefresh.refresh();

      if (success) {
        console.log('[Background] ✅ Refresh successful');
        await SilentTokenRefresh.saveRefreshTimestamp();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } else {
        console.error('[Background] ❌ Refresh failed');
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    }

    console.log('[Background] Token still healthy, no refresh needed');
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[Background] Task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register background refresh task
 * Call this on app startup to enable background token refresh
 */
export async function registerBackgroundRefresh(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_REFRESH_TASK);

    if (isRegistered) {
      console.log('[Background] Task already registered, unregistering first');
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_REFRESH_TASK);
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_REFRESH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (iOS minimum)
      stopOnTerminate: false,   // Continue after app termination
      startOnBoot: true,        // Restart on device reboot
    });

    console.log('[Background] ✅ Task registered successfully');
  } catch (error) {
    console.error('[Background] ❌ Registration failed:', error);
    throw error;
  }
}

/**
 * Unregister background refresh task
 * Call this when user logs out or to disable background refresh
 */
export async function unregisterBackgroundRefresh(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_REFRESH_TASK);
    console.log('[Background] Task unregistered');
  } catch (error) {
    console.error('[Background] Unregister failed:', error);
  }
}

/**
 * Get background refresh task status
 * Returns BackgroundFetchStatus:
 * - Restricted (1): Background refresh is unavailable and cannot be enabled
 * - Denied (2): User has explicitly disabled background refresh
 * - Available (3): Background refresh is enabled and available
 */
export async function getBackgroundRefreshStatus(): Promise<BackgroundFetch.BackgroundFetchStatus> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    return status;
  } catch (error) {
    console.error('[Background] Failed to get status:', error);
    return BackgroundFetch.BackgroundFetchStatus.Denied;
  }
}

/**
 * Check if background refresh is available
 */
export async function isBackgroundRefreshAvailable(): Promise<boolean> {
  try {
    const status = await getBackgroundRefreshStatus();
    return status === BackgroundFetch.BackgroundFetchStatus.Available;
  } catch {
    return false;
  }
}
