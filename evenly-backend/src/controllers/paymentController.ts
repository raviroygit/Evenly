import { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentService } from '../services/paymentService';
import { 
  createPaymentSchema, 
  updatePaymentSchema,
  paginationSchema,
  type CreatePaymentInput,
  type UpdatePaymentInput,
  type PaginationQuery
} from '../utils/validation';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/errors';

export class PaymentController {
  /**
   * Create a new payment
   */
  static createPayment = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const paymentData = createPaymentSchema.parse(request.body);

    const payment = await PaymentService.createPayment(paymentData, user.id);

    reply.status(201).send({
      success: true,
      data: payment,
      message: 'Payment created successfully',
    });
  });

  /**
   * Get payment by ID
   */
  static getPaymentById = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { paymentId } = request.params as { paymentId: string };

    const payment = await PaymentService.getPaymentById(paymentId);
    if (!payment) {
      return reply.status(404).send({
        success: false,
        message: 'Payment not found',
      });
    }

    reply.send({
      success: true,
      data: payment,
      message: 'Payment retrieved successfully',
    });
  });

  /**
   * Get group payments
   */
  static getGroupPayments = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId } = request.params as { groupId: string };
    const query = paginationSchema.parse(request.query);
    const { status } = request.query as { status?: 'pending' | 'completed' | 'cancelled' };

    const result = await PaymentService.getGroupPayments(groupId, user.id, {
      page: query.page,
      limit: query.limit,
      status,
    });

    reply.send({
      success: true,
      data: result.payments,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
        hasNext: query.page * query.limit < result.total,
        hasPrev: query.page > 1,
      },
      message: 'Group payments retrieved successfully',
    });
  });

  /**
   * Get user's payments
   */
  static getUserPayments = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const query = paginationSchema.parse(request.query);
    const { status, type } = request.query as { 
      status?: 'pending' | 'completed' | 'cancelled';
      type?: 'sent' | 'received';
    };

    const result = await PaymentService.getUserPayments(user.id, {
      page: query.page,
      limit: query.limit,
      status,
      type,
    });

    reply.send({
      success: true,
      data: result.payments,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
        hasNext: query.page * query.limit < result.total,
        hasPrev: query.page > 1,
      },
      message: 'User payments retrieved successfully',
    });
  });

  /**
   * Update payment status
   */
  static updatePaymentStatus = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { paymentId } = request.params as { paymentId: string };
    const { status } = request.body as { status: 'pending' | 'completed' | 'cancelled' };

    const payment = await PaymentService.updatePaymentStatus(paymentId, status, user.id);

    reply.send({
      success: true,
      data: payment,
      message: 'Payment status updated successfully',
    });
  });

  /**
   * Delete payment
   */
  static deletePayment = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { paymentId } = request.params as { paymentId: string };

    await PaymentService.deletePayment(paymentId, user.id);

    reply.send({
      success: true,
      message: 'Payment deleted successfully',
    });
  });

  /**
   * Get payment statistics for a group
   */
  static getGroupPaymentStats = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId } = request.params as { groupId: string };

    const stats = await PaymentService.getGroupPaymentStats(groupId, user.id);

    reply.send({
      success: true,
      data: stats,
      message: 'Payment statistics retrieved successfully',
    });
  });
}
