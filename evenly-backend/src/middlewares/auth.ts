import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../utils/auth';
import { UserService } from '../services/userService';
import { UnauthorizedError, AuthServiceError } from '../utils/errors';
import { AuthenticatedRequest } from '../types';
// Removed unused imports - no longer needed after removing temporary user logic

export const authenticateToken = async (
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> => {
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

    // Validate token with auth service
    console.log('🔍 Validating token with auth service...');
    const authResult = await AuthService.validateToken(token);
    console.log('🔍 Auth service validation result:', {
      success: authResult.success,
      error: authResult.error,
      hasUser: !!authResult.user,
      userEmail: authResult.user?.email
    });

    if (!authResult.success || !authResult.user) {
      // If auth service is unavailable or returns 500, throw error
      if (authResult.error === 'Auth service unavailable' || authResult.error === 'Token validation failed') {
        console.log('❌ Auth service unavailable or failed - this is likely a 500 error from the external auth service');
        console.log('💡 Suggestion: Check the external auth service logs for the 500 error');
        throw new UnauthorizedError('Authentication service unavailable');
      }
      
      console.log('❌ Token validation failed:', authResult.error);
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Log user info from auth service
    console.log('🔐 Auth Service User Info:', {
      id: authResult.user.id,
      email: authResult.user.email,
      name: authResult.user.name,
      avatar: authResult.user.avatar,
      tokenPrefix: token.substring(0, 8)
    });

    // Sync user with local database
    console.log('💾 Syncing user with evenly database...');
    const syncedUser = await UserService.createOrUpdateUser({
      id: authResult.user.id,
      email: authResult.user.email,
      name: authResult.user.name,
      avatar: authResult.user.avatar,
    });

    // Log synced user info
    console.log('✅ User synced to evenly database:', {
      evenlyId: syncedUser.id,
      authServiceId: syncedUser.authServiceId,
      email: syncedUser.email,
      name: syncedUser.name,
      avatar: syncedUser.avatar,
      createdAt: syncedUser.createdAt,
      updatedAt: syncedUser.updatedAt
    });

    // Attach synced user to request
    (request as AuthenticatedRequest).user = {
      ...syncedUser,
      avatar: syncedUser.avatar || undefined
    };
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
