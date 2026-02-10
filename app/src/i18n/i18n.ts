import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

import en from './locales/en.json';
import hi from './locales/hi.json';

const LANGUAGE_KEY = '@evenly_language';

// Get device locale safely (works with and without expo-localization)
const getDeviceLocale = (): string => {
  try {
    // Try to get locale from platform-specific APIs
    if (Platform.OS === 'ios') {
      return (
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        'en'
      );
    } else if (Platform.OS === 'android') {
      return NativeModules.I18nManager?.localeIdentifier || 'en';
    }
    return 'en';
  } catch (error) {
    return 'en';
  }
};

// Language detector for React Native
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // First try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }

      // Fallback to device language
      const deviceLocale = getDeviceLocale();
      const deviceLanguage = deviceLocale.split(/[-_]/)[0]; // Get 'en' from 'en-US' or 'en_US'
      const supportedLanguages = ['en', 'hi'];
      const languageToUse = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';
      callback(languageToUse);
    } catch (error) {
      // Default to English on error
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // Required for React Native
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Set to false for React Native
    },
  });

export default i18n;

// Helper function to change language
export const changeLanguage = async (language: string) => {
  await i18n.changeLanguage(language);
};

// Helper function to get current language
export const getCurrentLanguage = () => i18n.language;
