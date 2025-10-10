import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SimpleInput } from '../../components/ui/SimpleInput';
import { PlatformActionButton } from '../../components/ui/PlatformActionButton';
import { GlassListCard } from '../../components/ui/GlassListCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';

export const LoginScreen: React.FC = () => {
  const { colors, theme, toggleTheme } = useTheme();
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
      const result = await requestOTP(email);
      if (result.success) {
        setStep('otp');
        Alert.alert('OTP Sent', result.message);
      } else {
        setErrors({ email: result.message });
      }
    } catch (error: any) {
      console.error('Request OTP error:', error);
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.message.includes('User does not exist')) {
        errorMessage = 'User does not exist. Please sign up first.';
      } else if (error.message.includes('400')) {
        errorMessage = 'User not found. Please sign up first or check your email.';
      }
      
      setErrors({ email: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    if (otp.length !== 6) {
      setErrors({ otp: 'OTP must be 6 digits' });
      return;
    }

    setIsLoading(true);
    setErrors({});


    try {
      const result = await login(email, otp);
      if (result.success) {
        Alert.alert('Success', result.message);
        // Navigate to home screen
        router.replace('/tabs');
      } else {
        setErrors({ otp: result.message });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message.includes('400') || error.message.includes('Invalid')) {
        errorMessage = 'Invalid or expired OTP. Please try again or request a new code.';
      } else if (error.message.includes('Request failed')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
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
        Alert.alert('New OTP Sent', result.message);
        setOtp(''); // Clear the current OTP
      } else {
        setErrors({ otp: result.message });
      }
    } catch (error: any) {
      console.error('Request new OTP error:', error);
      setErrors({ otp: error.message || 'Failed to send new OTP. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      {/* Theme Toggle Button */}
      <TouchableOpacity 
        style={[styles.themeToggle, { backgroundColor: colors.card }]}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        <Text style={[styles.themeToggleText, { color: colors.foreground }]}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </Text>
      </TouchableOpacity>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'android' ? -50 : 0}
      >
        <View style={[styles.content, { paddingHorizontal: width > 600 ? 40 : 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {step === 'email' 
                ? 'Enter your email to receive a login code'
                : 'Enter the 6-digit code sent to your email'
              }
            </Text>
          </View>

          {/* Form Card */}
          <GlassListCard
            title={step === 'email' ? 'Login' : 'Verify Code'}
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
                  title="Send Login Code"
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
                  error={errors.otp}
                />
                
                <View style={styles.buttonContainer}>
                  <PlatformActionButton
                    title="Verify & Login"
                    onPress={handleVerifyOTP}
                    variant="primary"
                    size="large"
                    disabled={isLoading}
                    loading={isLoading}
                  />
                  
                  <PlatformActionButton
                    title="Request New OTP"
                    onPress={handleRequestNewOTP}
                    variant="secondary"
                    size="medium"
                    disabled={isLoading}
                    loading={false}
                  />
                  
                  <PlatformActionButton
                    title="Back to Email"
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
              Don&apos;t have an account?{' '}
              <Text 
                style={[styles.linkText, { color: colors.primary }]}
                onPress={() => router.push('/auth/signup')}
              >
                Sign up
              </Text>
            </Text>
            <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
              Need help? Make sure you&apos;ve verified your email after signing up.
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
  themeToggle: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  themeToggleText: {
    fontSize: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
