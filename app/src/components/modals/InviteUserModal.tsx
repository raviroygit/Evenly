import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ReusableModal } from '../ui/ReusableModal';
import { ResponsiveButtonRow } from '../ui/ResponsiveButtonRow';
import { ModalButtonContainer } from '../ui/ModalButtonContainer';
import { useTheme } from '../../contexts/ThemeContext';

interface InviteUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSendInvitation: (email: string) => Promise<void>;
  groupName: string;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  visible,
  onClose,
  onSendInvitation,
  groupName,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('modals.pleaseEnterEmail'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t('common.error'), t('modals.pleaseEnterValidEmail'));
      return;
    }

    try {
      setIsLoading(true);
      await onSendInvitation(email.trim());

      // Reset form first
      setEmail('');

      // Show success alert with callback to close modal
      Alert.alert(
        t('common.success'),
        t('modals.invitationSentSuccess'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    onClose();
  };

  return (
    <ReusableModal
      visible={visible}
      onClose={handleClose}
      title={t('modals.inviteUser')}
      subtitle={t('modals.inviteSomeone', { groupName })}
    >
      <View style={styles.container}>
        {/* Email Input */}
        <View style={styles.input}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {t('modals.emailAddress')}
          </Text>
          <View style={[styles.inputContainer, {
            backgroundColor: colors.background,
            borderColor: colors.border
          }]}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.mutedForeground}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.textInput, { color: colors.foreground }]}
              value={email}
              onChangeText={setEmail}
              placeholder={t('modals.enterEmailAddress')}
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
            style={styles.infoIcon}
          />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            {t('modals.inviteInfo')}
          </Text>
        </View>

        {/* Buttons */}
        <ModalButtonContainer
          buttons={[
            {
              title: t('common.cancel'),
              onPress: handleClose,
              variant: "destructive",
            },
            {
              title: t('modals.send'),
              onPress: handleSend,
              variant: "primary",
              loading: isLoading,
            },
          ]}
          style={styles.buttonRow}
          forceVertical={Dimensions.get('window').width < 400}
        />
      </View>
    </ReusableModal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 40,
    minHeight: '100%',
  },
  input: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonRow: {
    marginTop: 20,
  },
});
