import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateToken } from '../middlewares/auth';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError } from '../utils/errors';
import { db, users, organizationMembers, organizations, appConfig } from '../db';
import { eq } from 'drizzle-orm';
import { config } from '../config/config';

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
