import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../utils/auth';
import { UserService } from '../services/userService';
import { OrganizationService } from '../services/organizationService';
import { UnauthorizedError, AuthServiceError } from '../utils/errors';
import { AuthenticatedRequest } from '../types';
// Removed unused imports - no longer needed after removing temporary user logic

export const authenticateToken = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
  void _reply;
  try {
    // Extract token from cookies (sso_token)
    const cookies = request.cookies;
    let token = cookies?.sso_token;

    console.log('[Auth Middleware] Request cookies:', cookies);
    console.log('[Auth Middleware] Extracted sso_token:', token);
    console.log('[Auth Middleware] Request headers:', request.headers);

    // Handle duplicate sso_token issue from iOS
    if (typeof token === 'string' && token.includes(',')) {
      console.log('[Auth Middleware] Detected duplicate sso_token, cleaning...');
      // Split by comma and take the first one, then clean it
      const tokenParts = token.split(',');
      const firstToken = tokenParts[0].trim();
      // Remove any 'sso_token=' prefix if present
      token = firstToken.replace(/^sso_token=/, '');
      console.log('[Auth Middleware] Cleaned token:', token);
    }

    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    // Validate token with external auth service first; fall back to local session
    const authResult = await AuthService.validateToken(token);
    if (authResult.success && authResult.user) {
      const syncedUser = await UserService.createOrUpdateUser({
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        avatar: authResult.user.avatar,
      });
      (request as AuthenticatedRequest).user = { ...syncedUser, avatar: syncedUser.avatar || undefined };

      // Extract and sync organization context
      await extractOrganizationContext(request, token, syncedUser.id);

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

        return;
      }
    }

    throw new UnauthorizedError('Invalid or expired token');
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    // If auth service is unavailable, we might want to handle this differently
    // For now, we'll treat it as unauthorized
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
    console.warn('Optional auth failed:', error);
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
 * Extract organization context from request header and sync to local DB
 */
async function extractOrganizationContext(
  request: FastifyRequest,
  ssoToken: string,
  userId: string
): Promise<void> {
  try {
    // Get organization ID from header
    const authServiceOrgId = request.headers['x-organization-id'] as string;

    if (!authServiceOrgId) {
      console.log('⚠️  OrganizationContext: No organization ID provided in header');
      return;
    }

    console.log('🏢 OrganizationContext: Extracting org context:', authServiceOrgId);

    // Check if org exists in local DB
    let localOrg = await OrganizationService.getOrganizationByAuthServiceId(authServiceOrgId);

    if (!localOrg) {
      // Sync from auth service
      console.log('🔄 OrganizationContext: Organization not found locally, syncing...');
      const localOrgId = await OrganizationService.syncOrganizationFromAuthService(
        authServiceOrgId,
        ssoToken,
        userId
      );

      if (localOrgId) {
        localOrg = await OrganizationService.getOrganizationByAuthServiceId(authServiceOrgId);
      }
    }

    if (!localOrg) {
      console.error('❌ OrganizationContext: Failed to sync organization');
      console.error('❌ OrganizationContext: Auth service org ID:', authServiceOrgId);
      console.error('❌ OrganizationContext: User ID:', userId);
      return;
    }

    // Verify user is a member
    const isMember = await OrganizationService.isMember(localOrg.id, userId);
    if (!isMember) {
      console.error('❌ OrganizationContext: User is not a member of this organization');
      console.error('❌ OrganizationContext: Local org ID:', localOrg.id);
      console.error('❌ OrganizationContext: User ID:', userId);
      return;
    }

    // Get membership details
    const membership = await OrganizationService.getUserMembership(localOrg.id, userId);

    // Attach to request
    (request as any).organizationId = localOrg.id;
    (request as any).authServiceOrgId = authServiceOrgId;
    (request as any).organizationRole = membership?.role;

    console.log('✅ OrganizationContext: Context attached:', {
      localOrgId: localOrg.id,
      authServiceOrgId,
      role: membership?.role
    });
  } catch (error: any) {
    console.error('❌ OrganizationContext: Failed to extract context:', error.message);
    // Don't fail the request, just log the error
  }
}
