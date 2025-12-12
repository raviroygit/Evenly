import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function GroupsLayout() {
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
      <Stack.Screen 
        name="index"
        options={{
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
      <Stack.Screen 
        name="[groupId]"
        options={{
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: 'none',
        }}
      />
    </Stack>
  );
}
