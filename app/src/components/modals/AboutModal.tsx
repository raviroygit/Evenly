import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { ReusableModal } from '../ui/ReusableModal';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open link:', err));
  };

  return (
    <ReusableModal
      visible={visible}
      onClose={onClose}
      title="About Evenly"
      showCloseButton={true}
    >
      <View style={styles.content}>
        {/* App Logo/Icon Section */}
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>Evenly</Text>
          <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
            Split expenses, share memories
          </Text>
        </View>

        {/* App Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About the App</Text>
          <TouchableOpacity style={styles.descriptionContainer} activeOpacity={0.7}>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              Evenly is a modern expense splitting application designed to make sharing costs with friends, 
              family, and colleagues effortless. Track expenses, manage groups, and settle balances with ease.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Key Features</Text>
          <View style={styles.featuresList}>
            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                Create and manage expense groups
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <Ionicons name="receipt" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                Track individual and group expenses
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <Ionicons name="calculator" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                Automatic balance calculations
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                Real-time notifications and updates
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureItem} activeOpacity={0.7}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                Secure and private data handling
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Version Information</Text>
          <TouchableOpacity style={styles.versionInfo} activeOpacity={0.7}>
            <Text style={[styles.versionLabel, { color: colors.mutedForeground }]}>Version:</Text>
            <Text style={[styles.versionValue, { color: colors.foreground }]}>1.0.0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.versionInfo} activeOpacity={0.7}>
            <Text style={[styles.versionLabel, { color: colors.mutedForeground }]}>Build:</Text>
            <Text style={[styles.versionValue, { color: colors.foreground }]}>2024.1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.versionInfo} activeOpacity={0.7}>
            <Text style={[styles.versionLabel, { color: colors.mutedForeground }]}>Platform:</Text>
            <Text style={[styles.versionValue, { color: colors.foreground }]}>React Native + Expo</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Get in Touch</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Legal</Text>
          <View style={styles.legalList}>
            <TouchableOpacity 
              style={styles.legalItem}
              onPress={() => console.log('Privacy Policy')}
            >
              <Text style={[styles.legalText, { color: colors.primary }]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.legalItem}
              onPress={() => console.log('Terms of Service')}
            >
              <Text style={[styles.legalText, { color: colors.primary }]}>
                Terms of Service
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Made with ❤️ for better expense sharing
          </Text>
          <Text style={[styles.copyrightText, { color: colors.mutedForeground }]}>
            © 2024 Evenly. All rights reserved.
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
