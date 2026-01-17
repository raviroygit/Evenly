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
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(user?.name || '');
      setEmail(user?.email || '');
    }
  }, [visible, user?.name, user?.email]);

  const handleSave = async () => {
    // Define payload outside try-catch so it's accessible in both blocks
    let payload: { name?: string; email?: string } = {};

    try {
      setSaving(true);

      // Build payload
      if (name && name !== user?.name) payload.name = name.trim();
      if (email && email !== user?.email) payload.email = email.trim();

      console.log('[PersonalInfoModal] Preparing update:', {
        originalName: user?.name,
        newName: name,
        originalEmail: user?.email,
        newEmail: email,
        payload: payload
      });

      if (Object.keys(payload).length === 0) {
        console.log('[PersonalInfoModal] No changes detected, closing modal');
        onClose();
        return;
      }

      // Test: First verify the session is valid by calling GET /auth/me
      console.log('[PersonalInfoModal] Testing session before update...');
      try {
        const testResponse = await fetch(`${ENV.EVENLY_BACKEND_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Cookie': `sso_token=${(await AuthStorage.getAuthData())?.ssoToken}`,
            'Content-Type': 'application/json',
          },
        });
        const testData = await testResponse.json();
        console.log('[PersonalInfoModal] Session test result:', testData);

        if (!testData.success) {
          console.error('[PersonalInfoModal] ❌ Session is invalid BEFORE update attempt');
          Alert.alert('Session Expired', 'Please log out and log back in.');
          return;
        } else {
          console.log('[PersonalInfoModal] ✅ Session is valid, proceeding with update');
        }
      } catch (testError) {
        console.error('[PersonalInfoModal] Session test failed:', testError);
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
        if (updated) {
          setUser({ id: updated.id, email: updated.email, name: updated.name });
        } else if (user) {
          // Fallback: update with the payload if no user data in response
          setUser({ ...user, ...payload });
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
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
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


