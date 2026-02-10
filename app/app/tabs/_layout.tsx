import React, { useState, useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../../src/contexts/ThemeContext';
import { ProtectedRoute } from '../../src/components/auth/ProtectedRoute';
import { StatusBar } from 'expo-status-bar';
import CustomTabBar from '../../src/components/navigation/CustomTabBar';
import { LanguageSelectionModal } from '../../src/components/modals/LanguageSelectionModal';

const LANGUAGE_SELECTED_KEY = '@evenly_language_selected';

function TabLayoutContent() {
  const { t, i18n } = useTranslation();
  const { theme, colors } = useTheme();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if user has selected language before
  useEffect(() => {
    const checkLanguageSelection = async () => {
      try {
        const hasSelected = await AsyncStorage.getItem(LANGUAGE_SELECTED_KEY);
        if (!hasSelected) {
          // First time - show language selection modal
          setShowLanguageModal(true);
        }
      } catch (error) {
        console.error('Error checking language selection:', error);
      } finally {
        setChecking(false);
      }
    };

    checkLanguageSelection();
  }, []);

  const handleLanguageModalClose = async () => {
    try {
      // Mark that user has selected a language
      await AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, 'true');
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error saving language selection flag:', error);
      setShowLanguageModal(false);
    }
  };

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

      {/* Language Selection Modal - Show on first login */}
      {!checking && (
        <LanguageSelectionModal
          visible={showLanguageModal}
          onClose={handleLanguageModalClose}
        />
      )}
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