import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { ReusableModal } from '../ui/ReusableModal';
import { ResponsiveButtonRow } from '../ui/ResponsiveButtonRow';
import { ModalButtonContainer } from '../ui/ModalButtonContainer';
import { useTheme } from '../../contexts/ThemeContext';

interface Invitation {
  id: string;
  groupId: string;
  invitedBy: string;
  invitedEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expiresAt: string;
  createdAt: string;
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

interface InvitationsModalProps {
  visible: boolean;
  onClose: () => void;
  invitations: Invitation[];
  onAccept: (token: string) => void;
  onDecline: (token: string) => void;
  onRefresh: () => void;
  processingToken?: string;
}

export const InvitationsModal: React.FC<InvitationsModalProps> = ({
  visible,
  onClose,
  invitations,
  onAccept,
  onDecline,
  onRefresh,
  processingToken,
}) => {
  const { colors } = useTheme();

  const renderContent = () => {
    if (invitations.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No invitations found
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            When someone invites you to join a group, it will appear here.
          </Text>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.primary }]}
            onPress={onRefresh}
          >
            <Text style={[styles.refreshText, { color: '#FFFFFF' }]}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.invitationsList}>
        {invitations.map((invitation) => (
          <View 
            key={invitation.id} 
            style={[
              styles.invitationCard, 
              { 
                backgroundColor: colors.card,
                borderColor: colors.border,
              }
            ]}
          >
            {/* Group name as title */}
            <Text style={[styles.groupTitle, { color: colors.foreground }]}>
              {invitation.group?.name || 'Unknown Group'}
            </Text>
            
            {/* Status and Inviter badges */}
            <View style={styles.badgesRow}>
              {/* Status badge */}
              <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: colors.primary }]}>
                  {invitation.status}
                </Text>
              </View>
              
              {/* Inviter badge */}
              <View style={[styles.inviterBadge, { backgroundColor: colors.muted + '20' }]}>
                <Text style={[styles.inviterBadgeText, { color: colors.mutedForeground }]}>
                  by {invitation.inviter?.name || 'Unknown User'}
                </Text>
              </View>
            </View>
            
            {/* Action buttons */}
            <ModalButtonContainer
              buttons={[
                {
                  title: "Decline",
                  onPress: () => onDecline(invitation.token),
                  variant: "destructive",
                  disabled: processingToken === invitation.token,
                  loading: processingToken === invitation.token,
                },
                {
                  title: "Accept",
                  onPress: () => onAccept(invitation.token),
                  variant: "primary",
                  disabled: processingToken === invitation.token,
                  loading: processingToken === invitation.token,
                },
              ]}
              style={styles.buttonRow}
              forceVertical={Dimensions.get('window').width < 400}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <ReusableModal
      visible={visible}
      onClose={onClose}
      title="Group Invitations"
      showCloseButton={true}
    >
      {renderContent()}
    </ReusableModal>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 16,
    fontWeight: '600',
  },
  invitationsList: {
    gap: 16,
  },
  invitationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  inviterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inviterBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  buttonRow: {
    marginTop: 16,
    marginBottom: 8,
  },
});
