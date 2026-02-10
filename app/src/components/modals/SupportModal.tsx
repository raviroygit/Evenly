import React, { useState, useRef } from 'react';
import { View, StyleSheet, Linking, Alert, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ReusableModal } from '../ui/ReusableModal';
import { useTheme } from '../../contexts/ThemeContext';
import { PlatformActionButton } from '../ui/PlatformActionButton';
import { Ionicons } from '@expo/vector-icons';
import { EmailSupportModal } from './EmailSupportModal';
import { DedicatedChatModal, DedicatedChatModalRef } from './DedicatedChatModal';

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showEmailSupport, setShowEmailSupport] = useState(false);
  const [showDedicatedChat, setShowDedicatedChat] = useState(false);
  const dedicatedChatRef = useRef<DedicatedChatModalRef>(null);


  const handleOpenChatWidget = () => {
    setShowDedicatedChat(true);
  };



  const handleEmailSupport = () => {
    setShowEmailSupport(true);
  };

  const handleCloseEmailSupport = () => {
    setShowEmailSupport(false);
  };

  const handleOpenHelpCenter = () => {
    const helpUrl = 'https://evenly.app/help';
    Linking.openURL(helpUrl).catch(err => {
      Alert.alert(
        t('common.error'),
        t('modals.unableToOpen'),
        [{ text: t('common.ok') }]
      );
    });
  };

  return (
    <ReusableModal
      visible={visible}
      onClose={onClose}
      title={t('modals.contactSupport')}
      showCloseButton={true}
    >
      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="headset" size={32} color="#FFFFFF" />
          </View>
                  <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
                    {t('modals.weAreHereToHelp')}
                  </Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>
            {t('modals.chooseSupportMethod')}
          </Text>
        </View>

        {/* Support Options */}
        <View style={styles.optionsContainer}>
          {/* AI Chat Support */}
          <PlatformActionButton
            title={t('modals.chatWithAI')}
            onPress={handleOpenChatWidget}
            variant="primary"
            size="large"
            icon={<Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />}
            style={styles.optionButton}
          />

          {/* Email Support */}
          <PlatformActionButton
            title={t('modals.emailSupport')}
            onPress={handleEmailSupport}
            variant="secondary"
            size="large"
            icon={<Ionicons name="mail" size={20} color={colors.foreground} />}
            style={styles.optionButton}
          />

          {/* Help Center */}
          <PlatformActionButton
            title={t('modals.helpCenter')}
            onPress={handleOpenHelpCenter}
            variant="secondary"
            size="large"
            icon={<Ionicons name="book" size={20} color={colors.foreground} />}
            style={styles.optionButton}
          />
        </View>

        {/* Additional Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>
            {t('modals.whatCanWeHelp')}
          </Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {t('modals.accountIssues')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {t('modals.expenseTracking')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {t('modals.groupManagement')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {t('modals.paymentIssues')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {t('modals.appFeatures')}
              </Text>
            </View>
          </View>
        </View>

        {/* Response Time Info */}
        <View style={[styles.responseTimeCard, { backgroundColor: colors.muted }]}>
          <Ionicons name="time" size={20} color={colors.primary} />
          <View style={styles.responseTimeText}>
            <Text style={[styles.responseTimeTitle, { color: colors.foreground }]}>
              {t('modals.responseTimes')}
            </Text>
            <Text style={[styles.responseTimeSubtitle, { color: colors.mutedForeground }]}>
              {t('modals.responseTimeInfo')}
            </Text>
          </View>
        </View>
      </View>


      {/* Email Support Modal */}
      <EmailSupportModal
        visible={showEmailSupport}
        onClose={handleCloseEmailSupport}
      />

      {/* Dedicated Chat Modal */}
      <DedicatedChatModal
        ref={dedicatedChatRef}
        visible={showDedicatedChat}
        onClose={() => setShowDedicatedChat(false)}
      />
    </ReusableModal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  welcomeSection: {
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
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  optionButton: {
    marginBottom: 0,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  responseTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  responseTimeText: {
    flex: 1,
  },
  responseTimeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  responseTimeSubtitle: {
    fontSize: 12,
  },
});
