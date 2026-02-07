/**
 * Persist last successfully loaded data for offline / network-failure fallback.
 * When API fails on app reopen, we show this instead of empty/zero.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const GROUPS_CACHE_KEY = 'evenly_groups_cache';
const USER_BALANCES_CACHE_KEY = 'evenly_user_balances_cache';

export const OfflineDataCache = {
  async getGroups(): Promise<any[] | null> {
    try {
      const raw = await AsyncStorage.getItem(GROUPS_CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  },

  async setGroups(groups: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(GROUPS_CACHE_KEY, JSON.stringify(groups));
    } catch {
      // ignore
    }
  },

  async getUserBalances(): Promise<{ balances: any[]; netBalance: { totalOwed: number; totalOwing: number; netBalance: number } | null } | null> {
    try {
      const raw = await AsyncStorage.getItem(USER_BALANCES_CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.balances)) return null;
      return data;
    } catch {
      return null;
    }
  },

  async setUserBalances(payload: { balances: any[]; netBalance: { totalOwed: number; totalOwing: number; netBalance: number } | null }): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_BALANCES_CACHE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([GROUPS_CACHE_KEY, USER_BALANCES_CACHE_KEY]);
    } catch {
      // ignore
    }
  },
};
