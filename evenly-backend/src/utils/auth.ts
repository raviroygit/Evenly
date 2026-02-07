import axios from 'axios';
import { config } from '../config/config';
import { AuthServiceResponse, User } from '../types';

export class AuthService {
  private static readonly baseURL = config.auth.serviceUrl;

  /**
   * Whether the token looks like a JWT (three base64 parts separated by dots).
   * JWTs are validated via Bearer; opaque session IDs via Cookie.
   */
  private static looksLikeJwt(token: string): boolean {
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token.trim());
  }

  /**
   * Validate session token with auth service.
   * Sends JWT as Bearer (mobile), opaque session ID as Cookie (web).
   */
  static async validateToken(token: string): Promise<AuthServiceResponse> {
    try {
      const isJwt = this.looksLikeJwt(token);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (isJwt) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['Cookie'] = `sso_token=${token}`;
      }

      const response = await axios.get(`${this.baseURL}/me`, {
        headers,
        timeout: 10000, // 10 second timeout (auth service may be on cold start)
      });


      if (response.status === 200 && response.data.success) {
        return {
          success: true,
          user: response.data.user,
        };
      }

      return {
        success: false,
        error: 'Invalid token',
      };
    } catch (error: any) {
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Unauthorized - Invalid token',
        };
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return {
          success: false,
          error: 'Auth service unavailable',
        };
      }

      return {
        success: false,
        error: 'Token validation failed',
      };
    }
  }

  /**
   * Get user details by ID from auth service
   */
  static async getUserById(userId: string): Promise<AuthServiceResponse> {
    try {
      const response = await axios.get(`${this.baseURL}/users/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      if (response.status === 200 && response.data.success) {
        return {
          success: true,
          user: response.data.user,
        };
      }

      return {
        success: false,
        error: 'User not found',
      };
    } catch (error: any) {
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: false,
        error: 'Failed to fetch user details',
      };
    }
  }

  /**
   * Get multiple users by IDs from auth service
   */
  static async getUsersByIds(userIds: string[]): Promise<User[]> {
    try {
      const response = await axios.post(`${this.baseURL}/users/batch`, {
        userIds,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout for batch requests
      });

      if (response.status === 200 && response.data.success) {
        return response.data.users || [];
      }

      return [];
    } catch (error: any) {
      return [];
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractToken(authHeader?: string): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * Check if auth service is available
   */
  static async isServiceAvailable(): Promise<boolean> {
    try {
      // Health endpoint is at /api/v1/health, not /api/v1/auth/health
      const healthUrl = this.baseURL.replace('/auth', '') + '/health';
      const response = await axios.get(healthUrl, {
        timeout: 3000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
