import { eq, and, desc, count } from 'drizzle-orm';
import { db, payments, userBalances, users, groups, type Payment, type NewPayment } from '../db';
import { alias } from 'drizzle-orm/pg-core';
import { GroupService } from './groupService';
import { NotFoundError, ForbiddenError, ValidationError, DatabaseError } from '../utils/errors';

export class PaymentService {
  /**
   * Create a new payment
   */
  static async createPayment(
    paymentData: {
      fromUserId: string;
      toUserId: string;
      groupId: string;
      amount: string;
      currency?: string;
      description?: string;
    },
    createdBy: string,
    organizationId?: string
  ): Promise<Payment> {
    try {
      // Validate group belongs to organization
      if (organizationId) {
        const [group] = await db
          .select()
          .from(groups)
          .where(and(eq(groups.id, paymentData.groupId), eq(groups.organizationId, organizationId)))
          .limit(1);

        if (!group) {
          throw new NotFoundError('Group not found or does not belong to your organization');
        }
      }

      // Validate group membership
      const isMember = await GroupService.isUserGroupMember(paymentData.groupId, createdBy);
      if (!isMember) {
        throw new ForbiddenError('You are not a member of this group');
      }

      // Validate both users are group members
      const isFromUserMember = await GroupService.isUserGroupMember(paymentData.groupId, paymentData.fromUserId);
      const isToUserMember = await GroupService.isUserGroupMember(paymentData.groupId, paymentData.toUserId);

      if (!isFromUserMember || !isToUserMember) {
        throw new ValidationError('Both users must be members of the group');
      }

      // Validate amount
      const amount = parseFloat(paymentData.amount);
      if (amount <= 0) {
        throw new ValidationError('Payment amount must be positive');
      }

      // Check if there's actually a debt to settle
      const fromUserBalance = await this.getUserBalanceInGroup(paymentData.fromUserId, paymentData.groupId, organizationId);
      const toUserBalance = await this.getUserBalanceInGroup(paymentData.toUserId, paymentData.groupId, organizationId);

      // fromUserBalance should be negative (they owe money)
      // toUserBalance should be positive (they are owed money)
      if (fromUserBalance >= 0 || toUserBalance <= 0) {
        throw new ValidationError('No debt exists between these users in this group');
      }

      // Validate payment amount doesn't exceed debt
      const maxPaymentAmount = Math.min(Math.abs(fromUserBalance), toUserBalance);
      if (amount > maxPaymentAmount) {
        throw new ValidationError(`Payment amount cannot exceed the debt of $${maxPaymentAmount.toFixed(2)}`);
      }

      const newPayment: NewPayment = {
        fromUserId: paymentData.fromUserId,
        toUserId: paymentData.toUserId,
        groupId: paymentData.groupId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        description: paymentData.description,
        status: 'pending',
      };

      const [createdPayment] = await db
        .insert(payments)
        .values(newPayment)
        .returning();

      return createdPayment;
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error creating payment:', error);
      throw new DatabaseError('Failed to create payment');
    }
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId: string, organizationId?: string): Promise<Payment | null> {
    try {
      if (organizationId) {
        // Validate payment belongs to organization via groups table
        const [payment] = await db
          .select({
            id: payments.id,
            fromUserId: payments.fromUserId,
            toUserId: payments.toUserId,
            groupId: payments.groupId,
            amount: payments.amount,
            currency: payments.currency,
            description: payments.description,
            paymentMethod: payments.paymentMethod,
            status: payments.status,
            createdAt: payments.createdAt,
            updatedAt: payments.updatedAt,
          })
          .from(payments)
          .innerJoin(groups, eq(payments.groupId, groups.id))
          .where(and(eq(payments.id, paymentId), eq(groups.organizationId, organizationId)))
          .limit(1);

        if (!payment) {
          throw new NotFoundError('Payment not found or does not belong to your organization');
        }

        return payment;
      } else {
        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.id, paymentId))
          .limit(1);

        return payment || null;
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching payment:', error);
      throw new DatabaseError('Failed to fetch payment');
    }
  }

  /**
   * Get payments for a group
   */
  static async getGroupPayments(
    groupId: string,
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: 'pending' | 'completed' | 'cancelled';
    } = {},
    organizationId?: string
  ): Promise<{
    payments: (Payment & { fromUser: any; toUser: any })[];
    total: number;
  }> {
    try {
      // Validate group belongs to organization
      if (organizationId) {
        const [group] = await db
          .select()
          .from(groups)
          .where(and(eq(groups.id, groupId), eq(groups.organizationId, organizationId)))
          .limit(1);

        if (!group) {
          throw new NotFoundError('Group not found or does not belong to your organization');
        }
      }

      // Check if user is a member of the group
      const isMember = await GroupService.isUserGroupMember(groupId, userId);
      if (!isMember) {
        throw new ForbiddenError('You are not a member of this group');
      }

      const { page = 1, limit = 20, status } = options;
      const offset = (page - 1) * limit;

      // Create aliases for users table
      const fromUser = alias(users, 'fromUser');
      const toUser = alias(users, 'toUser');

      // Build query conditions
      let whereConditions: any = eq(payments.groupId, groupId);
      if (status) {
        whereConditions = and(whereConditions, eq(payments.status, status));
      }

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(payments)
        .where(whereConditions);

      // Get payments
      const paymentsList = await db
        .select({
          id: payments.id,
          fromUserId: payments.fromUserId,
          toUserId: payments.toUserId,
          groupId: payments.groupId,
          amount: payments.amount,
          currency: payments.currency,
          description: payments.description,
          paymentMethod: payments.paymentMethod,
          status: payments.status,
          createdAt: payments.createdAt,
          updatedAt: payments.updatedAt,
          fromUser: {
            id: fromUser.id,
            email: fromUser.email,
            name: fromUser.name,
            avatar: fromUser.avatar,
          },
          toUser: {
            id: fromUser.id,
            email: fromUser.email,
            name: fromUser.name,
            avatar: fromUser.avatar,
          },
        })
        .from(payments)
        .leftJoin(fromUser, eq(payments.fromUserId, fromUser.id))
        .leftJoin(toUser, eq(payments.toUserId, toUser.id))
        .where(whereConditions)
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        payments: paymentsList,
        total: totalResult.count,
      };
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching group payments:', error);
      throw new DatabaseError('Failed to fetch group payments');
    }
  }

  /**
   * Get user's payments
   */
  static async getUserPayments(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: 'pending' | 'completed' | 'cancelled';
      type?: 'sent' | 'received';
    } = {},
    organizationId?: string
  ): Promise<{
    payments: (Payment & { fromUser: any; toUser: any })[];
    total: number;
  }> {
    try {
      const { page = 1, limit = 20, status, type } = options;
      const offset = (page - 1) * limit;

      // Create aliases for users table
      const fromUser = alias(users, 'fromUser');
      const toUser = alias(users, 'toUser');

      // Build query conditions - start with user filter
      let whereConditions: any;
      if (type === 'sent') {
        whereConditions = eq(payments.fromUserId, userId);
      } else if (type === 'received') {
        whereConditions = eq(payments.toUserId, userId);
      } else {
        whereConditions = and(
          eq(payments.fromUserId, userId),
          eq(payments.toUserId, userId)
        );
      }

      if (status) {
        if (whereConditions) {
          whereConditions = and(whereConditions, eq(payments.status, status));
        } else {
          whereConditions = eq(payments.status, status);
        }
      }

      // Add organizationId filter if provided
      if (organizationId) {
        whereConditions = whereConditions
          ? and(whereConditions, eq(groups.organizationId, organizationId))
          : eq(groups.organizationId, organizationId);
      }

      // Get total count - join with groups if organizationId is provided
      let totalCountQuery = db.select({ count: count() }).from(payments);
      if (organizationId) {
        totalCountQuery = totalCountQuery.innerJoin(groups, eq(payments.groupId, groups.id)) as any;
      }
      const [totalResult] = await totalCountQuery.where(whereConditions);

      // Get payments - join with groups if organizationId is provided
      let paymentsQuery = db
        .select({
          id: payments.id,
          fromUserId: payments.fromUserId,
          toUserId: payments.toUserId,
          groupId: payments.groupId,
          amount: payments.amount,
          currency: payments.currency,
          description: payments.description,
          paymentMethod: payments.paymentMethod,
          status: payments.status,
          createdAt: payments.createdAt,
          updatedAt: payments.updatedAt,
          fromUser: {
            id: fromUser.id,
            email: fromUser.email,
            name: fromUser.name,
            avatar: fromUser.avatar,
          },
          toUser: {
            id: fromUser.id,
            email: fromUser.email,
            name: fromUser.name,
            avatar: fromUser.avatar,
          },
        })
        .from(payments);

      if (organizationId) {
        paymentsQuery = paymentsQuery.innerJoin(groups, eq(payments.groupId, groups.id)) as any;
      }

      const paymentsList = await paymentsQuery
        .leftJoin(fromUser, eq(payments.fromUserId, fromUser.id))
        .leftJoin(toUser, eq(payments.toUserId, toUser.id))
        .where(whereConditions)
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        payments: paymentsList,
        total: totalResult.count,
      };
    } catch (error) {
      console.error('Error fetching user payments:', error);
      throw new DatabaseError('Failed to fetch user payments');
    }
  }

  /**
   * Update payment status
   */
  static async updatePaymentStatus(
    paymentId: string,
    status: 'pending' | 'completed' | 'cancelled',
    userId: string,
    organizationId?: string
  ): Promise<Payment> {
    try {
      const payment = await this.getPaymentById(paymentId, organizationId);
      if (!payment) {
        throw new NotFoundError('Payment');
      }

      // Check if user is involved in the payment or is a group admin
      const isInvolved = payment.fromUserId === userId || payment.toUserId === userId;
      const isAdmin = await GroupService.isUserGroupAdmin(payment.groupId, userId);

      if (!isInvolved && !isAdmin) {
        throw new ForbiddenError('You can only update payments you are involved in');
      }

      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      const [updatedPayment] = await db
        .update(payments)
        .set(updateData)
        .where(eq(payments.id, paymentId))
        .returning();

      if (!updatedPayment) {
        throw new NotFoundError('Payment');
      }

      // If payment is completed, update user balances
      if (status === 'completed') {
        await this.updateBalancesAfterPayment(paymentId, organizationId);
      }

      return updatedPayment;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      console.error('Error updating payment status:', error);
      throw new DatabaseError('Failed to update payment status');
    }
  }

  /**
   * Delete payment
   */
  static async deletePayment(paymentId: string, userId: string, organizationId?: string): Promise<void> {
    try {
      const payment = await this.getPaymentById(paymentId, organizationId);
      if (!payment) {
        throw new NotFoundError('Payment');
      }

      // Check if user is involved in the payment or is a group admin
      const isInvolved = payment.fromUserId === userId || payment.toUserId === userId;
      const isAdmin = await GroupService.isUserGroupAdmin(payment.groupId, userId);

      if (!isInvolved && !isAdmin) {
        throw new ForbiddenError('You can only delete payments you are involved in');
      }

      // Only allow deletion of pending payments
      if (payment.status !== 'pending') {
        throw new ValidationError('Only pending payments can be deleted');
      }

      await db.delete(payments).where(eq(payments.id, paymentId));
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error deleting payment:', error);
      throw new DatabaseError('Failed to delete payment');
    }
  }

  /**
   * Get user balance in a specific group
   */
  private static async getUserBalanceInGroup(userId: string, groupId: string, organizationId?: string): Promise<number> {
    try {
      // Validate group belongs to organization if provided
      if (organizationId) {
        const [group] = await db
          .select()
          .from(groups)
          .where(and(eq(groups.id, groupId), eq(groups.organizationId, organizationId)))
          .limit(1);

        if (!group) {
          throw new NotFoundError('Group not found or does not belong to your organization');
        }
      }

      const [balance] = await db
        .select()
        .from(userBalances)
        .where(and(eq(userBalances.userId, userId), eq(userBalances.groupId, groupId)))
        .limit(1);

      return balance ? parseFloat(balance.balance) : 0;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching user balance:', error);
      return 0;
    }
  }

  /**
   * Update user balances after payment completion
   */
  private static async updateBalancesAfterPayment(paymentId: string, organizationId?: string): Promise<void> {
    try {
      const payment = await this.getPaymentById(paymentId, organizationId);
      if (!payment || payment.status !== 'completed') {
        return;
      }

      const amount = parseFloat(payment.amount);
      const groupId = payment.groupId;
      const fromUserId = payment.fromUserId;
      const toUserId = payment.toUserId;

      // Update from user's balance (reduce their debt)
      const fromUserBalance = await this.getUserBalanceInGroup(fromUserId, groupId, organizationId);
      const newFromUserBalance = fromUserBalance + amount; // fromUserBalance is negative, so adding amount reduces debt

      await db
        .update(userBalances)
        .set({
          balance: newFromUserBalance.toString(),
          updatedAt: new Date(),
        })
        .where(and(eq(userBalances.userId, fromUserId), eq(userBalances.groupId, groupId)));

      // Update to user's balance (reduce what they are owed)
      const toUserBalance = await this.getUserBalanceInGroup(toUserId, groupId, organizationId);
      const newToUserBalance = toUserBalance - amount; // toUserBalance is positive, so subtracting amount reduces what they're owed

      await db
        .update(userBalances)
        .set({
          balance: newToUserBalance.toString(),
          updatedAt: new Date(),
        })
        .where(and(eq(userBalances.userId, toUserId), eq(userBalances.groupId, groupId)));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating balances after payment:', error);
      throw new DatabaseError('Failed to update balances after payment');
    }
  }

  /**
   * Get payment statistics for a group
   */
  static async getGroupPaymentStats(groupId: string, userId: string, organizationId?: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    pendingPayments: number;
    completedPayments: number;
    cancelledPayments: number;
  }> {
    try {
      // Validate group belongs to organization
      if (organizationId) {
        const [group] = await db
          .select()
          .from(groups)
          .where(and(eq(groups.id, groupId), eq(groups.organizationId, organizationId)))
          .limit(1);

        if (!group) {
          throw new NotFoundError('Group not found or does not belong to your organization');
        }
      }

      // Check if user is a member of the group
      const isMember = await GroupService.isUserGroupMember(groupId, userId);
      if (!isMember) {
        throw new ForbiddenError('You are not a member of this group');
      }

      // TODO: Implement payment statistics
      return {
        totalPayments: 0,
        totalAmount: 0,
        pendingPayments: 0,
        completedPayments: 0,
        cancelledPayments: 0,
      };
    } catch (error) {
      if (error instanceof ForbiddenError || error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching payment statistics:', error);
      throw new DatabaseError('Failed to fetch payment statistics');
    }
  }
}
