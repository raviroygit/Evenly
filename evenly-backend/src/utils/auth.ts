import axios from 'axios';
import { config } from '../config/config';
import { AuthServiceResponse, User } from '../types';

export class AuthService {
  private static readonly baseURL = config.auth.serviceUrl;

  /**
   * Validate session token with auth service
   */
  static async validateToken(token: string): Promise<AuthServiceResponse> {
    try {
      console.log('🔍 AuthService: Validating token with external auth service...');
      console.log('🔍 AuthService: Token prefix:', token.substring(0, 8));
      console.log('🔍 AuthService: Auth service URL:', this.baseURL);
      
      const response = await axios.get(`${this.baseURL}/me`, {
        headers: {
          'Cookie': `sso_token=${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      });

      console.log('🔍 AuthService: Response status:', response.status);
      console.log('🔍 AuthService: Response data:', response.data);

      if (response.status === 200 && response.data.success) {
        console.log('✅ AuthService: Token validation successful');
        return {
          success: true,
          user: response.data.user,
        };
      }

      console.log('❌ AuthService: Invalid response from auth service');
      return {
        success: false,
        error: 'Invalid token',
      };
    } catch (error: any) {
      console.error('❌ AuthService: Validation error:', error.message);
      console.error('❌ AuthService: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code
      });
      
      if (error.response?.status === 401) {
        console.log('❌ AuthService: 401 Unauthorized - Invalid token');
        return {
          success: false,
          error: 'Unauthorized - Invalid token',
        };
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.log('❌ AuthService: Connection error - Auth service unavailable');
        return {
          success: false,
          error: 'Auth service unavailable',
        };
      }

      console.log('❌ AuthService: General token validation failed');
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
      console.error('Auth service user fetch error:', error.message);
      
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
      console.error('Auth service batch user fetch error:', error.message);
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
