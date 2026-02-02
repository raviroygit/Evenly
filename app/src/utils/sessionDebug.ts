import { AuthStorage } from './storage';
import { SilentTokenRefresh } from './silentTokenRefresh';
import { CacheManager } from './cacheManager';
import { getBackgroundRefreshStatus } from './backgroundTokenRefresh';

/**
 * Session Debug Utilities
 *
 * Provides debugging and testing utilities for session management
 * Use these functions during development to monitor and test session behavior
 */
export class SessionDebug {
  /**
   * Get comprehensive session status for debugging
   * Returns detailed information about current session state
   */
  static async getSessionStatus(): Promise<{
    hasAuthData: boolean;
    accessTokenInfo?: {
      isExpired: boolean;
      minutesUntilExpiry: number;
      expiryTimestamp: number;
      needsRefresh: boolean;
      needsUrgentRefresh: boolean;
    };
    refreshTokenInfo?: {
      isExpired: boolean;
      minutesUntilExpiry: number;
      expiryTimestamp: number;
      needsRefresh: boolean;
      needsUrgentRefresh: boolean;
    };
    lastRefreshTimestamp?: number;
    timeSinceLastRefresh?: string;
    tokenExpiringUrgently: boolean;
    cacheStale: boolean;
    backgroundTaskStatus?: string;
  }> {
    const authData = await AuthStorage.getAuthData();

    if (!authData?.accessToken) {
      return {
        hasAuthData: false,
        tokenExpiringUrgently: true,
        cacheStale: true,
      };
    }

    const accessTokenInfo = SilentTokenRefresh.getTokenExpiryInfo(authData.accessToken);
    const refreshTokenInfo = authData.refreshToken
      ? SilentTokenRefresh.getTokenExpiryInfo(authData.refreshToken)
      : undefined;

    const lastRefresh = await SilentTokenRefresh.getLastRefreshTimestamp();
    const tokenExpiringUrgently = await CacheManager.isTokenExpiringUrgently();
    const cacheStale = await CacheManager.shouldBypassCache();

    const bgStatus = await getBackgroundRefreshStatus();
    const bgStatusMap: Record<number, string> = {
      1: 'Restricted',
      2: 'Denied',
      3: 'Available',
    };

    let timeSinceLastRefresh: string | undefined;
    if (lastRefresh) {
      const seconds = Math.floor((Date.now() - lastRefresh) / 1000);
      if (seconds < 60) {
        timeSinceLastRefresh = `${seconds} seconds ago`;
      } else if (seconds < 3600) {
        timeSinceLastRefresh = `${Math.floor(seconds / 60)} minutes ago`;
      } else {
        timeSinceLastRefresh = `${Math.floor(seconds / 3600)} hours ago`;
      }
    }

    return {
      hasAuthData: true,
      accessTokenInfo,
      refreshTokenInfo,
      lastRefreshTimestamp: lastRefresh || undefined,
      timeSinceLastRefresh,
      tokenExpiringUrgently,
      cacheStale,
      backgroundTaskStatus: bgStatusMap[bgStatus] || 'Unknown',
    };
  }

  /**
   * Force token refresh (for testing)
   * Bypasses expiry checks and attempts refresh immediately
   */
  static async forceRefresh(): Promise<boolean> {
    const success = await SilentTokenRefresh.refresh();
    if (success) {
    } else {
    }
    return success;
  }

  /**
   * Clear all cache (for testing)
   * Invalidates all cached data to force fresh fetches
   */
  static async clearAllCache(): Promise<void> {
    await CacheManager.invalidateAllData();
  }

  /**
   * Log current session status to console
   * Formatted for easy reading during development
   */
  static async logStatus(): Promise<void> {
    const status = await this.getSessionStatus();

    if (status.accessTokenInfo) {
    }

    if (status.refreshTokenInfo) {
    }

    if (status.lastRefreshTimestamp) {
    }

  }

  /**
   * Test token refresh flow
   * Simulates the full refresh cycle and reports results
   */
  static async testRefreshFlow(): Promise<void> {

    // Step 1: Get initial status
    const beforeStatus = await this.getSessionStatus();
    if (!beforeStatus.hasAuthData) {
      return;
    }

    // Step 2: Attempt refresh
    const refreshSuccess = await this.forceRefresh();
    if (!refreshSuccess) {
      return;
    }

    // Step 3: Verify new token
    const afterStatus = await this.getSessionStatus();

    // Step 4: Check cache invalidation

  }

  /**
   * Monitor session for a specified duration
   * Logs session status at regular intervals
   *
   * @param durationMinutes - How long to monitor (default: 5 minutes)
   * @param intervalSeconds - How often to check (default: 30 seconds)
   */
  static async monitorSession(durationMinutes: number = 5, intervalSeconds: number = 30): Promise<void> {

    const endTime = Date.now() + durationMinutes * 60 * 1000;
    let checkCount = 0;

    const interval = setInterval(async () => {
      checkCount++;
      const now = Date.now();

      if (now >= endTime) {
        clearInterval(interval);
        return;
      }

      await this.logStatus();
    }, intervalSeconds * 1000);
  }
}
