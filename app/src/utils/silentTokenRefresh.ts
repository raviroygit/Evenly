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
    } catch (error) {
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

        const authData = await AuthStorage.getAuthData();

        if (!authData?.refreshToken) {
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
          pendingRequests.forEach(req => req.resolve(newAccessToken));
          pendingRequests = [];

          resolve(true);
        } else {
          throw new Error('Invalid refresh response');
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;

        // NEVER clear auth data - keep user logged in with cached data
        // Even if refresh token is invalid/expired, user should stay logged in
        if (error.response?.status === 401) {
          // Do NOT clear auth data - user stays logged in
        }

        // Reject all pending requests
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

        } catch {
        }

        await this.refresh();
      } else {
        // Calculate exact minutes for logging
        try {
          const payload = JSON.parse(atob(authData.accessToken.split('.')[1]));
          const expiryTime = payload.exp * 1000;
          const currentTime = Date.now();
          const minutesUntilExpiry = Math.floor((expiryTime - currentTime) / 60000);

        } catch {
        }
      }
    } catch (error: any) {
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
    await AuthStorage.clearAuthData();
    // AuthContext will detect this and redirect to login automatically
  }
}
