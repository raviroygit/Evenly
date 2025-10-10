import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { useGroupInvitations } from '../../hooks/useGroupInvitations';
import { PlatformActionButton } from '../../components/ui/PlatformActionButton';
import { GlassListCard } from '../../components/ui/GlassListCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { InvitationItem } from '../../components/features/invitations/InvitationItem';
import { useTheme } from '../../contexts/ThemeContext';

export const InvitationsScreen: React.FC = () => {
  const { colors } = useTheme();
  const {
    invitations,
    loading,
    error,
    acceptInvitation,
    declineInvitation,
    refreshInvitations,
  } = useGroupInvitations();
  const [processingToken, setProcessingToken] = useState<string | null>(null);

  const handleAccept = async (token: string) => {
    try {
      setProcessingToken(token);
      await acceptInvitation(token);
      Alert.alert('Success', 'You have joined the group successfully!');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setProcessingToken(null);
    }
  };

  const handleDecline = async (token: string) => {
    try {
      setProcessingToken(token);
      await declineInvitation(token);
      Alert.alert('Success', 'Invitation declined');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to decline invitation');
    } finally {
      setProcessingToken(null);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <GlassListCard
          title="Group Invitations"
          subtitle="Loading invitations..."
          contentGap={0}
        />
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <GlassListCard
          title="Group Invitations"
          subtitle="Error loading invitations"
          contentGap={0}
        >
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <PlatformActionButton
            title="Retry"
            onPress={refreshInvitations}
            variant="primary"
            size="medium"
            style={styles.retryButton}
          />
        </GlassListCard>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <GlassListCard
        title="Group Invitations"
        subtitle={invitations.length === 0 ? "No pending invitations" : `${invitations.length} pending invitation${invitations.length !== 1 ? 's' : ''}`}
        contentGap={8}
      >
        {invitations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              You don't have any pending group invitations.
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
              When someone invites you to join a group, it will appear here.
            </Text>
          </View>
        ) : (
          invitations.map((invitation) => (
            <InvitationItem
              key={invitation.id}
              invitation={invitation}
              onAccept={handleAccept}
              onDecline={handleDecline}
              isProcessing={processingToken === invitation.token}
            />
          ))
        )}
      </GlassListCard>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    alignSelf: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
