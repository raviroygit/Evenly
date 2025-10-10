import { useState, useEffect } from 'react';
import { GroupInvitationService } from '../services/GroupInvitationService';

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
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPendingInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading pending invitations...');
      const invitationsData = await GroupInvitationService.getPendingInvitations();
      console.log('Pending invitations loaded successfully:', invitationsData);
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
      console.log('Sending invitation to:', invitedEmail);
      const newInvitation = await GroupInvitationService.sendInvitation({
        groupId,
        invitedEmail,
      });
      console.log('Invitation sent successfully:', newInvitation);
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
      console.log('Accepting invitation with token:', token);
      await GroupInvitationService.acceptInvitation({ token });
      console.log('Invitation accepted successfully');
      
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
      console.log('Declining invitation with token:', token);
      await GroupInvitationService.declineInvitation({ token });
      console.log('Invitation declined successfully');
      
      // Remove the declined invitation from the list
      setInvitations(prev => prev.filter(inv => inv.token !== token));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decline invitation';
      setError(errorMessage);
      console.error('Error declining invitation:', err);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    loadPendingInvitations();
  }, []);

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
