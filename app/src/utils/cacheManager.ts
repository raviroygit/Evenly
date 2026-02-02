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
        return true;
      }

      const tokenInfo = SilentTokenRefresh.getTokenExpiryInfo(authData.accessToken);

      // Only bypass cache if token has < 5 minutes remaining
      if (tokenInfo.needsUrgentRefresh) {
        return true;
      }

      return false;
    } catch (error) {
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
        return true;
      }

      const tokenInfo = SilentTokenRefresh.getTokenExpiryInfo(authData.accessToken);

      if (tokenInfo.isExpired) {
      }

      return tokenInfo.isExpired;
    } catch (error) {
      return true;
    }
  }

  /**
   * Invalidate all data cache
   * Clears ALL cache entries - used on logout to prevent data leaks
   */
  static async invalidateAllData(): Promise<void> {

    try {
      // Use clearAll() to remove ALL cache entries
      // This ensures no cached data persists between user sessions
      await AppCache.clearAll();

    } catch (error) {
    }
  }

  /**
   * Check if cache should be bypassed
   * Returns true ONLY if access token has < 5 minutes remaining
   */
  static async shouldBypassCache(): Promise<boolean> {
    const tokenExpiringUrgently = await this.isTokenExpiringUrgently();

    if (tokenExpiringUrgently) {
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
        return 0;
      }

      // Use token's remaining lifetime as cache TTL
      const tokenLifetime = await this.getTokenRemainingLifetime();

      if (tokenLifetime > 0) {
        const hours = Math.floor(tokenLifetime / (1000 * 60 * 60));
        const minutes = Math.floor((tokenLifetime % (1000 * 60 * 60)) / (1000 * 60));
      }

      return tokenLifetime;
    } catch (error) {
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
      await AppCache.invalidateByPrefixes([prefix]);
    } catch (error) {
    }
  }
}
