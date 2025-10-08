import { FastifyRequest, FastifyReply } from 'fastify';
import { ExpenseService } from '../services/expenseService';
import { 
  createExpenseSchema, 
  updateExpenseSchema,
  paginationSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type PaginationQuery
} from '../utils/validation';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/errors';

export class ExpenseController {
  /**
   * Create a new expense
   */
  static createExpense = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const expenseData = createExpenseSchema.parse(request.body);

    const expense = await ExpenseService.createExpense(expenseData, user.id);

    reply.status(201).send({
      success: true,
      data: expense,
      message: 'Expense created successfully',
    });
  });

  /**
   * Get expense by ID
   */
  static getExpenseById = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { expenseId } = request.params as { expenseId: string };

    const expense = await ExpenseService.getExpenseById(expenseId);
    if (!expense) {
      return reply.status(404).send({
        success: false,
        message: 'Expense not found',
      });
    }

    reply.send({
      success: true,
      data: expense,
      message: 'Expense retrieved successfully',
    });
  });

  /**
   * Get group expenses
   */
  static getGroupExpenses = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId } = request.params as { groupId: string };
    const query = paginationSchema.parse(request.query);

    const result = await ExpenseService.getGroupExpenses(groupId, user.id, {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    reply.send({
      success: true,
      data: result.expenses,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
        hasNext: query.page * query.limit < result.total,
        hasPrev: query.page > 1,
      },
      message: 'Group expenses retrieved successfully',
    });
  });

  /**
   * Update expense
   */
  static updateExpense = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { expenseId } = request.params as { expenseId: string };
    const updateData = updateExpenseSchema.parse(request.body);

    const expense = await ExpenseService.updateExpense(expenseId, updateData, user.id);

    reply.send({
      success: true,
      data: expense,
      message: 'Expense updated successfully',
    });
  });

  /**
   * Delete expense
   */
  static deleteExpense = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { expenseId } = request.params as { expenseId: string };

    await ExpenseService.deleteExpense(expenseId, user.id);

    reply.send({
      success: true,
      message: 'Expense deleted successfully',
    });
  });

  /**
   * Get expense categories
   */
  static getExpenseCategories = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const categories = await ExpenseService.getExpenseCategories();

    reply.send({
      success: true,
      data: categories,
      message: 'Expense categories retrieved successfully',
    });
  });

  /**
   * Get user's expenses across all groups
   */
  static getUserExpenses = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const query = paginationSchema.parse(request.query);

    // TODO: Implement getUserExpenses in ExpenseService
    const expenses: any[] = [];

    reply.send({
      success: true,
      data: expenses,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      message: 'User expenses retrieved successfully',
    });
  });
}
