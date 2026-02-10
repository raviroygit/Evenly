import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ReusableModal } from '../ui/ReusableModal';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface PrivacySecurityModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacySecurityModal: React.FC<PrivacySecurityModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => {
      Alert.alert(
        t('common.error'),
        t('modals.unableToOpenLink'),
        [{ text: t('common.ok') }]
      );
    });
  };

  const handlePrivacyPolicy = () => {
    handleOpenLink('https://evenlysplit.nxtgenaidev.com/privacy');
  };

  const handleTermsOfService = () => {
    handleOpenLink('https://evenlysplit.nxtgenaidev.com/terms');
  };

  const handleDataExport = () => {
    Alert.alert(
      t('modals.dataExportTitle'),
      t('modals.dataExportMessage'),
      [{ text: t('common.ok') }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('modals.deleteAccountTitle'),
      t('modals.deleteAccountConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => {
          // Handle account deletion
        }}
      ]
    );
  };

  return (
    <ReusableModal
      visible={visible}
      onClose={onClose}
      title={t('modals.privacySecurity')}
      showCloseButton={true}
    >
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {t('modals.yourPrivacyMatters')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {t('modals.privacyCommitment')}
          </Text>
        </View>

        {/* Data Protection Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('modals.dataProtection')}</Text>
          <View style={styles.protectionList}>
            <View style={styles.protectionItem}>
              <Ionicons name="lock-closed" size={20} color={colors.primary} />
              <View style={styles.protectionText}>
                <Text style={[styles.protectionTitle, { color: colors.foreground }]}>
                  {t('modals.endToEndEncryption')}
                </Text>
                <Text style={[styles.protectionDescription, { color: colors.mutedForeground }]}>
                  {t('modals.encryptionDescription')}
                </Text>
              </View>
            </View>
            <View style={styles.protectionItem}>
              <Ionicons name="server" size={20} color={colors.primary} />
              <View style={styles.protectionText}>
                <Text style={[styles.protectionTitle, { color: colors.foreground }]}>
                  {t('modals.secureServers')}
                </Text>
                <Text style={[styles.protectionDescription, { color: colors.mutedForeground }]}>
                  {t('modals.secureServersDescription')}
                </Text>
              </View>
            </View>
            <View style={styles.protectionItem}>
              <Ionicons name="eye-off" size={20} color={colors.primary} />
              <View style={styles.protectionText}>
                <Text style={[styles.protectionTitle, { color: colors.foreground }]}>
                  {t('modals.noDataSelling')}
                </Text>
                <Text style={[styles.protectionDescription, { color: colors.mutedForeground }]}>
                  {t('modals.noDataSellingDescription')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Privacy Controls Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('modals.privacyControls')}</Text>
          <View style={styles.controlsList}>
            <TouchableOpacity
              style={[styles.controlItem, { borderBottomColor: colors.border }]}
              onPress={handleDataExport}
            >
              <Ionicons name="download" size={20} color={colors.primary} />
              <View style={styles.controlText}>
                <Text style={[styles.controlTitle, { color: colors.foreground }]}>
                  {t('modals.exportYourData')}
                </Text>
                <Text style={[styles.controlDescription, { color: colors.mutedForeground }]}>
                  {t('modals.exportDataDescription')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                // Handle notifications
              }}
            >
              <Ionicons name="notifications" size={20} color={colors.primary} />
              <View style={styles.controlText}>
                <Text style={[styles.controlTitle, { color: colors.foreground }]}>
                  {t('modals.notificationPreferences')}
                </Text>
                <Text style={[styles.controlDescription, { color: colors.mutedForeground }]}>
                  {t('modals.notificationPreferencesDescription')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                // Handle visibility
              }}
            >
              <Ionicons name="eye" size={20} color={colors.primary} />
              <View style={styles.controlText}>
                <Text style={[styles.controlTitle, { color: colors.foreground }]}>
                  {t('modals.profileVisibility')}
                </Text>
                <Text style={[styles.controlDescription, { color: colors.mutedForeground }]}>
                  {t('modals.profileVisibilityDescription')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('modals.securityFeatures')}</Text>
          <View style={styles.securityList}>
            <View style={styles.securityItem}>
              <Ionicons name="finger-print" size={20} color={colors.primary} />
              <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
                {t('modals.biometricAuth')}
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="key" size={20} color={colors.primary} />
              <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
                {t('modals.twoFactorAuth')}
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="shield" size={20} color={colors.primary} />
              <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
                {t('modals.securityUpdates')}
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="analytics" size={20} color={colors.primary} />
              <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
                {t('modals.securityMonitoring')}
              </Text>
            </View>
          </View>
        </View>

        {/* Legal Documents Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('modals.legalDocuments')}</Text>
          <View style={styles.legalList}>
            <TouchableOpacity
              style={[styles.legalItem, { borderBottomColor: colors.border }]}
              onPress={handlePrivacyPolicy}
            >
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={[styles.legalText, { color: colors.primary }]}>
                {t('modals.privacyPolicy')}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.legalItem, { borderBottomColor: colors.border }]}
              onPress={handleTermsOfService}
            >
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={[styles.legalText, { color: colors.primary }]}>
                {t('modals.termsOfService')}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('modals.accountActions')}</Text>
          <TouchableOpacity
            style={[styles.dangerItem, { borderBottomColor: colors.border }]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash" size={20} color="#ef4444" />
            <View style={styles.controlText}>
              <Text style={[styles.dangerTitle, { color: '#ef4444' }]}>
                {t('modals.deleteAccount')}
              </Text>
              <Text style={[styles.controlDescription, { color: colors.mutedForeground }]}>
                {t('modals.deleteAccountDescription')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            {t('modals.lastUpdated', {
              month: new Date().toLocaleDateString('en-US', { month: 'long' }),
              year: new Date().getFullYear()
            })}
          </Text>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            {t('modals.privacyContact')}
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  protectionList: {
    gap: 16,
  },
  protectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  protectionText: {
    flex: 1,
  },
  protectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  protectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  controlsList: {
    gap: 0,
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  controlText: {
    flex: 1,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  controlDescription: {
    fontSize: 14,
  },
  securityList: {
    gap: 12,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityText: {
    fontSize: 14,
    flex: 1,
  },
  legalList: {
    gap: 0,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  legalText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  footer: {
    paddingTop: 24,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
