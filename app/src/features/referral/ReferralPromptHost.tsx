import React, { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { ReferralService } from '../../services/ReferralService';
import { PendingReferralStorage } from './pendingReferralStorage';
import { ReferralPromptModal } from './ReferralPromptModal';

/**
 * Global referral-prompt listener. Mounted once at the root.
 *
 * When a flow stashes a pending referral code (e.g., the user came in via a
 * deep link and then signed in with Google), this component pops the prompt
 * modal once they're authenticated, pre-filled with the stashed code. The
 * stash is cleared as soon as we read it so the modal never reappears.
 */
export const ReferralPromptHost: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [initialCode, setInitialCode] = useState('');
  const [loading, setLoading] = useState(false);
  const handledForThisSession = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // On logout, allow the modal to fire again next time.
      handledForThisSession.current = false;
      return;
    }
    if (handledForThisSession.current) return;

    let cancelled = false;
    (async () => {
      const { code, requested } = await PendingReferralStorage.get();
      if (cancelled) return;
      if (code || requested) {
        handledForThisSession.current = true;
        // Clear immediately so a second mount can't re-trigger the prompt.
        await PendingReferralStorage.clear();
        setInitialCode(code || '');
        setVisible(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleApply = async (code: string) => {
    if (!code) {
      setVisible(false);
      return;
    }
    setLoading(true);
    try {
      const result = await ReferralService.applyReferralCode(code);
      setVisible(false);
      if (result.success) {
        Alert.alert(t('common.success'), t('referral.codeApplied'));
      } else {
        Alert.alert(t('common.error'), result.message || t('referral.invalidCode'));
      }
    } catch (error: any) {
      setVisible(false);
      Alert.alert(t('common.error'), error?.message || t('referral.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setVisible(false);
  };

  return (
    <ReferralPromptModal
      visible={visible}
      initialCode={initialCode}
      loading={loading}
      onApply={handleApply}
      onSkip={handleSkip}
    />
  );
};
