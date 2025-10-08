export const GroupSchemas = {
  Group: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string' },
      currency: { type: 'string' },
      defaultSplitType: { type: 'string', enum: ['equal', 'percentage', 'shares', 'exact'] },
      createdBy: { type: 'string', format: 'uuid' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  
  GroupWithMembers: {
    allOf: [
      { $ref: '#/components/schemas/Group' },
      {
        type: 'object',
        properties: {
          members: {
            type: 'array',
            items: { $ref: '#/components/schemas/GroupMember' },
          },
        },
      },
    ],
  },

  GroupMember: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      groupId: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      role: { type: 'string', enum: ['admin', 'member'] },
      joinedAt: { type: 'string', format: 'date-time' },
      user: { $ref: '#/components/schemas/User' },
    },
  },

  CreateGroupRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      currency: { type: 'string', pattern: '^[A-Z]{3}$', default: 'USD' },
      defaultSplitType: { 
        type: 'string', 
        enum: ['equal', 'percentage', 'shares', 'exact'],
        default: 'equal'
      },
    },
  },

  UpdateGroupRequest: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      currency: { type: 'string', pattern: '^[A-Z]{3}$' },
      defaultSplitType: { 
        type: 'string', 
        enum: ['equal', 'percentage', 'shares', 'exact']
      },
    },
  },

  AddMemberRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: ['admin', 'member'], default: 'member' },
    },
  },

  UpdateMemberRoleRequest: {
    type: 'object',
    required: ['role'],
    properties: {
      role: { type: 'string', enum: ['admin', 'member'] },
    },
  },

  GroupStats: {
    type: 'object',
    properties: {
      totalExpenses: { type: 'number' },
      totalMembers: { type: 'number' },
      totalOwed: { type: 'number' },
      totalOwing: { type: 'number' },
      netBalance: { type: 'number' },
      recentExpenses: {
        type: 'array',
        items: { $ref: '#/components/schemas/Expense' },
      },
    },
  },
};
