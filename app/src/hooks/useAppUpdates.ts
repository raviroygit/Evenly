import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import { Platform, Alert } from 'react-native';

export function useAppUpdates() {
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Only check for updates in production and on native platforms
    if (__DEV__ || Platform.OS === 'web') {
      return;
    }

    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      setIsChecking(true);
      console.log('[Updates] Checking for updates...');

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        console.log('[Updates] Update available! Fetching...');
        setUpdateAvailable(true);

        // Fetch the update
        await Updates.fetchUpdateAsync();
        console.log('[Updates] Update downloaded successfully');

        // Alert user about the update
        Alert.alert(
          'Update Available',
          'A new version of the app has been downloaded. Restart the app to apply the update.',
          [
            {
              text: 'Restart Now',
              onPress: async () => {
                await Updates.reloadAsync();
              },
            },
            {
              text: 'Later',
              style: 'cancel',
            },
          ]
        );
      } else {
        console.log('[Updates] App is up to date');
      }
    } catch (error) {
      console.error('[Updates] Error checking for updates:', error);
      // Silently fail - don't interrupt user experience
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isChecking,
    updateAvailable,
    checkForUpdates,
  };
}
