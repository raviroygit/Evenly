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
          let ssoToken = authData?.ssoToken;

          if (ssoToken) {
            // Normalize accidental double-encoding (e.g., %253A -> %3A)
            try {
              if (typeof ssoToken === 'string' && ssoToken.includes('%253A')) {
                ssoToken = decodeURIComponent(ssoToken);
              }
            } catch {}
            // Add sso_token to cookies
            config.headers = config.headers || {};
            // Remove any pre-existing cookie headers to avoid duplication
            if (config.headers['Cookie']) delete (config.headers as any)['Cookie'];
            if (config.headers['cookie']) delete (config.headers as any)['cookie'];
            
            // Set the cookie
            const cookieVal = `sso_token=${ssoToken}`;
            config.headers['Cookie'] = cookieVal;
            
            // Single log for sso token (full value)
            console.log(`[${Platform.OS}] SSO Token: ${ssoToken}`);
            
            if (Platform.OS === 'ios') {
              (config as any).withCredentials = true;
            }
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

          console.log('[EvenlyApiClient] Backend session expired - attempting silent refresh');

          try {
            // Silently refresh using refresh token (NO user interaction)
            const refreshed = await SilentTokenRefresh.refresh();

            if (refreshed) {
              // Get new auth data
              const authData = await AuthStorage.getAuthData();
              if (authData?.ssoToken) {
                // Mark as retried
                originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

                // Update sso_token in request headers
                originalRequest.headers['Cookie'] = `sso_token=${authData.ssoToken}`;

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
