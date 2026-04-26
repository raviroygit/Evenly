import AsyncStorage from '@react-native-async-storage/async-storage';

const CODE_KEY = 'evenly_pending_referral_code';
const PROMPT_KEY = 'evenly_referral_prompt_pending';

/** Tracks whether the user has ever completed an auth on this device. */
export const HAS_LOGGED_IN_BEFORE_KEY = 'evenly_has_logged_in_before';

export interface PendingReferralState {
  /** Pre-fill value (e.g., from a deep link). */
  code: string | null;
  /** Caller asked to surface the prompt even without a pre-filled code. */
  requested: boolean;
}

/**
 * Stash for a referral code (or a "show the prompt anyway" flag) that should
 * be auto-prompted after authentication.
 *
 * Used when a flow can't surface the prompt inline (e.g., Google sign-in
 * navigates straight to /tabs once authenticated). The auth-aware host on
 * the root layout reads this on auth-state transitions and shows the modal
 * pre-filled (or empty), then clears the stash.
 */
export const PendingReferralStorage = {
  async set(code: string): Promise<void> {
    if (!code) return;
    try {
      await AsyncStorage.setItem(CODE_KEY, code);
    } catch {
      // best-effort
    }
  },

  /** Mark "open the modal once after auth, even without a pre-filled code". */
  async requestPrompt(): Promise<void> {
    try {
      await AsyncStorage.setItem(PROMPT_KEY, '1');
    } catch {
      // best-effort
    }
  },

  async get(): Promise<PendingReferralState> {
    try {
      const [code, prompt] = await Promise.all([
        AsyncStorage.getItem(CODE_KEY),
        AsyncStorage.getItem(PROMPT_KEY),
      ]);
      return { code: code || null, requested: prompt === '1' };
    } catch {
      return { code: null, requested: false };
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([CODE_KEY, PROMPT_KEY]);
    } catch {
      // best-effort
    }
  },
};
