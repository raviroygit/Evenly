import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassButton } from '../../src/components/ui/GlassButton';
import { ReusableModal } from '../../src/components/ui/ReusableModal';
import { GlassInput } from '../../src/components/ui/GlassInput';
import { AuthService } from '../../src/services/AuthService';

interface Member {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  status: 'active' | 'suspended';
  joinedAt: string;
}

export default function OrganizationSettings() {
  const { currentOrganization, refreshOrganizations } = useAuth();
  const { colors } = useTheme();
  const authService = new AuthService();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'guest'>('member');
  const [inviting, setInviting] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const orgMembers = await authService.getOrganizationMembers(currentOrganization.id);
      setMembers(orgMembers);
    } catch (error) {
      console.error('Failed to load members:', error);
      Alert.alert('Error', 'Failed to load organization members');
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    await refreshOrganizations();
    setRefreshing(false);
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!currentOrganization) return;

    try {
      setInviting(true);
      await authService.inviteMember(currentOrganization.id, inviteEmail, inviteRole);
      Alert.alert('Success', `Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteModalVisible(false);
      await loadMembers();
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return ['#6366f1', '#8b5cf6'];
      case 'admin':
        return ['#8b5cf6', '#a855f7'];
      case 'member':
        return ['#3b82f6', '#6366f1'];
      case 'guest':
        return ['#64748b', '#475569'];
      default:
        return ['#6366f1', '#8b5cf6'];
    }
  };

  const canInviteMembers = currentOrganization?.role === 'owner' || currentOrganization?.role === 'admin';
  const canManageOrg = currentOrganization?.role === 'owner' || currentOrganization?.role === 'admin';

  if (!currentOrganization) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Organization Settings',
            headerShown: true,
          }}
        />
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={64} color={colors.subtext} />
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No organization selected
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Organization Settings',
          headerShown: true,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Organization Header */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.orgIcon}>
            <Text style={styles.orgIconText}>
              {(currentOrganization.displayName || currentOrganization.name).charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.orgName}>
            {currentOrganization.displayName || currentOrganization.name}
          </Text>
          <View style={styles.headerMeta}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {currentOrganization.role.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.planText}>
              {currentOrganization.plan.charAt(0).toUpperCase() + currentOrganization.plan.slice(1)} Plan
            </Text>
          </View>
        </LinearGradient>

        {/* Organization Info */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Organization Details
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="link-outline" size={20} color={colors.subtext} />
            <Text style={[styles.infoLabel, { color: colors.subtext }]}>Slug:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {currentOrganization.slug}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.subtext} />
            <Text style={[styles.infoLabel, { color: colors.subtext }]}>Created:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(currentOrganization.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </GlassCard>

        {/* Members Section */}
        <GlassCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Members ({members.length})
            </Text>
            {canInviteMembers && (
              <TouchableOpacity
                onPress={() => setInviteModalVisible(true)}
                style={styles.inviteButton}
              >
                <Ionicons name="person-add" size={20} color="#6366f1" />
                <Text style={styles.inviteButtonText}>Invite</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : members.length === 0 ? (
            <View style={styles.emptyMembers}>
              <Ionicons name="people-outline" size={48} color={colors.subtext} />
              <Text style={[styles.emptyMembersText, { color: colors.subtext }]}>
                No members yet
              </Text>
            </View>
          ) : (
            <View style={styles.membersList}>
              {members.map((member) => (
                <View
                  key={member.id}
                  style={[styles.memberItem, { borderBottomColor: colors.border }]}
                >
                  <View style={styles.memberIcon}>
                    <Text style={styles.memberIconText}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                      {member.name}
                    </Text>
                    <Text style={[styles.memberEmail, { color: colors.subtext }]}>
                      {member.email}
                    </Text>
                  </View>
                  <LinearGradient
                    colors={getRoleBadgeColor(member.role)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.memberRoleBadge}
                  >
                    <Text style={styles.memberRoleText}>
                      {member.role.toUpperCase()}
                    </Text>
                  </LinearGradient>
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Actions */}
        {canManageOrg && (
          <GlassCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Organization Actions
            </Text>
            <GlassButton
              onPress={() => {
                // TODO: Navigate to edit organization screen
                Alert.alert('Coming Soon', 'Edit organization functionality will be available soon');
              }}
              style={styles.actionButton}
            >
              <Ionicons name="create-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Edit Organization</Text>
            </GlassButton>
          </GlassCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Invite Member Modal */}
      <ReusableModal
        visible={inviteModalVisible}
        onClose={() => !inviting && setInviteModalVisible(false)}
        title="Invite Member"
        titleGradient
      >
        <View style={styles.modalContent}>
          <GlassInput
            placeholder="Email address"
            value={inviteEmail}
            onChangeText={setInviteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!inviting}
          />

          <Text style={[styles.inputLabel, { color: colors.text }]}>Role</Text>
          <View style={styles.roleSelector}>
            {(['admin', 'member', 'guest'] as const).map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => !inviting && setInviteRole(role)}
                style={[
                  styles.roleOption,
                  {
                    backgroundColor: inviteRole === role ? '#6366f1' : colors.card,
                    borderColor: inviteRole === role ? '#6366f1' : colors.border,
                  },
                ]}
                disabled={inviting}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    { color: inviteRole === role ? 'white' : colors.text },
                  ]}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <GlassButton
              onPress={() => setInviteModalVisible(false)}
              disabled={inviting}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </GlassButton>
            <GlassButton
              onPress={handleInviteMember}
              disabled={inviting}
              style={[styles.modalButton, styles.primaryButton]}
            >
              {inviting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[styles.modalButtonText, { color: 'white' }]}>
                  Send Invite
                </Text>
              )}
            </GlassButton>
          </View>
        </View>
      </ReusableModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  orgIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgIconText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  orgName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  planText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    margin: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyMembers: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyMembersText: {
    fontSize: 14,
    fontWeight: '500',
  },
  membersList: {
    gap: 0,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  memberIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  memberRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  memberRoleText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bottomSpacer: {
    height: 32,
  },
  modalContent: {
    gap: 16,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
