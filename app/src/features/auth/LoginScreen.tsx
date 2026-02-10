import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, Dimensions, Image } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText, TSpan } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SimpleInput } from '../../components/ui/SimpleInput';
import { PlatformActionButton } from '../../components/ui/PlatformActionButton';
import { GlassListCard } from '../../components/ui/GlassListCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { login, requestOTP } = useAuth();
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; otp?: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRequestOTP = async () => {
    if (!email.trim()) {
      setErrors({ email: t('auth.emailRequired') });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: t('auth.pleaseEnterValidEmail') });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await requestOTP(email);
      if (result.success) {
        setStep('otp');
        Alert.alert(t('auth.otpSent'), result.message);
      } else {
        // Display the actual backend error message
        setErrors({ email: result.message || t('errors.tryAgain') });
      }
    } catch (error: any) {
      // This shouldn't happen as requestOTP catches errors, but just in case
      const errorMessage = error.message || t('errors.tryAgain');
      setErrors({ email: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setErrors({ otp: t('auth.otpRequired') });
      return;
    }

    if (otp.length !== 6) {
      setErrors({ otp: t('auth.otpMustBe6Digits') });
      return;
    }

    setIsLoading(true);
    setErrors({});


    try {
      const result = await login(email, otp);
      if (result.success) {
        // Don't navigate here - let PublicRoute handle navigation automatically
        // when isAuthenticated becomes true to avoid race condition
        // Navigation will happen automatically via PublicRoute useEffect
      } else {
        // Display the actual backend error message
        setErrors({ otp: result.message || t('errors.tryAgain') });
      }
    } catch (error: any) {
      // This shouldn't happen as login catches errors, but just in case
      const errorMessage = error.message || t('errors.tryAgain');
      setErrors({ otp: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setErrors({});
  };

  const handleRequestNewOTP = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const result = await requestOTP(email);
      if (result.success) {
        Alert.alert(t('auth.newOtpSent'), result.message);
        setOtp(''); // Clear the current OTP
      } else {
        // Display the actual backend error message
        setErrors({ otp: result.message || t('errors.tryAgain') });
      }
    } catch (error: any) {
      // This shouldn't happen as requestOTP catches errors, but just in case
      const errorMessage = error.message || t('errors.tryAgain');
      setErrors({ otp: errorMessage });
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
          {/* Header */}
          <View style={styles.header}>
            <Image 
              source={require('../../../assets/icon.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.appNameContainer}>
              <Svg height="36" width="200">
                <Defs>
                  <SvgLinearGradient id="gradientLogin" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <SvgText
                  fill="url(#gradientLogin)"
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
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t('auth.welcomeBack')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {step === 'email'
                ? t('auth.enterEmailToReceiveCode')
                : t('auth.enter6DigitCodeSentToEmail')
              }
            </Text>
          </View>

          {/* Form Card */}
          <GlassListCard
            title={step === 'email' ? t('auth.login') : t('auth.verifyCode')}
            contentGap={20}
            padding={{
              small: 20,
              medium: 24,
              large: 28,
              tablet: 32,
            }}
            marginBottom={24}
          >
            {step === 'email' ? (
              <>
                <SimpleInput
                  label={t('auth.emailAddress')}
                  placeholder={t('auth.enterYourEmail')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.email}
                />

                <PlatformActionButton
                  title={t('auth.sendLoginCode')}
                  onPress={handleRequestOTP}
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
                    {t('auth.codeSentTo', { email })}
                  </Text>
                </View>

                <SimpleInput
                  label={t('auth.verificationCode')}
                  placeholder={t('auth.enter6DigitCode')}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                  error={errors.otp}
                />

                <View style={styles.buttonContainer}>
                  <PlatformActionButton
                    title={t('auth.verifyAndLogin')}
                    onPress={handleVerifyOTP}
                    variant="primary"
                    size="large"
                    disabled={isLoading}
                    loading={isLoading}
                  />

                  <PlatformActionButton
                    title={t('auth.requestNewOTP')}
                    onPress={handleRequestNewOTP}
                    variant="secondary"
                    size="medium"
                    disabled={isLoading}
                    loading={false}
                  />

                  <PlatformActionButton
                    title={t('auth.backToEmail')}
                    onPress={handleBackToEmail}
                    variant="secondary"
                    size="medium"
                    disabled={isLoading}
                    loading={false}
                  />
                </View>
              </>
            )}
          </GlassListCard>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              {t('auth.dontHaveAccount')}{' '}
              <Text
                style={[styles.linkText, { color: colors.primary }]}
                onPress={() => router.push('/auth/signup')}
              >
                {t('auth.signUp')}
              </Text>
            </Text>
            <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
              {t('auth.needHelp')}
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  linkText: {
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
    lineHeight: 16,
  },
});
