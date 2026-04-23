// Storage utility for persistent login using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Organization } from '../types';

interface StorageData {
  user: any;
  accessToken?: string;
  refreshToken?: string;
  // Long-lived server-minted bearer credential. When present, it is the
  // preferred auth token — it bypasses the external auth service entirely.
  apiKey?: string;
  organizations?: Organization[];
  timestamp: number;
}

const STORAGE_KEY = 'evenly_auth_data';
const ORGANIZATION_KEY = 'evenly_current_organization';
// No local expiry - mobile tokens never expire (10 years)

class StorageManager {
  private isWeb = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isWeb) {
        localStorage.setItem(key, value);
      } else {
        // Use AsyncStorage for React Native
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isWeb) {
        return localStorage.getItem(key);
      } else {
        // Use AsyncStorage for React Native
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isWeb) {
        localStorage.removeItem(key);
      } else {
        // Use AsyncStorage for React Native
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
    }
  }
}

const storage = new StorageManager();

export const AuthStorage = {
  async saveAuthData(
    user: any,
    accessToken?: string,
    organizations?: Organization[],
    refreshToken?: string,
    apiKey?: string
  ): Promise<void> {
    // Preserve any existing refreshToken / apiKey on disk when the caller
    // doesn't supply one (e.g. profile edits re-save auth data with only
    // user + accessToken — they shouldn't clobber long-lived credentials).
    let preservedRefresh = refreshToken;
    let preservedApiKey = apiKey;
    if (preservedRefresh === undefined || preservedApiKey === undefined) {
      try {
        const existing = await storage.getItem(STORAGE_KEY);
        if (existing) {
          const parsed = JSON.parse(existing) as StorageData;
          if (preservedRefresh === undefined) preservedRefresh = parsed.refreshToken;
          if (preservedApiKey === undefined) preservedApiKey = parsed.apiKey;
        }
      } catch {
        // ignore — treat as no existing values
      }
    }

    const data: StorageData = {
      user,
      accessToken,
      refreshToken: preservedRefresh,
      apiKey: preservedApiKey,
      organizations,
      timestamp: Date.now(),
    };

    await storage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  async getAuthData(): Promise<{ user: any; accessToken?: string; refreshToken?: string; apiKey?: string; organizations?: Organization[]; timestamp?: number } | null> {
    try {
      const dataString = await storage.getItem(STORAGE_KEY);

      if (!dataString) {
        return null;
      }

      const data: StorageData = JSON.parse(dataString);

      // Handle backward compatibility - if no timestamp, use current time
      const timestamp = data.timestamp || Date.now();

      // Session is considered valid if *either* the long-lived apiKey or an
      // accessToken is present. This lets clients that have upgraded to
      // key-auth drop the JWT without appearing logged out.
      if (!data.accessToken && !data.apiKey) {
        return null;
      }

      return {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        apiKey: data.apiKey,
        organizations: data.organizations,
        timestamp: timestamp,
      };
    } catch (error) {
      return null;
    }
  },

  async clearAuthData(): Promise<void> {
    await storage.removeItem(STORAGE_KEY);
  },

  async hasValidAuth(): Promise<boolean> {
    const authData = await this.getAuthData();
    return authData !== null && !!authData.accessToken;
  },

  async debugAuthData(): Promise<void> {
    try {
      const dataString = await storage.getItem(STORAGE_KEY);

      if (dataString) {
        const data = JSON.parse(dataString);
      }
    } catch (error) {
    }
  },

  // Organization storage methods
  async getCurrentOrganizationId(): Promise<string | null> {
    try {
      return await storage.getItem(ORGANIZATION_KEY);
    } catch (error) {
      return null;
    }
  },

  async setCurrentOrganizationId(organizationId: string): Promise<void> {
    try {
      await storage.setItem(ORGANIZATION_KEY, organizationId);
    } catch (error) {
    }
  },

  async clearCurrentOrganization(): Promise<void> {
    try {
      await storage.removeItem(ORGANIZATION_KEY);
    } catch (error) {
    }
  },
};
