import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SimpleInput } from '../../components/ui/SimpleInput';
import { PlatformActionButton } from '../../components/ui/PlatformActionButton';
import { GlassListCard } from '../../components/ui/GlassListCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from '../../constants/countryCodes';
import { ReferralService } from '../../services/ReferralService';
import { GoogleLogo } from '../../components/ui/GoogleLogo';
import { CountryCodePicker } from './CountryCodePicker';
import { ReferralPromptModal } from '../referral/ReferralPromptModal';
import {
  PendingReferralStorage,
  HAS_LOGGED_IN_BEFORE_KEY,
} from '../referral/pendingReferralStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  composeE164,
  isEmailIdentifier,
  buildAvatarFilePart,
  type SendOtpResponse,
  type VerifyOtpInput,
} from '../../services/UnifiedAuthService';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const EMAIL_MAX_LENGTH = 254;
const REQUIRED_PHONE_DIGITS = 10;
const PHONE_E164_REGEX = /^\+[1-9]\d{1,14}$/;
const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MB per spec

type Step = 'method' | 'identifier' | 'otp';

interface FieldErrors {
  identifier?: string;
  otp?: string;
  name?: string;
  avatar?: string;
  crossChannel?: string;
  google?: string;
}

export const UnifiedAuthScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { sendOtp, verifyOtpUnified, signInWithGoogle } = useAuth();
  const params = useLocalSearchParams<{ referralCode?: string }>();
  const { width } = Dimensions.get('window');

  const [step, setStep] = useState<Step>('method');
  const [identifier, setIdentifier] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [crossChannel, setCrossChannel] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otpInfo, setOtpInfo] = useState<SendOtpResponse | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Referral-prompt fallback: when a first-time signup reaches the verify step
  // without any referral code (deep link OR manual entry), we surface one
  // dialog asking for it before completing signup. `referralPromptDismissed`
  // ensures we don't ask again if the user skips and re-tries verification.
  const [showReferralPrompt, setShowReferralPrompt] = useState(false);
  const [referralPromptInput, setReferralPromptInput] = useState('');
  const [referralPromptDismissed, setReferralPromptDismissed] = useState(false);

  // Pre-fill referral code from deep link
  useEffect(() => {
    if (params.referralCode) {
      setReferralCode(params.referralCode);
    }
  }, [params.referralCode]);

  const identifierIsEmail = useMemo(() => isEmailIdentifier(identifier.trim()), [identifier]);

  /** Channel actually used for the OTP (whichever field was sent in send-otp). */
  const usedChannel: 'email' | 'phone' = identifierIsEmail ? 'email' : 'phone';

  /** Final composed values. */
  const finalEmail = identifierIsEmail ? identifier.trim().toLowerCase() : undefined;
  const finalPhone = !identifierIsEmail ? composeE164(countryCode, identifier) : undefined;

  const intent = otpInfo?.intent;
  const needsName = intent === 'signup' || otpInfo?.user?.hasName === false;
  const needsAvatar = intent === 'signup' || otpInfo?.user?.hasAvatar === false; // tile is shown but never required
  const needsCrossChannel =
    intent === 'signup' ||
    (usedChannel === 'email' && otpInfo?.user?.hasPhoneNumber === false) ||
    (usedChannel === 'phone' && otpInfo?.user?.hasEmail === false);

  const validateIdentifier = (): string | undefined => {
    const value = identifier.trim();
    if (!value) {
      return t('auth.emailOrPhoneRequired');
    }
    if (identifierIsEmail) {
      if (value.length > EMAIL_MAX_LENGTH) return t('auth.emailTooLong');
      if (!EMAIL_REGEX.test(value)) return t('auth.pleaseEnterValidEmail');
      return undefined;
    }
    const digits = value.replace(/\D/g, '');
    if (digits.length !== REQUIRED_PHONE_DIGITS) {
      return t('auth.phoneNumberMustBe10Digits', { count: REQUIRED_PHONE_DIGITS });
    }
    const e164 = composeE164(countryCode, digits);
    if (!PHONE_E164_REGEX.test(e164)) {
      return t('auth.enterValid10DigitPhone');
    }
    return undefined;
  };

  const handleContinue = async () => {
    const identifierError = validateIdentifier();
    if (identifierError) {
      setErrors({ identifier: identifierError });
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      const result = await sendOtp({
        ...(finalEmail ? { email: finalEmail } : {}),
        ...(finalPhone ? { phoneNumber: finalPhone } : {}),
        channel: identifierIsEmail ? 'email' : 'whatsapp',
      });

      if (!result.success) {
        setErrors({ identifier: result.message });
        return;
      }

      setOtpInfo(result);
      setStep('otp');
      setOtp('');
      // Reset signup-only fields when re-entering OTP step
      if (result.intent === 'login') {
        setName('');
        setAvatarUri(undefined);
        setCrossChannel('');
      }
      // For email, surface a clear "check inbox / spam" hint with the actual
      // address. For WhatsApp, the auth service's own message already names the
      // sender, so we pass it through unchanged.
      Alert.alert(
        t('auth.otpSent'),
        identifierIsEmail
          ? t('auth.otpSentEmailDetail', { email: finalEmail })
          : result.message || ''
      );
    } catch (error: any) {
      setErrors({ identifier: error?.message || t('errors.tryAgain') });
    } finally {
      setIsLoading(false);
    }
  };

  const acceptPickedAsset = (asset: { uri?: string; fileSize?: number }) => {
    if (!asset?.uri) return;
    if (typeof asset.fileSize === 'number' && asset.fileSize > AVATAR_MAX_BYTES) {
      setErrors((prev) => ({ ...prev, avatar: t('auth.avatarTooLarge') }));
      return;
    }
    setAvatarUri(asset.uri);
    setErrors((prev) => ({ ...prev, avatar: undefined }));
  };

  const handlePickFromGallery = async () => {
    try {
      const ImagePicker = require('expo-image-picker') as typeof import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setErrors((prev) => ({ ...prev, avatar: t('modals.cameraRollPermission') }));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled) return;
      acceptPickedAsset(result.assets?.[0] as any);
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, avatar: error?.message || t('errors.tryAgain') }));
    }
  };

  const handleTakePhoto = async () => {
    try {
      const ImagePicker = require('expo-image-picker') as typeof import('expo-image-picker');
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setErrors((prev) => ({ ...prev, avatar: t('modals.cameraPermission') }));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled) return;
      acceptPickedAsset(result.assets?.[0] as any);
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, avatar: error?.message || t('errors.tryAgain') }));
    }
  };

  const handleChoosePhotoSource = () => {
    Alert.alert(
      t('auth.choosePhotoSource'),
      t('modals.chooseAnOption'),
      [
        { text: t('modals.camera'), onPress: handleTakePhoto },
        { text: t('modals.gallery'), onPress: handlePickFromGallery },
        { text: t('common.cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  /**
   * Actual verify flow. Split out from `handleVerify` so the referral-code
   * prompt can interrupt and resume on demand. `effectiveReferralCode`
   * supersedes the screen state when the prompt provided a fresh value.
   */
  const doVerify = async (effectiveReferralCode?: string) => {
    const trimmedOtp = otp.trim();
    const next: FieldErrors = {};

    if (!trimmedOtp) next.otp = t('auth.otpRequired');
    else if (trimmedOtp.length !== 6) next.otp = t('auth.otpMustBe6Digits');

    if (needsName && name.trim().length < 2) {
      next.name = t('auth.nameMustBe2Chars');
    }

    // Cross-channel field is optional, but if filled, validate format.
    let crossChannelValue: string | undefined;
    if (needsCrossChannel && crossChannel.trim()) {
      if (usedChannel === 'email') {
        const digits = crossChannel.replace(/\D/g, '');
        if (digits.length !== REQUIRED_PHONE_DIGITS) {
          next.crossChannel = t('auth.phoneNumberMustBe10Digits', { count: REQUIRED_PHONE_DIGITS });
        } else {
          crossChannelValue = composeE164(countryCode, digits);
        }
      } else {
        const value = crossChannel.trim().toLowerCase();
        if (!EMAIL_REGEX.test(value)) {
          next.crossChannel = t('auth.pleaseEnterValidEmail');
        } else {
          crossChannelValue = value;
        }
      }
    }

    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      const verifyInput: VerifyOtpInput = {
        otp: trimmedOtp,
        ...(finalEmail ? { email: finalEmail } : {}),
        ...(finalPhone ? { phoneNumber: finalPhone } : {}),
      };

      // Cross-channel: when verifying via email, phoneNumber is the optional
      // "other channel"; vice versa. Add it as the missing side of the pair.
      if (crossChannelValue) {
        if (usedChannel === 'email') verifyInput.phoneNumber = crossChannelValue;
        else verifyInput.email = crossChannelValue;
      }

      if (needsName) {
        verifyInput.name = name.trim();
      }

      if (avatarUri) {
        verifyInput.file = buildAvatarFilePart(avatarUri);
      }

      const result = await verifyOtpUnified(verifyInput);

      if (!result.success) {
        setErrors({ otp: result.message });
        return;
      }

      // Apply referral code best-effort on successful signup. Never block login.
      const codeToApply = (effectiveReferralCode ?? referralCode).trim();
      if (intent === 'signup' && codeToApply) {
        try {
          await ReferralService.applyReferralCode(codeToApply);
        } catch {
          // non-blocking
        }
      }

      // PublicRoute will redirect to /tabs once isAuthenticated flips true.
    } catch (error: any) {
      setErrors({ otp: error?.message || t('errors.tryAgain') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    // First-time signup with no referral code yet: surface the prompt once.
    // After a skip the user can press Verify again and we'll go straight through.
    if (
      intent === 'signup' &&
      !referralCode.trim() &&
      !referralPromptDismissed
    ) {
      setReferralPromptInput('');
      setShowReferralPrompt(true);
      return;
    }
    await doVerify();
  };

  const handleApplyReferralFromPrompt = async (rawCode: string) => {
    const code = rawCode.trim();
    setShowReferralPrompt(false);
    setReferralPromptDismissed(true);
    if (code) {
      setReferralCode(code);
    }
    await doVerify(code || undefined);
  };

  const handleSkipReferralPrompt = async () => {
    setShowReferralPrompt(false);
    setReferralPromptDismissed(true);
    await doVerify();
  };

  const handleResend = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      const result = await sendOtp({
        ...(finalEmail ? { email: finalEmail } : {}),
        ...(finalPhone ? { phoneNumber: finalPhone } : {}),
        channel: identifierIsEmail ? 'email' : 'whatsapp',
      });
      if (result.success) {
        Alert.alert(
          t('auth.newOtpSent'),
          identifierIsEmail
            ? t('auth.otpSentEmailDetail', { email: finalEmail })
            : result.message || ''
        );
        setOtp('');
        setOtpInfo(result);
      } else {
        setErrors({ otp: result.message });
      }
    } catch (error: any) {
      setErrors({ otp: error?.message || t('errors.tryAgain') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToIdentifier = () => {
    setStep('identifier');
    setOtp('');
    setName('');
    setAvatarUri(undefined);
    setCrossChannel('');
    setOtpInfo(null);
    setErrors({});
    setReferralPromptDismissed(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrors({});
    try {
      // Pre-Google stash: deep-link code wins; otherwise on the first ever
      // auth on this device, request the prompt anyway so brand-new Google
      // users get a chance to enter a friend's code. Either way the
      // root-level ReferralPromptHost pops the modal post-auth and clears.
      const trimmedCode = referralCode.trim();
      if (trimmedCode) {
        await PendingReferralStorage.set(trimmedCode);
      } else {
        const everLoggedIn = await AsyncStorage.getItem(HAS_LOGGED_IN_BEFORE_KEY).catch(() => null);
        if (!everLoggedIn) {
          await PendingReferralStorage.requestPrompt();
        }
      }
      const result = await signInWithGoogle();
      if (!result.success && result.message !== 'Google sign-in was cancelled') {
        // Google sign-in failed/cancelled — drop the stash so the next time
        // the user signs in they don't see an unexpected prompt.
        await PendingReferralStorage.clear().catch(() => {});
        setErrors({ google: result.message });
      }
    } catch (error: any) {
      await PendingReferralStorage.clear().catch(() => {});
      setErrors({ google: error?.message || t('errors.tryAgain') });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const codeSentTarget = usedChannel === 'email' ? finalEmail || '' : finalPhone || '';
  const titleText =
    step === 'method' || step === 'identifier'
      ? t('auth.welcomeBack')
      : intent === 'signup'
      ? t('auth.createAccount')
      : t('auth.welcomeBack');

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'android' ? -50 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: width > 600 ? 40 : 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.appNameContainer}>
              <Svg height="36" width="200">
                <Defs>
                  <SvgLinearGradient id="gradientUnified" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <SvgText
                  fill="url(#gradientUnified)"
                  fontSize="28"
                  fontWeight="700"
                  x="50%"
                  y="28"
                  textAnchor="middle"
                  letterSpacing="0.5"
                  fontFamily="System"
                >
                  {t('auth.appName')}
                </SvgText>
              </Svg>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>{titleText}</Text>
          </View>

          {step === 'method' ? (
            <>
              {/* Google Sign-In */}
              <TouchableOpacity
                style={[styles.googleButton, { borderColor: colors.border }]}
                onPress={handleGoogleSignIn}
                disabled={isGoogleLoading}
                activeOpacity={0.7}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color={colors.foreground} />
                ) : (
                  <>
                    <View style={styles.googleIcon}>
                      <GoogleLogo size={20} />
                    </View>
                    <Text style={[styles.googleButtonText, { color: colors.foreground }]}>
                      {t('auth.continueWithGoogle')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {errors.google ? <Text style={styles.fieldError}>{errors.google}</Text> : null}

              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
                  {t('auth.orContinueWith')}
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <PlatformActionButton
                title={t('auth.continueWithEmailOrPhone')}
                onPress={() => setStep('identifier')}
                variant="secondary"
                size="large"
              />
            </>
          ) : step === 'identifier' ? (
            <>
              <GlassListCard
                title={t('auth.continueWithEmailOrPhone')}
                contentGap={20}
                padding={{ small: 20, medium: 24, large: 28, tablet: 32 }}
                marginBottom={24}
              >
                <View>
                  <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                    {t('auth.emailOrPhone')}
                  </Text>
                  <View style={styles.identifierRow}>
                    {!identifierIsEmail && identifier.trim().length > 0 ? (
                      <TouchableOpacity
                        style={[
                          styles.countryCodeTouchable,
                          {
                            backgroundColor: colors.muted,
                            borderColor: errors.identifier ? '#FF3B30' : colors.border,
                          },
                        ]}
                        onPress={() => setShowCountryPicker(true)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[styles.countryCodeText, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {COUNTRY_CODES.find((c) => c.code === countryCode)?.label ?? countryCode}
                        </Text>
                        <Text
                          style={[styles.countryCodeChevron, { color: colors.mutedForeground }]}
                        >
                          ▼
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    <View
                      style={[
                        styles.identifierInputWrapper,
                        {
                          backgroundColor: colors.muted,
                          borderColor: errors.identifier ? '#FF3B30' : colors.border,
                        },
                      ]}
                    >
                      <TextInput
                        style={[styles.identifierInput, { color: colors.foreground }]}
                        placeholder={t('auth.emailOrPhonePlaceholder')}
                        placeholderTextColor={colors.mutedForeground}
                        value={identifier}
                        onChangeText={(v) => {
                          setIdentifier(v);
                          if (errors.identifier) {
                            setErrors((e) => ({ ...e, identifier: undefined }));
                          }
                        }}
                        keyboardType={identifierIsEmail ? 'email-address' : 'default'}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                  {errors.identifier ? (
                    <Text style={styles.fieldError}>{errors.identifier}</Text>
                  ) : (
                    <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                      {t('auth.emailOrPhoneHint')}
                    </Text>
                  )}
                </View>

                {referralCode ? (
                  <View style={[styles.referralPill, { borderColor: colors.border }]}>
                    <Text style={[styles.referralPillText, { color: colors.mutedForeground }]}>
                      {t('referral.codeApplied')}: {referralCode}
                    </Text>
                  </View>
                ) : null}
                {/* Manual referral entry lives on the OTP step (signup intent). */}

                <View style={styles.buttonContainer}>
                  <PlatformActionButton
                    title={t('auth.sendVerificationCode')}
                    onPress={handleContinue}
                    variant="primary"
                    size="large"
                    disabled={isLoading || isGoogleLoading}
                    loading={isLoading}
                  />
                  <PlatformActionButton
                    title={t('common.cancel', { defaultValue: 'Cancel' })}
                    onPress={() => {
                      setStep('method');
                      setErrors({});
                    }}
                    variant="secondary"
                    size="large"
                    disabled={isLoading}
                  />
                </View>
              </GlassListCard>
            </>
          ) : (
            <GlassListCard
              title={t('auth.verifyCode')}
              contentGap={20}
              padding={{ small: 20, medium: 24, large: 28, tablet: 32 }}
              marginBottom={24}
            >
              <View style={styles.targetDisplay}>
                <Text style={[styles.targetText, { color: colors.mutedForeground }]}>
                  {usedChannel === 'email'
                    ? t('auth.codeSentTo', { email: codeSentTarget })
                    : t('auth.codeSentToPhone', { phone: codeSentTarget })}
                </Text>
              </View>

              {needsAvatar ? (
                avatarUri ? (
                  <View style={styles.avatarPickedContainer}>
                    <TouchableOpacity
                      onPress={handleChoosePhotoSource}
                      activeOpacity={0.85}
                      style={[styles.avatarCircle, { borderColor: colors.border }]}
                    >
                      <Image source={{ uri: avatarUri }} style={styles.avatarCirclePreview} />
                      <View style={styles.avatarChangeOverlay}>
                        <Text style={styles.avatarChangeOverlayText}>{t('auth.changePhoto')}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleChoosePhotoSource} style={styles.avatarChangeLink}>
                      <Text style={[styles.avatarChangeLinkText, { color: colors.primary }]}>
                        {t('auth.changePhoto')}
                      </Text>
                    </TouchableOpacity>
                    {errors.avatar ? <Text style={styles.fieldError}>{errors.avatar}</Text> : null}
                  </View>
                ) : (
                  <View>
                    <PlatformActionButton
                      title={t('auth.addYourPhoto')}
                      onPress={handleChoosePhotoSource}
                      variant="secondary"
                      size="medium"
                    />
                    {errors.avatar ? <Text style={styles.fieldError}>{errors.avatar}</Text> : null}
                  </View>
                )
              ) : null}

              <SimpleInput
                label={t('auth.verificationCode')}
                placeholder={t('auth.enter6DigitCode')}
                value={otp}
                onChangeText={(v) => {
                  setOtp(v.replace(/\D/g, '').slice(0, 6));
                  if (errors.otp) setErrors((e) => ({ ...e, otp: undefined }));
                }}
                keyboardType="numeric"
                maxLength={6}
                required
                error={errors.otp}
              />

              {needsName ? (
                <SimpleInput
                  label={t('auth.fullName')}
                  placeholder={t('auth.enterYourName')}
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                  }}
                  autoCapitalize="words"
                  required
                  error={errors.name}
                />
              ) : null}

              {needsCrossChannel ? (
                usedChannel === 'email' ? (
                  <View>
                    <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                      {t('auth.alsoAddPhoneOptional')}
                    </Text>
                    <View style={styles.identifierRow}>
                      <TouchableOpacity
                        style={[
                          styles.countryCodeTouchable,
                          {
                            backgroundColor: colors.muted,
                            borderColor: errors.crossChannel ? '#FF3B30' : colors.border,
                          },
                        ]}
                        onPress={() => setShowCountryPicker(true)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[styles.countryCodeText, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {COUNTRY_CODES.find((c) => c.code === countryCode)?.label ?? countryCode}
                        </Text>
                        <Text style={[styles.countryCodeChevron, { color: colors.mutedForeground }]}>
                          ▼
                        </Text>
                      </TouchableOpacity>
                      <View
                        style={[
                          styles.identifierInputWrapper,
                          {
                            backgroundColor: colors.muted,
                            borderColor: errors.crossChannel ? '#FF3B30' : colors.border,
                          },
                        ]}
                      >
                        <TextInput
                          style={[styles.identifierInput, { color: colors.foreground }]}
                          placeholder={t('modals.enterPhoneNumber', { defaultValue: 'Enter phone number' })}
                          placeholderTextColor={colors.mutedForeground}
                          value={crossChannel}
                          onChangeText={(v) => {
                            setCrossChannel(v.replace(/\D/g, '').slice(0, REQUIRED_PHONE_DIGITS));
                            if (errors.crossChannel) {
                              setErrors((e) => ({ ...e, crossChannel: undefined }));
                            }
                          }}
                          keyboardType="phone-pad"
                          maxLength={REQUIRED_PHONE_DIGITS}
                        />
                      </View>
                    </View>
                    {errors.crossChannel ? (
                      <Text style={styles.fieldError}>{errors.crossChannel}</Text>
                    ) : null}
                  </View>
                ) : (
                  <SimpleInput
                    label={t('auth.alsoAddEmailOptional')}
                    placeholder={t('auth.enterYourEmail')}
                    value={crossChannel}
                    onChangeText={(v) => {
                      setCrossChannel(v);
                      if (errors.crossChannel) setErrors((e) => ({ ...e, crossChannel: undefined }));
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={errors.crossChannel}
                  />
                )
              ) : null}

              {intent === 'signup' ? (
                <SimpleInput
                  label={t('referral.enterCode')}
                  placeholder={t('referral.enterCodePlaceholder')}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ) : null}

              <View style={styles.buttonContainer}>
                <PlatformActionButton
                  title={
                    intent === 'signup' ? t('auth.verifyAndCreateAccount') : t('auth.verifyAndLogin')
                  }
                  onPress={handleVerify}
                  variant="primary"
                  size="large"
                  disabled={isLoading}
                  loading={isLoading}
                />
                <View style={styles.resendRow}>
                  <Text style={[styles.resendHint, { color: colors.mutedForeground }]}>
                    {t('auth.didntGetCode')}
                  </Text>
                  <TouchableOpacity
                    onPress={handleResend}
                    disabled={isLoading}
                    activeOpacity={0.6}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text
                      style={[
                        styles.resendLink,
                        { color: colors.primary, opacity: isLoading ? 0.5 : 1 },
                      ]}
                    >
                      {t('auth.resendCode')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <PlatformActionButton
                  title={t('auth.useDifferentMethod')}
                  onPress={handleBackToIdentifier}
                  variant="secondary"
                  size="medium"
                  disabled={isLoading}
                />
              </View>
            </GlassListCard>
          )}

          <CountryCodePicker
            visible={showCountryPicker}
            selectedCode={countryCode}
            onSelect={setCountryCode}
            onClose={() => setShowCountryPicker(false)}
          />

          <ReferralPromptModal
            visible={showReferralPrompt}
            initialCode={referralPromptInput}
            loading={isLoading}
            onApply={handleApplyReferralFromPrompt}
            onSkip={handleSkipReferralPrompt}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
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
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  identifierRow: {
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
  identifierInputWrapper: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  identifierInput: {
    fontSize: 16,
    paddingVertical: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
  fieldError: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  referralPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  referralPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  targetDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  targetText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  avatarPickedContainer: {
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarCirclePreview: {
    width: '100%',
    height: '100%',
  },
  avatarChangeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
  },
  avatarChangeOverlayText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  avatarChangeLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  avatarChangeLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  resendHint: {
    fontSize: 13,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
    minHeight: 52,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
