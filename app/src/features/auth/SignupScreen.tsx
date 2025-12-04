import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, Linking, Dimensions, Image } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { SimpleInput } from '../../components/ui/SimpleInput';
import { PlatformActionButton } from '../../components/ui/PlatformActionButton';
import { GlassListCard } from '../../components/ui/GlassListCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';

export const SignupScreen: React.FC = () => {
  const { colors } = useTheme();
  const { signup } = useAuth();
  const router = useRouter();
  const { width } = Dimensions.get('window');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signup(email);
      if (result.success) {
        setIsEmailSent(true);
        Alert.alert(
          'Magic Link Sent!', 
          'Please check your email and click the magic link to complete your signup.',
          [
            {
              text: 'Open Email App',
              onPress: () => {
                // Try to open the default email app
                Linking.openURL('mailto:');
              }
            },
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      } else {
        setErrors({ email: result.message });
      }
    } catch {
      setErrors({ email: 'Failed to send magic link. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    await handleSignup();
  };

  const handleBackToForm = () => {
    setIsEmailSent(false);
    setEmail('');
    setErrors({});
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
              {isEmailSent ? 'Check Your Email' : 'Create Account'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {isEmailSent 
                ? 'We sent a magic link to your email address'
                : 'Enter your email to get started with a magic link'
              }
            </Text>
          </View>

          {/* Form Card */}
          <GlassListCard
            title={isEmailSent ? 'Email Sent' : 'Sign Up'}
            contentGap={20}
            padding={{
              small: 20,
              medium: 24,
              large: 28,
              tablet: 32,
            }}
            marginBottom={24}
          >
            {!isEmailSent ? (
              <>
                <SimpleInput
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.email}
                />
                
                <PlatformActionButton
                  title="Send Magic Link"
                  onPress={handleSignup}
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
                    Magic link sent to:
                  </Text>
                  <Text style={[styles.emailAddress, { color: colors.foreground }]}>
                    {email}
                  </Text>
                </View>

                <View style={styles.instructions}>
                  <Text style={[styles.instructionText, { color: colors.mutedForeground }]}>
                    1. Check your email inbox (and spam folder)
                  </Text>
                  <Text style={[styles.instructionText, { color: colors.mutedForeground }]}>
                    2. Click the magic link in the email
                  </Text>
                  <Text style={[styles.instructionText, { color: colors.mutedForeground }]}>
                    3. You&apos;ll be automatically signed in
                  </Text>
                </View>
                
                <View style={styles.buttonContainer}>
                  <PlatformActionButton
                    title="Open Email App"
                    onPress={() => Linking.openURL('mailto:')}
                    variant="primary"
                    size="large"
                    loading={false}
                  />
                  
                  <PlatformActionButton
                    title="Resend Magic Link"
                    onPress={handleResendEmail}
                    variant="secondary"
                    size="medium"
                    disabled={isLoading}
                    loading={isLoading}
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

          {/* Footer */}
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
  emailDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  emailAddress: {
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
    lineHeight: 20,
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
