import React from 'react';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { AuthInitializer } from '../src/components/auth/AuthInitializer';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthInitializer>
          <Slot />
        </AuthInitializer>
      </AuthProvider>
    </ThemeProvider>
  );
}
