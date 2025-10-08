import { FastifyRequest, FastifyReply } from 'fastify';
import { BalanceService } from '../services/balanceService';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/errors';

export class BalanceController {
  /**
   * Get group balances
   */
  static getGroupBalances = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId } = request.params as { groupId: string };

    const balances = await BalanceService.getGroupBalances(groupId, user.id);

    reply.send({
      success: true,
      data: balances,
      message: 'Group balances retrieved successfully',
    });
  });

  /**
   * Get user's balances across all groups
   */
  static getUserBalances = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;

    const balances = await BalanceService.getUserBalances(user.id);

    reply.send({
      success: true,
      data: balances,
      message: 'User balances retrieved successfully',
    });
  });

  /**
   * Get simplified debts for a group
   */
  static getSimplifiedDebts = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId } = request.params as { groupId: string };

    const simplifiedDebts = await BalanceService.getSimplifiedDebts(groupId, user.id);

    reply.send({
      success: true,
      data: simplifiedDebts,
      message: 'Simplified debts retrieved successfully',
    });
  });

  /**
   * Get user's net balance
   */
  static getUserNetBalance = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;

    const netBalance = await BalanceService.getUserNetBalance(user.id);

    reply.send({
      success: true,
      data: netBalance,
      message: 'User net balance retrieved successfully',
    });
  });

  /**
   * Get group balance summary
   */
  static getGroupBalanceSummary = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId } = request.params as { groupId: string };

    const summary = await BalanceService.getGroupBalanceSummary(groupId, user.id);

    reply.send({
      success: true,
      data: summary,
      message: 'Group balance summary retrieved successfully',
    });
  });

  /**
   * Recalculate group balances
   */
  static recalculateGroupBalances = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId } = request.params as { groupId: string };

    await BalanceService.recalculateGroupBalances(groupId, user.id);

    reply.send({
      success: true,
      message: 'Group balances recalculated successfully',
    });
  });

  /**
   * Get balance history
   */
  static getBalanceHistory = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId, userId } = request.params as { groupId: string; userId: string };

    const history = await BalanceService.getBalanceHistory(groupId, user.id, userId);

    reply.send({
      success: true,
      data: history,
      message: 'Balance history retrieved successfully',
    });
  });

  /**
   * Validate group balance consistency
   */
  static validateGroupBalanceConsistency = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { groupId } = request.params as { groupId: string };

    const validation = await BalanceService.validateGroupBalanceConsistency(groupId);

    reply.send({
      success: true,
      data: validation,
      message: 'Group balance consistency validated',
    });
  });
}
