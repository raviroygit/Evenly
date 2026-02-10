import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ReusableModal } from '../ui/ReusableModal';
import { useTheme } from '../../contexts/ThemeContext';
import { PlatformActionButton } from '../ui/PlatformActionButton';
import { Ionicons } from '@expo/vector-icons';
import { ENV } from '../../config/env';

interface EmailSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

interface SupportFormData {
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  category: 'technical' | 'billing' | 'feature' | 'other';
}

export const EmailSupportModal: React.FC<EmailSupportModalProps> = ({ visible, onClose }) => {
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SupportFormData>({
    userName: '',
    userEmail: '',
    subject: '',
    message: '',
    priority: 'medium',
    category: 'other',
  });

  const handleInputChange = (field: keyof SupportFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.userName.trim()) {
      Alert.alert(t('modals.validationError'), t('modals.pleaseEnterName'));
      return false;
    }
    if (!formData.userEmail.trim()) {
      Alert.alert(t('modals.validationError'), t('modals.pleaseEnterEmail'));
      return false;
    }
    if (!formData.userEmail.includes('@')) {
      Alert.alert(t('modals.validationError'), t('modals.pleaseEnterValidEmail'));
      return false;
    }
    if (!formData.subject.trim()) {
      Alert.alert(t('modals.validationError'), t('modals.pleaseEnterSubject'));
      return false;
    }
    if (!formData.message.trim()) {
      Alert.alert(t('modals.validationError'), t('modals.pleaseEnterMessage'));
      return false;
    }
    if (formData.message.trim().length < 10) {
      Alert.alert(t('modals.validationError'), t('modals.messageTooShort'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${ENV.EVENLY_BACKEND_URL}/support/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert(
          t('modals.successExclamation'),
          t('modals.supportRequestSent'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                // Reset form
                setFormData({
                  userName: '',
                  userEmail: '',
                  subject: '',
                  message: '',
                  priority: 'medium',
                  category: 'other',
                });
                onClose();
              },
            },
          ]
        );
      } else {
        throw new Error(result.message || 'Failed to send support request');
      }
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        t('modals.failedToSend'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: t('modals.low'), color: '#27ae60' },
    { value: 'medium', label: t('modals.medium'), color: '#f39c12' },
    { value: 'high', label: t('modals.high'), color: '#e74c3c' },
  ];

  const categoryOptions = [
    { value: 'technical', label: t('modals.technicalIssue'), icon: 'bug' },
    { value: 'billing', label: t('modals.billing'), icon: 'card' },
    { value: 'feature', label: t('modals.featureRequest'), icon: 'bulb' },
    { value: 'other', label: t('modals.other'), icon: 'help-circle' },
  ];

  return (
    <ReusableModal visible={visible} onClose={onClose} title={t('modals.contactSupport')}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {t('modals.fillOutForm')}
            </Text>

            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{t('modals.name')} *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                value={formData.userName}
                onChangeText={(value) => handleInputChange('userName', value)}
                placeholder={t('modals.enterFullName')}
                placeholderTextColor={colors.mutedForeground}
                editable={!isLoading}
              />
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{t('modals.email')} *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                value={formData.userEmail}
                onChangeText={(value) => handleInputChange('userEmail', value)}
                placeholder={t('modals.enterEmailAddress')}
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* Subject Field */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{t('modals.subject')} *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                value={formData.subject}
                onChangeText={(value) => handleInputChange('subject', value)}
                placeholder={t('modals.briefDescription')}
                placeholderTextColor={colors.mutedForeground}
                editable={!isLoading}
              />
            </View>

            {/* Category Selection */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{t('modals.category')}</Text>
              <View style={styles.categoryContainer}>
                {categoryOptions.map((option) => (
                  <PlatformActionButton
                    key={option.value}
                    title={option.label}
                    onPress={() => handleInputChange('category', option.value)}
                    variant={formData.category === option.value ? 'primary' : 'secondary'}
                    size="small"
                    icon={<Ionicons name={option.icon as any} size={16} color={formData.category === option.value ? colors.primaryForeground : colors.foreground} />}
                    style={styles.categoryButton}
                    disabled={isLoading}
                  />
                ))}
              </View>
            </View>

            {/* Priority Selection */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{t('modals.priority')}</Text>
              <View style={styles.priorityContainer}>
                {priorityOptions.map((option) => (
                  <PlatformActionButton
                    key={option.value}
                    title={option.label}
                    onPress={() => handleInputChange('priority', option.value)}
                    variant={formData.priority === option.value ? 'primary' : 'secondary'}
                    size="small"
                    style={[
                      styles.priorityButton,
                      formData.priority === option.value && { backgroundColor: option.color },
                    ]}
                    disabled={isLoading}
                  />
                ))}
              </View>
            </View>

            {/* Message Field */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{t('modals.message')} *</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                value={formData.message}
                onChangeText={(value) => handleInputChange('message', value)}
                placeholder={t('modals.describeIssue')}
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!isLoading}
              />
              <Text style={[styles.characterCount, { color: colors.mutedForeground }]}>
                {t('modals.charactersCount', { count: formData.message.length })}
              </Text>
            </View>

            {/* Submit Button */}
            <PlatformActionButton
              title={isLoading ? t('modals.sending') : t('modals.sendSupportRequest')}
              onPress={handleSubmit}
              variant="primary"
              size="large"
              icon={isLoading ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : <Ionicons name="send" size={20} color={colors.primaryForeground} />}
              style={styles.submitButton}
              disabled={isLoading}
            />

            {/* Additional Info */}
            <View style={styles.infoSection}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>
                {t('modals.whatHappensNext')}
              </Text>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {t('modals.supportNextSteps')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ReusableModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  infoSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
