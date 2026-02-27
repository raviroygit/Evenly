import { useState, useCallback } from 'react';
import { Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ReferralService } from '../services/ReferralService';
import { openWhatsApp } from '../utils/shareHelper';

// Single smart download link with OG metadata for rich WhatsApp preview
const DOWNLOAD_LINK = 'https://evenlysplit.nxtgenaidev.com/download';

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  referredUsers: { id: string; name: string; email: string; joinedAt: string }[];
}

export function useReferral() {
  const { t } = useTranslation();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReferralCode = useCallback(async (): Promise<string | null> => {
    setLoading(true);
    try {
      const response = await ReferralService.getMyReferralCode();
      if (response.success) {
        setReferralCode(response.data.referralCode);
        return response.data.referralCode;
      }
    } catch {
      // Silently fail — code will be retried on next load
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  const loadReferralStats = useCallback(async () => {
    try {
      const response = await ReferralService.getReferralStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const copyReferralCode = useCallback(async () => {
    if (!referralCode) return;
    try {
      await Share.share({ message: referralCode });
    } catch {
      // User cancelled
    }
  }, [referralCode]);

  const shareReferral = useCallback(async () => {
    const code = referralCode ?? await loadReferralCode();
    if (!code) return;

    const message = t('referral.shareMessage', {
      downloadLink: DOWNLOAD_LINK,
      code,
    });

    await openWhatsApp(message);
  }, [referralCode, loadReferralCode, t]);

  const applyReferralCode = useCallback(async (code: string) => {
    try {
      const response = await ReferralService.applyReferralCode(code);
      return response;
    } catch {
      return { success: false, message: t('errors.tryAgain') };
    }
  }, [t]);

  return {
    referralCode,
    stats,
    loading,
    loadReferralCode,
    loadReferralStats,
    copyReferralCode,
    shareReferral,
    applyReferralCode,
  };
}
