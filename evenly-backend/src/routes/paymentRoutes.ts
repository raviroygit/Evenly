import { FastifyInstance } from 'fastify';
import { PaymentController } from '../controllers/paymentController';
import { authenticateToken } from '../middlewares/auth';

export async function paymentRoutes(fastify: FastifyInstance) {
  // Apply authentication to all payment routes
  fastify.addHook('preHandler', authenticateToken);

  // Payment CRUD operations
  fastify.post('/', {
    schema: {
      description: 'Create a new payment',
      tags: ['Payments'],
      body: {
        type: 'object',
        required: ['fromUserId', 'toUserId', 'groupId', 'amount'],
        properties: {
          fromUserId: { type: 'string', format: 'uuid' },
          toUserId: { type: 'string', format: 'uuid' },
          groupId: { type: 'string', format: 'uuid' },
          amount: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$' },
          currency: { type: 'string', pattern: '^[A-Z]{3}$', default: 'USD' },
          description: { type: 'string', maxLength: 500 },
        },
      },
    },
  }, PaymentController.createPayment);

  fastify.get('/user', {
    schema: {
      description: 'Get user\'s payments',
      tags: ['Payments'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', pattern: '^\\d+$', default: '1' },
          limit: { type: 'string', pattern: '^\\d+$', default: '20' },
          status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] },
          type: { type: 'string', enum: ['sent', 'received'] },
        },
      },
    },
  }, PaymentController.getUserPayments);

  fastify.get('/group/:groupId', {
    schema: {
      description: 'Get group payments',
      tags: ['Payments'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', pattern: '^\\d+$', default: '1' },
          limit: { type: 'string', pattern: '^\\d+$', default: '20' },
          status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] },
        },
      },
    },
  }, PaymentController.getGroupPayments);

  fastify.get('/:paymentId', {
    schema: {
      description: 'Get payment by ID',
      tags: ['Payments'],
      params: {
        type: 'object',
        required: ['paymentId'],
        properties: {
          paymentId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, PaymentController.getPaymentById);

  fastify.put('/:paymentId', {
    schema: {
      description: 'Update payment status',
      tags: ['Payments'],
      params: {
        type: 'object',
        required: ['paymentId'],
        properties: {
          paymentId: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] },
        },
      },
    },
  }, PaymentController.updatePaymentStatus);

  fastify.delete('/:paymentId', {
    schema: {
      description: 'Delete payment',
      tags: ['Payments'],
      params: {
        type: 'object',
        required: ['paymentId'],
        properties: {
          paymentId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, PaymentController.deletePayment);


  fastify.get('/stats/group/:groupId', {
    schema: {
      description: 'Get group payment statistics',
      tags: ['Payments'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, PaymentController.getGroupPaymentStats);
}