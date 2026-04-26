import React, { useState, useCallback, Suspense, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { ErrorBoundary } from '../src/components/common/ErrorBoundary';
import { LanguageSelectionModal } from '../src/components/modals/LanguageSelectionModal';

const LANGUAGE_PICKED_KEY = 'evenly_language_picked';

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
  /** Tri-state gate so we don't redirect before the picker decision is made. */
  const [languageGate, setLanguageGate] = useState<'checking' | 'picking' | 'ready'>('checking');

  const finishLogoAnimation = useCallback(() => {
    setShowLogoAnimation(false);
  }, []);

  React.useEffect(() => {
    if (!showLogoAnimation) return;
    const timeout = setTimeout(finishLogoAnimation, LOGO_ANIMATION_MAX_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [showLogoAnimation, finishLogoAnimation]);

  // After the splash animation finishes, decide whether the language picker
  // should appear. We only show it on the very first launch — subsequent
  // launches read the flag and proceed straight to redirect.
  useEffect(() => {
    if (showLogoAnimation) return;
    if (languageGate !== 'checking') return;
    let cancelled = false;
    (async () => {
      try {
        const picked = await AsyncStorage.getItem(LANGUAGE_PICKED_KEY);
        if (cancelled) return;
        setLanguageGate(picked === '1' ? 'ready' : 'picking');
      } catch {
        if (!cancelled) setLanguageGate('ready');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showLogoAnimation, languageGate]);

  const handleLanguagePickerClose = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LANGUAGE_PICKED_KEY, '1');
    } catch {
      // best-effort: even if the flag fails to persist, don't block the user
    }
    setLanguageGate('ready');
  }, []);

  React.useEffect(() => {
    if (!showLogoAnimation && !isLoading && pathname === '/' && languageGate === 'ready') {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/tabs');
        } else {
          router.replace('/auth');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showLogoAnimation, isAuthenticated, isLoading, router, pathname, languageGate]);

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
      <LanguageSelectionModal
        visible={languageGate === 'picking'}
        onClose={handleLanguagePickerClose}
        silent
      />
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
