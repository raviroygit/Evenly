import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService';
import { z } from 'zod';

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().min(4, 'OTP must be at least 4 characters'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const mobileRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export class AuthController {
  /**
   * Send magic link for signup
   */
  static async signup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email } = signupSchema.parse(request.body);

      const result = await AuthService.signup(email);

      return reply.status(200).send({
        success: true,
        message: result.message,
        data: null,
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to send signup link',
      });
    }
  }

  /**
   * Update current user profile (proxy to auth service)
   */
  static async updateCurrentUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as { name?: string; email?: string };
      const result = await AuthService.updateUser(request, body);

      if (result.success) {
        return reply.status(200).send({
          success: true,
          message: result.message || 'User updated successfully',
          data: {
            user: result.user,
          },
        });
      }

      return reply.status(400).send({
        success: false,
        message: result.message || 'Failed to update user',
      });
    } catch (error: any) {
      console.error('Update user error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to update user',
      });
    }
  }

  /**
   * Delete current user (proxy to auth service)
   */
  static async deleteCurrentUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await AuthService.deleteUser(request);
      if (result.success) {
        return reply.status(200).send({ success: true, message: result.message || 'Account deleted', data: null });
      }
      return reply.status(400).send({ success: false, message: result.message || 'Failed to delete account' });
    } catch (error: any) {
      console.error('Delete user error:', error);
      return reply.status(500).send({ success: false, message: error.message || 'Failed to delete account' });
    }
  }

  /**
   * Send OTP for login
   */
  static async requestOTP(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email } = loginSchema.parse(request.body);

      const result = await AuthService.requestOTP(email);

      return reply.status(200).send({
        success: true,
        message: result.message,
        data: null,
      });
    } catch (error: any) {
      console.error('Request OTP error:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to send OTP',
      });
    }
  }

  /**
   * Verify OTP and login
   */
  static async verifyOTP(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email, otp } = verifyOTPSchema.parse(request.body);

      const result = await AuthService.verifyOTP(email, otp);

      if (result.success && result.user) {
        // Set the sso_token cookie
        reply.setCookie('sso_token', result.ssoToken || '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
        });

        return reply.status(200).send({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          },
          ssoToken: result.ssoToken, // Include ssoToken in response
        });
      }

      return reply.status(400).send({
        success: false,
        message: result.message || 'Invalid OTP',
      });
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to verify OTP',
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { refreshToken } = refreshTokenSchema.parse(request.body);

      const result = await AuthService.refreshToken(refreshToken);

      if (result.success && result.accessToken) {
        return reply.status(200).send({
          success: true,
          message: 'Token refreshed successfully',
          data: {
            accessToken: result.accessToken,
          },
        });
      }

      return reply.status(401).send({
        success: false,
        message: result.message || 'Failed to refresh token',
      });
    } catch (error: any) {
      console.error('Refresh token error:', error);
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to refresh token',
      });
    }
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await AuthService.getCurrentUser(request);

      if (result.success && result.user) {
        return reply.status(200).send({
          success: true,
          message: 'User retrieved successfully',
          data: {
            user: result.user,
          },
        });
      }

      return reply.status(401).send({
        success: false,
        message: result.message || 'User not authenticated',
      });
    } catch (error: any) {
      console.error('Get current user error:', error);
      
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to get user info',
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await AuthService.logout(request);

      // Clear the sso_token cookie
      reply.clearCookie('sso_token', {
        path: '/',
      });

      return reply.status(200).send({
        success: true,
        message: result.message || 'Logged out successfully',
        data: null,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to logout',
      });
    }
  }

  /**
   * Google social login: verify idToken, upsert user, create session cookie
   */
  static async googleLogin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { idToken } = request.body as { idToken: string };
      if (!idToken) return reply.status(400).send({ success: false, message: 'Missing idToken' });

      const result = await AuthService.socialLoginGoogle(idToken);
      if (result.success && result.user) {
        if (result.ssoToken) {
          reply.setCookie('sso_token', result.ssoToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' || request.protocol === 'https',
            sameSite: 'none',
            domain: process.env.DOMAIN || 'localhost',
            path: '/',
            maxAge: 86400,
          });
        }

        return reply.status(200).send({
          success: true,
          message: result.message || 'Login successful',
          data: {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          },
          ssoToken: result.ssoToken,
        });
      }

      return reply.status(400).send({ success: false, message: result.message || 'Google login failed' });
    } catch (err: any) {
      return reply.code(500).send({ success: false, message: err.message || 'Google login failed' });
    }
  }

  /**
   * Mobile-specific: Silent token refresh (wrapper to auth service)
   * Uses refresh token to create new 90-day session - NO OTP required
   */
  static async mobileRefresh(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { refreshToken } = mobileRefreshSchema.parse(request.body);

      const result = await AuthService.mobileRefresh(refreshToken);

      if (result.success && result.user) {
        // Set the sso_token cookie
        if (result.ssoToken) {
          reply.setCookie('sso_token', result.ssoToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
            path: '/',
          });
        }

        return reply.status(200).send({
          success: true,
          message: result.message,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          ssoToken: result.ssoToken,
          user: result.user,
          expiresAt: new Date(Date.now() + 90 * 86400 * 1000).toISOString(), // 90 days
        });
      }

      return reply.status(401).send({
        success: false,
        message: result.message || 'Failed to refresh session',
      });
    } catch (error: any) {
      console.error('Mobile refresh error:', error);

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to refresh session',
      });
    }
  }

  /**
   * Mobile-specific: Get session expiry info (wrapper to auth service)
   * Returns when session expires and whether it should be refreshed soon
   */
  static async mobileSessionExpiry(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await AuthService.mobileSessionExpiry(request);

      if (result.success) {
        return reply.status(200).send(result);
      }

      return reply.status(401).send(result);
    } catch (error: any) {
      console.error('Mobile session expiry error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to check session expiry',
      });
    }
  }
}
