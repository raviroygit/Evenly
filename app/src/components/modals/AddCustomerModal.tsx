import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';

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
  const { colors, theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  // Pre-fill form when editing
  React.useEffect(() => {
    if (editCustomer) {
      setName(editCustomer.name || '');
      setEmail(editCustomer.email || '');
      setPhone(editCustomer.phone || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
    }
    setErrors({});
  }, [editCustomer, visible]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
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
        // Update existing customer
        await onUpdateCustomer(editCustomer.id, {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        });
      } else {
        // Create new customer
        await EvenlyBackendService.createKhataCustomer({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
        });
      }

      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setErrors({});

      // Close modal immediately for better UX
      onClose();

      // Then refresh list in background
      await onSuccess();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (error instanceof Error ? error.message : null);
      Alert.alert(
        'Error',
        msg || `Failed to ${editCustomer ? 'update' : 'create'} customer. Please try again.`,
        [{ text: 'OK' }]
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
                    {editCustomer ? 'Edit Customer' : 'Add Customer'}
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
                        Name <Text style={styles.required}>*</Text>
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
                        placeholder="Enter customer name"
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
                        Email <Text style={styles.required}>*</Text>
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
                        placeholder="Enter email address"
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

                    {/* Phone Field */}
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { color: colors.foreground }]}>
                        Phone
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                            color: colors.foreground,
                          },
                        ]}
                        placeholder="Enter phone number (optional)"
                        placeholderTextColor={colors.mutedForeground}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        editable={!loading}
                      />
                    </View>
                  </View>

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
                        {editCustomer ? 'Update Customer' : 'Add Customer'}
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
});

