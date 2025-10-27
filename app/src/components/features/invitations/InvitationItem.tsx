import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';

interface InvitationItemProps {
  invitation: {
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
  };
  onAccept: (token: string) => void;
  onDecline: (token: string) => void;
  isProcessing?: boolean;
}

export const InvitationItem: React.FC<InvitationItemProps> = ({
  invitation,
  onAccept,
  onDecline,
  isProcessing = false,
}) => {
  const { colors, theme } = useTheme();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = new Date() > new Date(invitation.expiresAt);

  const cardStyle = {
    backgroundColor: theme === 'dark' ? colors.card : colors.background,
    borderColor: theme === 'dark' ? colors.border : colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  };

  return (
    <View style={[styles.invitationCard, cardStyle]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.groupInfo}>
            <Text style={[styles.groupName, { color: colors.foreground }]}>
              {invitation.group?.name || 'Unknown Group'}
            </Text>
            <Text style={[styles.inviterText, { color: colors.mutedForeground }]}>
              Invited by {invitation.inviter?.name || 'Unknown User'}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            {isExpired ? (
              <View style={[styles.statusBadge, { backgroundColor: colors.destructive + '20' }]}>
                <Text style={[styles.statusText, { color: colors.destructive }]}>
                  Expired
                </Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.statusText, { color: colors.primary }]}>
                  Pending
                </Text>
              </View>
            )}
          </View>
        </View>

        {invitation.group?.description && (
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {invitation.group.description}
          </Text>
        )}

        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              Invited {formatDate(invitation.createdAt)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              Expires {formatDate(invitation.expiresAt)}
            </Text>
          </View>
        </View>

        {!isExpired && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton, { borderColor: colors.border }]}
              onPress={() => onDecline(invitation.token)}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={18} color={colors.destructive} />
              <Text style={[styles.actionButtonText, { color: colors.destructive }]}>
                Decline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.primary }]}
              onPress={() => onAccept(invitation.token)}
              disabled={isProcessing}
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                Accept
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  invitationCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  inviterText: {
    fontSize: 14,
  },
  statusContainer: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  declineButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  acceptButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
