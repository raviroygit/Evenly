import axios from 'axios';
import { FastifyRequest } from 'fastify';
import { config } from '../config/config';
import { UserService } from './userService';

interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
  organization?: any;
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
          'X-Organization-Id': config.auth.organizationId,
        },
        timeout: 30000, // Increased timeout to 30 seconds
      });

      return {
        success: response.data.success !== false,
        message: response.data.message || 'Magic link sent to your email!',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send magic link',
      };
    }
  }

  /**
   * Send OTP for login (with mobile support)
   */
  static async requestOTP(email: string, request?: FastifyRequest): Promise<AuthResponse> {
    try {
      const isMobile = this.isMobileClient(request);

      // Build headers - forward mobile header to shared auth system
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Organization-Id': config.auth.organizationId,
      };

      // Forward mobile client header to shared auth system
      if (isMobile) {
        headers['x-client-type'] = 'mobile';
      }

      const response = await axios.post(`${this.AUTH_SERVICE_URL}/login/otp`, {
        email,
      }, {
        headers,
        timeout: 30000, // Increased timeout to 30 seconds
      });

      return {
        success: response.data.success !== false,
        message: response.data.message || 'OTP sent to your email!',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  }

  /**
   * Helper to detect mobile client from request
   */
  private static isMobileClient(request?: FastifyRequest): boolean {
    if (!request) return false;
    const clientType = request.headers['x-client-type'] as string;
    return clientType === 'mobile';
  }

  /**
   * Verify OTP and login (with mobile support)
   * Pass the request object to forward mobile header to shared auth system
   */
  static async verifyOTP(email: string, otp: string, request?: FastifyRequest): Promise<AuthResponse> {
    try {
      const isMobile = this.isMobileClient(request);

      // Build headers - forward mobile header to shared auth system
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Organization-Id': config.auth.organizationId,
      };

      // Forward mobile client header to shared auth system
      if (isMobile) {
        headers['x-client-type'] = 'mobile';
      }

      const response = await axios.post(`${this.AUTH_SERVICE_URL}/login/verify-otp`, {
        email,
        otp,
      }, {
        headers,
        timeout: 30000, // Increased timeout to 30 seconds
      });

      if (response.data.user && response.data.accessToken) {
        // Log what we received from shared auth system
        if (isMobile) {
        }

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
          phoneNumber: response.data.user.phoneNumber, // Sync phoneNumber to database
        });

        return {
          success: true,
          message: response.data.message || 'Login successful!',
          user: {
            id: syncedUser.id,
            email: syncedUser.email,
            name: syncedUser.name,
            avatar: syncedUser.avatar,
            phoneNumber: syncedUser.phoneNumber, // Return phoneNumber from synced user
            role: response.data.user.role,
          },
          organization: response.data.organization,
          ssoToken: ssoToken || undefined, // Use the actual sso_token from cookie
          accessToken: response.data.accessToken, // From shared auth (mobile-aware)
          refreshToken: response.data.refreshToken, // null for mobile, present for web
        };
      }

      return {
        success: false,
        message: response.data.message || 'Invalid OTP',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify OTP',
      };
    }
  }

  /**
   * Google social login - proxy to auth service
   */
  static async socialLoginGoogle(idToken: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${this.AUTH_SERVICE_URL}/social/google`, { idToken }, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        timeout: 30000,
      });

      // Extract sso_token from response headers
      const setCookieHeader = response.headers['set-cookie'];
      let ssoToken: string | undefined;
      if (setCookieHeader) {
        const cookieString = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
        const match = cookieString.match(/sso_token=([^;]+)/);
        if (match) ssoToken = match[1];
      }

      if (response.data?.user && response.data?.accessToken) {
        return {
          success: true,
          message: response.data.message || 'Login successful!',
          user: response.data.user,
          ssoToken,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        };
      }
      return { success: false, message: response.data?.message || 'Google login failed' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Google login failed' };
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
        timeout: 30000, // Increased timeout to 30 seconds
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
        timeout: 30000, // Increased timeout to 30 seconds
      });

      // Auth service returns: { success: true, user: {...}, organization: {...} }
      if (response.data.success && response.data.user) {
        // Sync user with local database
        const syncedUser = await UserService.createOrUpdateUser({
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          avatar: response.data.user.avatar,
          phoneNumber: response.data.user.phoneNumber, // Sync phoneNumber to database
        });

        return {
          success: true,
          message: 'User retrieved successfully',
          user: {
            id: syncedUser.id,
            email: syncedUser.email,
            name: syncedUser.name,
            avatar: syncedUser.avatar,
            phoneNumber: syncedUser.phoneNumber, // Return phoneNumber from synced user
          },
          organization: response.data.organization, // Include organization from auth service
        };
      }

      return {
        success: false,
        message: 'User not authenticated',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user info',
      };
    }
  }

  /**
   * Update current user profile via auth service
   */
  static async updateUser(request: FastifyRequest, data: { name?: string; email?: string }): Promise<AuthResponse> {
    try {
      let ssoToken = request.cookies?.sso_token;
      // Minimal diagnostics: inbound cookie and token presence
      // Fallback: parse from raw Cookie header if not populated by cookie parser
      if (!ssoToken && (request.headers as any)?.cookie) {
        const raw = String((request.headers as any).cookie);
        const parts = raw.split(';').map(p => p.trim());
        const ssoPart = parts.find(p => p.startsWith('sso_token='));
        if (ssoPart) ssoToken = ssoPart.substring('sso_token='.length);
      }
      if (!ssoToken) {
        return {
          success: false,
          message: 'No authentication token provided',
        };
      }
      
      const response = await axios.put(`${this.AUTH_SERVICE_URL}/me`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cookie': `sso_token=${ssoToken}`,
        },
        timeout: 30000,
      });
      const respData = response.data;
      if (respData?.success) {
        // Optionally sync with local DB if auth returns user
        if (respData.user) {
          await UserService.createOrUpdateUser({
            id: respData.user.id,
            email: respData.user.email,
            name: respData.user.name,
            avatar: respData.user.avatar,
          });
        }
        return {
          success: true,
          message: respData.message || 'User updated successfully',
          user: respData.user,
        };
      }

      return {
        success: false,
        message: respData?.message || 'Failed to update user',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || 'Failed to update user',
      };
    }
  }

  /**
   * Delete current user via auth service
   */
  static async deleteUser(request: FastifyRequest): Promise<AuthResponse> {
    try {
      const ssoToken = request.cookies?.sso_token;
      
      if (!ssoToken) {
        return { success: false, message: 'No authentication token provided' };
      }

      const response = await axios.delete(`${this.AUTH_SERVICE_URL}/me`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cookie': `sso_token=${ssoToken}`,
        },
        timeout: 30000,
      });

      const respData = response.data;
      if (respData?.success) {
        return { success: true, message: respData.message || 'Account deleted' };
      }
      return { success: false, message: respData?.message || 'Failed to delete account' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete account' };
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
          timeout: 30000, // Increased timeout to 30 seconds
        });
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error: any) {
      // Even if logout fails on auth service, we should still return success
      // as the local session will be cleared
      return {
        success: true,
        message: 'Logged out successfully',
      };
    }
  }

  /**
   * Mobile-specific: Silent token refresh (wrapper to auth service mobile endpoint)
   * Uses refresh token to create new 90-day session - NO OTP required
   */
  static async mobileRefresh(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(
        `${this.AUTH_SERVICE_URL}/../mobile/refresh`, // Goes to /api/v1/mobile/refresh
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data.success && response.data.user) {
        // Sync user with local database
        const syncedUser = await UserService.createOrUpdateUser({
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          avatar: response.data.user.avatar,
        });

        return {
          success: true,
          message: response.data.message || 'Session refreshed successfully',
          user: {
            id: syncedUser.id,
            email: syncedUser.email,
            name: syncedUser.name,
            avatar: syncedUser.avatar,
          },
          ssoToken: response.data.ssoToken,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        };
      }
      return {
        success: false,
        message: response.data.message || 'Failed to refresh session',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to refresh session',
      };
    }
  }

  /**
   * Mobile-specific: Check session expiry (wrapper to auth service mobile endpoint)
   * Returns when session expires and whether it should be refreshed soon
   */
  static async mobileSessionExpiry(request: FastifyRequest): Promise<any> {
    try {
      const ssoToken = request.cookies?.sso_token;

      if (!ssoToken) {
        return {
          success: false,
          message: 'No authentication token provided',
        };
      }
      const response = await axios.get(
        `${this.AUTH_SERVICE_URL}/../mobile/session-expiry`, // Goes to /api/v1/mobile/session-expiry
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cookie': `sso_token=${ssoToken}`,
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to check session expiry',
      };
    }
  }
}
