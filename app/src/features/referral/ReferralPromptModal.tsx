import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { PlatformActionButton } from '../../components/ui/PlatformActionButton';

export interface ReferralPromptModalProps {
  visible: boolean;
  /** Pre-filled code (e.g., from a deep link). User can still edit. */
  initialCode?: string;
  /** Optional override for the title text. */
  title?: string;
  /** Optional override for the body text. */
  body?: string;
  /** Disables the buttons + input while a network call is in flight. */
  loading?: boolean;
  /** Called with the trimmed code when the user taps Apply. Empty string allowed. */
  onApply: (code: string) => void;
  /** Called when the user dismisses without applying. */
  onSkip: () => void;
}

/**
 * Reusable referral-code prompt. Used both inline by the unified auth screen
 * (post-verify safety net) and by the profile screen (manual entry button).
 */
export const ReferralPromptModal: React.FC<ReferralPromptModalProps> = ({
  visible,
  initialCode,
  title,
  body,
  loading,
  onApply,
  onSkip,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [value, setValue] = useState(initialCode || '');

  // Re-sync when the modal is reopened with a different prefill.
  useEffect(() => {
    if (visible) {
      setValue(initialCode || '');
    }
  }, [visible, initialCode]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onSkip}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {/* Outer tap layer: tapping the dimmed area outside the sheet
            dismisses the keyboard but never the modal. */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.overlay}>
            {/* Inner tap layer: tapping the sheet's empty body (between the
                input and buttons) also dismisses the keyboard. The TextInput
                and PlatformActionButton children take their own taps. */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={[styles.sheet, { backgroundColor: colors.card }]}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  {title ?? t('referral.havePromptTitle')}
                </Text>
                <Text style={[styles.body, { color: colors.mutedForeground }]}>
                  {body ?? t('referral.havePromptBody')}
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder={t('referral.enterCodePlaceholder')}
                    placeholderTextColor={colors.mutedForeground}
                    value={value}
                    onChangeText={setValue}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={() => onApply(value.trim())}
                  />
                </View>
                <View style={styles.buttons}>
                  <PlatformActionButton
                    title={t('referral.applyAndContinue')}
                    onPress={() => onApply(value.trim())}
                    variant="primary"
                    size="large"
                    disabled={loading}
                    loading={loading}
                  />
                  <PlatformActionButton
                    title={t('referral.skipForNow')}
                    onPress={onSkip}
                    variant="secondary"
                    size="medium"
                    disabled={loading}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputWrapper: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 16,
    paddingVertical: 4,
  },
  buttons: {
    marginTop: 16,
    gap: 12,
  },
});
