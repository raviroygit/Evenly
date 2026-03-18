import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ReusableModal } from '../ui/ReusableModal';
import { useTheme } from '../../contexts/ThemeContext';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
];

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (languageCode: string) => {
    if (isChanging) return;
    setIsChanging(true);
    try {
      setSelectedLanguage(languageCode);

      // Update language in i18n
      await i18n.changeLanguage(languageCode);

      // Save to AsyncStorage
      await AsyncStorage.setItem('userLanguage', languageCode);

      // Update in backend database
      try {
        await EvenlyBackendService.updateUserLanguage(languageCode);
      } catch (backendError) {
        // Log error but don't block language change if backend fails
        console.error('Failed to update language in backend:', backendError);
      }

      Alert.alert(
        t('common.success'),
        t('profile.languageChanged')
      );
      onClose();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('errors.tryAgain')
      );
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <ReusableModal
      visible={visible}
      onClose={onClose}
      title={t('profile.selectLanguage')}
    >
      <View style={styles.container}>
        {LANGUAGES.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageOption,
              {
                backgroundColor: theme === 'dark' ? '#1C1C2E' : '#FFFFFF',
                borderColor: selectedLanguage === language.code ? colors.primary : 'transparent',
                borderWidth: selectedLanguage === language.code ? 2 : 0,
              },
            ]}
            onPress={() => handleLanguageChange(language.code)}
            disabled={isChanging}
          >
            <View style={styles.languageInfo}>
              <Text style={[styles.languageName, { color: colors.foreground }]}>
                {language.nativeName}
              </Text>
              <Text style={[styles.languageSubtext, { color: colors.mutedForeground }]}>
                {language.name}
              </Text>
            </View>
            {selectedLanguage === language.code && !isChanging && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            {t('profile.languageInfo')}
          </Text>
        </View>

        {isChanging && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.foreground }]}>
              {t('profile.updating')}
            </Text>
          </View>
        )}
      </View>
    </ReusableModal>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  languageSubtext: {
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
