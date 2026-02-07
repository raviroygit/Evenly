import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, Dimensions, Image, Modal, TouchableOpacity, FlatList, TextInput } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SimpleInput } from '../../components/ui/SimpleInput';
import { PlatformActionButton } from '../../components/ui/PlatformActionButton';
import { GlassListCard } from '../../components/ui/GlassListCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from '../../constants/countryCodes';

// E.164: + followed by country code + 10 digits (India: +91 + 10 digits)
const PHONE_E164_REGEX = /^\+[1-9]\d{1,14}$/;
const REQUIRED_PHONE_DIGITS = 10;

// Email: local part (letters, digits, . _ % + -), @, domain with at least one dot and 2+ char TLD
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const EMAIL_MAX_LENGTH = 254;

export const SignupScreen: React.FC = () => {
  const { colors } = useTheme();
  const { signupWithOtp, signupVerifyOtp } = useAuth();
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phoneNumber?: string; otp?: string }>({});

  const fullPhoneE164 = (): string => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits ? `${countryCode}${digits}` : '';
  };

  const validateForm = () => {
    const next: typeof errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    const fullPhone = fullPhoneE164();

    if (trimmedName.length < 2) {
      next.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!trimmedEmail) {
      next.email = 'Email is required';
    } else if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
      next.email = 'Email address is too long';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      next.email = 'Please enter a valid email (e.g. name@example.com)';
    }

    // Phone validation: exactly 10 digits
    if (!phoneNumber.trim()) {
      next.phoneNumber = 'Phone number is required';
    } else if (digitsOnly.length !== REQUIRED_PHONE_DIGITS) {
      next.phoneNumber = `Phone number must be exactly ${REQUIRED_PHONE_DIGITS} digits`;
    } else if (!PHONE_E164_REGEX.test(fullPhone)) {
      next.phoneNumber = 'Enter a valid 10-digit phone number';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signupWithOtp(name.trim(), email.trim().toLowerCase(), fullPhoneE164());
      if (result.success) {
        setStep('otp');
        Alert.alert('OTP Sent', result.message);
      } else {
        setErrors({ email: result.message || 'Failed to send OTP' });
      }
    } catch (error: any) {
      setErrors({ email: error.message || 'Failed to send OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setErrors({ otp: 'OTP is required' });
      return;
    }
    if (trimmedOtp.length !== 6) {
      setErrors({ otp: 'OTP must be 6 digits' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signupVerifyOtp(email.trim().toLowerCase(), trimmedOtp);
      if (result.success) {
        Alert.alert(
          'Account created',
          'Please sign in with your email to continue.',
          [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
        );
        return;
      }
      setErrors({ otp: result.message || 'Invalid or expired OTP' });
    } catch (error: any) {
      setErrors({ otp: error.message || 'Verification failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToForm = () => {
    setStep('form');
    setOtp('');
    setErrors({});
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      const result = await signupWithOtp(name.trim(), email.trim().toLowerCase(), fullPhoneE164());
      if (result.success) {
        Alert.alert('OTP Sent', result.message);
        setOtp('');
      } else {
        setErrors({ otp: result.message || 'Failed to resend OTP' });
      }
    } catch (error: any) {
      setErrors({ otp: error.message || 'Failed to resend OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'android' ? -50 : 0}
      >
        <View style={[styles.content, { paddingHorizontal: width > 600 ? 40 : 20 }]}>
          <View style={styles.header}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.appNameContainer}>
              <Svg height="36" width="200">
                <Defs>
                  <SvgLinearGradient id="gradientSignup" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <SvgText
                  fill="url(#gradientSignup)"
                  fontSize="28"
                  fontWeight="700"
                  x="50%"
                  y="28"
                  textAnchor="middle"
                  letterSpacing="0.5"
                  fontFamily="System"
                >
                  EvenlySplit
                </SvgText>
              </Svg>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {step === 'otp' ? 'Verify Email' : 'Create Account'}
            </Text>
           
          </View>

          <GlassListCard
            title={step === 'otp' ? 'Verify Code' : 'Sign Up'}
            contentGap={20}
            padding={{
              small: 20,
              medium: 24,
              large: 28,
              tablet: 32,
            }}
            marginBottom={24}
          >
            {step === 'form' ? (
              <>
                <SimpleInput
                  label="Full Name"
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  required
                  error={errors.name}
                />
                <SimpleInput
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  required
                  error={errors.email}
                />
                <View style={styles.phoneRow}>
                  <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                    Phone Number <Text style={[styles.requiredAsterisk, { color: colors.destructive }]}>*</Text>
                  </Text>
                  <View style={styles.phoneInputRow}>
                    <TouchableOpacity
                      style={[styles.countryCodeTouchable, { backgroundColor: colors.muted, borderColor: errors.phoneNumber ? '#FF3B30' : colors.border }]}
                      onPress={() => setShowCountryPicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.countryCodeText, { color: colors.foreground }]} numberOfLines={1}>
                        {COUNTRY_CODES.find((c) => c.code === countryCode)?.label ?? countryCode}
                      </Text>
                      <Text style={[styles.countryCodeChevron, { color: colors.mutedForeground }]}>▼</Text>
                    </TouchableOpacity>
                    <View style={[styles.phoneInputWrapper, { backgroundColor: colors.muted, borderColor: errors.phoneNumber ? '#FF3B30' : colors.border }]}>
                      <TextInput
                        style={[styles.phoneInput, { color: colors.foreground }]}
                        placeholder="9876543210"
                        placeholderTextColor={colors.mutedForeground}
                        value={phoneNumber}
                        onChangeText={(t) => {
                          setPhoneNumber(t.replace(/\D/g, '').slice(0, REQUIRED_PHONE_DIGITS));
                          if (errors.phoneNumber) setErrors((e) => ({ ...e, phoneNumber: undefined }));
                        }}
                        keyboardType="phone-pad"
                        maxLength={REQUIRED_PHONE_DIGITS}
                      />
                    </View>
                  </View>
                  {errors.phoneNumber ? <Text style={styles.phoneError}>{errors.phoneNumber}</Text> : null}
                </View>
                <Modal visible={showCountryPicker} transparent animationType="slide">
                  <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCountryPicker(false)}>
                    <View style={[styles.countryPickerSheet, { backgroundColor: colors.background }]} onStartShouldSetResponder={() => true}>
                      <Text style={[styles.countryPickerTitle, { color: colors.foreground }]}>Select country code</Text>
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
                            {countryCode === item.code && <Text style={{ color: colors.primary, fontWeight: '600' }}>✓</Text>}
                          </TouchableOpacity>
                        )}
                        style={styles.countryList}
                      />
                      <PlatformActionButton title="Cancel" onPress={() => setShowCountryPicker(false)} variant="secondary" size="medium" />
                    </View>
                  </TouchableOpacity>
                </Modal>
                <PlatformActionButton
                  title="Send Verification Code"
                  onPress={handleSendOtp}
                  variant="primary"
                  size="large"
                  disabled={isLoading}
                  loading={isLoading}
                />
              </>
            ) : (
              <>
                <View style={styles.emailDisplay}>
                  <Text style={[styles.emailText, { color: colors.mutedForeground }]}>
                    Code sent to: {email}
                  </Text>
                </View>
                <SimpleInput
                  label="Verification Code"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                  required
                  error={errors.otp}
                />
                <View style={styles.buttonContainer}>
                  <PlatformActionButton
                    title="Verify & Create Account"
                    onPress={handleVerifyOtp}
                    variant="primary"
                    size="large"
                    disabled={isLoading}
                    loading={isLoading}
                  />
                  <PlatformActionButton
                    title="Resend Code"
                    onPress={handleResendOtp}
                    variant="secondary"
                    size="medium"
                    disabled={isLoading}
                    loading={false}
                  />
                  <PlatformActionButton
                    title="Back to Form"
                    onPress={handleBackToForm}
                    variant="secondary"
                    size="medium"
                    loading={false}
                  />
                </View>
              </>
            )}
          </GlassListCard>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Already have an account?{' '}
              <Text
                style={[styles.linkText, { color: colors.primary }]}
                onPress={() => router.push('/auth/login')}
              >
                Sign in
              </Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appNameContainer: {
    marginBottom: 8,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  phoneRow: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  requiredAsterisk: {
    fontWeight: '600',
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  countryCodeTouchable: {
    minWidth: 100,
    paddingVertical: 14,
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
  phoneError: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  modalOverlay: {
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
  emailDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '400',
  },
  linkText: {
    fontWeight: '600',
  },
});
