import { useState, useEffect } from 'react';
import { GroupInvitationService } from '../services/GroupInvitationService';
import { useAuth } from '../contexts/AuthContext';

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

export const useGroupInvitations = () => {
  const { authState } = useAuth();
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPendingInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const invitationsData = await GroupInvitationService.getPendingInvitations();
      setInvitations(invitationsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load invitations';
      setError(errorMessage);
      console.error('Error loading pending invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (groupId: string, invitedEmail: string) => {
    try {
      setError(null);
      const newInvitation = await GroupInvitationService.sendInvitation({
        groupId,
        invitedEmail,
      });
      return newInvitation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
      setError(errorMessage);
      console.error('Error sending invitation:', err);
      throw new Error(errorMessage);
    }
  };

  const acceptInvitation = async (token: string) => {
    try {
      setError(null);
      await GroupInvitationService.acceptInvitation({ token });
      
      // Remove the accepted invitation from the list
      setInvitations(prev => prev.filter(inv => inv.token !== token));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(errorMessage);
      console.error('Error accepting invitation:', err);
      throw new Error(errorMessage);
    }
  };

  const declineInvitation = async (token: string) => {
    try {
      setError(null);
      await GroupInvitationService.declineInvitation({ token });
      
      // Remove the declined invitation from the list
      setInvitations(prev => prev.filter(inv => inv.token !== token));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decline invitation';
      setError(errorMessage);
      console.error('Error declining invitation:', err);
      throw new Error(errorMessage);
    }
  };

  // Wait for auth to be ready before loading data
  useEffect(() => {
    // Clear data when user logs out
    if (authState === 'unauthenticated' || authState === 'initializing') {
      console.log('[useGroupInvitations] User logged out or initializing - clearing invitations');
      setInvitations([]);
      setLoading(true);
      setError(null);
      return;
    }

    // Only load data when authenticated
    if (authState !== 'authenticated') {
      console.log('[useGroupInvitations] Auth not ready, skipping data load. State:', authState);
      return;
    }

    console.log('[useGroupInvitations] Auth ready, loading invitations...');
    loadPendingInvitations();
  }, [authState]);

  return {
    invitations,
    loading,
    error,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    refreshInvitations: loadPendingInvitations,
  };
};
