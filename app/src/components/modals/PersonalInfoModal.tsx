import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TextInput, Alert, TouchableOpacity, FlatList, Modal } from 'react-native';
import { ReusableModal } from '../ui/ReusableModal';
import { useTheme } from '../../contexts/ThemeContext';
import { PlatformActionButton } from '../ui/PlatformActionButton';
import { useAuth } from '../../contexts/AuthContext';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { AuthStorage } from '../../utils/storage';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from '../../constants/countryCodes';
import { useTranslation } from 'react-i18next';

const REQUIRED_PHONE_DIGITS = 10;

interface PersonalInfoModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Optional callback after successful update
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({ visible, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const { user, setUser, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phoneNumber?: string }>({});
  const prefilledPhoneRef = useRef<string | undefined>(undefined);
  const prefilledCountryRef = useRef<string | undefined>(undefined);

  const fullPhone = (): string => {
    const digits = phone.replace(/\D/g, '').slice(0, REQUIRED_PHONE_DIGITS);
    return digits ? `${countryCode}${digits}` : '';
  };

  useEffect(() => {
    if (visible && user) {
      setName(user.name || '');
      setEmail(user.email || '');
      const raw = (user.phoneNumber || '').replace(/\D/g, '');
      let nextCode = DEFAULT_COUNTRY_CODE;
      let nextPhone = raw.slice(-REQUIRED_PHONE_DIGITS);
      if (user.phoneNumber?.startsWith('+')) {
        const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
        const matched = sorted.find((c) => user.phoneNumber!.startsWith(c.code));
        if (matched) {
          const codeDigits = matched.code.replace('+', '');
          nextCode = matched.code;
          nextPhone = raw.slice(codeDigits.length).slice(-REQUIRED_PHONE_DIGITS);
        }
      }
      setCountryCode(nextCode);
      setPhone(nextPhone);
      prefilledPhoneRef.current = nextPhone;
      prefilledCountryRef.current = nextCode;
      setErrors({});
    }
  }, [visible, user?.name, user?.email, user?.phoneNumber]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    // Define payload outside try-catch so it's accessible in both blocks
    let payload: { name?: string; email?: string; phoneNumber?: string } = {};
    const newErrors: { name?: string; email?: string; phoneNumber?: string } = {};

    try {
      setSaving(true);
      setErrors({});

      // Validate name
      const trimmedName = name.trim();
      if (!trimmedName) {
        newErrors.name = t('modals.nameRequired');
      } else if (trimmedName.length < 2) {
        newErrors.name = t('modals.nameMinLength');
      }

      // Validate email
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        newErrors.email = t('modals.emailRequired');
      } else if (!validateEmail(trimmedEmail)) {
        newErrors.email = t('modals.emailInvalid');
      }

      // Validate phone only when user has changed it from pre-filled value
      const isUnchangedPrefill =
        prefilledPhoneRef.current !== undefined &&
        prefilledCountryRef.current !== undefined &&
        phone === prefilledPhoneRef.current &&
        countryCode === prefilledCountryRef.current;

      if (!isUnchangedPrefill) {
        const digitsOnly = phone.replace(/\D/g, '');
        if (!phone.trim()) {
          newErrors.phoneNumber = t('modals.phoneRequired');
        } else if (digitsOnly.length !== REQUIRED_PHONE_DIGITS) {
          newErrors.phoneNumber = t('modals.phoneDigits', { digits: REQUIRED_PHONE_DIGITS });
        }
      }

      // If there are validation errors, show them and stop
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setSaving(false);
        return;
      }

      // Build payload
      const newPhoneE164 = fullPhone();
      if (trimmedName && trimmedName !== user?.name) payload.name = trimmedName;
      if (trimmedEmail && trimmedEmail !== user?.email) payload.email = trimmedEmail;
      if (newPhoneE164 && newPhoneE164 !== user?.phoneNumber) payload.phoneNumber = newPhoneE164;

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      const result = await EvenlyBackendService.updateCurrentUser(payload);

      if (result.success) {
        // Update local state with the response data
        const updated = result.data?.user;
        let updatedUser;

        if (updated) {
          // Preserve all existing user fields and update with new data
          updatedUser = {
            ...user,
            id: updated.id || user?.id,
            email: updated.email || user?.email,
            name: updated.name || user?.name,
            phoneNumber: updated.phoneNumber || user?.phoneNumber
          };
          setUser(updatedUser);
        } else if (user) {
          // Fallback: update with the payload if no user data in response
          updatedUser = { ...user, ...payload };
          setUser(updatedUser);
        }

        // IMPORTANT: Save updated user to AsyncStorage so changes persist on app reopen
        if (updatedUser) {
          try {
            // Get current auth data to preserve access token and organizations
            const authData = await AuthStorage.getAuthData();
            if (authData) {
              await AuthStorage.saveAuthData(
                updatedUser,
                authData.accessToken,
                authData.organizations
              );
            }
          } catch {
            // Continue anyway - user is updated in memory
          }

          // Force refresh user data from backend to ensure consistency
          try {
            await refreshUser();
          } catch {
            // Continue anyway - local data is already updated
          }
        }

        // Call success callback to refresh parent component
        if (onSuccess) {
          onSuccess();
        }

        // Show success alert with callback to close modal
        Alert.alert(
          t('common.success'),
          result.message || t('modals.profileUpdated'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert(t('common.error'), result.message || t('modals.profileUpdateFailed'));
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || t('modals.profileUpdateFailed');
      Alert.alert(t('common.error'), `${errorMessage}\n\nStatus: ${error?.response?.status || t('common.networkError')}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ReusableModal visible={visible} onClose={onClose} title={t('modals.editPersonalInfo')}>
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>{t('profile.fullName')}</Text>
          <View style={[styles.inputContainer, {
            backgroundColor: colors.background,
            borderColor: errors.name ? '#FF3B30' : colors.border
          }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder={t('profile.enterName')}
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
            />
          </View>
          {errors.name && (
            <Text style={styles.errorText}>{errors.name}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>{t('profile.email')}</Text>
          <View style={[styles.inputContainer, {
            backgroundColor: colors.background,
            borderColor: errors.email ? '#FF3B30' : colors.border
          }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder={t('profile.enterEmail')}
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>{t('profile.phone')} <Text style={styles.required}>*</Text></Text>
          <View style={styles.phoneInputRow}>
            <TouchableOpacity
              style={[
                styles.countryCodeTouchable,
                {
                  backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                  borderColor: errors.phoneNumber ? '#FF3B30' : colors.border,
                },
              ]}
              onPress={() => setShowCountryPicker(true)}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Text style={[styles.countryCodeText, { color: colors.foreground }]} numberOfLines={1}>
                {COUNTRY_CODES.find((c) => c.code === countryCode)?.label ?? countryCode}
              </Text>
              <Text style={[styles.countryCodeChevron, { color: colors.mutedForeground }]}>▼</Text>
            </TouchableOpacity>
            <View
              style={[
                styles.phoneInputWrapper,
                {
                  backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                  borderColor: errors.phoneNumber ? '#FF3B30' : colors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.phoneInput, { color: colors.foreground }]}
                placeholder="9876543210"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={(t) => {
                  setPhone(t.replace(/\D/g, '').slice(0, REQUIRED_PHONE_DIGITS));
                  if (errors.phoneNumber) setErrors((e) => ({ ...e, phoneNumber: undefined }));
                }}
                keyboardType="phone-pad"
                maxLength={REQUIRED_PHONE_DIGITS}
                editable={!saving}
              />
            </View>
          </View>
          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          )}
        </View>

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
              <Text style={[styles.countryPickerTitle, { color: colors.foreground }]}>{t('modals.selectCountryCode')}</Text>
              <FlatList
                data={COUNTRY_CODES}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.countryOption, countryCode === item.code && { backgroundColor: colors.muted }]}
                    onPress={() => {
                      setCountryCode(item.code);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={[styles.countryOptionText, { color: colors.foreground }]}>{item.label}</Text>
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
                <Text style={[styles.cancelCountryButtonText, { color: colors.foreground }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={styles.actions}>
          <PlatformActionButton title={t('common.cancel')} onPress={onClose} variant="secondary" />
          <PlatformActionButton title={saving ? t('common.saving') : t('modals.saveChanges')} onPress={handleSave} variant="primary" disabled={saving} />
        </View>

        {/* Delete Account moved to Profile screen Account section */}
      </View>
    </ReusableModal>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  required: {
    color: '#FF3B30',
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
    borderWidth: 1,
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
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  phoneInput: {
    fontSize: 16,
    paddingVertical: 4,
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 8,
  },
});


