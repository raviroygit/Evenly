import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassButton } from '../../src/components/ui/GlassButton';
import { GlassInput } from '../../src/components/ui/GlassInput';
import { AuthService } from '../../src/services/AuthService';

export default function CreateOrganization() {
  const { refreshOrganizations } = useAuth();
  const { colors } = useTheme();
  const authService = new AuthService();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [creating, setCreating] = useState(false);
  const [slugError, setSlugError] = useState('');

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (text: string) => {
    setName(text);
    // Auto-generate slug from name if slug is empty or was auto-generated
    if (!slug || slug === generateSlug(name)) {
      const newSlug = generateSlug(text);
      setSlug(newSlug);
      validateSlug(newSlug);
    }
  };

  const handleSlugChange = (text: string) => {
    const cleanedSlug = generateSlug(text);
    setSlug(cleanedSlug);
    validateSlug(cleanedSlug);
  };

  const validateSlug = (slugText: string) => {
    if (!slugText) {
      setSlugError('Slug is required');
      return false;
    }
    if (slugText.length < 3) {
      setSlugError('Slug must be at least 3 characters');
      return false;
    }
    if (slugText.length > 50) {
      setSlugError('Slug must be less than 50 characters');
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(slugText)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and hyphens');
      return false;
    }
    setSlugError('');
    return true;
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Organization name is required');
      return;
    }

    if (!validateSlug(slug)) {
      Alert.alert('Error', slugError || 'Invalid slug');
      return;
    }

    try {
      setCreating(true);
      const result = await authService.createOrganization({
        name: name.trim(),
        slug: slug.trim(),
        displayName: displayName.trim() || undefined,
      });

      if (result.success) {
        Alert.alert('Success', 'Organization created successfully');
        await refreshOrganizations();
        router.back();
      } else {
        Alert.alert('Error', result.message || 'Failed to create organization');
      }
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      Alert.alert('Error', error.message || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{
          title: 'Create Organization',
          headerShown: true,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Ionicons name="business" size={64} color="white" />
          <Text style={styles.headerTitle}>Create New Organization</Text>
          <Text style={styles.headerSubtitle}>
            Set up a new workspace for your team
          </Text>
        </LinearGradient>

        {/* Form */}
        <GlassCard style={styles.formCard}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Organization Name <Text style={styles.required}>*</Text>
            </Text>
            <Text style={[styles.hint, { color: colors.subtext }]}>
              The full name of your organization
            </Text>
            <GlassInput
              placeholder="e.g., My Company"
              value={name}
              onChangeText={handleNameChange}
              autoCapitalize="words"
              editable={!creating}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              URL Slug <Text style={styles.required}>*</Text>
            </Text>
            <Text style={[styles.hint, { color: colors.subtext }]}>
              A unique identifier for your organization (lowercase, no spaces)
            </Text>
            <View style={styles.slugInputContainer}>
              <Text style={[styles.slugPrefix, { color: colors.subtext }]}>
                evenly.com/
              </Text>
              <GlassInput
                placeholder="my-company"
                value={slug}
                onChangeText={handleSlugChange}
                autoCapitalize="none"
                editable={!creating}
                style={styles.slugInput}
              />
            </View>
            {slugError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{slugError}</Text>
              </View>
            ) : slug ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.successText}>Slug is valid</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Display Name <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <Text style={[styles.hint, { color: colors.subtext }]}>
              A friendly name to show in the UI (if different from organization name)
            </Text>
            <GlassInput
              placeholder="e.g., My Company Inc."
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              editable={!creating}
            />
          </View>
        </GlassCard>

        {/* Info Card */}
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#6366f1" />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              What happens next?
            </Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={[styles.infoItemText, { color: colors.subtext }]}>
                You'll be the owner of this organization
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={[styles.infoItemText, { color: colors.subtext }]}>
                You can invite members via email
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={[styles.infoItemText, { color: colors.subtext }]}>
                All your data will be isolated to this organization
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={[styles.infoItemText, { color: colors.subtext }]}>
                You can switch between organizations anytime
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Actions */}
        <View style={styles.actions}>
          <GlassButton
            onPress={() => router.back()}
            disabled={creating}
            style={styles.cancelButton}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
          </GlassButton>
          <GlassButton
            onPress={handleCreate}
            disabled={creating || !name.trim() || !slug.trim() || !!slugError}
            style={[
              styles.createButton,
              (creating || !name.trim() || !slug.trim() || !!slugError) && styles.disabledButton,
            ]}
          >
            {creating ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.createButtonText}>Creating...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.createButtonText}>Create Organization</Text>
              </>
            )}
          </GlassButton>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formCard: {
    margin: 16,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  optional: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '400',
  },
  hint: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  slugInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slugPrefix: {
    fontSize: 14,
    fontWeight: '500',
  },
  slugInput: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  successText: {
    fontSize: 12,
    color: '#10b981',
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoItemText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  createButton: {
    flex: 2,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomSpacer: {
    height: 32,
  },
});
