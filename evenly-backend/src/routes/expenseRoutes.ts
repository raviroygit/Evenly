import { FastifyInstance } from 'fastify';
import { ExpenseController } from '../controllers/expenseController';
import { authenticateToken } from '../middlewares/auth';

export async function expenseRoutes(fastify: FastifyInstance) {
  // Apply authentication to all expense routes
  fastify.addHook('preHandler', authenticateToken);

  // Expense CRUD operations
  fastify.post('/', {
    schema: {
      description: 'Create a new expense',
      tags: ['Expenses'],
      body: {
        type: 'object',
        required: ['groupId', 'title', 'totalAmount', 'splitType'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
          title: { type: 'string', minLength: 1, maxLength: 200 },
          totalAmount: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$' },
          paidBy: { type: 'string', format: 'uuid' }, // Optional - will be set to current user
          description: { type: 'string', maxLength: 200 }, // Optional - no minLength requirement
          category: { type: 'string', maxLength: 50 },
          date: { type: 'string', format: 'date-time' },
          splitType: { 
            type: 'string', 
            enum: ['equal', 'percentage', 'shares', 'exact']
          },
          splits: {
            type: 'array',
            items: {
              type: 'object',
              required: ['userId'],
              properties: {
                userId: { type: 'string', format: 'uuid' },
                amount: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$' },
                percentage: { type: 'number', minimum: 0, maximum: 100 },
                shares: { type: 'number', minimum: 0 },
              },
            },
          },
        },
      },
    },
  }, ExpenseController.createExpense);

  fastify.get('/group/:groupId', {
    schema: {
      description: 'Get group expenses',
      tags: ['Expenses'],
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
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      },
    },
  }, ExpenseController.getGroupExpenses);

  fastify.get('/user', {
    schema: {
      description: 'Get user expenses',
      tags: ['Expenses'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', pattern: '^\\d+$', default: '1' },
          limit: { type: 'string', pattern: '^\\d+$', default: '20' },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      },
    },
  }, ExpenseController.getUserExpenses);

  fastify.get('/:expenseId', {
    schema: {
      description: 'Get expense by ID',
      tags: ['Expenses'],
      params: {
        type: 'object',
        required: ['expenseId'],
        properties: {
          expenseId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, ExpenseController.getExpenseById);

  fastify.put('/:expenseId', {
    schema: {
      description: 'Update expense',
      tags: ['Expenses'],
      params: {
        type: 'object',
        required: ['expenseId'],
        properties: {
          expenseId: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          amount: { type: 'number', minimum: 0.01 },
          description: { type: 'string', minLength: 1, maxLength: 200 },
          category: { type: 'string', maxLength: 50 },
          date: { type: 'string', format: 'date-time' },
          splitType: { 
            type: 'string', 
            enum: ['equal', 'percentage', 'shares', 'exact']
          },
          splits: {
            type: 'array',
            items: {
              type: 'object',
              required: ['userId'],
              properties: {
                userId: { type: 'string', format: 'uuid' },
                amount: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$' },
                percentage: { type: 'number', minimum: 0, maximum: 100 },
                shares: { type: 'number', minimum: 0 },
              },
            },
          },
        },
      },
    },
  }, ExpenseController.updateExpense);

  fastify.delete('/:expenseId', {
    schema: {
      description: 'Delete expense',
      tags: ['Expenses'],
      params: {
        type: 'object',
        required: ['expenseId'],
        properties: {
          expenseId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, ExpenseController.deleteExpense);

  fastify.get('/categories/list', {
    schema: {
      description: 'Get expense categories',
      tags: ['Expenses'],
    },
  }, ExpenseController.getExpenseCategories);
}