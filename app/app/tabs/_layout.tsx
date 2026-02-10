import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '../../src/contexts/ThemeContext';
import { ProtectedRoute } from '../../src/components/auth/ProtectedRoute';
import { StatusBar } from 'expo-status-bar';
import CustomTabBar from '../../src/components/navigation/CustomTabBar';

function TabLayoutContent() {
  const { t } = useTranslation();
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
                title: t('dashboard.home')
              }}
            />
            <Tabs.Screen
              name="groups"
              options={{
                title: t('groups.title')
              }}
            />
            <Tabs.Screen
              name="books"
              options={{
                title: t('khata.title')
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: t('profile.title')
              }}
            />
          </Tabs>
        ) : (
          <NativeTabs>
            <NativeTabs.Trigger name="index">
              <Label>{t('dashboard.home')}</Label>
              <Icon sf="house.fill" />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="groups">
              <Label>{t('groups.title')}</Label>
              <Icon sf="person.3.fill" />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="books">
              <Label>{t('khata.title')}</Label>
              <Icon sf="book.fill" />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="profile">
              <Label>{t('profile.title')}</Label>
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