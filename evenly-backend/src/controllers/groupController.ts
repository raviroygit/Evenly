import { FastifyRequest, FastifyReply } from 'fastify';
import { GroupService } from '../services/groupService';
import { UserService } from '../services/userService';
import { 
  createGroupSchema, 
  updateGroupSchema, 
  addGroupMemberSchema,
  paginationSchema,
  type CreateGroupInput,
  type UpdateGroupInput,
  type AddGroupMemberInput,
  type PaginationQuery
} from '../utils/validation';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/errors';

export class GroupController {
  /**
   * Create a new group
   */
  static createGroup = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const groupData = createGroupSchema.parse(request.body);

    const group = await GroupService.createGroup(groupData, user.id, organizationId);

    reply.status(201).send({
      success: true,
      data: group,
      message: 'Group created successfully',
    });
  });

  /**
   * Get user's groups
   */
  static getUserGroups = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const query = paginationSchema.parse(request.query);

    const groups = await GroupService.getUserGroups(user.id, organizationId);

    reply.send({
      success: true,
      data: groups,
      message: 'Groups retrieved successfully',
    });
  });

  /**
   * Get group by ID
   */
  static getGroupById = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const { groupId } = request.params as { groupId: string };

    // Check if user is a member of the group
    const isMember = await GroupService.isUserGroupMember(groupId, user.id);
    if (!isMember) {
      return reply.status(403).send({
        success: false,
        message: 'Access denied. You are not a member of this group.',
      });
    }

    const group = await GroupService.getGroupById(groupId, organizationId);
    if (!group) {
      return reply.status(404).send({
        success: false,
        message: 'Group not found',
      });
    }

    reply.send({
      success: true,
      data: group,
      message: 'Group retrieved successfully',
    });
  });

  /**
   * Update group
   */
  static updateGroup = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId } = request.params as { groupId: string };
    const updateData = updateGroupSchema.parse(request.body);

    const group = await GroupService.updateGroup(groupId, updateData, user.id);

    reply.send({
      success: true,
      data: group,
      message: 'Group updated successfully',
    });
  });

  /**
   * Delete group
   */
  static deleteGroup = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId } = request.params as { groupId: string };

    await GroupService.deleteGroup(groupId, user.id);

    reply.send({
      success: true,
      message: 'Group deleted successfully',
    });
  });

  /**
   * Add member to group
   */
  static addGroupMember = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId } = request.params as { groupId: string };
    const memberData = addGroupMemberSchema.parse(request.body);

    // Check if user is an admin of the group
    const isAdmin = await GroupService.isUserGroupAdmin(groupId, user.id);
    if (!isAdmin) {
      return reply.status(403).send({
        success: false,
        message: 'Only group admins can add members',
      });
    }

    // Find user by email
    const targetUser = await UserService.getUserByEmail(memberData.email);
    if (!targetUser) {
      return reply.status(404).send({
        success: false,
        message: 'User not found',
      });
    }

    const member = await GroupService.addGroupMember(groupId, targetUser.id, memberData.role);

    reply.status(201).send({
      success: true,
      data: member,
      message: 'Member added successfully',
    });
  });

  /**
   * Remove member from group
   */
  static removeGroupMember = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId, userId } = request.params as { groupId: string; userId: string };

    await GroupService.removeGroupMember(groupId, userId, user.id);

    reply.send({
      success: true,
      message: 'Member removed successfully',
    });
  });

  /**
   * Update member role
   */
  static updateMemberRole = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId, userId } = request.params as { groupId: string; userId: string };
    const { role } = request.body as { role: 'admin' | 'member' };

    const member = await GroupService.updateMemberRole(groupId, userId, role, user.id);

    reply.send({
      success: true,
      data: member,
      message: 'Member role updated successfully',
    });
  });

  /**
   * Get group members
   */
  static getGroupMembers = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId } = request.params as { groupId: string };

    // Check if user is a member of the group
    const isMember = await GroupService.isUserGroupMember(groupId, user.id);
    if (!isMember) {
      return reply.status(403).send({
        success: false,
        message: 'Access denied. You are not a member of this group.',
      });
    }

    const members = await GroupService.getGroupMembers(groupId);

    reply.send({
      success: true,
      data: members,
      message: 'Group members retrieved successfully',
    });
  });

  /**
   * Leave group
   */
  static leaveGroup = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId } = request.params as { groupId: string };

    await GroupService.leaveGroup(groupId, user.id);

    reply.send({
      success: true,
      message: 'Left group successfully',
    });
  });

  /**
   * Get group statistics
   */
  static getGroupStats = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const { groupId } = request.params as { groupId: string };

    // Check if user is a member of the group
    const isMember = await GroupService.isUserGroupMember(groupId, user.id);
    if (!isMember) {
      return reply.status(403).send({
        success: false,
        message: 'Access denied. You are not a member of this group.',
      });
    }

    // TODO: Implement group statistics
    const stats = {
      totalExpenses: 0,
      totalMembers: 0,
      totalAmount: 0,
      lastActivity: new Date(),
    };

    reply.send({
      success: true,
      data: stats,
      message: 'Group statistics retrieved successfully',
    });
  });
}
