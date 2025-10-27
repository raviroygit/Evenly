import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SwipeActionProvider } from '../src/contexts/SwipeActionContext';
import { AuthInitializer } from '../src/components/auth/AuthInitializer';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <SwipeActionProvider>
            <AuthInitializer>
              <Slot />
            </AuthInitializer>
          </SwipeActionProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
