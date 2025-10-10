import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';

import './global.css';

export default function App() {
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}
