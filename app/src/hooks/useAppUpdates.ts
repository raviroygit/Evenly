import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform, Alert, AppState, AppStateStatus, Linking } from 'react-native';
import Constants from 'expo-constants';
import { ENV } from '../config/env';

// Minimum interval between update checks (5 minutes)
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.nxtgenaidev.evenly';
const APP_STORE_URL = 'https://apps.apple.com/us/app/evenlysplit/id6756101586';

/**
 * Compare two semver strings. Returns:
 *  1  if a > b
 * -1  if a < b
 *  0  if equal
 */
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export function useAppUpdates() {
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const lastCheckRef = useRef<number>(0);

  const checkForUpdates = useCallback(async () => {
    // Throttle: skip if checked recently
    const now = Date.now();
    if (now - lastCheckRef.current < CHECK_INTERVAL_MS) {
      return;
    }
    lastCheckRef.current = now;

    try {
      setIsChecking(true);

      // Get the installed app version from native build
      const currentVersion =
        Constants.expoConfig?.version ||  // from app.json at build time
        Constants.manifest2?.extra?.expoClient?.version ||
        ENV.APP_VERSION ||
        '0.0.0';

      // Ask backend for latest version
      const baseUrl = (ENV.EVENLY_BACKEND_URL || '').replace(/\/api\/?$/, '');
      const res = await fetch(`${baseUrl}/api/app/version`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) return;

      const { data } = await res.json();
      const { latestVersion, minVersion, forceUpdate, releaseNotes } = data;

      // Check if current version is below minimum (force update)
      const belowMin = minVersion && compareSemver(currentVersion, minVersion) < 0;

      // Check if a newer version is available
      const hasUpdate = compareSemver(currentVersion, latestVersion) < 0;

      if (!hasUpdate && !belowMin) return;

      setUpdateAvailable(true);

      const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
      const isForced = forceUpdate || belowMin;

      const message = releaseNotes
        ? `A new version (${latestVersion}) is available.\n\n${releaseNotes}`
        : `A new version (${latestVersion}) is available. Please update for the best experience.`;

      const buttons: any[] = [
        {
          text: 'Update Now',
          onPress: () => Linking.openURL(storeUrl),
        },
      ];

      // Only allow "Later" if not a forced update
      if (!isForced) {
        buttons.push({ text: 'Later', style: 'cancel' });
      }

      Alert.alert('Update Available', message, buttons, {
        cancelable: !isForced,
      });
    } catch (error) {
      // Silently fail - don't interrupt user experience
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Only check in production and on native platforms
    if (__DEV__ || Platform.OS === 'web') {
      return;
    }

    // Check on launch
    checkForUpdates();

    // Also check when app comes back to foreground
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkForUpdates();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [checkForUpdates]);

  return {
    isChecking,
    updateAvailable,
    checkForUpdates,
  };
}
