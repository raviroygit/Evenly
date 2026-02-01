/**
 * Data Refresh Coordinator
 *
 * Centralized coordinator for refreshing all app data after token refresh.
 * Ensures all data sources reload in a coordinated manner without race conditions.
 *
 * Usage:
 * 1. Hooks register their refresh callbacks on mount
 * 2. AuthContext calls refreshAll() after token refresh
 * 3. All registered callbacks execute together
 */

type RefreshCallback = () => Promise<void>;

export class DataRefreshCoordinator {
  private static refreshCallbacks: Set<RefreshCallback> = new Set();
  private static isRefreshing = false;

  /**
   * Register a data refresh callback
   * Returns cleanup function to unregister on unmount
   */
  static register(callback: RefreshCallback): () => void {
    console.log('[DataRefreshCoordinator] Registering refresh callback');
    this.refreshCallbacks.add(callback);

    // Return cleanup function
    return () => {
      console.log('[DataRefreshCoordinator] Unregistering refresh callback');
      this.refreshCallbacks.delete(callback);
    };
  }

  /**
   * Refresh all registered data sources
   * Executes all callbacks in parallel
   */
  static async refreshAll(): Promise<void> {
    if (this.isRefreshing) {
      console.log('[DataRefreshCoordinator] Refresh already in progress, skipping');
      return;
    }

    this.isRefreshing = true;
    const startTime = Date.now();

    try {
      console.log(`[DataRefreshCoordinator] Starting coordinated refresh of ${this.refreshCallbacks.size} data sources`);

      // Execute all refresh callbacks in parallel
      const refreshPromises = Array.from(this.refreshCallbacks).map(async (callback, index) => {
        try {
          await callback();
          console.log(`[DataRefreshCoordinator] Refresh callback ${index + 1} completed`);
        } catch (error) {
          console.error(`[DataRefreshCoordinator] Refresh callback ${index + 1} failed:`, error);
          // Don't throw - allow other callbacks to complete
        }
      });

      await Promise.all(refreshPromises);

      const duration = Date.now() - startTime;
      console.log(`[DataRefreshCoordinator] ✅ All data refreshed successfully in ${duration}ms`);
    } catch (error) {
      console.error('[DataRefreshCoordinator] Error during coordinated refresh:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Get the number of registered callbacks
   */
  static getRegisteredCount(): number {
    return this.refreshCallbacks.size;
  }

  /**
   * Check if a refresh is currently in progress
   */
  static isRefreshInProgress(): boolean {
    return this.isRefreshing;
  }

  /**
   * Clear all registered callbacks (useful for testing)
   */
  static clearAll(): void {
    console.log('[DataRefreshCoordinator] Clearing all registered callbacks');
    this.refreshCallbacks.clear();
  }
}
