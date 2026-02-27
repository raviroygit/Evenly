import { FastifyInstance } from 'fastify';
import { ReferralController } from '../controllers/referralController';
import { authenticateToken } from '../middlewares/auth';

export async function referralRoutes(fastify: FastifyInstance) {
  // GET /my-code — get or generate referral code (auth required)
  fastify.get('/my-code', {
    preHandler: authenticateToken,
    schema: {
      description: 'Get or generate the current user\'s referral code',
      tags: ['Referrals'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                referralCode: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, ReferralController.getMyReferralCode as any);

  // GET /stats — get referral statistics (auth required)
  fastify.get('/stats', {
    preHandler: authenticateToken,
    schema: {
      description: 'Get referral statistics for the current user',
      tags: ['Referrals'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalReferrals: { type: 'number' },
                completedReferrals: { type: 'number' },
                referredUsers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      joinedAt: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, ReferralController.getReferralStats as any);

  // POST /apply — apply a referral code (auth required)
  fastify.post('/apply', {
    preHandler: authenticateToken,
    schema: {
      description: 'Apply a referral code to the current user',
      tags: ['Referrals'],
      body: {
        type: 'object',
        required: ['referralCode'],
        properties: {
          referralCode: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, ReferralController.applyReferral as any);

  // GET /validate/:code — validate a referral code (public, no auth)
  fastify.get('/validate/:code', {
    schema: {
      description: 'Validate a referral code (public endpoint)',
      tags: ['Referrals'],
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                valid: { type: 'boolean' },
                referrerName: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, ReferralController.validateCode as any);
}
