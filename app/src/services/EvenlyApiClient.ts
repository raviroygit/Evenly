import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import { ENV } from '../config/env';
import { AuthStorage } from '../utils/storage';
import ErrorHandler from '../utils/ErrorHandler';
import { SilentTokenRefresh } from '../utils/silentTokenRefresh';

type RetryableRequestConfig = AxiosRequestConfig & { _retriedAfterRefresh?: boolean };

// Gate SESSION_EXPIRED emission until the app is past its splash/boot phase,
// so a transient 401 during boot (e.g. auth service cold start) cannot log the user out.
// Flipped by AuthInitializer once it sees a non-'/' pathname.
let appBooted = false;
export const markAppBooted = () => {
  appBooted = true;
};

/**
 * Axios instance for Evenly Backend API with automatic authentication.
 * Organization ID is always taken from env (EXPO_PUBLIC_ORGANIZATION_ID) – no storage or user resolution.
 */
class EvenlyApiClient {
  private client: AxiosInstance;
  private unauthorizedEmitted = false;

  constructor() {
    // Ensure base URL ends with /api so paths like /auth/me resolve to .../api/auth/me.
    const base = (ENV.EVENLY_BACKEND_URL || '').replace(/\/+$/, '');
    const baseURL = base.endsWith('/api') ? base : `${base}/api`;

    this.client = axios.create({
      baseURL,
      timeout: 120000, // 120 seconds (2 minutes) for image uploads
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'x-client-type': 'mobile', // Identify as mobile client for never-expiring tokens
      },
      // Important: Don't use transformRequest/transformResponse for FormData on React Native Android
      // Let axios handle multipart/form-data automatically
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to automatically add authentication
    // NOTE: Mobile tokens never expire, so no refresh logic needed
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // For FormData, special handling needed for React Native
          if (config.data instanceof FormData) {
            console.log('[EvenlyApiClient] Preparing FormData request:', {
              url: config.url,
              method: config.method,
              platform: Platform.OS,
              hasData: !!config.data,
              baseURL: config.baseURL,
              fullURL: `${config.baseURL}${config.url}`,
            });

            if (config.headers) {
              if (Platform.OS === 'android') {
                // On Android, axios incorrectly sets Content-Type to application/x-www-form-urlencoded
                // We MUST explicitly set it to multipart/form-data (axios will add the boundary)
                config.headers['Content-Type'] = 'multipart/form-data';
                console.log('[EvenlyApiClient] Android: Set Content-Type to multipart/form-data');
              } else {
                // On iOS, remove Content-Type to let axios auto-detect
                delete (config.headers as any)['Content-Type'];
                console.log('[EvenlyApiClient] iOS: Removed Content-Type, letting axios auto-detect');
              }
            }

            console.log('[EvenlyApiClient] FormData headers after setup:', Object.keys(config.headers || {}));
          }

          // The unified auth service mints fresh access tokens on every login
          // and rotates them via /refresh-token, so we read accessToken only.
          // The legacy DB-backed apiKey path is gone.
          const authData = await AuthStorage.getAuthData();
          const token = authData?.accessToken;
          if (!token) {
            this.unauthorizedEmitted = false;
          }

          if (token) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${token}`;
          }

          // Org id from env only (same as backend EVENLY_ORGANIZATION_ID)
          if (ENV.ORGANIZATION_ID) {
            config.headers = config.headers || {};
            config.headers['x-organization-id'] = ENV.ORGANIZATION_ID;
          }

          return config;
        } catch (error) {
          return config;
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    // NOTE: Mobile tokens never expire, so 401 errors are rare (network issues, token revoked, etc.)
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        // Log the error for debugging
        ErrorHandler.logError(error, 'API Request');

        // Enhanced error logging for FormData uploads
        if (error.config?.data instanceof FormData || error.code === 'ERR_NETWORK') {
          console.log('[EvenlyApiClient] Upload Error Details:', {
            code: error.code,
            message: error.message,
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            hasFormData: error.config?.data instanceof FormData,
            platform: Platform.OS,
          });
        }

        // Handle 401 Unauthorized.
        // Strategy: attempt a silent token refresh + retry once. If refresh succeeds,
        // transparently retry the original request. If refresh is impossible (no
        // refresh token on disk) or fails (network blip, auth service cold start),
        // keep the user logged in with cached data — the sibling nextgenai app
        // behaves the same way and users explicitly want persistent sessions here.
        if (error.response?.status === 401) {
          const message = error.response?.data?.message ?? '';
          const originalRequest = error.config as RetryableRequestConfig | undefined;

          if (message === 'Unauthorized Access' && appBooted && originalRequest && !originalRequest._retriedAfterRefresh) {
            originalRequest._retriedAfterRefresh = true;
            let refreshed = false;
            try {
              refreshed = await SilentTokenRefresh.refresh();
            } catch {
              refreshed = false;
            }
            if (refreshed) {
              // Drop the stale Authorization header so the request interceptor
              // re-reads the freshly-stored accessToken from storage on retry.
              if (originalRequest.headers && 'Authorization' in originalRequest.headers) {
                delete (originalRequest.headers as any).Authorization;
              }
              this.unauthorizedEmitted = false;
              return this.client.request(originalRequest);
            }
          }

          // Refresh not possible / failed, or non-"Unauthorized Access" 401.
          // Never force-logout — surface as a transient error so cached data stays.
          return Promise.reject({
            ...error,
            _offlineMode: true,
            message: 'Network error - using cached data',
          });
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

  /** Base URL used for API requests (e.g. https://xxx.run.app/api). Useful for debugging. */
  getBaseURL(): string {
    return this.client.defaults.baseURL || '';
  }
}

// Export singleton instance
export const evenlyApiClient = new EvenlyApiClient();
export default evenlyApiClient;
