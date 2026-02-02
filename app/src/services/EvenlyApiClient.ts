import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ENV } from '../config/env';
import { AuthStorage } from '../utils/storage';
import ErrorHandler from '../utils/ErrorHandler';
import { Platform } from 'react-native';

/**
 * Axios instance for Evenly Backend API with automatic authentication
 */
class EvenlyApiClient {
  private client: AxiosInstance;
  private currentOrganizationId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: ENV.EVENLY_BACKEND_URL,
      timeout: 120000, // 120 seconds (2 minutes) for image uploads
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'x-client-type': 'mobile', // Identify as mobile client for never-expiring tokens
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
      } else if (authData?.user?.organizations && authData.user.organizations.length > 0) {
        this.currentOrganizationId = authData.user.organizations[0].id;
      }
    } catch (error) {
    }
  }

  /**
   * Set the current organization ID (called when user logs in or switches org)
   */
  setOrganizationId(organizationId: string | null) {
    this.currentOrganizationId = organizationId;
  }

  /**
   * Get the current organization ID
   */
  getOrganizationId(): string | null {
    return this.currentOrganizationId;
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

          if (accessToken) {
            // Simply attach the token - it never expires for mobile
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${accessToken}`;
          }

          // Add organization context header from in-memory storage
          // Backend requires this to filter data by organization
          if (this.currentOrganizationId) {
            config.headers = config.headers || {};
            config.headers['x-organization-id'] = this.currentOrganizationId;
          } else {
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

        // Handle 401 Unauthorized - token might be revoked or network issue
        if (error.response?.status === 401) {

          // Since mobile tokens never expire, 401 means:
          // 1. Token was revoked remotely (security issue)
          // 2. Network error / backend issue
          // 3. Invalid token (shouldn't happen)

          // Keep user logged in with cached data in all cases
          // User can view cached data and retry when network is restored
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
}

// Export singleton instance
export const evenlyApiClient = new EvenlyApiClient();
export default evenlyApiClient;
