import { User } from '../types';
import { evenlyApiClient } from './EvenlyApiClient';
import { ENV } from '../config/env';
import { AuthStorage } from '../utils/storage';

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export class AuthService {
  /**
   * Sync user with evenly-backend after successful authentication
   */
  private async syncUserWithEvenlyBackend(user: any): Promise<void> {
    try {
      // Use the Axios client to make a test API call to evenly-backend to trigger user sync
      // The interceptor will automatically add the Bearer token
      await evenlyApiClient.get('/groups');
    } catch (error) {
      // Don't throw error as this shouldn't block the auth flow
    }
  }


  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: any; accessToken?: string; refreshToken?: string }> {
    try {
      // Convert RequestInit to Axios config
      const axiosConfig: any = {
        method: options.method || 'GET',
        url: endpoint,
        ...options,
      };

      // Handle body for POST/PUT requests
      if (options.body) {
        axiosConfig.data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      }

      // NO MANUAL HEADER SETTING - Let the interceptor handle authentication
      // The interceptor will automatically add Bearer token from storage

      // Use the Axios client
      const response = await evenlyApiClient.getInstance().request(axiosConfig);

      // Extract JWT tokens from response body if available
      const accessToken = response.data.accessToken || response.data.data?.accessToken;
      const refreshToken = response.data.refreshToken || response.data.data?.refreshToken;

      return { data: response.data, accessToken, refreshToken };
    } catch (error: any) {
      throw error;
    }
  }

  async signup(email: string): Promise<AuthResponse> {
    try {
      const { data: response } = await this.makeRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          senderName: ENV.APP_NAME,
          appName: ENV.APP_NAME
        }),
      });

      // Check backend response success field
      if (response.success === false || !response.success) {
        return {
          success: false,
          message: response.message || 'Failed to send magic link',
        };
      }

      return {
        success: true,
        message: response.message || 'Magic link sent to your email!',
      };
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message;
      return {
        success: false,
        message: serverMsg || error.message || 'Failed to send magic link',
      };
    }
  }

  async requestOTP(email: string): Promise<AuthResponse> {
    try {
      const { data: response } = await this.makeRequest('/auth/login/otp', {
        method: 'POST',
        body: JSON.stringify({
          email,
          senderName: ENV.APP_NAME,
          appName: ENV.APP_NAME
        }),
      });

      // Check backend response success field
      if (response.success === false || !response.success) {
        return {
          success: false,
          message: response.message || 'Failed to send OTP',
        };
      }

      return {
        success: true,
        message: response.message || 'OTP sent to your email!',
      };
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message;
      return {
        success: false,
        message: serverMsg || error.message || 'Failed to send OTP',
      };
    }
  }

  async verifyOTP(email: string, otp: string): Promise<AuthResponse & { accessToken?: string; refreshToken?: string }> {
    try {
      const { data: response, accessToken, refreshToken } = await this.makeRequest('/auth/login/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });

      if (response.success && (response.user || response.data?.user)) {
        const user = response.user || response.data?.user;
        const organization = response.organization || response.data?.organization;

        // Store organization if available
        if (organization) {
          await AuthStorage.setCurrentOrganizationId(organization.id);
        }

        // Sync user with evenly-backend
        await this.syncUserWithEvenlyBackend(user);

        const userResponse = {
          id: user.id,
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber,
          stats: {
            groups: 0,
            totalSpent: 0,
            owed: 0,
          },
          organizations: organization ? [organization] : undefined,
          currentOrganization: organization,
        };

        return {
          success: true,
          message: response.message || 'Login successful!',
          user: userResponse,
          accessToken,
          refreshToken,
        };
      }

      return {
        success: false,
        message: response.message || 'Invalid OTP',
      };
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message;
      return {
        success: false,
        message: serverMsg || error.message || 'Invalid OTP',
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // First, try to get phoneNumber from stored user data (from auth service)
      const storedAuthData = await AuthStorage.getAuthData();
      const storedPhoneNumber = storedAuthData?.user?.phoneNumber;

      const { data: response } = await this.makeRequest('/auth/me', {});
      if (response.success && response.user) {
        const organizations = response.organizations || [];

        // Store organizations
        if (organizations.length > 0) {

          // Set current organization to the first one if not already set
          const currentOrgId = await AuthStorage.getCurrentOrganizationId();
          if (!currentOrgId && organizations[0]) {
            await AuthStorage.setCurrentOrganizationId(organizations[0].id);
          }
        }

        // Sync user with evenly-backend
        await this.syncUserWithEvenlyBackend(response.user);

        // Use phoneNumber from response if available, otherwise use stored phoneNumber
        // This handles the case where evenly-backend doesn't return phoneNumber
        const phoneNumber = response.user.phoneNumber || storedPhoneNumber;

        return {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          phoneNumber: phoneNumber,
          stats: { groups: 0, totalSpent: 0, owed: 0 }, // Will be updated from evenly-backend
          organizations: organizations,
          defaultOrganizationId: response.user.defaultOrganizationId,
          lastOrganizationId: response.user.lastOrganizationId,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async updateUserProfile(update: { name?: string; email?: string }): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const { data: response } = await this.makeRequest('/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Even if logout fails on server, we should clear local state
    }
  }

  // Handle magic link verification (for web-based magic links)
  async verifyMagicLink(token: string): Promise<AuthResponse> {
    try {
      const { data: response } = await this.makeRequest(`/auth/magic?token=${token}`, {
        method: 'GET',
      });

      return {
        success: true,
        message: response.message || 'Magic link verified!',
        user: {
          id: response.userId || 'temp-id',
          email: 'user@example.com', // You might want to get this from the response
          name: 'User',
          stats: {
            groups: 0,
            totalSpent: 0,
            owed: 0,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Invalid magic link',
      };
    }
  }

  // Organization methods
  async getUserOrganizations(): Promise<any[]> {
    try {
      const { data: response } = await this.makeRequest('/organizations', {});
      if (response.success && response.organizations) {
        return response.organizations;
      }
      return [];
    } catch (error) {
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
        return {
          success: true,
          organization: response.organization,
        };
      }

      return {
        success: false,
        message: response.message || 'Failed to switch organization',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to switch organization',
      };
    }
  }

  async createOrganization(data: { name: string; slug?: string; displayName?: string }): Promise<{ success: boolean; message?: string; organization?: any }> {
    try {
      const { data: response } = await this.makeRequest('/organizations', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.success) {
        return {
          success: true,
          organization: response.organization,
        };
      }

      return {
        success: false,
        message: response.message || 'Failed to create organization',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create organization',
      };
    }
  }

  async getOrganizationMembers(organizationId: string): Promise<any[]> {
    try {
      const { data: response } = await this.makeRequest(`/organizations/${organizationId}/members`, {});
      if (response.success && response.members) {
        return response.members;
      }
      return [];
    } catch (error) {
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
        return {
          success: true,
          invitation: response.invitation,
        };
      }

      return {
        success: false,
        message: response.message || 'Failed to invite member',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to invite member',
      };
    }
  }

  async getMyInvitations(): Promise<any[]> {
    try {
      const { data: response } = await this.makeRequest('/invitations/my', {});
      if (response.success && response.invitations) {
        return response.invitations;
      }
      return [];
    } catch (error) {
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
        return {
          success: true,
          organization: response.organization,
        };
      }

      return {
        success: false,
        message: response.message || 'Failed to accept invitation',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to accept invitation',
      };
    }
  }
}
