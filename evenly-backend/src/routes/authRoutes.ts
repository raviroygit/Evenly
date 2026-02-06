import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/authController';

export async function authRoutes(fastify: FastifyInstance) {
  // Signup - Send magic link
  fastify.post('/signup', {
    schema: {
      description: 'Send magic link for user signup',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'null' },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            errors: { type: 'array' },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, AuthController.signup);

  // Signup with OTP - Request OTP (name, email, phoneNumber required)
  fastify.post('/signup/otp', {
    schema: {
      description: 'Request signup OTP (name, email, phone number required)',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['name', 'email', 'phoneNumber'],
        properties: {
          name: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
          phoneNumber: { type: 'string', description: 'E.164 e.g. +14155552671' },
        },
      },
      response: {
        200: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'null' } } },
        400: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, errors: { type: 'array' } } },
        500: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
      },
    },
  }, AuthController.signupWithOtp);

  // Signup with OTP - Verify OTP and create account
  fastify.post('/signup/verify-otp', {
    schema: {
      description: 'Verify signup OTP and complete registration',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'otp'],
        properties: {
          email: { type: 'string', format: 'email' },
          otp: { type: 'string', minLength: 4 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: { type: 'object' },
                organization: { type: 'object' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        400: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
        500: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
      },
    },
  }, AuthController.signupVerifyOtp);

  // Login - Request OTP
  fastify.post('/login/otp', {
    schema: {
      description: 'Send OTP for user login',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'null' },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            errors: { type: 'array' },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, AuthController.requestOTP);

  // Login - Verify OTP
  fastify.post('/login/verify-otp', {
    schema: {
      description: 'Verify OTP and complete login',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'otp'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          otp: {
            type: 'string',
            minLength: 4,
            description: 'OTP code received via email',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    avatar: { type: 'string' },
                    phoneNumber: { type: 'string' },
                    role: { type: 'string' },
                  },
                },
                organization: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    displayName: { type: 'string' },
                    domainIdentifier: { type: 'string' },
                    role: { type: 'string' },
                  },
                },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            errors: { type: 'array' },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, AuthController.verifyOTP);

  // Refresh Token
  fastify.post('/refresh-token', {
    schema: {
      description: 'Refresh access token using refresh token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: 'Refresh token',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, AuthController.refreshToken);

  // Get Current User
  fastify.get('/me', {
    schema: {
      description: 'Get current authenticated user info',
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    avatar: { type: 'string' },
                    phoneNumber: { type: 'string' },
                  },
                },
                organization: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    displayName: { type: 'string' },
                    domainIdentifier: { type: 'string' },
                    slug: { type: 'string' },
                    role: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, AuthController.getCurrentUser);

  // Update Current User
  fastify.put('/me', {
    schema: {
      description: 'Update current authenticated user info',
      tags: ['Authentication'],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  }, AuthController.updateCurrentUser);

  // Delete Current User
  fastify.delete('/me', {
    schema: {
      description: 'Delete current authenticated user',
      tags: ['Authentication'],
    },
  }, AuthController.deleteCurrentUser);

  // Social Login - Google
  fastify.post('/social/google', {
    schema: {
      description: 'Login/signup via Google ID token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['idToken'],
        properties: {
          idToken: { type: 'string' },
        },
      },
    },
  }, AuthController.googleLogin);

  // Logout
  fastify.post('/logout', {
    schema: {
      description: 'Logout current user',
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'null' },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, AuthController.logout);

  // Mobile-specific: Silent token refresh
  fastify.post('/mobile/refresh', {
    schema: {
      description: 'Silent token refresh for mobile apps (90-day sessions, no OTP required)',
      tags: ['Mobile Authentication'],
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: 'Refresh token from login',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            ssoToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                avatar: { type: 'string' },
              },
            },
            expiresAt: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, AuthController.mobileRefresh);

  // Mobile-specific: Check session expiry
  fastify.get('/mobile/session-expiry', {
    schema: {
      description: 'Check when current session expires (for mobile apps to schedule refresh)',
      tags: ['Mobile Authentication'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            expiresAt: { type: 'string' },
            expiresInMs: { type: 'number' },
            expiresInMinutes: { type: 'number' },
            shouldRefresh: { type: 'boolean' },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, AuthController.mobileSessionExpiry);
}
