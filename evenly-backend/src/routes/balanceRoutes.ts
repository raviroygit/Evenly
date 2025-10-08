import { FastifyInstance } from 'fastify';
import { BalanceController } from '../controllers/balanceController';
import { authenticateToken } from '../middlewares/auth';

export async function balanceRoutes(fastify: FastifyInstance) {
  // Apply authentication to all balance routes
  fastify.addHook('preHandler', authenticateToken);

  // User balance routes
  fastify.get('/user', {
    schema: {
      description: 'Get user\'s balances across all groups',
      tags: ['Balances'],
    },
  }, BalanceController.getUserBalances);

  fastify.get('/user/net', {
    schema: {
      description: 'Get user\'s net balance (total owed - total owing)',
      tags: ['Balances'],
    },
  }, BalanceController.getUserNetBalance);

  // Group balance routes
  fastify.get('/group/:groupId', {
    schema: {
      description: 'Get group balances',
      tags: ['Balances'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, BalanceController.getGroupBalances);

  fastify.get('/group/:groupId/summary', {
    schema: {
      description: 'Get group balance summary',
      tags: ['Balances'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, BalanceController.getGroupBalanceSummary);

  fastify.get('/group/:groupId/simplified-debts', {
    schema: {
      description: 'Get simplified debts for a group (who owes whom)',
      tags: ['Balances'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, BalanceController.getSimplifiedDebts);

  fastify.get('/group/:groupId/history/:userId', {
    schema: {
      description: 'Get balance history for a user in a group',
      tags: ['Balances'],
      params: {
        type: 'object',
        required: ['groupId', 'userId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, BalanceController.getBalanceHistory);

  // Admin routes
  fastify.post('/group/:groupId/recalculate', {
    schema: {
      description: 'Recalculate group balances (admin only)',
      tags: ['Balances'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, BalanceController.recalculateGroupBalances);

  fastify.get('/group/:groupId/validate', {
    schema: {
      description: 'Validate group balance consistency',
      tags: ['Balances'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, BalanceController.validateGroupBalanceConsistency);
}