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
      Alert.alert('Validation Error', 'Please enter your name');
      return false;
    }
    if (!formData.userEmail.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return false;
    }
    if (!formData.userEmail.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (!formData.subject.trim()) {
      Alert.alert('Validation Error', 'Please enter a subject');
      return false;
    }
    if (!formData.message.trim()) {
      Alert.alert('Validation Error', 'Please enter your message');
      return false;
    }
    if (formData.message.trim().length < 10) {
      Alert.alert('Validation Error', 'Message must be at least 10 characters long');
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
          'Success!',
          'Your support request has been sent successfully. We\'ll get back to you soon!',
          [
            {
              text: 'OK',
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
        'Error',
        'Failed to send your support request. Please try again or contact us directly.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#27ae60' },
    { value: 'medium', label: 'Medium', color: '#f39c12' },
    { value: 'high', label: 'High', color: '#e74c3c' },
  ];

  const categoryOptions = [
    { value: 'technical', label: 'Technical Issue', icon: 'bug' },
    { value: 'billing', label: 'Billing', icon: 'card' },
    { value: 'feature', label: 'Feature Request', icon: 'bulb' },
    { value: 'other', label: 'Other', icon: 'help-circle' },
  ];

  return (
    <ReusableModal visible={visible} onClose={onClose} title="Contact Support">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              Fill out the form below and we'll get back to you as soon as possible.
            </Text>

            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Name *</Text>
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
                placeholder="Enter your full name"
                placeholderTextColor={colors.mutedForeground}
                editable={!isLoading}
              />
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Email *</Text>
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
                placeholder="Enter your email address"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* Subject Field */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Subject *</Text>
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
                placeholder="Brief description of your issue"
                placeholderTextColor={colors.mutedForeground}
                editable={!isLoading}
              />
            </View>

            {/* Category Selection */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Category</Text>
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
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Priority</Text>
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
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Message *</Text>
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
                placeholder="Please describe your issue or question in detail..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!isLoading}
              />
              <Text style={[styles.characterCount, { color: colors.mutedForeground }]}>
                {formData.message.length}/2000 characters
              </Text>
            </View>

            {/* Submit Button */}
            <PlatformActionButton
              title={isLoading ? 'Sending...' : 'Send Support Request'}
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
                What happens next?
              </Text>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                • We'll review your request within 24 hours{'\n'}
                • You'll receive a response at the email address you provided{'\n'}
                • For urgent issues, please mark priority as "High"
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
