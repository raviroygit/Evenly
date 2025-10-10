import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { ThemeProvider, useTheme } from '../../src/contexts/ThemeContext';
import { ProtectedRoute } from '../../src/components/auth/ProtectedRoute';
import { StatusBar } from 'expo-status-bar';
import CustomTabBar from '../../src/components/navigation/CustomTabBar';

function TabLayoutContent() {
  const { theme, colors } = useTheme();

  return (
    <ProtectedRoute>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {Platform.OS === 'android' ? (
          <Tabs
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
              headerShown: false,
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: "Home"
              }}
            />
            <Tabs.Screen
              name="expenses"
              options={{
                title: "Expenses"
              }}
            />
            <Tabs.Screen
              name="groups"
              options={{
                title: "Groups"
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: "Profile"
              }}
            />
          </Tabs>
        ) : (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <Label>Home</Label>
              <Icon sf="house.fill" />
            </NativeTabs.Trigger>
            
            <NativeTabs.Trigger name="expenses">
              <Label>Expenses</Label>
              <Icon sf="doc.text.fill" />
              <Badge>+9</Badge>
            </NativeTabs.Trigger>
            
            <NativeTabs.Trigger name="groups">
              <Label>Groups</Label>
              <Icon sf="person.3.fill" />
            </NativeTabs.Trigger>
            
            <NativeTabs.Trigger name="profile">
              <Label>Profile</Label>
              <Icon sf="person.fill" />
            </NativeTabs.Trigger>
          </NativeTabs>
        )}
        
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </SafeAreaView>
    </ProtectedRoute>
  );
}

export default function TabLayout() {
  return (
    <ThemeProvider>
      <TabLayoutContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});