import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import evenlyApiClient from '../../services/EvenlyApiClient';

export const AppVersionScreen: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();

  const [latestVersion, setLatestVersion] = useState('');
  const [minVersion, setMinVersion] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await evenlyApiClient.get('/admin/app-version');
      const cfg = res.data?.data;
      if (cfg) {
        setLatestVersion(cfg.latestVersion || '');
        setMinVersion(cfg.minVersion || '');
        setForceUpdate(cfg.forceUpdate || false);
        setReleaseNotes(cfg.releaseNotes || '');
      }
    } catch {
      Alert.alert('Error', 'Failed to load version config');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!latestVersion.trim()) {
      Alert.alert('Validation', 'Latest version is required');
      return;
    }

    // Simple semver validation
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(latestVersion.trim())) {
      Alert.alert('Validation', 'Latest version must be in format X.Y.Z (e.g. 2.0.1)');
      return;
    }
    if (minVersion.trim() && !semverRegex.test(minVersion.trim())) {
      Alert.alert('Validation', 'Min version must be in format X.Y.Z (e.g. 2.0.0)');
      return;
    }

    Alert.alert(
      'Update App Version',
      `Set latest version to ${latestVersion.trim()}?\n\nAll users with an older version will see an update prompt.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              setSaving(true);
              await evenlyApiClient.put('/admin/app-version', {
                latestVersion: latestVersion.trim(),
                minVersion: minVersion.trim() || latestVersion.trim(),
                forceUpdate,
                releaseNotes: releaseNotes.trim(),
              });
              Alert.alert('Success', 'App version config updated. Users will see the update prompt on next app open.');
            } catch {
              Alert.alert('Error', 'Failed to update version config');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading config...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTextGroup}>
            <Ionicons name="cloud-upload" size={24} color="#10B981" />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              App Version
            </Text>
          </View>
        </View>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          Control in-app update prompts for all users
        </Text>

        {/* Latest Version */}
        <Text style={[styles.label, { color: colors.foreground }]}>Latest Version *</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          placeholder="e.g. 2.0.2"
          placeholderTextColor={colors.mutedForeground}
          value={latestVersion}
          onChangeText={setLatestVersion}
          keyboardType="numeric"
          maxLength={20}
          returnKeyType="next"
        />

        {/* Min Version */}
        <Text style={[styles.label, { color: colors.foreground }]}>Minimum Version</Text>
        <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
          Users below this version will be forced to update
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          placeholder="e.g. 2.0.0"
          placeholderTextColor={colors.mutedForeground}
          value={minVersion}
          onChangeText={setMinVersion}
          keyboardType="numeric"
          maxLength={20}
          returnKeyType="next"
        />

        {/* Force Update Toggle */}
        <View style={[styles.toggleRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.toggleLeft}>
            <Text style={[styles.label, { color: colors.foreground, marginBottom: 0 }]}>Force Update</Text>
            <Text style={[styles.fieldHint, { color: colors.mutedForeground, marginBottom: 0 }]}>
              Users cannot dismiss the update dialog
            </Text>
          </View>
          <Switch
            value={forceUpdate}
            onValueChange={setForceUpdate}
            trackColor={{ false: colors.border, true: '#10B981' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Release Notes */}
        <Text style={[styles.label, { color: colors.foreground }]}>Release Notes (optional)</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: colors.card,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          placeholder="What's new in this version..."
          placeholderTextColor={colors.mutedForeground}
          value={releaseNotes}
          onChangeText={setReleaseNotes}
          maxLength={500}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
          {releaseNotes.length}/500
        </Text>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: '#10B981' },
            saving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving || !latestVersion.trim()}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          )}
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Version Config'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
    marginTop: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    marginLeft: 40,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  fieldHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  toggleLeft: {
    flex: 1,
    marginRight: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
