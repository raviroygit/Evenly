import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TextInput, Alert } from 'react-native';
import { ReusableModal } from '../ui/ReusableModal';
import { useTheme } from '../../contexts/ThemeContext';
import { PlatformActionButton } from '../ui/PlatformActionButton';
import { useAuth } from '../../contexts/AuthContext';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { ENV } from '../../config/env';
import { AuthStorage } from '../../utils/storage';

interface PersonalInfoModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Optional callback after successful update
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({ visible, onClose, onSuccess }) => {
  const { colors } = useTheme();
  const { user, setUser, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phoneNumber?: string }>({});

  useEffect(() => {
    if (visible) {
      setName(user?.name || '');
      setEmail(user?.email || '');
      setPhoneNumber(user?.phoneNumber || '');
      setErrors({});
    }
  }, [visible, user?.name, user?.email, user?.phoneNumber]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Allow various phone formats: +1234567890, 123-456-7890, (123) 456-7890, etc.
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
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
        newErrors.name = 'Name is required';
      } else if (trimmedName.length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }

      // Validate email
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(trimmedEmail)) {
        newErrors.email = 'Please enter a valid email address';
      }

      // Validate phone number (optional, but if provided must be valid)
      const trimmedPhone = phoneNumber.trim();
      if (trimmedPhone && !validatePhoneNumber(trimmedPhone)) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
      }

      // If there are validation errors, show them and stop
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setSaving(false);
        return;
      }

      // Build payload
      if (trimmedName && trimmedName !== user?.name) payload.name = trimmedName;
      if (trimmedEmail && trimmedEmail !== user?.email) payload.email = trimmedEmail;
      if (trimmedPhone && trimmedPhone !== user?.phoneNumber) payload.phoneNumber = trimmedPhone;

      console.log('[PersonalInfoModal] Preparing update:', {
        originalName: user?.name,
        newName: name,
        originalEmail: user?.email,
        newEmail: email,
        originalPhone: user?.phoneNumber,
        newPhone: phoneNumber,
        payload: payload
      });

      if (Object.keys(payload).length === 0) {
        console.log('[PersonalInfoModal] No changes detected, closing modal');
        onClose();
        return;
      }

      console.log('[PersonalInfoModal] Calling updateCurrentUser with payload:', JSON.stringify(payload));
      const result = await EvenlyBackendService.updateCurrentUser(payload);

      console.log('[PersonalInfoModal] Update result:', {
        success: result.success,
        message: result.message,
        hasUser: !!result.data?.user,
        fullResult: result
      });

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
              console.log('[PersonalInfoModal] ✅ Updated user saved to storage');
            }
          } catch (storageError) {
            console.error('[PersonalInfoModal] ❌ Failed to save to storage:', storageError);
            // Continue anyway - user is updated in memory
          }

          // Force refresh user data from backend to ensure consistency
          try {
            await refreshUser();
            console.log('[PersonalInfoModal] ✅ User data refreshed from backend');
          } catch (refreshError) {
            console.error('[PersonalInfoModal] ⚠️ Failed to refresh user from backend:', refreshError);
            // Continue anyway - local data is already updated
          }
        }

        // Call success callback to refresh parent component
        if (onSuccess) {
          onSuccess();
        }

        // Show success alert with callback to close modal
        Alert.alert(
          'Success',
          result.message || 'Profile updated successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('[PersonalInfoModal] ❌ Profile update failed:', {
        message: error.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
        requestData: payload,
        fullError: error
      });

      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update profile';
      Alert.alert('Error', `${errorMessage}\n\nStatus: ${error?.response?.status || 'Network Error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ReusableModal visible={visible} onClose={onClose} title="Edit Personal Info">
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
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
              placeholder="Enter your name"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
            />
          </View>
          {errors.name && (
            <Text style={styles.errorText}>{errors.name}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
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
              placeholder="Enter your email"
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
          <Text style={[styles.label, { color: colors.foreground }]}>Phone Number (Optional)</Text>
          <View style={[styles.inputContainer, {
            backgroundColor: colors.background,
            borderColor: errors.phoneNumber ? '#FF3B30' : colors.border
          }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: undefined });
              }}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>
          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          )}
        </View>

        <View style={styles.actions}>
          <PlatformActionButton title="Cancel" onPress={onClose} variant="secondary" />
          <PlatformActionButton title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} variant="primary" disabled={saving} />
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


