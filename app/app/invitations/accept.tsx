import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GroupInvitationService } from '../../src/services/GroupInvitationService';
import { useAuth } from '../../src/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface InvitationDetails {
  id: string;
  groupId: string;
  invitedEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expiresAt: string;
  group?: {
    id: string;
    name: string;
    description?: string;
    currency: string;
  };
  inviter?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function AcceptInvitationScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInvitationDetails();
    } else {
      setError('Invalid invitation link');
      setLoading(false);
    }
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching invitation details for token:', token);
      const details = await GroupInvitationService.getInvitationByToken(token as string);
      console.log('Invitation details:', details);

      setInvitation(details);

      // Check if already accepted
      if (details.status === 'accepted') {
        Alert.alert(
          'Already Accepted',
          'You have already accepted this invitation!',
          [
            {
              text: 'Go to Group',
              onPress: () => router.replace(`/tabs/groups/${details.groupId}`),
            },
          ]
        );
      }

      // Check if expired
      if (details.status === 'expired' || new Date(details.expiresAt) < new Date()) {
        setError('This invitation has expired');
      }

      // Check if declined
      if (details.status === 'declined') {
        setError('This invitation was declined');
      }
    } catch (err: any) {
      console.error('Error fetching invitation:', err);
      setError(err.response?.data?.message || 'Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!isAuthenticated) {
      // Redirect to login first
      Alert.alert(
        'Login Required',
        'Please login or create an account to accept this invitation.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Login',
            onPress: () => {
              // Navigate to login and pass invitation token
              router.push(`/auth/login?invitationToken=${token}`);
            },
          },
        ]
      );
      return;
    }

    try {
      setAccepting(true);

      console.log('Accepting invitation with token:', token);
      await GroupInvitationService.acceptInvitation({ token: token as string });

      // Show success message
      Alert.alert(
        'Success!',
        `You've joined ${invitation?.group?.name || 'the group'}!`,
        [
          {
            text: 'Go to Group',
            onPress: () => {
              // Navigate to the group
              router.replace(`/tabs/groups/${invitation?.groupId}`);
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to accept invitation. Please try again.'
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineInvitation = () => {
    Alert.alert(
      'Decline Invitation',
      'Are you sure you want to decline this invitation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await GroupInvitationService.declineInvitation({ token: token as string });
              Alert.alert('Declined', 'Invitation declined successfully', [
                {
                  text: 'OK',
                  onPress: () => router.replace('/tabs'),
                },
              ]);
            } catch (err: any) {
              Alert.alert('Error', 'Failed to decline invitation');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading invitation...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error || !invitation) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContent}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorText}>{error || 'Invalid invitation'}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace('/tabs')}
            >
              <Text style={styles.buttonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>You're Invited!</Text>

          <View style={styles.card}>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{invitation.group?.name}</Text>
              {invitation.group?.description && (
                <Text style={styles.groupDescription}>
                  {invitation.group.description}
                </Text>
              )}
            </View>

            <View style={styles.inviterInfo}>
              <Text style={styles.inviterLabel}>Invited by</Text>
              <View style={styles.inviterRow}>
                {invitation.inviter?.avatar ? (
                  <Image
                    source={{ uri: invitation.inviter.avatar }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {invitation.inviter?.name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <Text style={styles.inviterName}>{invitation.inviter?.name}</Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>Currency:</Text>
              <Text style={styles.detailValue}>{invitation.group?.currency}</Text>
            </View>

            {invitation.expiresAt && (
              <View style={styles.expiryInfo}>
                <Text style={styles.expiryText}>
                  Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAcceptInvitation}
              disabled={accepting}
            >
              {accepting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Accept Invitation</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={handleDeclineInvitation}
              disabled={accepting}
            >
              <Text style={[styles.buttonText, styles.declineButtonText]}>
                Decline
              </Text>
            </TouchableOpacity>
          </View>

          {!isAuthenticated && (
            <View style={styles.loginHint}>
              <Text style={styles.loginHintText}>
                💡 You'll need to login or create an account to accept this invitation
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  groupInfo: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  inviterInfo: {
    marginBottom: 16,
  },
  inviterLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  inviterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inviterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  expiryInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  expiryText: {
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'center',
    fontWeight: '500',
  },
  actions: {
    marginBottom: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButtonText: {
    color: '#ffffff',
  },
  loginHint: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  loginHintText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
