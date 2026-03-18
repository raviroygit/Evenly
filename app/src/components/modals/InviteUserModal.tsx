import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, TextInput, Dimensions, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ReusableModal } from '../ui/ReusableModal';
import { ModalButtonContainer } from '../ui/ModalButtonContainer';
import { useTheme } from '../../contexts/ThemeContext';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from '../../constants/countryCodes';

const REQUIRED_PHONE_DIGITS = 10;

interface InviteUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSendInvitation: (data: { email?: string; phone?: string }) => Promise<void>;
  groupName: string;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  visible,
  onClose,
  onSendInvitation,
  groupName,
}) => {
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail && !trimmedPhone) {
      Alert.alert(t('common.error'), t('modals.pleaseEnterEmailOrPhone'));
      return;
    }

    // Validate email if provided
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        Alert.alert(t('common.error'), t('modals.pleaseEnterValidEmail'));
        return;
      }
    }

    // Validate phone if provided (must be exactly 10 digits)
    if (trimmedPhone && trimmedPhone.length !== REQUIRED_PHONE_DIGITS) {
      Alert.alert(t('common.error'), t('modals.pleaseEnterValidPhone'));
      return;
    }

    // Build full phone number with country code
    const fullPhone = trimmedPhone ? `${countryCode}${trimmedPhone}` : undefined;

    try {
      setIsLoading(true);
      await onSendInvitation({
        email: trimmedEmail || undefined,
        phone: fullPhone,
      });

      // Reset form
      setEmail('');
      setPhone('');
      setCountryCode(DEFAULT_COUNTRY_CODE);

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
    setPhone('');
    setCountryCode(DEFAULT_COUNTRY_CODE);
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

        {/* OR Divider */}
        <View style={styles.orContainer}>
          <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.orText, { color: colors.mutedForeground }]}>
            {t('common.or', { defaultValue: 'OR' })}
          </Text>
          <View style={[styles.orLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Phone Input with Country Code */}
        <View style={styles.input}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {t('modals.phoneNumber', { defaultValue: 'Phone Number' })}
          </Text>
          <View style={styles.phoneInputRow}>
            <TouchableOpacity
              style={[
                styles.countryCodeTouchable,
                { backgroundColor: theme === 'dark' ? '#1C1C2E' : '#FFFFFF', borderColor: colors.border, borderWidth: 1 },
              ]}
              onPress={() => setShowCountryPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.countryCodeText, { color: colors.foreground }]} numberOfLines={1}>
                {COUNTRY_CODES.find((c) => c.code === countryCode)?.label ?? countryCode}
              </Text>
              <Text style={[styles.countryCodeChevron, { color: colors.mutedForeground }]}>▼</Text>
            </TouchableOpacity>
            <View
              style={[
                styles.phoneInputWrapper,
                { backgroundColor: theme === 'dark' ? '#1C1C2E' : '#FFFFFF', borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <TextInput
                style={[styles.phoneInput, { color: colors.foreground }]}
                placeholder={t('modals.enterPhoneNumber', { defaultValue: 'Enter phone number' })}
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, REQUIRED_PHONE_DIGITS))}
                keyboardType="phone-pad"
                maxLength={REQUIRED_PHONE_DIGITS}
              />
            </View>
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
            {t('modals.inviteInfoEmailOrPhone', { defaultValue: 'Enter an email or phone number to invite someone. If they are a registered user, they will receive the invitation.' })}
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

      {/* Country code picker modal */}
      <Modal visible={showCountryPicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.countryModalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryPicker(false)}
        >
          <View
            style={[styles.countryPickerSheet, { backgroundColor: colors.background }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.countryPickerTitle, { color: colors.foreground }]}>
              {t('modals.selectCountryCode', { defaultValue: 'Select country code' })}
            </Text>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryOption,
                    countryCode === item.code && { backgroundColor: colors.muted },
                  ]}
                  onPress={() => {
                    setCountryCode(item.code);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={[styles.countryOptionText, { color: colors.foreground }]}>
                    {item.label}
                  </Text>
                  {countryCode === item.code && (
                    <Text style={{ color: colors.primary, fontWeight: '600' }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.countryList}
            />
            <TouchableOpacity
              style={[styles.cancelCountryButton, { backgroundColor: colors.muted }]}
              onPress={() => setShowCountryPicker(false)}
            >
              <Text style={[styles.cancelCountryButtonText, { color: colors.foreground }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ReusableModal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 40,
    minHeight: '100%',
  },
  input: {
    marginBottom: 4,
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
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  countryCodeTouchable: {
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryCodeText: {
    fontSize: 16,
    flex: 1,
  },
  countryCodeChevron: {
    fontSize: 10,
    marginLeft: 4,
  },
  phoneInputWrapper: {
    flex: 1,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  phoneInput: {
    fontSize: 16,
    paddingVertical: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
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
    marginTop: 16,
  },
  countryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  countryPickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
    paddingBottom: 40,
  },
  countryPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  countryList: {
    maxHeight: 360,
    marginBottom: 16,
  },
  countryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  countryOptionText: {
    fontSize: 16,
  },
  cancelCountryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelCountryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
