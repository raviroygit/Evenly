import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../utils/auth';
import { UserService } from '../services/userService';
import { OrganizationService } from '../services/organizationService';
import { UnauthorizedError, AuthServiceError } from '../utils/errors';
import { AuthenticatedRequest } from '../types';
import { config } from '../config/config';

export const authenticateToken = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  void _reply;
  try {
    // Mobile: use Bearer token from Authorization header. Web: fallback to sso_token cookie.
    let token: string | null =
      AuthService.extractToken(request.headers.authorization) ??
      request.cookies?.sso_token ??
      null;

    // Handle duplicate sso_token issue from iOS (cookie only)
    if (typeof token === 'string' && token.includes(',')) {
      // Split by comma and take the first one, then clean it
      const tokenParts = token.split(',');
      const firstToken = tokenParts[0].trim();
      // Remove any 'sso_token=' prefix if present
      token = firstToken.replace(/^sso_token=/, '');
    }

    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    // Validate token with external auth service first; fall back to local session
    const authResult = await AuthService.validateToken(token);
    if (authResult.success && authResult.user) {
      const u = authResult.user;
      if (!u.id || !u.email || !u.name) {
        throw new UnauthorizedError('Invalid user data from auth service');
      }
      const syncedUser = await UserService.createOrUpdateUser({
        id: u.id,
        email: u.email,
        name: u.name,
        avatar: u.avatar,
        phoneNumber: u.phoneNumber,
      });
      (request as AuthenticatedRequest).user = {
        ...syncedUser,
        avatar: syncedUser.avatar ?? undefined,
        phoneNumber: syncedUser.phoneNumber ?? undefined,
      } as AuthenticatedRequest['user'];

      // Extract and sync organization context (non-throwing; best-effort)
      await extractOrganizationContext(request, token, syncedUser.id);
      // Ensure org is set from hardcoded Evenly org so controllers never see "Organization ID is required"
      await ensureOrganizationIdSet(request, syncedUser.id);

      return;
    }

    const { validateSession } = await import('../utils/localSession');
    const local = validateSession(token);
    if (local.valid && local.userId) {
      const user = await UserService.getUserById(local.userId);
      if (user) {
        (request as AuthenticatedRequest).user = { ...user, avatar: user.avatar || undefined } as any;

        // Extract and sync organization context
        await extractOrganizationContext(request, token, user.id);
        await ensureOrganizationIdSet(request, user.id);

        return;
      }
    }

    throw new UnauthorizedError('Invalid or expired token');
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    // Log the real error so we can fix 503s (e.g. DB errors, org sync failures)
    const err = error as { message?: string; name?: string };
    request.log?.error?.({ err: error, message: err?.message, name: err?.name }, 'Auth middleware error');
    throw new AuthServiceError('Authentication service unavailable');
  }
};

export const optionalAuth = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  void _reply;
  try {
    // Extract token from cookies (sso_token)
    const cookies = request.cookies;
    const token = cookies?.sso_token;

    if (token) {
      const authResult = await AuthService.validateToken(token);
      if (authResult.success && authResult.user) {
        (request as AuthenticatedRequest).user = authResult.user;
      }
    }
  } catch (error) {
    // For optional auth, we don't throw errors
    // Just log and continue without user
  }
};

export const requireGroupMember = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  void _reply;
  const authenticatedRequest = request as AuthenticatedRequest;
  
  if (!authenticatedRequest.user) {
    throw new UnauthorizedError('Authentication required');
  }

  // This middleware should be used after route-specific middleware
  // that extracts groupId from params
  const groupId = (request.params as { groupId?: string })?.groupId;
  
  if (!groupId) {
    throw new UnauthorizedError('Group ID required');
  }

  // Check if user is a member of the group
  // This will be implemented in the group service
  // For now, we'll just pass through
  // TODO: Implement group membership check
};

export const requireGroupAdmin = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  void _reply;
  const authenticatedRequest = request as AuthenticatedRequest;
  
  if (!authenticatedRequest.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const groupId = (request.params as { groupId?: string })?.groupId;
  
  if (!groupId) {
    throw new UnauthorizedError('Group ID required');
  }

  // Check if user is an admin of the group
  // This will be implemented in the group service
  // For now, we'll just pass through
  // TODO: Implement group admin check
};

/**
 * Extract organization context: use hardcoded Evenly org id, ensure local org exists and user is member, set request.organizationId.
 */
async function extractOrganizationContext(
  request: FastifyRequest,
  ssoToken: string,
  userId: string
): Promise<void> {
  const authServiceOrgId = config.auth.evenlyOrganizationId || '';
  if (!authServiceOrgId) return;

  try {
    const localOrgId = await OrganizationService.ensureOrganizationExistsForAuthServiceId(
      authServiceOrgId,
      userId
    );
    if (!localOrgId) {
      await OrganizationService.syncOrganizationFromAuthService(authServiceOrgId, ssoToken, userId);
      const retryId = await OrganizationService.ensureOrganizationExistsForAuthServiceId(
        authServiceOrgId,
        userId
      );
      if (!retryId) {
        // Org may already exist; use it so we always set organizationId
        const existing = await OrganizationService.getOrganizationByAuthServiceId(authServiceOrgId);
        if (existing) {
          (request as any).organizationId = existing.id;
          (request as any).authServiceOrgId = authServiceOrgId;
          (request as any).organizationRole = 'member';
        }
        return;
      }
      (request as any).organizationId = retryId;
      (request as any).authServiceOrgId = authServiceOrgId;
      (request as any).organizationRole = 'member';
      return;
    }

    const localOrg = await OrganizationService.getOrganizationByAuthServiceId(authServiceOrgId);
    const membership = localOrg
      ? await OrganizationService.getUserMembership(localOrg.id, userId)
      : null;

    (request as any).organizationId = localOrgId;
    (request as any).authServiceOrgId = authServiceOrgId;
    (request as any).organizationRole = membership?.role ?? 'member';
  } catch (error: any) {
    try {
      const fallbackId = await OrganizationService.ensureOrganizationExistsForAuthServiceId(
        authServiceOrgId,
        userId
      );
      if (fallbackId) {
        (request as any).organizationId = fallbackId;
        (request as any).authServiceOrgId = authServiceOrgId;
        (request as any).organizationRole = 'member';
      } else {
        const existing = await OrganizationService.getOrganizationByAuthServiceId(authServiceOrgId);
        if (existing) {
          (request as any).organizationId = existing.id;
          (request as any).authServiceOrgId = authServiceOrgId;
          (request as any).organizationRole = 'member';
        }
      }
    } catch (_) {
      // ignore
    }
  }
}

/**
 * Ensure request.organizationId is set using hardcoded Evenly org when missing (so controllers never see "Organization ID is required").
 */
async function ensureOrganizationIdSet(request: FastifyRequest, userId: string): Promise<void> {
  if ((request as any).organizationId) return;
  const authServiceOrgId = config.auth.evenlyOrganizationId || '';
  if (!authServiceOrgId) return;
  const localOrgId = await OrganizationService.getDefaultLocalOrganizationId(userId);
  if (localOrgId) {
    (request as any).organizationId = localOrgId;
    (request as any).authServiceOrgId = authServiceOrgId;
    (request as any).organizationRole = 'member';
  }
}
