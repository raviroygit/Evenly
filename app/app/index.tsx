import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading) {
      // Add a small delay to ensure the Slot component is mounted
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/tabs');
        } else {
          router.replace('/auth/login');
        }
      }, 100); // 100ms delay

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading screen while checking authentication
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
