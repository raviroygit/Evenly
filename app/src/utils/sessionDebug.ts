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
    console.log('[SessionDebug] Forcing token refresh...');
    const success = await SilentTokenRefresh.refresh();
    if (success) {
      console.log('[SessionDebug] ✅ Force refresh successful');
    } else {
      console.error('[SessionDebug] ❌ Force refresh failed');
    }
    return success;
  }

  /**
   * Clear all cache (for testing)
   * Invalidates all cached data to force fresh fetches
   */
  static async clearAllCache(): Promise<void> {
    console.log('[SessionDebug] Clearing all cache...');
    await CacheManager.invalidateAllData();
    console.log('[SessionDebug] ✅ Cache cleared');
  }

  /**
   * Log current session status to console
   * Formatted for easy reading during development
   */
  static async logStatus(): Promise<void> {
    const status = await this.getSessionStatus();
    console.log('╔══════════════════════════════════════╗');
    console.log('║       SESSION DEBUG STATUS           ║');
    console.log('╚══════════════════════════════════════╝');
    console.log('');
    console.log('📊 AUTH DATA:', status.hasAuthData ? '✅ Present' : '❌ Missing');
    console.log('');

    if (status.accessTokenInfo) {
      console.log('🔑 ACCESS TOKEN:');
      console.log('  • Expired:', status.accessTokenInfo.isExpired ? '❌ YES' : '✅ NO');
      console.log('  • Minutes until expiry:', status.accessTokenInfo.minutesUntilExpiry);
      console.log('  • Needs refresh (<1hr):', status.accessTokenInfo.needsRefresh ? '⚠️ YES' : '✅ NO');
      console.log('  • Urgent refresh (<5min):', status.accessTokenInfo.needsUrgentRefresh ? '🚨 YES' : '✅ NO');
      console.log('');
    }

    if (status.refreshTokenInfo) {
      console.log('🔄 REFRESH TOKEN:');
      console.log('  • Expired:', status.refreshTokenInfo.isExpired ? '❌ YES' : '✅ NO');
      console.log('  • Minutes until expiry:', status.refreshTokenInfo.minutesUntilExpiry);
      console.log('');
    }

    if (status.lastRefreshTimestamp) {
      console.log('⏰ LAST REFRESH:', status.timeSinceLastRefresh || 'Unknown');
      console.log('');
    }

    console.log('⚡ TOKEN EXPIRING URGENTLY (<5 min):', status.tokenExpiringUrgently ? '🚨 YES' : '✅ NO');
    console.log('💾 CACHE STATUS:', status.cacheStale ? '⚠️ Stale (bypassed)' : '✅ Fresh');
    console.log('📡 BACKGROUND TASK:', status.backgroundTaskStatus || 'Unknown');
    console.log('');
    console.log('════════════════════════════════════════');
  }

  /**
   * Test token refresh flow
   * Simulates the full refresh cycle and reports results
   */
  static async testRefreshFlow(): Promise<void> {
    console.log('[SessionDebug] 🧪 Testing refresh flow...');
    console.log('');

    // Step 1: Get initial status
    console.log('Step 1: Getting initial token status...');
    const beforeStatus = await this.getSessionStatus();
    if (!beforeStatus.hasAuthData) {
      console.error('❌ No auth data - cannot test refresh');
      return;
    }
    console.log('✅ Initial access token expires in:', beforeStatus.accessTokenInfo?.minutesUntilExpiry, 'minutes');
    console.log('');

    // Step 2: Attempt refresh
    console.log('Step 2: Attempting token refresh...');
    const refreshSuccess = await this.forceRefresh();
    if (!refreshSuccess) {
      console.error('❌ Refresh failed');
      return;
    }
    console.log('✅ Refresh successful');
    console.log('');

    // Step 3: Verify new token
    console.log('Step 3: Verifying new token...');
    const afterStatus = await this.getSessionStatus();
    console.log('✅ New access token expires in:', afterStatus.accessTokenInfo?.minutesUntilExpiry, 'minutes');
    console.log('');

    // Step 4: Check cache invalidation
    console.log('Step 4: Checking cache status...');
    console.log('Cache is:', afterStatus.cacheStale ? 'STALE (will bypass)' : 'FRESH (will use)');
    console.log('');

    console.log('✅ Refresh flow test complete!');
    console.log('════════════════════════════════════════');
  }

  /**
   * Monitor session for a specified duration
   * Logs session status at regular intervals
   *
   * @param durationMinutes - How long to monitor (default: 5 minutes)
   * @param intervalSeconds - How often to check (default: 30 seconds)
   */
  static async monitorSession(durationMinutes: number = 5, intervalSeconds: number = 30): Promise<void> {
    console.log(`[SessionDebug] 📊 Starting session monitor for ${durationMinutes} minutes...`);
    console.log(`[SessionDebug] Checking every ${intervalSeconds} seconds`);
    console.log('');

    const endTime = Date.now() + durationMinutes * 60 * 1000;
    let checkCount = 0;

    const interval = setInterval(async () => {
      checkCount++;
      const now = Date.now();

      if (now >= endTime) {
        clearInterval(interval);
        console.log('[SessionDebug] ✅ Monitoring complete');
        return;
      }

      console.log(`[SessionDebug] Check #${checkCount}`);
      await this.logStatus();
      console.log('');
    }, intervalSeconds * 1000);
  }
}
