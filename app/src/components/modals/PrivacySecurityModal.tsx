import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { ReusableModal } from '../ui/ReusableModal';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface PrivacySecurityModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacySecurityModal: React.FC<PrivacySecurityModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.error('Failed to open link:', err);
      Alert.alert(
        'Error',
        'Unable to open link. Please try again later.',
        [{ text: 'OK' }]
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
      'Data Export',
      'Your data export request has been submitted. You will receive an email with your data within 24 hours.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // Handle account deletion
        }}
      ]
    );
  };

  return (
    <ReusableModal
      visible={visible}
      onClose={onClose}
      title="Privacy & Security"
      showCloseButton={true}
    >
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Your Privacy Matters
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            We're committed to protecting your personal information and ensuring your data is secure.
          </Text>
        </View>

        {/* Data Protection Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Data Protection</Text>
          <View style={styles.protectionList}>
            <View style={styles.protectionItem}>
              <Ionicons name="lock-closed" size={20} color={colors.primary} />
              <View style={styles.protectionText}>
                <Text style={[styles.protectionTitle, { color: colors.foreground }]}>
                  End-to-End Encryption
                </Text>
                <Text style={[styles.protectionDescription, { color: colors.mutedForeground }]}>
                  All your financial data is encrypted using industry-standard AES-256 encryption
                </Text>
              </View>
            </View>
            <View style={styles.protectionItem}>
              <Ionicons name="server" size={20} color={colors.primary} />
              <View style={styles.protectionText}>
                <Text style={[styles.protectionTitle, { color: colors.foreground }]}>
                  Secure Servers
                </Text>
                <Text style={[styles.protectionDescription, { color: colors.mutedForeground }]}>
                  Your data is stored on secure, SOC 2 compliant servers with regular security audits
                </Text>
              </View>
            </View>
            <View style={styles.protectionItem}>
              <Ionicons name="eye-off" size={20} color={colors.primary} />
              <View style={styles.protectionText}>
                <Text style={[styles.protectionTitle, { color: colors.foreground }]}>
                  No Data Selling
                </Text>
                <Text style={[styles.protectionDescription, { color: colors.mutedForeground }]}>
                  We never sell, rent, or share your personal information with third parties
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Privacy Controls Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Privacy Controls</Text>
          <View style={styles.controlsList}>
            <TouchableOpacity 
              style={[styles.controlItem, { borderBottomColor: colors.border }]}
              onPress={handleDataExport}
            >
              <Ionicons name="download" size={20} color={colors.primary} />
              <View style={styles.controlText}>
                <Text style={[styles.controlTitle, { color: colors.foreground }]}>
                  Export Your Data
                </Text>
                <Text style={[styles.controlDescription, { color: colors.mutedForeground }]}>
                  Download a copy of all your data
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
                  Notification Preferences
                </Text>
                <Text style={[styles.controlDescription, { color: colors.mutedForeground }]}>
                  Control what notifications you receive
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
                  Profile Visibility
                </Text>
                <Text style={[styles.controlDescription, { color: colors.mutedForeground }]}>
                  Control who can see your profile information
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Security Features</Text>
          <View style={styles.securityList}>
            <View style={styles.securityItem}>
              <Ionicons name="finger-print" size={20} color={colors.primary} />
              <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
                Biometric authentication support
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="key" size={20} color={colors.primary} />
              <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
                Two-factor authentication (2FA)
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="shield" size={20} color={colors.primary} />
              <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
                Regular security updates and patches
              </Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="analytics" size={20} color={colors.primary} />
              <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
                Continuous security monitoring
              </Text>
            </View>
          </View>
        </View>

        {/* Legal Documents Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Legal Documents</Text>
          <View style={styles.legalList}>
            <TouchableOpacity 
              style={[styles.legalItem, { borderBottomColor: colors.border }]}
              onPress={handlePrivacyPolicy}
            >
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={[styles.legalText, { color: colors.primary }]}>
                Privacy Policy
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.legalItem, { borderBottomColor: colors.border }]}
              onPress={handleTermsOfService}
            >
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={[styles.legalText, { color: colors.primary }]}>
                Terms of Service
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account Actions</Text>
          <TouchableOpacity 
            style={[styles.dangerItem, { borderBottomColor: colors.border }]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash" size={20} color="#ef4444" />
            <View style={styles.controlText}>
              <Text style={[styles.dangerTitle, { color: '#ef4444' }]}>
                Delete Account
              </Text>
              <Text style={[styles.controlDescription, { color: colors.mutedForeground }]}>
                Permanently delete your account and all data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Last updated: December 2024
          </Text>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Questions? Contact us at privacy@evenly.app
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
