import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function AdminLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="broadcast" />
      <Stack.Screen name="users" />
    </Stack>
  );
}
