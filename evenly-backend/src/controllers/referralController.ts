import { FastifyReply } from 'fastify';
import { z } from 'zod';
import { ReferralService } from '../services/referralService';
import { AuthenticatedRequest } from '../types';

const applyReferralSchema = z.object({
  referralCode: z.string().min(1, 'Referral code is required'),
});

export class ReferralController {
  /**
   * GET /my-code — get or generate the current user's referral code
   */
  static async getMyReferralCode(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      const referralCode = await ReferralService.getOrCreateReferralCode(userId);

      return reply.status(200).send({
        success: true,
        data: { referralCode },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to get referral code',
      });
    }
  }

  /**
   * GET /stats — get referral statistics for the current user
   */
  static async getReferralStats(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      const stats = await ReferralService.getReferralStats(userId);

      return reply.status(200).send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to get referral stats',
      });
    }
  }

  /**
   * POST /apply — apply a referral code to the current (new) user
   */
  static async applyReferral(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { referralCode } = applyReferralSchema.parse(request.body);
      const userId = request.user.id;

      const result = await ReferralService.applyReferralCode(referralCode, userId);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: result.message,
        });
      }

      return reply.status(200).send({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({
          success: false,
          message: 'Invalid input',
          errors: error.errors,
        });
      }
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to apply referral code',
      });
    }
  }

  /**
   * GET /validate/:code — validate a referral code (public, no auth required)
   */
  static async validateCode(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { code } = request.params as { code: string };

      if (!code) {
        return reply.status(400).send({
          success: false,
          message: 'Referral code is required',
        });
      }

      const result = await ReferralService.validateReferralCode(code);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to validate referral code',
      });
    }
  }
}
