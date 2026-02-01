import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Request queue for concurrent refresh attempts
type PendingRequest = {
  resolve: (token: string | null) => void;
  reject: (error: Error) => void;
};

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let pendingRequests: PendingRequest[] = [];

export class SilentTokenRefresh {
  /**
   * Check if access token is expired or about to expire (< 5 minutes by default)
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
   * Get detailed token expiry information
   * Returns comprehensive status about token expiry state
   */
  static getTokenExpiryInfo(accessToken: string): {
    isExpired: boolean;
    minutesUntilExpiry: number;
    expiryTimestamp: number;
    needsRefresh: boolean;        // < 1 hour
    needsUrgentRefresh: boolean;  // < 5 minutes
  } {
    try {
      // Decode JWT to check expiry
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);

      return {
        isExpired: minutesUntilExpiry <= 0,
        minutesUntilExpiry: Math.max(0, minutesUntilExpiry),
        expiryTimestamp: expiryTime,
        needsRefresh: minutesUntilExpiry < 60,        // Less than 1 hour
        needsUrgentRefresh: minutesUntilExpiry < 5,   // Less than 5 minutes
      };
    } catch (error) {
      console.warn('[SilentRefresh] Failed to decode token:', error);
      // If we can't decode, assume token is expired
      return {
        isExpired: true,
        minutesUntilExpiry: 0,
        expiryTimestamp: 0,
        needsRefresh: true,
        needsUrgentRefresh: true,
      };
    }
  }

  /**
   * Save timestamp of last successful refresh
   */
  static async saveRefreshTimestamp(): Promise<void> {
    try {
      await AsyncStorage.setItem('evenly_last_refresh', Date.now().toString());
      console.log('[SilentRefresh] Saved refresh timestamp');
    } catch (error) {
      console.error('[SilentRefresh] Failed to save refresh timestamp:', error);
    }
  }

  /**
   * Get timestamp of last successful refresh
   * Returns null if no refresh has been recorded
   */
  static async getLastRefreshTimestamp(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem('evenly_last_refresh');
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('[SilentRefresh] Failed to get refresh timestamp:', error);
      return null;
    }
  }

  /**
   * Silently refresh session using refresh token
   * No user interaction required
   *
   * Returns the new access token if successful, null otherwise
   * Queues concurrent requests to prevent duplicate refreshes
   */
  static async refresh(): Promise<boolean> {
    // If already refreshing, queue this request
    if (isRefreshing) {
      console.log('[SilentRefresh] Refresh already in progress, queueing request...');

      return new Promise((resolve, reject) => {
        pendingRequests.push({
          resolve: (token) => resolve(!!token),
          reject,
        });
      });
    }

    isRefreshing = true;
    const startTime = Date.now();

    refreshPromise = new Promise(async (resolve) => {
      let newAccessToken: string | null = null;

      try {
        console.log('[SilentRefresh] Starting silent token refresh...');

        const authData = await AuthStorage.getAuthData();

        if (!authData?.refreshToken) {
          console.log('[SilentRefresh] No refresh token available');
          throw new Error('No refresh token available');
        }

        // Call MOBILE-SPECIFIC refresh endpoint for 90-day sessions with token rotation
        const response = await Promise.race([
          axios.post(
            `${ENV.EVENLY_BACKEND_URL}/auth/mobile/refresh`,
            { refreshToken: authData.refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
              },
            }
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Token refresh timeout')), 10000)
          ),
        ]) as any;

        if (response.data.accessToken && response.data.refreshToken) {
          const duration = Date.now() - startTime;
          console.log(`[SilentRefresh] ✅ Mobile session refreshed successfully in ${duration}ms`);
          console.log(`[SilentRefresh] ✅ Session extended to 90 days`);
          console.log(`[SilentRefresh] ✅ New refresh token received and will be saved`);

          newAccessToken = response.data.accessToken;

          // CRITICAL: Save BOTH new tokens (access + refresh) to enable token rotation
          // The refresh token is rotated on each refresh - old one becomes invalid
          await AuthStorage.saveAuthData(
            response.data.user || authData.user, // Use updated user if provided
            response.data.accessToken,
            response.data.refreshToken // NEW refresh token (rotated)
          );

          // Save refresh timestamp for cache invalidation tracking
          await this.saveRefreshTimestamp();

          // Resolve all pending requests with the new token
          console.log(`[SilentRefresh] Resolving ${pendingRequests.length} queued requests`);
          pendingRequests.forEach(req => req.resolve(newAccessToken));
          pendingRequests = [];

          resolve(true);
        } else {
          console.log('[SilentRefresh] ❌ Refresh failed - invalid response');
          throw new Error('Invalid refresh response');
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`[SilentRefresh] ❌ Refresh failed after ${duration}ms:`, error.message);

        // NEVER clear auth data - keep user logged in with cached data
        // Even if refresh token is invalid/expired, user should stay logged in
        if (error.response?.status === 401) {
          console.warn('[SilentRefresh] ⚠️ Refresh token invalid - keeping user logged in with cached data');
          console.warn('[SilentRefresh] ⚠️ User can continue using app in offline mode');
          // Do NOT clear auth data - user stays logged in
        }

        // Reject all pending requests
        console.log(`[SilentRefresh] Rejecting ${pendingRequests.length} queued requests`);
        pendingRequests.forEach(req => req.reject(error));
        pendingRequests = [];

        resolve(false);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    });

    return refreshPromise;
  }

  /**
   * Check if session needs refresh and refresh if needed
   * Call this periodically in background
   * @param thresholdMinutes - Minutes before expiry to trigger refresh (default 5)
   */
  static async checkAndRefresh(thresholdMinutes: number = 5): Promise<void> {
    try {
      const authData = await AuthStorage.getAuthData();

      if (!authData?.accessToken || !authData?.refreshToken) {
        console.log('[SilentRefresh] No auth data, skipping refresh check');
        return;
      }

      // Check if token is expired or about to expire
      if (this.isTokenExpiredOrExpiring(authData.accessToken, thresholdMinutes)) {
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
