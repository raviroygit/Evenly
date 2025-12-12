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
        
        // Handle 401 Unauthorized - token might be expired
        if (error.response?.status === 401) {
          try {
            // Try to refresh the token
            const authData = await AuthStorage.getAuthData();
            const refreshToken = authData?.refreshToken;

            if (refreshToken) {
              const refreshResponse = await axios.post(
                `${ENV.EVENLY_BACKEND_URL}/auth/refresh-token`,
                { refreshToken },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                  },
                }
              );

              if (refreshResponse.data.accessToken) {
                // Update stored tokens
                await AuthStorage.saveAuthData(
                  authData.user,
                  refreshResponse.data.accessToken,
                  refreshToken,
                  authData.ssoToken
                );

                // Retry the original request with new token
                const originalRequest = error.config;
                const rawToken = authData.ssoToken || '';
                
                // Handle existing cookies properly
                const existingCookie = originalRequest.headers['Cookie'] || originalRequest.headers['cookie'];
                if (existingCookie) {
                  // Split by semicolon (standard cookie separator), filter out sso_token entries, then rejoin
                  const cookieParts = existingCookie
                    .split(';')
                    .map((part: string) => part.trim())
                    .filter((part: string) => !part.startsWith('sso_token='))
                    .filter((part: string) => part.length > 0); // Remove empty parts
                  
                  // Add the new sso_token (use raw token to match Android)
                  cookieParts.push(`sso_token=${rawToken}`);
                  
                  originalRequest.headers['Cookie'] = cookieParts.join('; ');
                } else {
                  originalRequest.headers['Cookie'] = `sso_token=${rawToken}`;
                }
                
                return this.client(originalRequest);
              }
            }
          } catch (refreshError) {
            console.error('[EvenlyApiClient] Token refresh failed:', refreshError);
            ErrorHandler.logError(refreshError, 'Token Refresh');
            // Clear auth data and redirect to login
            await AuthStorage.clearAuthData();
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
