import axios from 'axios';
import { FastifyRequest } from 'fastify';
import { config } from '../config/config';
import { UserService } from './userService';

interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
  ssoToken?: string;
  accessToken?: string;
  refreshToken?: string;
}

export class AuthService {
  private static readonly AUTH_SERVICE_URL = config.auth.serviceUrl;

  /**
   * Send magic link for signup
   */
  static async signup(email: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${this.AUTH_SERVICE_URL}/signup`, {
        email,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      return {
        success: true,
        message: response.data.message || 'Magic link sent to your email!',
      };
    } catch (error: any) {
      console.error('Auth service signup error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send magic link',
      };
    }
  }

  /**
   * Send OTP for login
   */
  static async requestOTP(email: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${this.AUTH_SERVICE_URL}/login/otp`, {
        email,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      return {
        success: true,
        message: response.data.message || 'OTP sent to your email!',
      };
    } catch (error: any) {
      console.error('Auth service request OTP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  }

  /**
   * Verify OTP and login
   */
  static async verifyOTP(email: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${this.AUTH_SERVICE_URL}/login/verify-otp`, {
        email,
        otp,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data.user && response.data.accessToken) {
        // Extract sso_token from response headers
        const setCookieHeader = response.headers['set-cookie'];
        let ssoToken = null;
        
        if (setCookieHeader) {
          const ssoTokenMatch = setCookieHeader.find(cookie => 
            cookie.startsWith('sso_token=')
          );
          if (ssoTokenMatch) {
            ssoToken = ssoTokenMatch.split('sso_token=')[1].split(';')[0];
          }
        }

        // Sync user with local database
        const syncedUser = await UserService.createOrUpdateUser({
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          avatar: response.data.user.avatar,
        });

        return {
          success: true,
          message: response.data.message || 'Login successful!',
          user: {
            id: syncedUser.id,
            email: syncedUser.email,
            name: syncedUser.name,
            avatar: syncedUser.avatar,
          },
          ssoToken: ssoToken || undefined, // Use the actual sso_token from cookie
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Invalid OTP',
      };
    } catch (error: any) {
      console.error('Auth service verify OTP error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify OTP',
      };
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${this.AUTH_SERVICE_URL}/refresh-token`, {
        refreshToken,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data.accessToken) {
        return {
          success: true,
          message: 'Token refreshed successfully',
          accessToken: response.data.accessToken,
        };
      }

      return {
        success: false,
        message: 'Failed to refresh token',
      };
    } catch (error: any) {
      console.error('Auth service refresh token error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to refresh token',
      };
    }
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(request: FastifyRequest): Promise<AuthResponse> {
    try {
      const ssoToken = request.cookies?.sso_token;

      if (!ssoToken) {
        return {
          success: false,
          message: 'No authentication token provided',
        };
      }

      const response = await axios.get(`${this.AUTH_SERVICE_URL}/me`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cookie': `sso_token=${ssoToken}`,
        },
        timeout: 10000,
      });

      if (response.data.user) {
        // Sync user with local database
        const syncedUser = await UserService.createOrUpdateUser({
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          avatar: response.data.user.avatar,
        });

        return {
          success: true,
          message: 'User retrieved successfully',
          user: {
            id: syncedUser.id,
            email: syncedUser.email,
            name: syncedUser.name,
            avatar: syncedUser.avatar,
          },
        };
      }

      return {
        success: false,
        message: 'User not authenticated',
      };
    } catch (error: any) {
      console.error('Auth service get current user error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user info',
      };
    }
  }

  /**
   * Logout user
   */
  static async logout(request: FastifyRequest): Promise<AuthResponse> {
    try {
      const ssoToken = request.cookies?.sso_token;

      if (ssoToken) {
        await axios.post(`${this.AUTH_SERVICE_URL}/logout`, {}, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cookie': `sso_token=${ssoToken}`,
          },
          timeout: 10000,
        });
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error: any) {
      console.error('Auth service logout error:', error);
      // Even if logout fails on auth service, we should still return success
      // as the local session will be cleared
      return {
        success: true,
        message: 'Logged out successfully',
      };
    }
  }
}
