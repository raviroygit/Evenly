import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ReusableModal } from '../ui/ReusableModal';
import { useTheme } from '../../contexts/ThemeContext';

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

  const handleLanguageChange = async (languageCode: string) => {
    try {
      setSelectedLanguage(languageCode);
      await i18n.changeLanguage(languageCode);
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
                backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                borderColor: selectedLanguage === language.code ? colors.primary : 'transparent',
                borderWidth: selectedLanguage === language.code ? 2 : 0,
              },
            ]}
            onPress={() => handleLanguageChange(language.code)}
          >
            <View style={styles.languageInfo}>
              <Text style={[styles.languageName, { color: colors.foreground }]}>
                {language.nativeName}
              </Text>
              <Text style={[styles.languageSubtext, { color: colors.mutedForeground }]}>
                {language.name}
              </Text>
            </View>
            {selectedLanguage === language.code && (
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
      </View>
    </ReusableModal>
  );
};

const styles = StyleSheet.create({
  container: {
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
});
