/**
 * Persist last successfully loaded home/dashboard data.
 * When API fails (e.g. network), we show this instead of zeros.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOME_CACHE_KEY = 'evenly_home_cache';

export interface HomeCacheData {
  khataSummary: { totalGive: string; totalGet: string } | null;
  customerCount: number;
  customers: any[];
  timestamp: number;
}

export const HomeCache = {
  async get(): Promise<HomeCacheData | null> {
    try {
      const raw = await AsyncStorage.getItem(HOME_CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as HomeCacheData;
      if (!data || typeof data.timestamp !== 'number') return null;
      return data;
    } catch {
      return null;
    }
  },

  async set(data: {
    khataSummary: { totalGive: string; totalGet: string } | null;
    customerCount: number;
    customers: any[];
  }): Promise<void> {
    try {
      await AsyncStorage.setItem(
        HOME_CACHE_KEY,
        JSON.stringify({
          ...data,
          timestamp: Date.now(),
        } as HomeCacheData)
      );
    } catch {
      // ignore
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HOME_CACHE_KEY);
    } catch {
      // ignore
    }
  },
};
