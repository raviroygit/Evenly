import { FastifyInstance } from 'fastify';
import { GroupInvitationController } from '../controllers/groupInvitationController';
import { authenticateToken } from '../middlewares/auth';

export async function groupInvitationRoutes(fastify: FastifyInstance) {
  // Apply authentication to most invitation routes
  fastify.addHook('preHandler', authenticateToken);

  // Send group invitation
  fastify.post('/send', {
    schema: {
      description: 'Send a group invitation via email',
      tags: ['Group Invitations'],
      body: {
        type: 'object',
        required: ['groupId', 'invitedEmail'],
        properties: {
          groupId: { type: 'string', format: 'uuid' },
          invitedEmail: { type: 'string', format: 'email' },
        },
      },
    },
  }, GroupInvitationController.sendInvitation);

  // Get pending invitations for current user
  fastify.get('/pending', {
    schema: {
      description: 'Get pending invitations for the current user',
      tags: ['Group Invitations'],
    },
  }, GroupInvitationController.getPendingInvitations);

  // Accept group invitation
  fastify.post('/accept', {
    schema: {
      description: 'Accept a group invitation',
      tags: ['Group Invitations'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 1 },
        },
      },
    },
  }, GroupInvitationController.acceptInvitation);

  // Decline group invitation
  fastify.post('/decline', {
    schema: {
      description: 'Decline a group invitation',
      tags: ['Group Invitations'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 1 },
        },
      },
    },
  }, GroupInvitationController.declineInvitation);

  // Public route to get invitation details by token (no auth required)
  fastify.get('/:token', {
    schema: {
      description: 'Get invitation details by token (public)',
      tags: ['Group Invitations'],
      params: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 1 },
        },
      },
    },
    preHandler: [], // Override the global auth hook for this route
  }, GroupInvitationController.getInvitationByToken);
}
