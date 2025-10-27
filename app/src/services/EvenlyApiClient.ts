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
    console.log('[EvenlyApiClient] Initializing with baseURL:', ENV.EVENLY_BACKEND_URL);
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
          console.log('[EvenlyApiClient] Interceptor called for:', config.method?.toUpperCase(), config.url);
          
          // Get auth data from storage
          const authData = await AuthStorage.getAuthData();
          const ssoToken = authData?.ssoToken;
          
          console.log('[EvenlyApiClient] Retrieved ssoToken from storage:', ssoToken ? 'exists' : 'null');

          if (ssoToken) {
            // Add sso_token to cookies (ensure it's properly decoded)
            config.headers = config.headers || {};
            const decodedToken = decodeURIComponent(ssoToken);
            
            // Handle existing cookies properly
            const existingCookie = config.headers['Cookie'] || config.headers['cookie'];
            if (existingCookie) {
              console.log('[EvenlyApiClient] Original cookie:', existingCookie);
              
              // Split by semicolon (standard cookie separator), filter out sso_token entries, then rejoin
              const cookieParts = existingCookie
                .split(';')
                .map((part: string) => part.trim())
                .filter((part: string) => !part.startsWith('sso_token='))
                .filter((part: string) => part.length > 0); // Remove empty parts
              
              console.log('[EvenlyApiClient] Cleaned cookie parts:', cookieParts);
              
              // Add the new sso_token
              cookieParts.push(`sso_token=${decodedToken}`);
              
              const finalCookie = cookieParts.join('; ');
              console.log('[EvenlyApiClient] Final cookie:', finalCookie);
              
              config.headers['Cookie'] = finalCookie;
            } else {
              config.headers['Cookie'] = `sso_token=${decodedToken}`;
            }
          }

          console.log('[EvenlyApiClient] Request:', config.method?.toUpperCase(), config.url);
          console.log('[EvenlyApiClient] Full URL:', config.baseURL + (config.url || ''));
          return config;
        } catch (error) {
          console.error('[EvenlyApiClient] Request interceptor error:', error);
          return config;
        }
      },
      (error) => {
        console.error('[EvenlyApiClient] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('[EvenlyApiClient] Response:', response.status, response.config.url);
        return response;
      },
      async (error) => {
        // Log the error for debugging
        ErrorHandler.logError(error, 'API Request');
        
        // Handle 401 Unauthorized - token might be expired
        if (error.response?.status === 401) {
          console.log('[EvenlyApiClient] 401 Unauthorized - attempting token refresh');
          
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
                const decodedToken = authData.ssoToken ? decodeURIComponent(authData.ssoToken) : '';
                
                // Handle existing cookies properly
                const existingCookie = originalRequest.headers['Cookie'] || originalRequest.headers['cookie'];
                if (existingCookie) {
                  // Split by semicolon (standard cookie separator), filter out sso_token entries, then rejoin
                  const cookieParts = existingCookie
                    .split(';')
                    .map((part: string) => part.trim())
                    .filter((part: string) => !part.startsWith('sso_token='))
                    .filter((part: string) => part.length > 0); // Remove empty parts
                  
                  // Add the new sso_token
                  cookieParts.push(`sso_token=${decodedToken}`);
                  
                  originalRequest.headers['Cookie'] = cookieParts.join('; ');
                } else {
                  originalRequest.headers['Cookie'] = `sso_token=${decodedToken}`;
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
