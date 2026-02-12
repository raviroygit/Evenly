import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService';
import { OrganizationService } from '../services/organizationService';
import { UserService } from '../services/userService';
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

const signupWithOtpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().min(10, 'Phone number is required').regex(/^\+[1-9]\d{1,14}$/, 'Phone must be E.164 (e.g. +14155552671)'),
});

const signupVerifyOtpSchema = z.object({
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

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: result.message,
          data: null,
        });
      }

      return reply.status(200).send({
        success: true,
        message: result.message,
        data: null,
      });
    } catch (error: any) {
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
      return reply.status(500).send({ success: false, message: error.message || 'Failed to delete account' });
    }
  }

  /**
   * Signup with OTP: request OTP (name, email, phoneNumber required).
   */
  static async signupWithOtp(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name, email, phoneNumber } = signupWithOtpSchema.parse(request.body);
      const result = await AuthService.signupWithOtp(name, email, phoneNumber, request);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: result.message,
          data: null,
        });
      }

      return reply.status(200).send({
        success: true,
        message: result.message,
        data: null,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to send signup OTP',
      });
    }
  }

  /**
   * Verify signup OTP and complete signup (create account, return tokens like login).
   */
  static async signupVerifyOtp(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email, otp } = signupVerifyOtpSchema.parse(request.body);
      const result = await AuthService.signupVerifyOtp(email, otp, request);

      if (result.success && result.user) {
        if (result.ssoToken) {
          reply.setCookie('sso_token', result.ssoToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
          });
        }

        if (result.organization) {
          try {
            await OrganizationService.syncOrganizationFromData(
              {
                id: result.organization.id,
                name: result.organization.name,
                displayName: result.organization.displayName,
                domainIdentifier: result.organization.domainIdentifier,
                role: result.organization.role,
              },
              result.user.id
            );
          } catch {
          }
        }

        return reply.status(200).send({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            organization: result.organization,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          },
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          ssoToken: result.ssoToken,
        });
      }

      return reply.status(400).send({
        success: false,
        message: result.message || 'Invalid or expired OTP',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to verify signup OTP',
      });
    }
  }

  /**
   * Send OTP for login
   */
  static async requestOTP(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email } = loginSchema.parse(request.body);

      // Pass request to AuthService so it can detect mobile clients and forward header
      const result = await AuthService.requestOTP(email, request);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: result.message,
          data: null,
        });
      }

      return reply.status(200).send({
        success: true,
        message: result.message,
        data: null,
      });
    } catch (error: any) {
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

      // Pass request to AuthService so it can detect mobile clients and forward header
      const result = await AuthService.verifyOTP(email, otp, request);

      if (result.success && result.user) {
        // Set the sso_token cookie
        reply.setCookie('sso_token', result.ssoToken || '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: '/',
        });

        // Sync user to local database
        try {
          await UserService.createOrUpdateUser({
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            avatar: result.user.avatar,
          });
        } catch (syncError: any) {
        }

        // Sync organization to local database if provided
        if (result.organization) {
          try {
            const localOrgId = await OrganizationService.syncOrganizationFromData(
              {
                id: result.organization.id,
                name: result.organization.name,
                displayName: result.organization.displayName,
                domainIdentifier: result.organization.domainIdentifier,
                role: result.organization.role,
              },
              result.user.id
            );
            if (localOrgId) {
            } else {
            }
          } catch (orgSyncError: any) {
          }
        }

        return reply.status(200).send({
          success: true,
          message: result.message,
          data: {
            user: result.user,
            organization: result.organization,
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
            organization: result.organization, // Include organization in response
          },
        });
      }

      return reply.status(401).send({
        success: false,
        message: result.message || 'User not authenticated',
      });
    } catch (error: any) {
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
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to check session expiry',
      });
    }
  }

  /**
   * Update user's preferred language
   */
  static async updateUserLanguage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const updateLanguageSchema = z.object({
        language: z.enum(['en', 'hi'], { errorMap: () => ({ message: 'Language must be "en" or "hi"' }) }),
      });

      const { language } = updateLanguageSchema.parse(request.body);
      const userId = (request as any).user?.id;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: 'Unauthorized',
        });
      }

      await UserService.updateUserLanguage(userId, language);

      return reply.status(200).send({
        success: true,
        message: 'Language preference updated successfully',
        data: { language },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to update language preference',
      });
    }
  }

  /**
   * Update user's preferred currency
   */
  static async updateUserCurrency(request: FastifyRequest, reply: FastifyReply) {
    try {
      const updateCurrencySchema = z.object({
        currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CNY', 'AED', 'SAR'], {
          errorMap: () => ({ message: 'Invalid currency code' }),
        }),
      });

      const { currency } = updateCurrencySchema.parse(request.body);
      const userId = (request as any).user?.id;

      if (!userId) {
        return reply.status(401).send({
          success: false,
          message: 'Unauthorized',
        });
      }

      await UserService.updateUserCurrency(userId, currency);

      return reply.status(200).send({
        success: true,
        message: 'Currency preference updated successfully',
        data: { currency },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
      }

      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to update currency preference',
      });
    }
  }
}
