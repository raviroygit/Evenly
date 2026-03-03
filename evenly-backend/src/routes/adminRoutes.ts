import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { authenticateToken } from '../middlewares/auth';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { db, users, organizationMembers, organizations, appConfig, expenses, payments, groupInvitations, groups, groupMembers } from '../db';
import { eq, or, and, ne } from 'drizzle-orm';
import { config } from '../config/config';
import { AuthService } from '../utils/auth';

export async function adminRoutes(fastify: FastifyInstance) {
  // GET /users — list all users in the Evenly organization (admin/owner only)
  fastify.get('/users', {
    preHandler: authenticateToken,
    schema: {
      description: 'List all users in the Evenly organization (admin/owner only)',
      tags: ['Admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phoneNumber: { type: 'string', nullable: true },
                  avatar: { type: 'string', nullable: true },
                  role: { type: 'string' },
                  createdAt: { type: 'string' },
                },
              },
            },
            total: { type: 'number' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const organizationRole = (request as any).organizationRole;

    if (organizationRole !== 'owner' && organizationRole !== 'admin') {
      throw new ForbiddenError('Only organization owners and admins can view all users');
    }

    // Look up the Evenly organization by its auth service ID from config
    const evenlyAuthOrgId = config.auth.evenlyOrganizationId;

    const evenlyOrg = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.authServiceOrgId, evenlyAuthOrgId))
      .limit(1);

    if (!evenlyOrg.length) {
      return reply.send({ success: true, data: [], total: 0 });
    }

    const evenlyOrgId = evenlyOrg[0].id;

    // Get all members of the Evenly organization with their user data
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        avatar: users.avatar,
        role: organizationMembers.role,
        createdAt: users.createdAt,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, evenlyOrgId));

    // Deduplicate by user id (keep first occurrence — highest-privilege role)
    const seen = new Set<string>();
    const members = rows.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    return reply.send({
      success: true,
      data: members,
      total: members.length,
    });
  });

  // DELETE /users/:userId — delete a user and all their data (admin/owner only)
  fastify.delete<{ Params: { userId: string } }>('/users/:userId', {
    preHandler: authenticateToken,
  }, async (request, reply) => {
    const organizationRole = (request as any).organizationRole;

    if (organizationRole !== 'owner' && organizationRole !== 'admin') {
      throw new ForbiddenError('Only organization owners and admins can delete users');
    }

    const { userId } = request.params;

    // Verify user exists and get authServiceId for auth service deletion
    const userRows = await db.select({
      id: users.id,
      authServiceId: users.authServiceId,
    }).from(users).where(eq(users.id, userId)).limit(1);
    if (!userRows.length) {
      throw new NotFoundError('User not found');
    }

    const targetUser = userRows[0];

    // Check if the target user is an owner — owners cannot be deleted
    const evenlyAuthOrgId = config.auth.evenlyOrganizationId;
    const evenlyOrg = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.authServiceOrgId, evenlyAuthOrgId))
      .limit(1);

    if (evenlyOrg.length) {
      const memberRows = await db
        .select({ role: organizationMembers.role })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, evenlyOrg[0].id),
            eq(organizationMembers.userId, userId)
          )
        )
        .limit(1);

      if (memberRows.length && memberRows[0].role === 'owner') {
        throw new ForbiddenError('Cannot delete an organization owner');
      }
    }

    // Delete user from auth service (nxgenaidev_auth MongoDB)
    // Auth service has DELETE /api/v1/users/:userId with org admin auth
    try {
      const adminToken =
        AuthService.extractToken(request.headers.authorization) ??
        request.cookies?.sso_token ??
        '';

      // Auth service URL is .../api/v1/auth — replace /auth with /users for the users endpoint
      const authUsersUrl = config.auth.serviceUrl.replace(/\/auth$/, '/users');

      await axios.delete(`${authUsersUrl}/${targetUser.authServiceId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'Cookie': `sso_token=${adminToken}`,
          'X-Organization-Id': config.auth.evenlyOrganizationId,
        },
        timeout: 15000,
      });
    } catch (authErr: any) {
      // Log but don't block — evenly-backend cleanup should still proceed
      console.error('[adminDeleteUser] Auth service delete failed:', authErr?.response?.data?.message || authErr?.message);
    }

    // Handle foreign key constraints for tables without CASCADE

    // 1. Delete expenses where paidBy = userId (cascades to expense_splits)
    await db.delete(expenses).where(eq(expenses.paidBy, userId));

    // 2. Delete payments where fromUserId or toUserId = userId
    await db.delete(payments).where(
      or(eq(payments.fromUserId, userId), eq(payments.toUserId, userId))
    );

    // 3. Delete group_invitations where invitedBy = userId
    await db.delete(groupInvitations).where(eq(groupInvitations.invitedBy, userId));

    // 4. Set invitedUserId = null where invitedUserId = userId
    await db.update(groupInvitations)
      .set({ invitedUserId: null })
      .where(eq(groupInvitations.invitedUserId, userId));

    // 5. Reassign groups.createdBy where user is the creator
    const createdGroups = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.createdBy, userId));

    for (const group of createdGroups) {
      // Find another active member to reassign ownership
      const otherMember = await db
        .select({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, group.id),
            ne(groupMembers.userId, userId),
            eq(groupMembers.isActive, true)
          )
        )
        .limit(1);

      if (otherMember.length) {
        await db.update(groups)
          .set({ createdBy: otherMember[0].userId })
          .where(eq(groups.id, group.id));
      } else {
        // Sole member — delete the group (cascades group_members, user_balances, etc.)
        await db.delete(groups).where(eq(groups.id, group.id));
      }
    }

    // 6. Delete the user (CASCADE handles: organization_members, group_members,
    //    expense_splits, user_balances, khata_customers, khata_transactions,
    //    device_tokens, referrals)
    await db.delete(users).where(eq(users.id, userId));

    return reply.send({ success: true, message: 'User deleted successfully' });
  });

  // GET /app-version — get current app version config (admin/owner only)
  fastify.get('/app-version', {
    preHandler: authenticateToken,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const organizationRole = (request as any).organizationRole;
    if (organizationRole !== 'owner' && organizationRole !== 'admin') {
      throw new ForbiddenError('Only organization owners and admins can view app version config');
    }

    const rows = await db.select().from(appConfig).where(eq(appConfig.id, 1)).limit(1);
    const cfg = rows[0] || { latestVersion: '2.0.1', minVersion: '2.0.0', forceUpdate: false, releaseNotes: '' };

    return reply.send({ success: true, data: cfg });
  });

  // PUT /app-version — update app version config (admin/owner only)
  fastify.put('/app-version', {
    preHandler: authenticateToken,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const organizationRole = (request as any).organizationRole;
    if (organizationRole !== 'owner' && organizationRole !== 'admin') {
      throw new ForbiddenError('Only organization owners and admins can update app version config');
    }

    const { latestVersion, minVersion, forceUpdate, releaseNotes } = (request.body as any) || {};

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (latestVersion !== undefined) updateData.latestVersion = latestVersion;
    if (minVersion !== undefined) updateData.minVersion = minVersion;
    if (forceUpdate !== undefined) updateData.forceUpdate = forceUpdate;
    if (releaseNotes !== undefined) updateData.releaseNotes = releaseNotes;

    await db.update(appConfig).set(updateData).where(eq(appConfig.id, 1));

    const rows = await db.select().from(appConfig).where(eq(appConfig.id, 1)).limit(1);

    return reply.send({ success: true, data: rows[0] });
  });
}
