import { User } from '../types';
import { evenlyApiClient } from './EvenlyApiClient';
import { ENV } from '../config/env';

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export class AuthService {
  /**
   * Sync user with evenly-backend after successful authentication
   */
  private async syncUserWithEvenlyBackend(user: any, ssoToken?: string): Promise<void> {
    try {
      if (!ssoToken) {
        console.warn('No sso_token provided for syncing with evenly-backend');
        return;
      }

      // Use the Axios client to make a test API call to evenly-backend to trigger user sync
      await evenlyApiClient.get('/groups');
    } catch (error) {
      console.warn('Failed to sync user with evenly-backend:', error);
      // Don't throw error as this shouldn't block the auth flow
    }
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    ssoToken?: string
  ): Promise<{ data: any; ssoToken?: string; accessToken?: string; refreshToken?: string }> {
    try {
      // Convert RequestInit to Axios config
      const axiosConfig: any = {
        method: options.method || 'GET',
        url: endpoint,
        ...options,
      };

      // Handle body for POST/PUT requests
      if (options.body) {
        axiosConfig.data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      }

      // NO MANUAL HEADER SETTING - Let the interceptor handle authentication
      // The interceptor will automatically add sso_token from storage

      // Use the Axios client
      const response = await evenlyApiClient.getInstance().request(axiosConfig);
      
      // Extract sso_token from Set-Cookie header
      let extractedSsoToken: string | undefined;
      const setCookieHeader = response.headers['set-cookie'];
      
      if (setCookieHeader) {
        // Handle both string and array cases
        const cookieString = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
        const ssoTokenMatch = cookieString.match(/sso_token=([^;]+)/);
        if (ssoTokenMatch) {
          extractedSsoToken = decodeURIComponent(ssoTokenMatch[1]);
        }
      }

      // Extract JWT tokens from response body if available
      const accessToken = response.data.accessToken || response.data.data?.accessToken;
      const refreshToken = response.data.refreshToken || response.data.data?.refreshToken;
      
      return { data: response.data, ssoToken: extractedSsoToken, accessToken, refreshToken };
    } catch (error: any) {
      console.error('API Request failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        endpoint: endpoint,
        options: options
      });
      throw error;
    }
  }

  async signup(email: string): Promise<AuthResponse> {
    try {
      const { data: response } = await this.makeRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ 
          email,
          senderName: ENV.APP_NAME,
          appName: ENV.APP_NAME
        }),
      });

      return {
        success: true,
        message: response.message || 'Magic link sent to your email!',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send magic link',
      };
    }
  }

  async requestOTP(email: string): Promise<AuthResponse> {
    try {
      const { data: response } = await this.makeRequest('/auth/login/otp', {
        method: 'POST',
        body: JSON.stringify({ 
          email,
          senderName: ENV.APP_NAME,
          appName: ENV.APP_NAME
        }),
      });

      return {
        success: true,
        message: response.message || 'OTP sent to your email!',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
      };
    }
  }

  async verifyOTP(email: string, otp: string): Promise<AuthResponse & { ssoToken?: string; accessToken?: string; refreshToken?: string }> {
    try {
      const { data: response, ssoToken, accessToken, refreshToken } = await this.makeRequest('/auth/login/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });

      if (response.success && (response.user || response.data?.user)) {
        const user = response.user || response.data?.user;
        
        // Sync user with evenly-backend
        await this.syncUserWithEvenlyBackend(user, ssoToken);

        return {
          success: true,
          message: response.message || 'Login successful!',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            stats: {
              groups: 0,
              totalSpent: 0,
              owed: 0,
            },
          },
          ssoToken,
          accessToken,
          refreshToken,
        };
      }

      return {
        success: false,
        message: response.message || 'Invalid OTP',
        ssoToken, // Still return the ssoToken even if login failed
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Invalid OTP',
      };
    }
  }

  async getCurrentUser(ssoToken?: string): Promise<User | null> {
    try {
      const { data: response } = await this.makeRequest('/auth/me', {}, ssoToken);
      if (response.success && response.user) {
        // Sync user with evenly-backend
        await this.syncUserWithEvenlyBackend(response.user, ssoToken);

        return {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          stats: { groups: 0, totalSpent: 0, owed: 0 }, // Will be updated from evenly-backend
        };
      }
      return null;
    } catch (error) {
      console.log('Get current user failed:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Even if logout fails on server, we should clear local state
    }
  }

  // Handle magic link verification (for web-based magic links)
  async verifyMagicLink(token: string): Promise<AuthResponse> {
    try {
      const { data: response } = await this.makeRequest(`/auth/magic?token=${token}`, {
        method: 'GET',
      });

      return {
        success: true,
        message: response.message || 'Magic link verified!',
        user: {
          id: response.userId || 'temp-id',
          email: 'user@example.com', // You might want to get this from the response
          name: 'User',
          stats: {
            groups: 0,
            totalSpent: 0,
            owed: 0,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Invalid magic link',
      };
    }
  }
}
