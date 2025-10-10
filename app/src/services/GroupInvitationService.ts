import { evenlyApiClient } from './EvenlyApiClient';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface GroupInvitation {
  id: string;
  groupId: string;
  invitedBy: string;
  invitedEmail: string;
  invitedUserId?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  createdAt: string;
  updatedAt: string;
  group?: {
    id: string;
    name: string;
    description?: string;
    currency: string;
    defaultSplitType: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
  inviter?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface SendInvitationData {
  groupId: string;
  invitedEmail: string;
}

interface AcceptInvitationData {
  token: string;
}

interface DeclineInvitationData {
  token: string;
}

export class GroupInvitationService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    try {
      // Convert RequestInit to Axios config
      const axiosConfig: any = {
        method: options.method || 'GET',
        ...options,
      };

      // Handle body for POST/PUT requests
      if (options.body) {
        axiosConfig.data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      }

      // Use the Axios client with automatic authentication
      const response = await evenlyApiClient.getInstance().request<ApiResponse<T>>({
        url: endpoint,
        ...axiosConfig,
      });

      return response.data;
    } catch (error: any) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }


  // Send group invitation
  static async sendInvitation(data: SendInvitationData): Promise<GroupInvitation> {
    const response = await this.makeRequest<GroupInvitation>('/invitations/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Get pending invitations for current user
  static async getPendingInvitations(): Promise<GroupInvitation[]> {
    const response = await this.makeRequest<GroupInvitation[]>('/invitations/pending');
    return response.data;
  }

  // Accept group invitation
  static async acceptInvitation(data: AcceptInvitationData): Promise<void> {
    await this.makeRequest('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Decline group invitation
  static async declineInvitation(data: DeclineInvitationData): Promise<void> {
    await this.makeRequest('/invitations/decline', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get invitation details by token (public endpoint)
  static async getInvitationByToken(token: string): Promise<GroupInvitation> {
    const response = await this.makeRequest<GroupInvitation>(`/invitations/${token}`, {
      method: 'GET',
    });
    return response.data;
  }
}
