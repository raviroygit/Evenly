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
  activities?: any[];
  activitiesCount?: number;
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
    activities?: any[];
    activitiesCount?: number;
  }): Promise<void> {
    try {
      // Preserve optional fields not provided in this call
      const existing = data.activities === undefined ? await this.get() : null;
      const merged = {
        ...data,
        activities: data.activities ?? existing?.activities,
        activitiesCount: data.activitiesCount ?? existing?.activitiesCount,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        HOME_CACHE_KEY,
        JSON.stringify(merged as HomeCacheData)
      );
    } catch {
      // ignore
    }
  },

  async getActivities(): Promise<{ activities: any[]; count: number } | null> {
    try {
      const data = await this.get();
      if (!data?.activities || data.activities.length === 0) return null;
      return { activities: data.activities, count: data.activitiesCount || data.activities.length };
    } catch {
      return null;
    }
  },

  async setActivities(activities: any[], count: number): Promise<void> {
    try {
      const existing = await this.get();
      await this.set({
        khataSummary: existing?.khataSummary || null,
        customerCount: existing?.customerCount || 0,
        customers: existing?.customers || [],
        activities,
        activitiesCount: count,
      });
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
