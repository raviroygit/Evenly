import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ENV } from '../config/env';
import { AuthStorage } from '../utils/storage';
import ErrorHandler from '../utils/ErrorHandler';
import { sessionEvents, SESSION_EVENTS } from '../utils/sessionEvents';

/**
 * Axios instance for Evenly Backend API with automatic authentication.
 * Organization ID is always taken from env (EXPO_PUBLIC_ORGANIZATION_ID) – no storage or user resolution.
 */
class EvenlyApiClient {
  private client: AxiosInstance;
  private unauthorizedEmitted = false;

  constructor() {
    // Ensure base URL ends with /api so paths like /auth/signup/otp resolve to .../api/auth/signup/otp
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
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to automatically add authentication
    // NOTE: Mobile tokens never expire, so no refresh logic needed
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // Debug: Log data type

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
          if (!accessToken) {
            this.unauthorizedEmitted = false;
          }

          if (accessToken) {
            // Simply attach the token - it never expires for mobile
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${accessToken}`;
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
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          const message = error.response?.data?.message ?? '';
          if (message === 'Unauthorized Access') {
            if (!this.unauthorizedEmitted) {
              this.unauthorizedEmitted = true;
              sessionEvents.emit(SESSION_EVENTS.SESSION_EXPIRED);
            }
            return Promise.reject(error);
          }
          // Other 401s: keep user logged in with cached data (e.g. network/backend issue)
          return Promise.reject({
            ...error,
            _offlineMode: true,
            message: 'Network error - using cached data'
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
