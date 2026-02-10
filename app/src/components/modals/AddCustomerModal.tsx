import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from '../../constants/countryCodes';

const REQUIRED_PHONE_DIGITS = 10;

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface AddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editCustomer?: Customer | null;
  onUpdateCustomer?: (customerId: string, data: { name: string; email?: string; phone?: string }) => Promise<void>;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  visible,
  onClose,
  onSuccess,
  editCustomer = null,
  onUpdateCustomer,
}) => {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const prefilledPhoneRef = useRef<string | undefined>(undefined);
  const prefilledCountryRef = useRef<string | undefined>(undefined);

  const fullPhone = (): string => {
    const digits = phone.replace(/\D/g, '').slice(0, REQUIRED_PHONE_DIGITS);
    return digits ? `${countryCode}${digits}` : '';
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Pre-fill form when editing (store pre-filled phone/country so we skip validation when unchanged)
  React.useEffect(() => {
    if (editCustomer) {
      setName(editCustomer.name || '');
      setEmail(editCustomer.email || '');
      const raw = (editCustomer.phone || '').replace(/\D/g, '');
      let nextCode = DEFAULT_COUNTRY_CODE;
      let nextPhone = raw.slice(-REQUIRED_PHONE_DIGITS);
      if (editCustomer.phone?.startsWith('+')) {
        const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
        const matched = sorted.find((c) => editCustomer.phone!.startsWith(c.code));
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
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setCountryCode(DEFAULT_COUNTRY_CODE);
      prefilledPhoneRef.current = undefined;
      prefilledCountryRef.current = undefined;
    }
    setErrors({});
  }, [editCustomer, visible]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};
    const digitsOnly = phone.replace(/\D/g, '');

    if (!name.trim()) {
      newErrors.name = t('errors.requiredField');
    }

    if (!email.trim()) {
      newErrors.email = t('errors.requiredField');
    } else if (!validateEmail(email.trim())) {
      newErrors.email = t('errors.invalidEmail');
    }

    const isUnchangedPrefill =
      editCustomer &&
      prefilledPhoneRef.current !== undefined &&
      prefilledCountryRef.current !== undefined &&
      phone === prefilledPhoneRef.current &&
      countryCode === prefilledCountryRef.current;

    if (!isUnchangedPrefill) {
      if (!phone.trim()) {
        newErrors.phone = t('errors.requiredField');
      } else if (digitsOnly.length !== REQUIRED_PHONE_DIGITS) {
        newErrors.phone = `Phone number must be exactly ${REQUIRED_PHONE_DIGITS} digits`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (editCustomer && onUpdateCustomer) {
        await onUpdateCustomer(editCustomer.id, {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: fullPhone(),
        });
      } else {
        await EvenlyBackendService.createKhataCustomer({
          name: name.trim(),
          email: email.trim(),
          phone: fullPhone(),
        });
      }

      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setCountryCode(DEFAULT_COUNTRY_CODE);
      setErrors({});

      // Close modal immediately for better UX
      onClose();

      // Then refresh list in background
      await onSuccess();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (error instanceof Error ? error.message : null);
      Alert.alert(
        t('common.error'),
        msg || `Failed to ${editCustomer ? 'update' : 'create'} customer. Please try again.`,
        [{ text: t('common.ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setEmail('');
      setPhone('');
      setCountryCode(DEFAULT_COUNTRY_CODE);
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
          },
        ]}
      >
        <View style={styles.overlayTouchable}>
          <TouchableOpacity
            style={styles.overlayBackground}
            activeOpacity={1}
            onPress={handleClose}
          />
          <View style={styles.modalWrapper}>
            <KeyboardAvoidingView
              style={styles.modalWrapper}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              <View
                style={[
                  styles.modalContainer,
                  {
                    backgroundColor: colors.background,
                  },
                  keyboardVisible && styles.modalContainerKeyboardOpen,
                ]}
              >
                {/* Header */}
                <View style={styles.header}>
                  <Text style={[styles.title, { color: colors.foreground }]}>
                    {editCustomer ? t('common.edit') + ' ' + t('khata.customers').slice(0, -1) : t('khata.addCustomer')}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={loading}
                  >
                    <Ionicons name="close" size={24} color={colors.foreground} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={[styles.scrollView, keyboardVisible && styles.scrollViewKeyboardOpen]}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Form */}
                  <View style={styles.form}>
                    {/* Name Field */}
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { color: colors.foreground }]}>
                        {t('profile.name')} <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                            color: colors.foreground,
                            borderColor: errors.name ? '#FF3B30' : 'transparent',
                            borderWidth: errors.name ? 1 : 0,
                          },
                        ]}
                        placeholder={t('khata.customerName')}
                        placeholderTextColor={colors.mutedForeground}
                        value={name}
                        onChangeText={(text) => {
                          setName(text);
                          if (errors.name) {
                            setErrors({ ...errors, name: undefined });
                          }
                        }}
                        editable={!loading}
                      />
                      {errors.name && (
                        <Text style={styles.errorText}>{errors.name}</Text>
                      )}
                    </View>

                    {/* Email Field */}
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { color: colors.foreground }]}>
                        {t('auth.email')} <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                            color: colors.foreground,
                            borderColor: errors.email ? '#FF3B30' : 'transparent',
                            borderWidth: errors.email ? 1 : 0,
                          },
                        ]}
                        placeholder={t('auth.enterEmail')}
                        placeholderTextColor={colors.mutedForeground}
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (errors.email) {
                            setErrors({ ...errors, email: undefined });
                          }
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                      />
                      {errors.email && (
                        <Text style={styles.errorText}>{errors.email}</Text>
                      )}
                    </View>

                    {/* Phone Field - required with country code */}
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { color: colors.foreground }]}>
                        {t('profile.phoneNumber')} <Text style={styles.required}>*</Text>
                      </Text>
                      <View style={styles.phoneInputRow}>
                        <TouchableOpacity
                          style={[
                            styles.countryCodeTouchable,
                            {
                              backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                              borderColor: errors.phone ? '#FF3B30' : 'transparent',
                              borderWidth: errors.phone ? 1 : 0,
                            },
                          ]}
                          onPress={() => setShowCountryPicker(true)}
                          activeOpacity={0.7}
                          disabled={loading}
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
                              borderColor: errors.phone ? '#FF3B30' : 'transparent',
                              borderWidth: errors.phone ? 1 : 0,
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
                              if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
                            }}
                            keyboardType="phone-pad"
                            maxLength={REQUIRED_PHONE_DIGITS}
                            editable={!loading}
                          />
                        </View>
                      </View>
                      {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
                    </View>
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
                        Select country code
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

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: loading ? colors.mutedForeground : colors.primary,
                      },
                    ]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {editCustomer ? t('common.update') + ' ' + t('khata.customers').slice(0, -1) : t('khata.addCustomer')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalContainerKeyboardOpen: {
    flex: 1,
    maxHeight: '90%',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollViewKeyboardOpen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    paddingBottom: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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

