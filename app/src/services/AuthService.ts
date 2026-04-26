import { User } from '../types';
import { evenlyApiClient } from './EvenlyApiClient';
import { AuthStorage } from '../utils/storage';
import { UnifiedAuthService } from './UnifiedAuthService';

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

/**
 * AuthService — thin wrapper around the Evenly backend for everything that
 * stays after the unified auth migration: profile fetch/update, organization
 * management, invitations, Google OAuth (still proxied through the backend),
 * and logout (which now hits the auth service directly to invalidate the
 * refresh token).
 *
 * Passwordless OTP send/verify lives in `UnifiedAuthService` and talks to the
 * NxtGenAiDev auth service directly — this class no longer participates in
 * that flow.
 */
export class AuthService {
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: any; accessToken?: string; refreshToken?: string; apiKey?: string }> {
    const axiosConfig: any = {
      method: options.method || 'GET',
      url: endpoint,
      ...options,
    };

    if (options.body) {
      axiosConfig.data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    }

    const response = await evenlyApiClient.getInstance().request(axiosConfig);

    const accessToken = response.data.accessToken || response.data.data?.accessToken;
    const refreshToken = response.data.refreshToken || response.data.data?.refreshToken;
    const apiKey = response.data.apiKey || response.data.data?.apiKey;

    return { data: response.data, accessToken, refreshToken, apiKey };
  }

  /** Touch the Evenly backend so `authenticateToken` middleware syncs the user row. */
  private async syncUserWithEvenlyBackend(_user: any): Promise<void> {
    try {
      await evenlyApiClient.get('/groups');
    } catch {
      // Best-effort — don't block auth flow on sync failure.
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const storedAuthData = await AuthStorage.getAuthData();
      const storedPhoneNumber = storedAuthData?.user?.phoneNumber;

      const { data: response } = await this.makeRequest('/auth/me', {});
      const user = response.user || response.data?.user;
      if (response.success && user) {
        const org = response.organization || response.data?.organization;
        const orgs = response.organizations || response.data?.organizations;
        const organizations = orgs || (org ? [org] : []);

        if (organizations.length > 0) {
          const currentOrgId = await AuthStorage.getCurrentOrganizationId();
          if (!currentOrgId && organizations[0]) {
            await AuthStorage.setCurrentOrganizationId(organizations[0].id);
          }
        }

        await this.syncUserWithEvenlyBackend(user);

        const phoneNumber = user.phoneNumber || storedPhoneNumber;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          phoneNumber,
          preferredLanguage: user.preferredLanguage,
          preferredCurrency: user.preferredCurrency,
          stats: { groups: 0, totalSpent: 0, owed: 0 },
          organizations,
          defaultOrganizationId: user.defaultOrganizationId,
          lastOrganizationId: user.lastOrganizationId,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async updateUserProfile(update: { name?: string; email?: string }): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const { data: response } = await this.makeRequest('/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });

      if (response && response.success) {
        const updatedUser: User | undefined = response.user
          ? { id: response.user.id, email: response.user.email, name: response.user.name, stats: { groups: 0, totalSpent: 0, owed: 0 } }
          : undefined;
        return { success: true, message: response.message || 'Updated', user: updatedUser };
      }
      return { success: false, message: response?.message || 'Failed to update user' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update user' };
    }
  }

  /**
   * Sign in with Google: send the Google ID token to the backend.
   * The backend handles both login and signup (auto-creates user if new).
   * Still proxied through the Evenly backend — independent of the unified OTP flow.
   */
  async signInWithGoogle(idToken: string): Promise<AuthResponse & { accessToken?: string; refreshToken?: string; apiKey?: string }> {
    try {
      const { data: response, accessToken, refreshToken, apiKey } = await this.makeRequest('/auth/social/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });

      const user = response.user || response.data?.user;
      const organization = response.organization || response.data?.organization;

      if (response.success && user) {
        if (organization) {
          await AuthStorage.setCurrentOrganizationId(organization.id);
        }

        await this.syncUserWithEvenlyBackend(user);

        const userResponse = {
          id: user.id,
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber,
          stats: { groups: 0, totalSpent: 0, owed: 0 },
          organizations: organization ? [organization] : undefined,
          currentOrganization: organization,
        };

        return {
          success: true,
          message: response.message || 'Login successful!',
          user: userResponse,
          accessToken,
          refreshToken,
          apiKey,
        };
      }

      return {
        success: false,
        message: response.message || 'Google sign-in failed',
      };
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message;
      const status = error?.response?.status;
      let userMessage = serverMsg || error.message || 'Google sign-in failed';
      if (status === 400) userMessage = serverMsg || 'Invalid Google token. Please try again.';
      if (status >= 500) userMessage = 'Server error. Please try again later.';
      return { success: false, message: userMessage };
    }
  }

  /**
   * Logout: invalidate the auth-service refresh token + active sessions
   * directly against `/api/v1/auth/logout`. Callers (AuthContext.logout)
   * should pass the access token they captured before wiping storage —
   * by the time this runs the storage path is usually gone, so reading
   * from `AuthStorage` here is only a fallback.
   */
  async logout(accessToken?: string): Promise<void> {
    try {
      let token = accessToken;
      if (!token) {
        const authData = await AuthStorage.getAuthData();
        token = authData?.accessToken;
      }
      if (token) {
        await UnifiedAuthService.logoutDirect(token);
      }
    } catch {
      // Best-effort: local logout proceeds regardless.
    }
  }

  // -------------------------- Organization management --------------------------

  async getUserOrganizations(): Promise<any[]> {
    try {
      const { data: response } = await this.makeRequest('/organizations', {});
      if (response.success && response.organizations) {
        return response.organizations;
      }
      return [];
    } catch {
      return [];
    }
  }

  async switchOrganization(organizationId: string): Promise<{ success: boolean; message?: string; organization?: any }> {
    try {
      const { data: response } = await this.makeRequest('/organizations/switch', {
        method: 'POST',
        body: JSON.stringify({ organizationId }),
      });

      if (response.success) {
        return { success: true, organization: response.organization };
      }
      return { success: false, message: response.message || 'Failed to switch organization' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to switch organization' };
    }
  }

  async createOrganization(data: { name: string; slug?: string; displayName?: string }): Promise<{ success: boolean; message?: string; organization?: any }> {
    try {
      const { data: response } = await this.makeRequest('/organizations', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.success) {
        return { success: true, organization: response.organization };
      }
      return { success: false, message: response.message || 'Failed to create organization' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to create organization' };
    }
  }

  async getOrganizationMembers(organizationId: string): Promise<any[]> {
    try {
      const { data: response } = await this.makeRequest(`/organizations/${organizationId}/members`, {});
      if (response.success && response.members) {
        return response.members;
      }
      return [];
    } catch {
      return [];
    }
  }

  async inviteMember(organizationId: string, email: string, role: string): Promise<{ success: boolean; message?: string; invitation?: any }> {
    try {
      const { data: response } = await this.makeRequest(`/organizations/${organizationId}/members/invite`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });

      if (response.success) {
        return { success: true, invitation: response.invitation };
      }
      return { success: false, message: response.message || 'Failed to invite member' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to invite member' };
    }
  }

  async getMyInvitations(): Promise<any[]> {
    try {
      const { data: response } = await this.makeRequest('/invitations/my', {});
      if (response.success && response.invitations) {
        return response.invitations;
      }
      return [];
    } catch {
      return [];
    }
  }

  async acceptInvitation(token: string): Promise<{ success: boolean; message?: string; organization?: any }> {
    try {
      const { data: response } = await this.makeRequest('/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      if (response.success) {
        return { success: true, organization: response.organization };
      }
      return { success: false, message: response.message || 'Failed to accept invitation' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to accept invitation' };
    }
  }
}
