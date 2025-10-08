import { FastifyRequest, FastifyReply } from 'fastify';
import { GroupInvitationService } from '../services/groupInvitationService';
import { 
  sendInvitationSchema,
  acceptInvitationSchema,
  declineInvitationSchema,
  type SendInvitationInput,
  type AcceptInvitationInput,
  type DeclineInvitationInput
} from '../utils/validation';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/errors';

export class GroupInvitationController {
  /**
   * Send a group invitation
   */
  static sendInvitation = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId, invitedEmail } = sendInvitationSchema.parse(request.body);

    const invitation = await GroupInvitationService.sendInvitation(
      groupId,
      user.id,
      invitedEmail
    );

    reply.status(201).send({
      success: true,
      data: invitation,
      message: 'Invitation sent successfully',
    });
  });

  /**
   * Get pending invitations for the current user
   */
  static getPendingInvitations = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;

    const invitations = await GroupInvitationService.getPendingInvitations(user.id);

    reply.send({
      success: true,
      data: invitations,
      message: 'Pending invitations retrieved successfully',
    });
  });

  /**
   * Accept a group invitation
   */
  static acceptInvitation = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { token } = acceptInvitationSchema.parse(request.body);

    await GroupInvitationService.acceptInvitation(token, user.id);

    reply.send({
      success: true,
      message: 'Invitation accepted successfully',
    });
  });

  /**
   * Decline a group invitation
   */
  static declineInvitation = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { token } = declineInvitationSchema.parse(request.body);

    await GroupInvitationService.declineInvitation(token, user.id);

    reply.send({
      success: true,
      message: 'Invitation declined successfully',
    });
  });

  /**
   * Get invitation details by token (public endpoint)
   */
  static getInvitationByToken = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.params as { token: string };

    const invitation = await GroupInvitationService.getInvitationByToken(token);

    if (!invitation) {
      return reply.status(404).send({
        success: false,
        message: 'Invalid or expired invitation',
      });
    }

    reply.send({
      success: true,
      data: invitation,
      message: 'Invitation details retrieved successfully',
    });
  });
}
