import AsyncStorage from '@react-native-async-storage/async-storage';

type CachedEntry<T> = {
  value: T;
  expiresAt: number; // epoch ms
};

const CACHE_PREFIX = 'EB_CACHE:';

function buildKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

export const AppCache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(buildKey(key));
      if (!raw) return null;
      const parsed: CachedEntry<T> = JSON.parse(raw);
      if (typeof parsed?.expiresAt !== 'number') {
        await AsyncStorage.removeItem(buildKey(key));
        return null;
      }
      if (Date.now() > parsed.expiresAt) {
        await AsyncStorage.removeItem(buildKey(key));
        return null;
      }
      return parsed.value;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    try {
      const entry: CachedEntry<T> = {
        value,
        expiresAt: Date.now() + Math.max(0, ttlMs || 0),
      };
      await AsyncStorage.setItem(buildKey(key), JSON.stringify(entry));
    } catch {
      // ignore cache write errors
    }
  },

  async invalidate(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(buildKey(key));
    } catch {
      // ignore
    }
  },

  async invalidateByPrefixes(prefixes: string[]): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const toDelete = keys.filter(k => {
        if (!k.startsWith(CACHE_PREFIX)) return false;
        const logical = k.substring(CACHE_PREFIX.length);
        return prefixes.some(p => logical.startsWith(p));
      });
      if (toDelete.length) {
        await AsyncStorage.multiRemove(toDelete);
      }
    } catch {
      // ignore
    }
  },

  /**
   * Clear ALL cache entries
   * Used on logout to ensure no data leaks between users
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      if (cacheKeys.length > 0) {
        console.log(`[AppCache] Clearing ${cacheKeys.length} cache entries`);
        await AsyncStorage.multiRemove(cacheKeys);
        console.log('[AppCache] ✅ All cache cleared');
      }
    } catch (error) {
      console.error('[AppCache] ❌ Failed to clear cache:', error);
    }
  },
};

export function defaultCacheKeyFromRequest(method: string, endpoint: string, body?: any): string {
  const normalizedMethod = (method || 'GET').toUpperCase();
  const bodyHash = body ? stableHash(body) : '';
  return `${normalizedMethod}:${endpoint}:${bodyHash}`;
}

function stableHash(obj: any): string {
  try {
    const json = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      hash = (hash * 31 + json.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16);
  } catch {
    return 'x';
  }
}


