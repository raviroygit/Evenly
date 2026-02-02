import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ActivitiesProvider } from '../src/contexts/ActivitiesContext';
import { SwipeActionProvider } from '../src/contexts/SwipeActionContext';
import { AuthInitializer } from '../src/components/auth/AuthInitializer';
import { Slot, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

// Keep native splash (black) visible until we show the logo animation screen
SplashScreen.preventAutoHideAsync().catch(() => {});

// Temporarily disabled - requires native modules (expo prebuild)
// import { registerBackgroundRefresh, unregisterBackgroundRefresh } from '../src/utils/backgroundTokenRefresh';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Handle deep links when app is opened from a link
    const handleDeepLink = (url: string) => {
      try {
        // Parse the URL
        const { hostname, path } = Linking.parse(url);

        // Handle invitation deep links
        // Format: evenly://invitation/token123 or https://evenly.app/invitation/token123
        if (hostname === 'invitation' || path?.startsWith('/invitation')) {
          let token = '';

          if (hostname === 'invitation' && path) {
            // Custom scheme: evenly://invitation/token123 (path may be '/token123' or 'token123')
            token = path.replace(/^\//, '');
          } else if (path?.startsWith('/invitation/')) {
            // Universal link: https://evenly.app/invitation/token123
            token = path.substring('/invitation/'.length);
          }

          if (token) {
            router.replace(`/invitations/accept?token=${token}`);
          }
        }

        // Handle tabs/groups deep links (new format)
        // Format: evenly://tabs/groups/groupId or evenly://tabs/groups or https://evenly.app/tabs/groups/...
        else if ((hostname === 'tabs' && path?.includes('/groups')) || path?.startsWith('/tabs/groups')) {
          if (path?.match(/\/groups\/([a-f0-9-]+)/)) {
            // Specific group: evenly://tabs/groups/groupId or https://evenly.app/tabs/groups/groupId
            const groupId = path.match(/\/groups\/([a-f0-9-]+)/)?.[1];
            if (groupId) {
              router.replace(`/tabs/groups/${groupId}`);
            }
          } else if (path === '/groups' || path === '/tabs/groups') {
            // Groups list: evenly://tabs/groups or https://evenly.app/tabs/groups
            router.replace('/tabs/groups');
          }
        }

        // Handle tabs/books deep links (new format)
        // Format: evenly://tabs/books
        else if (hostname === 'tabs' && path?.includes('/books')) {
          router.replace('/tabs/books');
        }

        // Legacy group deep links (backward compatibility)
        // Format: evenly://group/groupId123 or https://evenly.app/group/groupId123
        else if (hostname === 'group' || path?.startsWith('/group')) {
          let groupId = '';

          if (hostname === 'group' && path) {
            // Custom scheme: evenly://group/groupId123 (path may be '/groupId' or 'groupId')
            groupId = path.replace(/^\//, '');
          } else if (path?.startsWith('/group/')) {
            // Universal link: https://evenly.app/group/groupId123
            groupId = path.substring('/group/'.length);
          }

          if (groupId) {
            router.replace(`/tabs/groups/${groupId}`);
          }
        }

        // Legacy Khata deep links (backward compatibility)
        // Format: evenly://khata or https://evenly.app/khata or https://evenly.app/books
        else if (hostname === 'khata' || path === '/khata' || path === '/books' || path === '/tabs/books') {
          router.replace('/tabs/books');
        }
      } catch {
        // Deep link handling failed; ignore
      }
    };

    // Get initial URL (when app is opened from a closed state)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Listen for deep links when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

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
    registerBackgroundRefresh().catch(() => {});

    return () => {
      unregisterBackgroundRefresh().catch(() => {});
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
