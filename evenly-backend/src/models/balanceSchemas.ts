export const BalanceSchemas = {
  UserBalance: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      groupId: { type: 'string', format: 'uuid' },
      balance: { type: 'string' },
      lastUpdated: { type: 'string', format: 'date-time' },
    },
  },

  UserBalanceWithUser: {
    allOf: [
      { $ref: '#/components/schemas/UserBalance' },
      {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
        },
      },
    ],
  },

  UserBalanceWithGroup: {
    allOf: [
      { $ref: '#/components/schemas/UserBalance' },
      {
        type: 'object',
        properties: {
          group: { $ref: '#/components/schemas/Group' },
        },
      },
    ],
  },

  SimplifiedDebt: {
    type: 'object',
    properties: {
      fromUserId: { type: 'string', format: 'uuid' },
      toUserId: { type: 'string', format: 'uuid' },
      amount: { type: 'number' },
      fromUser: { $ref: '#/components/schemas/User' },
      toUser: { $ref: '#/components/schemas/User' },
    },
  },

  GroupBalanceSummary: {
    type: 'object',
    properties: {
      totalExpenses: { type: 'number' },
      totalMembers: { type: 'number' },
      totalOwed: { type: 'number' },
      totalOwing: { type: 'number' },
      netBalance: { type: 'number' },
      balances: {
        type: 'array',
        items: { $ref: '#/components/schemas/UserBalanceWithUser' },
      },
      simplifiedDebts: {
        type: 'array',
        items: { $ref: '#/components/schemas/SimplifiedDebt' },
      },
    },
  },
};
