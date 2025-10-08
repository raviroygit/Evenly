export const PaymentSchemas = {
  Payment: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      groupId: { type: 'string', format: 'uuid' },
      fromUserId: { type: 'string', format: 'uuid' },
      toUserId: { type: 'string', format: 'uuid' },
      amount: { type: 'number' },
      description: { type: 'string' },
      status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] },
      createdAt: { type: 'string', format: 'date-time' },
      completedAt: { type: 'string', format: 'date-time' },
    },
  },

  PaymentWithUsers: {
    allOf: [
      { $ref: '#/components/schemas/Payment' },
      {
        type: 'object',
        properties: {
          fromUser: { $ref: '#/components/schemas/User' },
          toUser: { $ref: '#/components/schemas/User' },
          group: { $ref: '#/components/schemas/Group' },
        },
      },
    ],
  },

  CreatePaymentRequest: {
    type: 'object',
    required: ['groupId', 'toUserId', 'amount'],
    properties: {
      groupId: { type: 'string', format: 'uuid' },
      toUserId: { type: 'string', format: 'uuid' },
      amount: { type: 'number', minimum: 0.01 },
      description: { type: 'string', maxLength: 200 },
    },
  },

  UpdatePaymentRequest: {
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] },
      description: { type: 'string', maxLength: 200 },
    },
  },
};
