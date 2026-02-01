// Storage utility for persistent login using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Organization } from '../types';

interface StorageData {
  user: any;
  accessToken?: string;
  // No refreshToken - mobile tokens never expire
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
      console.error('Storage setItem error:', error);
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
      console.error('Storage getItem error:', error);
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
      console.error('Storage removeItem error:', error);
    }
  }
}

const storage = new StorageManager();

export const AuthStorage = {
  async saveAuthData(user: any, accessToken?: string, organizations?: Organization[]): Promise<void> {
    const data: StorageData = {
      user,
      accessToken,
      // No refreshToken - mobile tokens never expire
      organizations,
      timestamp: Date.now(),
    };

    await storage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('[AuthStorage] ✅ Auth data saved (token never expires)');
  },

  async getAuthData(): Promise<{ user: any; accessToken?: string; organizations?: Organization[]; timestamp?: number } | null> {
    try {
      const dataString = await storage.getItem(STORAGE_KEY);

      if (!dataString) {
        return null;
      }

      const data: StorageData = JSON.parse(dataString);

      // Handle backward compatibility - if no timestamp, use current time
      const timestamp = data.timestamp || Date.now();

      // NO LOCAL EXPIRY CHECK - Mobile tokens never expire (10 years)
      // Users stay logged in forever until manual logout

      // Check if accessToken is present (required for backend authentication)
      if (!data.accessToken) {
        console.warn('[AuthStorage] No accessToken found in stored data');
        return null;
      }

      return {
        user: data.user,
        accessToken: data.accessToken,
        // No refreshToken - mobile tokens never expire
        organizations: data.organizations,
        timestamp: timestamp,
      };
    } catch (error) {
      console.error('[AuthStorage] Error getting auth data:', error);
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
        console.log('[AuthStorage] DEBUG - Parsed data:', {
          hasUser: !!data.user,
          hasAccessToken: !!data.accessToken,
          hasOrganizations: !!data.organizations,
          organizationsCount: data.organizations?.length || 0,
          timestamp: data.timestamp,
          user: data.user
        });
      }
    } catch (error) {
      console.error('[AuthStorage] DEBUG - Error:', error);
    }
  },

  // Organization storage methods
  async getCurrentOrganizationId(): Promise<string | null> {
    try {
      return await storage.getItem(ORGANIZATION_KEY);
    } catch (error) {
      console.error('[AuthStorage] Error getting current organization:', error);
      return null;
    }
  },

  async setCurrentOrganizationId(organizationId: string): Promise<void> {
    try {
      await storage.setItem(ORGANIZATION_KEY, organizationId);
      console.log('[AuthStorage] Current organization set:', organizationId);
    } catch (error) {
      console.error('[AuthStorage] Error setting current organization:', error);
    }
  },

  async clearCurrentOrganization(): Promise<void> {
    try {
      await storage.removeItem(ORGANIZATION_KEY);
      console.log('[AuthStorage] Current organization cleared');
    } catch (error) {
      console.error('[AuthStorage] Error clearing current organization:', error);
    }
  },
};
