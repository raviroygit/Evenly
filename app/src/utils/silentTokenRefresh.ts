import axios from 'axios';
import { ENV } from '../config/env';
import { AuthStorage } from './storage';

/**
 * Silent Token Refresh Manager
 *
 * Automatically refreshes authentication session using refresh token
 * NO OTP required - completely silent background refresh
 *
 * If refresh fails completely, silently clears auth data and redirects to login
 * Users NEVER see error messages
 */

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export class SilentTokenRefresh {
  /**
   * Check if access token is expired or about to expire (< 5 minutes)
   * Returns true if token needs refresh, false otherwise
   */
  static isTokenExpiredOrExpiring(accessToken: string, thresholdMinutes: number = 5): boolean {
    try {
      // Decode JWT to check expiry (JWT format: header.payload.signature)
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);

      // Return true if token expires in less than threshold minutes
      return minutesUntilExpiry < thresholdMinutes;
    } catch (error) {
      console.warn('[SilentRefresh] Failed to decode token, assuming expired:', error);
      // If we can't decode, assume token needs refresh
      return true;
    }
  }

  /**
   * Silently refresh session using refresh token
   * No user interaction required
   */
  static async refresh(): Promise<boolean> {
    // If already refreshing, wait for that to complete
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = new Promise(async (resolve) => {
      try {
        console.log('[SilentRefresh] Starting silent token refresh...');

        const authData = await AuthStorage.getAuthData();

        if (!authData?.refreshToken) {
          console.log('[SilentRefresh] No refresh token available');
          isRefreshing = false;
          refreshPromise = null;
          resolve(false);
          return;
        }

        // Call nxgenaidev_auth refresh token endpoint directly
        const response = await axios.post(
          `${ENV.EVENLY_BACKEND_URL}/auth/refresh-token`,
          { refreshToken: authData.refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            timeout: 10000,
          }
        );

        if (response.data.accessToken && response.data.refreshToken) {
          console.log('[SilentRefresh] ✅ Session refreshed successfully');

          // Save new tokens (keep existing user data)
          await AuthStorage.saveAuthData(
            authData.user,
            response.data.accessToken,
            response.data.refreshToken
          );

          isRefreshing = false;
          refreshPromise = null;
          resolve(true);
        } else {
          console.log('[SilentRefresh] ❌ Refresh failed - invalid response');
          isRefreshing = false;
          refreshPromise = null;
          resolve(false);
        }
      } catch (error: any) {
        console.error('[SilentRefresh] ❌ Refresh failed:', error.message);

        // NEVER clear auth data - keep user logged in with cached data
        // Even if refresh token is invalid/expired, user should stay logged in
        if (error.response?.status === 401) {
          console.warn('[SilentRefresh] ⚠️ Refresh token invalid - keeping user logged in with cached data');
          console.warn('[SilentRefresh] ⚠️ User can continue using app in offline mode');
          // Do NOT clear auth data - user stays logged in
        }

        isRefreshing = false;
        refreshPromise = null;
        resolve(false);
      }
    });

    return refreshPromise;
  }

  /**
   * Check if session needs refresh and refresh if needed
   * Call this periodically in background
   */
  static async checkAndRefresh(): Promise<void> {
    try {
      const authData = await AuthStorage.getAuthData();

      if (!authData?.accessToken || !authData?.refreshToken) {
        console.log('[SilentRefresh] No auth data, skipping refresh check');
        return;
      }

      // Check if token is expired or about to expire
      if (this.isTokenExpiredOrExpiring(authData.accessToken, 5)) {
        // Calculate exact minutes for logging
        try {
          const payload = JSON.parse(atob(authData.accessToken.split('.')[1]));
          const expiryTime = payload.exp * 1000;
          const currentTime = Date.now();
          const minutesUntilExpiry = Math.floor((expiryTime - currentTime) / 60000);

          console.log(
            `[SilentRefresh] Token expires in ${minutesUntilExpiry} minutes - refreshing now`
          );
        } catch {
          console.log('[SilentRefresh] Token expired or invalid - refreshing now');
        }

        await this.refresh();
      } else {
        // Calculate exact minutes for logging
        try {
          const payload = JSON.parse(atob(authData.accessToken.split('.')[1]));
          const expiryTime = payload.exp * 1000;
          const currentTime = Date.now();
          const minutesUntilExpiry = Math.floor((expiryTime - currentTime) / 60000);

          console.log(
            `[SilentRefresh] Token OK - expires in ${minutesUntilExpiry} minutes`
          );
        } catch {
          console.log('[SilentRefresh] Token status unknown');
        }
      }
    } catch (error: any) {
      console.log('[SilentRefresh] Check failed:', error.message);
      // Don't throw - just log the error
    }
  }

  /**
   * Check if currently refreshing
   */
  static isRefreshing(): boolean {
    return isRefreshing;
  }

  /**
   * Silently logout user (clear auth data)
   * Used when refresh fails completely
   */
  static async silentLogout(): Promise<void> {
    console.log('[SilentRefresh] Performing silent logout');
    await AuthStorage.clearAuthData();
    // AuthContext will detect this and redirect to login automatically
  }
}
