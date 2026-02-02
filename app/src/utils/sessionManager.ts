// Session management utilities
import { AuthStorage } from './storage';

export class SessionManager {
  private static instance: SessionManager;
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Start automatic session refresh
  startSessionRefresh(refreshCallback: () => Promise<void>) {
    this.stopSessionRefresh(); // Clear any existing interval
    
    this.refreshInterval = setInterval(async () => {
      try {
        await refreshCallback();
      } catch (error) {
      }
    }, this.REFRESH_INTERVAL);
  }

  // Stop automatic session refresh
  stopSessionRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Check if session is still valid
  async isSessionValid(): Promise<boolean> {
    try {
      const authData = await AuthStorage.getAuthData();
      return authData !== null;
    } catch (error) {
      return false;
    }
  }

  // Clear session data
  async clearSession(): Promise<void> {
    try {
      await AuthStorage.clearAuthData();
      this.stopSessionRefresh();
    } catch (error) {
    }
  }

  // Get session info
  async getSessionInfo(): Promise<{ isValid: boolean; user?: any; expiresAt?: number }> {
    try {
      const authData = await AuthStorage.getAuthData();
      if (authData) {
        return {
          isValid: true,
          user: authData.user,
          expiresAt: authData.expiresAt,
        };
      }
      return { isValid: false };
    } catch (error) {
      return { isValid: false };
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
