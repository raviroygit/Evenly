export const ExpenseSchemas = {
  Expense: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      groupId: { type: 'string', format: 'uuid' },
      amount: { type: 'number' },
      description: { type: 'string' },
      category: { type: 'string' },
      date: { type: 'string', format: 'date-time' },
      splitType: { type: 'string', enum: ['equal', 'percentage', 'shares', 'exact'] },
      createdBy: { type: 'string', format: 'uuid' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  ExpenseWithSplits: {
    allOf: [
      { $ref: '#/components/schemas/Expense' },
      {
        type: 'object',
        properties: {
          splits: {
            type: 'array',
            items: { $ref: '#/components/schemas/ExpenseSplit' },
          },
          group: { $ref: '#/components/schemas/Group' },
          createdByUser: { $ref: '#/components/schemas/User' },
        },
      },
    ],
  },

  ExpenseSplit: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      expenseId: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      amount: { type: 'number' },
      percentage: { type: 'number' },
      shares: { type: 'number' },
      user: { $ref: '#/components/schemas/User' },
    },
  },

  CreateExpenseRequest: {
    type: 'object',
    required: ['groupId', 'amount', 'description', 'splitType'],
    properties: {
      groupId: { type: 'string', format: 'uuid' },
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
            amount: { type: 'number', minimum: 0 },
            percentage: { type: 'number', minimum: 0, maximum: 100 },
            shares: { type: 'number', minimum: 0 },
          },
        },
      },
    },
  },

  UpdateExpenseRequest: {
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
            amount: { type: 'number', minimum: 0 },
            percentage: { type: 'number', minimum: 0, maximum: 100 },
            shares: { type: 'number', minimum: 0 },
          },
        },
      },
    },
  },

  ExpenseCategory: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      icon: { type: 'string' },
      color: { type: 'string' },
    },
  },
};
