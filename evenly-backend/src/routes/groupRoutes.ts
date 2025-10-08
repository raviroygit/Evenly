import { FastifyInstance } from 'fastify';
import { GroupController } from '../controllers/groupController';
import { authenticateToken } from '../middlewares/auth';

export async function groupRoutes(fastify: FastifyInstance) {
  // Apply authentication to all group routes
  fastify.addHook('preHandler', authenticateToken);

  // Group CRUD operations
  fastify.post('/', {
    schema: {
      description: 'Create a new group',
      tags: ['Groups'],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          defaultSplitType: { 
            type: 'string', 
            enum: ['equal', 'percentage', 'shares', 'exact'],
            default: 'equal'
          },
        },
      },
    },
  }, GroupController.createGroup);

  fastify.get('/', {
    schema: {
      description: 'Get user\'s groups',
      tags: ['Groups'],
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
  }, GroupController.getUserGroups);

  fastify.get('/:groupId', {
    schema: {
      description: 'Get group by ID',
      tags: ['Groups'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, GroupController.getGroupById);

  fastify.put('/:groupId', {
    schema: {
      description: 'Update group',
      tags: ['Groups'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
      body: {
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
    },
  }, GroupController.updateGroup);

  fastify.delete('/:groupId', {
    schema: {
      description: 'Delete group',
      tags: ['Groups'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, GroupController.deleteGroup);

  // Group member operations
  fastify.post('/:groupId/members', {
    schema: {
      description: 'Add member to group',
      tags: ['Groups'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'member'], default: 'member' },
        },
      },
    },
  }, GroupController.addGroupMember);

  fastify.get('/:groupId/members', {
    schema: {
      description: 'Get group members',
      tags: ['Groups'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, GroupController.getGroupMembers);

  fastify.delete('/:groupId/members/:userId', {
    schema: {
      description: 'Remove member from group',
      tags: ['Groups'],
      params: {
        type: 'object',
        required: ['groupId', 'userId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, GroupController.removeGroupMember);

  fastify.put('/:groupId/members/:userId/role', {
    schema: {
      description: 'Update member role',
      tags: ['Groups'],
      params: {
        type: 'object',
        required: ['groupId', 'userId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['admin', 'member'] },
        },
      },
    },
  }, GroupController.updateMemberRole);

  fastify.post('/:groupId/leave', {
    schema: {
      description: 'Leave group',
      tags: ['Groups'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, GroupController.leaveGroup);

  fastify.get('/:groupId/stats', {
    schema: {
      description: 'Get group statistics',
      tags: ['Groups'],
      params: {
        type: 'object',
        required: ['groupId'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, GroupController.getGroupStats);
}