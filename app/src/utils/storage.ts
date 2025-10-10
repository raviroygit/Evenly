// Storage utility for persistent login using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StorageData {
  user: any;
  accessToken?: string;
  refreshToken?: string;
  ssoToken?: string;
  timestamp: number;
}

const STORAGE_KEY = 'evenly_auth_data';
const TOKEN_EXPIRY_DAYS = 7; // Token expires after 7 days

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
  async saveAuthData(user: any, accessToken?: string, refreshToken?: string, ssoToken?: string): Promise<void> {
    const data: StorageData = {
      user,
      accessToken,
      refreshToken,
      ssoToken,
      timestamp: Date.now(),
    };
    
    console.log('[AuthStorage] Saving auth data:', { 
      hasUser: !!user, 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken,
      hasSsoToken: !!ssoToken,
      ssoToken: ssoToken 
    });
    
    await storage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('[AuthStorage] Auth data saved successfully');
  },

  async getAuthData(): Promise<{ user: any; accessToken?: string; refreshToken?: string; ssoToken?: string; timestamp?: number } | null> {
    try {
      const dataString = await storage.getItem(STORAGE_KEY);
      console.log('[AuthStorage] Retrieved data string:', dataString ? 'exists' : 'null');
      
      if (!dataString) {
        console.log('[AuthStorage] No stored data found');
        return null;
      }

      const data: StorageData = JSON.parse(dataString);
      console.log('[AuthStorage] Parsed data:', { 
        hasUser: !!data.user, 
        hasAccessToken: !!data.accessToken, 
        hasRefreshToken: !!data.refreshToken,
        hasSsoToken: !!data.ssoToken,
        ssoToken: data.ssoToken,
        timestamp: data.timestamp 
      });
      
      // Handle backward compatibility - if no timestamp, assume it's old
      const timestamp = data.timestamp || 0;
      
      // Check if token is expired
      const now = Date.now();
      const tokenAge = now - timestamp;
      const maxAge = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      
      if (tokenAge > maxAge) {
        console.log('[AuthStorage] Token expired, clearing auth data');
        await this.clearAuthData();
        return null;
      }

      // Check if ssoToken is present (required for backend authentication)
      if (!data.ssoToken) {
        console.log('[AuthStorage] No ssoToken found, clearing auth data');
        await this.clearAuthData();
        return null;
      }

      console.log('[AuthStorage] Auth data retrieved successfully');
      return {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        ssoToken: data.ssoToken,
        timestamp: timestamp,
      };
    } catch (error) {
      console.error('[AuthStorage] Error getting auth data:', error);
      return null;
    }
  },

  async clearAuthData(): Promise<void> {
    await storage.removeItem(STORAGE_KEY);
    console.log('[AuthStorage] Auth data cleared');
  },

  async hasValidAuth(): Promise<boolean> {
    const authData = await this.getAuthData();
    return authData !== null && !!authData.ssoToken;
  },

  async debugAuthData(): Promise<void> {
    try {
      const dataString = await storage.getItem(STORAGE_KEY);
      console.log('[AuthStorage] DEBUG - Raw stored data:', dataString);
      
      if (dataString) {
        const data = JSON.parse(dataString);
        console.log('[AuthStorage] DEBUG - Parsed data:', {
          hasUser: !!data.user,
          hasAccessToken: !!data.accessToken,
          hasRefreshToken: !!data.refreshToken,
          hasSsoToken: !!data.ssoToken,
          ssoToken: data.ssoToken,
          timestamp: data.timestamp,
          user: data.user
        });
      }
    } catch (error) {
      console.error('[AuthStorage] DEBUG - Error:', error);
    }
  },
};
