import React, { useState, useCallback, Suspense } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { ErrorBoundary } from '../src/components/common/ErrorBoundary';

const LOGO_ANIMATION_MAX_DURATION_MS = 6000;
const STATIC_LOGO_MS = 2500;
const LOGO_IMAGE = require('../assets/splash.png');

function StaticLogoFallback({ onFinish }: { onFinish: () => void }) {
  React.useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const t = setTimeout(onFinish, STATIC_LOGO_MS);
    return () => clearTimeout(t);
  }, [onFinish]);
  return (
    <View style={styles.logoContainer}>
      <Image source={LOGO_IMAGE} style={styles.staticLogo} resizeMode="contain" />
    </View>
  );
}

const LogoVideoScreen = React.lazy(() =>
  import('./LogoVideoScreen').catch(() => ({
    default: (props: { onFinish: () => void }) => <StaticLogoFallback {...props} />,
  }))
);

function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoAnimation, setShowLogoAnimation] = useState(true);

  const finishLogoAnimation = useCallback(() => {
    setShowLogoAnimation(false);
  }, []);

  React.useEffect(() => {
    if (!showLogoAnimation) return;
    const timeout = setTimeout(finishLogoAnimation, LOGO_ANIMATION_MAX_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [showLogoAnimation, finishLogoAnimation]);

  React.useEffect(() => {
    if (!showLogoAnimation && !isLoading && pathname === '/') {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/tabs');
        } else {
          router.replace('/auth/login');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showLogoAnimation, isAuthenticated, isLoading, router, pathname]);

  if (showLogoAnimation) {
    return (
      <ErrorBoundary
        fallback={
          <StaticLogoFallback onFinish={finishLogoAnimation} />
        }
      >
        <Suspense
          fallback={
            <View style={styles.logoContainer}>
              {/* Black screen - matches video background, no spinner flash */}
            </View>
          }
        >
          <LogoVideoScreen onFinish={finishLogoAnimation} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.foreground }]}>
        Loading...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  staticLogo: {
    width: '80%',
    height: '80%',
    maxWidth: 320,
    maxHeight: 320,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default function Index() {
  return <IndexScreen />;
}
