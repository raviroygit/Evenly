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

        // Call mobile-specific refresh endpoint (via evenly-backend wrapper)
        const response = await axios.post(
          `${ENV.EVENLY_BACKEND_URL}/mobile/refresh`,
          { refreshToken: authData.refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            timeout: 10000,
          }
        );

        if (response.data.success && response.data.ssoToken) {
          console.log('[SilentRefresh] ✅ Session refreshed successfully');

          // Save new tokens
          await AuthStorage.saveAuthData(
            response.data.user,
            response.data.accessToken,
            response.data.refreshToken,
            response.data.ssoToken
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

        // If refresh token is invalid/expired (401), silently logout
        if (error.response?.status === 401) {
          console.log('[SilentRefresh] Refresh token invalid - silently logging out');
          await AuthStorage.clearAuthData();
          // AuthContext will detect this and redirect to login automatically
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

      if (!authData?.ssoToken || !authData?.refreshToken) {
        console.log('[SilentRefresh] No auth data, skipping refresh check');
        return;
      }

      // Check when session expires (via evenly-backend wrapper)
      const response = await axios.get(
        `${ENV.EVENLY_BACKEND_URL}/mobile/session-expiry`,
        {
          headers: {
            'Cookie': `sso_token=${authData.ssoToken}`,
            'ngrok-skip-browser-warning': 'true',
          },
          timeout: 10000,
        }
      );

      if (response.data.success && response.data.shouldRefresh) {
        console.log(
          `[SilentRefresh] Session expires in ${response.data.expiresInMinutes} minutes - refreshing now`
        );
        await this.refresh();
      } else {
        console.log(
          `[SilentRefresh] Session OK - expires in ${response.data.expiresInMinutes} minutes`
        );
      }
    } catch (error: any) {
      // If check fails, try refreshing anyway (session might be expired)
      if (error.response?.status === 401) {
        console.log('[SilentRefresh] Session expired, refreshing...');
        await this.refresh();
      } else {
        console.log('[SilentRefresh] Check failed:', error.message);
      }
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
