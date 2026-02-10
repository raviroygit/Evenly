import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ReusableModal } from '../ui/ReusableModal';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ReusableModal
      visible={visible}
      onClose={onClose}
      title={t('modals.aboutApp')}
      showCloseButton={true}
    >
      <View style={styles.content}>
        {/* App Logo/Icon Section */}
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>EvenlySplit</Text>
          <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
            {t('modals.appTagline')}
          </Text>
        </View>

        {/* App Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('modals.aboutTheApp')}</Text>
          <TouchableOpacity style={styles.descriptionContainer} activeOpacity={0.7}>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {t('modals.appDescription')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('modals.keyFeatures')}</Text>
          <View style={styles.featuresList}>
            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                {t('modals.createManageGroups')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <Ionicons name="receipt" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                {t('modals.trackExpenses')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <Ionicons name="calculator" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                {t('modals.automaticCalculations')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                {t('modals.realTimeNotifications')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                {t('modals.secureDataHandling')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('modals.versionInformation')}</Text>
          <TouchableOpacity style={styles.versionInfo} activeOpacity={0.7}>
            <Text style={[styles.versionLabel, { color: colors.mutedForeground }]}>{t('modals.version')}</Text>
            <Text style={[styles.versionValue, { color: colors.foreground }]}>1.0.0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.versionInfo} activeOpacity={0.7}>
            <Text style={[styles.versionLabel, { color: colors.mutedForeground }]}>{t('modals.build')}</Text>
            <Text style={[styles.versionValue, { color: colors.foreground }]}>2024.1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.versionInfo} activeOpacity={0.7}>
            <Text style={[styles.versionLabel, { color: colors.mutedForeground }]}>{t('modals.platform')}</Text>
            <Text style={[styles.versionValue, { color: colors.foreground }]}>React Native + Expo</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('modals.getInTouch')}</Text>
          <View style={styles.contactList}>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleOpenLink('mailto:support@evenly.app')}
            >
              <Ionicons name="mail" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.primary }]}>
                support@evenly.app
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleOpenLink('https://evenly.app')}
            >
              <Ionicons name="globe" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.primary }]}>
                evenly.app
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('modals.legal')}</Text>
          <View style={styles.legalList}>
            <TouchableOpacity
              style={styles.legalItem}
              onPress={() => handleOpenLink('https://evenlysplit.nxtgenaidev.com/privacy')}
            >
              <Text style={[styles.legalText, { color: colors.primary }]}>
                {t('modals.privacyPolicy')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.legalItem}
              onPress={() => handleOpenLink('https://evenlysplit.nxtgenaidev.com/terms')}
            >
              <Text style={[styles.legalText, { color: colors.primary }]}>
                {t('modals.termsOfService')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            {t('modals.madeWithLove')}
          </Text>
          <Text style={[styles.copyrightText, { color: colors.mutedForeground }]}>
            {t('modals.allRightsReserved')}
          </Text>
        </View>
      </View>
    </ReusableModal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'justify',
  },
  descriptionContainer: {
    paddingVertical: 8,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  versionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactList: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '500',
  },
  legalList: {
    gap: 8,
  },
  legalItem: {
    paddingVertical: 4,
  },
  legalText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
