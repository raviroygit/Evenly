import { AppCache } from './cache';
import { AuthStorage } from './storage';
import { SilentTokenRefresh } from './silentTokenRefresh';

/**
 * Cache Manager with Token-Based TTL
 *
 * Uses the actual access token's remaining lifetime as cache TTL
 * Cache expires when token expires (or < 5 minutes remaining)
 */
export class CacheManager {
  /**
   * Check if access token has < 5 minutes remaining before expiry
   * Returns true if token expires in less than 5 minutes
   */
  static async isTokenExpiringUrgently(): Promise<boolean> {
    try {
      const authData = await AuthStorage.getAuthData();
      if (!authData?.accessToken) {
        console.log('[CacheManager] No access token - bypassing cache');
        return true;
      }

      const tokenInfo = SilentTokenRefresh.getTokenExpiryInfo(authData.accessToken);

      // Only bypass cache if token has < 5 minutes remaining
      if (tokenInfo.needsUrgentRefresh) {
        console.log(
          `[CacheManager] Token has ${tokenInfo.minutesUntilExpiry} minutes remaining (< 5 min) - bypassing cache`
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('[CacheManager] Error checking token expiry:', error);
      return true;
    }
  }

  /**
   * Get the access token's remaining lifetime in milliseconds
   * Returns 0 if token is expired or missing
   */
  static async getTokenRemainingLifetime(): Promise<number> {
    try {
      const authData = await AuthStorage.getAuthData();
      if (!authData?.accessToken) {
        return 0;
      }

      const tokenInfo = SilentTokenRefresh.getTokenExpiryInfo(authData.accessToken);

      if (tokenInfo.isExpired) {
        return 0;
      }

      // Convert minutes to milliseconds
      const remainingMs = tokenInfo.minutesUntilExpiry * 60 * 1000;
      return Math.max(0, remainingMs);
    } catch (error) {
      console.error('[CacheManager] Error getting token lifetime:', error);
      return 0;
    }
  }

  /**
   * Check if session has expired
   * Returns true if access token is expired or missing
   */
  static async isSessionExpired(): Promise<boolean> {
    try {
      const authData = await AuthStorage.getAuthData();
      if (!authData?.accessToken) {
        console.log('[CacheManager] No access token - session expired');
        return true;
      }

      const tokenInfo = SilentTokenRefresh.getTokenExpiryInfo(authData.accessToken);

      if (tokenInfo.isExpired) {
        console.log('[CacheManager] Access token expired');
      }

      return tokenInfo.isExpired;
    } catch (error) {
      console.error('[CacheManager] Error checking session expiry:', error);
      return true;
    }
  }

  /**
   * Invalidate all data cache
   * Clears cache for all API endpoints
   */
  static async invalidateAllData(): Promise<void> {
    console.log('[CacheManager] Invalidating all data cache...');

    try {
      await Promise.all([
        AppCache.invalidateByPrefixes(['/groups']),
        AppCache.invalidateByPrefixes(['/expenses']),
        AppCache.invalidateByPrefixes(['/balances']),
        AppCache.invalidateByPrefixes(['/payments']),
        AppCache.invalidateByPrefixes(['/khata']),
        AppCache.invalidateByPrefixes(['/auth/me']),
        AppCache.invalidateByPrefixes(['/dashboard']),
      ]);

      console.log('[CacheManager] ✅ All cache invalidated successfully');
    } catch (error) {
      console.error('[CacheManager] ❌ Failed to invalidate cache:', error);
    }
  }

  /**
   * Check if cache should be bypassed
   * Returns true ONLY if access token has < 5 minutes remaining
   */
  static async shouldBypassCache(): Promise<boolean> {
    const tokenExpiringUrgently = await this.isTokenExpiringUrgently();

    if (tokenExpiringUrgently) {
      console.log('[CacheManager] Bypassing cache - token expires in < 5 minutes');
    }

    return tokenExpiringUrgently;
  }

  /**
   * Get cache TTL based on access token's remaining lifetime
   * Returns the actual token's remaining lifetime as cache TTL
   * Returns 0 if token has < 5 minutes remaining (bypass cache)
   *
   * @returns Cache TTL in milliseconds (token's remaining lifetime or 0)
   */
  static async getCacheTTL(): Promise<number> {
    try {
      // Check if token is expiring urgently (< 5 minutes)
      const shouldBypass = await this.shouldBypassCache();
      if (shouldBypass) {
        console.log('[CacheManager] Using 0ms cache TTL (token < 5 min)');
        return 0;
      }

      // Use token's remaining lifetime as cache TTL
      const tokenLifetime = await this.getTokenRemainingLifetime();

      if (tokenLifetime > 0) {
        const hours = Math.floor(tokenLifetime / (1000 * 60 * 60));
        const minutes = Math.floor((tokenLifetime % (1000 * 60 * 60)) / (1000 * 60));
        console.log(`[CacheManager] Using token TTL: ${hours}h ${minutes}m (${tokenLifetime}ms)`);
      }

      return tokenLifetime;
    } catch (error) {
      console.error('[CacheManager] Error getting cache TTL:', error);
      return 0;
    }
  }

  /**
   * Invalidate cache for specific endpoint prefix
   * Useful for targeted cache invalidation
   *
   * @param prefix - Endpoint prefix to invalidate (e.g., '/groups', '/expenses')
   */
  static async invalidateByPrefix(prefix: string): Promise<void> {
    try {
      console.log(`[CacheManager] Invalidating cache for prefix: ${prefix}`);
      await AppCache.invalidateByPrefixes([prefix]);
      console.log(`[CacheManager] ✅ Cache invalidated for: ${prefix}`);
    } catch (error) {
      console.error(`[CacheManager] ❌ Failed to invalidate cache for ${prefix}:`, error);
    }
  }
}
