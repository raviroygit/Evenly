import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ENV } from '../config/env';
import { AuthStorage } from '../utils/storage';
import ErrorHandler from '../utils/ErrorHandler';
import { Platform } from 'react-native';
import { SilentTokenRefresh } from '../utils/silentTokenRefresh';

/**
 * Axios instance for Evenly Backend API with automatic authentication
 */
class EvenlyApiClient {
  private client: AxiosInstance;
  private currentOrganizationId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: ENV.EVENLY_BACKEND_URL,
      timeout: 30000, // Increased from 10000 to 30000ms (30 seconds)
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    this.setupInterceptors();
    this.initializeOrganizationId();
  }

  /**
   * Initialize organization ID from storage on app startup
   */
  private async initializeOrganizationId() {
    try {
      const authData = await AuthStorage.getAuthData();
      if (authData?.user?.currentOrganization?.id) {
        this.currentOrganizationId = authData.user.currentOrganization.id;
        console.log('[EvenlyApiClient] Initialized with organization ID:', this.currentOrganizationId);
      } else if (authData?.user?.organizations && authData.user.organizations.length > 0) {
        this.currentOrganizationId = authData.user.organizations[0].id;
        console.log('[EvenlyApiClient] Initialized with first organization ID:', this.currentOrganizationId);
      }
    } catch (error) {
      console.error('[EvenlyApiClient] Failed to initialize organization ID:', error);
    }
  }

  /**
   * Set the current organization ID (called when user logs in or switches org)
   */
  setOrganizationId(organizationId: string | null) {
    this.currentOrganizationId = organizationId;
    console.log('[EvenlyApiClient] Organization ID updated:', organizationId);
  }

  /**
   * Get the current organization ID
   */
  getOrganizationId(): string | null {
    return this.currentOrganizationId;
  }

  private setupInterceptors() {
    // Request interceptor to automatically add authentication
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // For FormData, don't set Content-Type - let axios handle it automatically
          if (config.data instanceof FormData) {
            // Remove Content-Type header if it exists, axios will set it with boundary
            if (config.headers) {
              delete (config.headers as any)['Content-Type'];
            }
          }

          // Get auth data from storage
          const authData = await AuthStorage.getAuthData();
          const accessToken = authData?.accessToken;

          if (accessToken) {
            // Use Bearer token authentication for mobile apps
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${accessToken}`;

            console.log(`[${Platform.OS}] Using Bearer token authentication`);
          }

          // Add organization context header from in-memory storage
          // Backend requires this to filter data by organization
          if (this.currentOrganizationId) {
            config.headers = config.headers || {};
            config.headers['x-organization-id'] = this.currentOrganizationId;
            console.log(`[${Platform.OS}] ✅ Added organization ID header:`, this.currentOrganizationId);
          } else {
            console.warn(`[${Platform.OS}] ⚠️ No organization ID available - request will fail on backend`);
          }

          return config;
        } catch (error) {
          console.error('Request interceptor error:', error);
          return config;
        }
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        // Log the error for debugging
        ErrorHandler.logError(error, 'API Request');

        // Handle 401 Unauthorized - backend session expired
        if (error.response?.status === 401) {
          const originalRequest = error.config;

          // Avoid infinite retry loop
          if (originalRequest._retryCount && originalRequest._retryCount >= 1) {
            console.warn('[EvenlyApiClient] ⚠️ Already retried once - keeping user logged in with cached data');
            console.warn('[EvenlyApiClient] ⚠️ User can continue using app in offline mode');

            // NEVER logout user - keep them logged in with cached data
            // User stays logged in, can view cached data
            return Promise.reject({
              ...error,
              _offlineMode: true,
              message: 'Session expired - using cached data'
            });
          }

          // Check if access token is actually expired before attempting refresh
          try {
            const authData = await AuthStorage.getAuthData();

            if (authData?.accessToken) {
              // Check if token is expired or about to expire (< 5 minutes)
              const needsRefresh = SilentTokenRefresh.isTokenExpiredOrExpiring(authData.accessToken, 5);

              if (!needsRefresh) {
                // Token is still valid (> 5 minutes remaining)
                // This 401 is a legitimate auth error (wrong token, revoked, permission denied)
                console.warn('[EvenlyApiClient] ⚠️ Token still valid but got 401 - legitimate auth error');
                console.warn('[EvenlyApiClient] ⚠️ Keeping user logged in with cached data');

                return Promise.reject({
                  ...error,
                  _offlineMode: true,
                  message: 'Authentication error - using cached data'
                });
              }
            }
          } catch (checkError) {
            console.warn('[EvenlyApiClient] Error checking token expiry:', checkError);
            // If we can't check, proceed with refresh attempt
          }

          console.log('[EvenlyApiClient] Token expired - attempting silent refresh');

          try {
            // Silently refresh using refresh token (NO user interaction)
            const refreshed = await SilentTokenRefresh.refresh();

            if (refreshed) {
              // Get new auth data
              const authData = await AuthStorage.getAuthData();
              if (authData?.accessToken) {
                // Mark as retried
                originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

                // Update Bearer token in request headers
                originalRequest.headers['Authorization'] = `Bearer ${authData.accessToken}`;

                console.log('[EvenlyApiClient] ✅ Silent refresh successful, retrying request');
                // Retry the original request with new session
                return this.client(originalRequest);
              }
            } else {
              console.warn('[EvenlyApiClient] ⚠️ Silent refresh failed - keeping user logged in with cached data');
              console.warn('[EvenlyApiClient] ⚠️ User can continue using app in offline mode');

              // NEVER logout user - keep them logged in with cached data
              // User stays logged in, can view cached data
              return Promise.reject({
                ...error,
                _offlineMode: true,
                message: 'Session expired - using cached data'
              });
            }
          } catch (refreshError) {
            console.warn('[EvenlyApiClient] ⚠️ Silent refresh error - keeping user logged in with cached data');
            console.warn('[EvenlyApiClient] ⚠️ User can continue using app in offline mode');
            ErrorHandler.logError(refreshError, 'Silent Token Refresh');

            // NEVER logout user - keep them logged in with cached data
            // User stays logged in, can view cached data
            return Promise.reject({
              ...error,
              _offlineMode: true,
              message: 'Session expired - using cached data'
            });
          }
        }

        // For non-401 errors, we'll let the calling code handle the user-friendly error display
        return Promise.reject(error);
      }
    );
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  // Get the underlying axios instance for advanced usage
  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const evenlyApiClient = new EvenlyApiClient();
export default evenlyApiClient;
