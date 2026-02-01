import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ActivitiesProvider } from '../src/contexts/ActivitiesContext';
import { SwipeActionProvider } from '../src/contexts/SwipeActionContext';
import { AuthInitializer } from '../src/components/auth/AuthInitializer';
import { Slot, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
// Temporarily disabled - requires native modules (expo prebuild)
// import { registerBackgroundRefresh, unregisterBackgroundRefresh } from '../src/utils/backgroundTokenRefresh';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Handle deep links when app is opened from a link
    const handleDeepLink = (url: string) => {
      console.log('Deep link received:', url);

      try {
        // Parse the URL
        const { hostname, path, queryParams } = Linking.parse(url);
        console.log('Parsed URL:', { hostname, path, queryParams });

        // Handle invitation deep links
        // Format: evenly://invitation/token123 or https://evenly.app/invitation/token123
        if (hostname === 'invitation' || path?.startsWith('/invitation')) {
          let token = '';

          if (hostname === 'invitation' && path) {
            // Custom scheme: evenly://invitation/token123
            token = path.substring(1); // Remove leading slash
          } else if (path?.startsWith('/invitation/')) {
            // Universal link: https://evenly.app/invitation/token123
            token = path.substring('/invitation/'.length);
          }

          if (token) {
            console.log('Navigating to invitation:', token);
            router.push(`/invitations/accept?token=${token}`);
          }
        }

        // Handle group deep links
        // Format: evenly://group/groupId123 or https://evenly.app/group/groupId123
        else if (hostname === 'group' || path?.startsWith('/group')) {
          let groupId = '';

          if (hostname === 'group' && path) {
            // Custom scheme: evenly://group/groupId123
            groupId = path.substring(1); // Remove leading slash
          } else if (path?.startsWith('/group/')) {
            // Universal link: https://evenly.app/group/groupId123
            groupId = path.substring('/group/'.length);
          }

          if (groupId) {
            console.log('Navigating to group:', groupId);
            // Navigate to group details screen
            router.push(`/tabs/groups/${groupId}`);
          }
        }

        // Handle Khata deep links
        // Format: evenly://khata or https://evenly.app/khata
        else if (hostname === 'khata' || path === '/khata') {
          console.log('Navigating to Khata');
          // Navigate to Khata tab (you may need to create this screen)
          router.push('/tabs/books');
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    };

    // Get initial URL (when app is opened from a closed state)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        handleDeepLink(url);
      }
    });

    // Listen for deep links when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('URL event:', url);
      handleDeepLink(url);
    });

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, [router]);

  // Register background token refresh task on app startup
  // Temporarily disabled - requires native modules (expo prebuild)
  // To enable: Run `npx expo prebuild` then `npx expo run:ios` or `npx expo run:android`
  /*
  useEffect(() => {
    console.log('[App] Registering background token refresh task...');

    registerBackgroundRefresh()
      .then(() => {
        console.log('[App] ✅ Background refresh task registered successfully');
      })
      .catch((error) => {
        console.error('[App] ❌ Failed to register background refresh task:', error);
      });

    // Cleanup on unmount (when app is closed)
    return () => {
      unregisterBackgroundRefresh().catch((error) => {
        console.error('[App] Failed to unregister background refresh:', error);
      });
    };
  }, []);
  */

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <ActivitiesProvider>
            <SwipeActionProvider>
              <AuthInitializer>
                <Slot />
              </AuthInitializer>
            </SwipeActionProvider>
          </ActivitiesProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
