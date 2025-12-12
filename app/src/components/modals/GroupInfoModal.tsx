import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useGroups } from '../../hooks/useGroups';
import { useAllExpenses } from '../../hooks/useAllExpenses';
import { ExpenseItem } from '../features/expenses/ExpenseItem';
import { SkeletonExpenseList } from '../ui/SkeletonLoader';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { MemberInfoModal } from './MemberInfoModal';
import { GroupMember } from '../../types';

interface GroupInfoModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string | null;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  visible,
  onClose,
  groupId,
}) => {
  const { colors, theme } = useTheme();
  const { groups, loading: groupsLoading } = useGroups();
  const { expenses, loading: expensesLoading } = useAllExpenses();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [creator, setCreator] = useState<{ name: string; email: string } | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ name: string; email: string } | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Find the specific group
  const group = groups.find(g => g.id === groupId);

  // Filter expenses for this group
  const groupExpenses = expenses.filter(expense => expense.groupId === groupId);

  useEffect(() => {
    if (visible && groupId) {
      loadMembers();
      loadCreator();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, groupId]);

  const loadMembers = async () => {
    if (!groupId) return;
    
    try {
      setLoadingMembers(true);
      const membersData = await EvenlyBackendService.getGroupMembers(groupId);
      setMembers(membersData.map((m: any) => ({
        id: m.id || m.userId,
        name: m.user?.name || m.name || 'Unknown',
        email: m.user?.email || m.email || 'Unknown',
        avatar: m.user?.avatar || m.avatar,
        role: m.role || 'member',
      })));
    } catch (error) {
      console.error('Error loading group members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadCreator = async () => {
    if (!group?.createdBy) return;
    
    try {
      setLoadingCreator(true);
      // Try to find creator in members first
      const membersData = await EvenlyBackendService.getGroupMembers(groupId!);
      const creatorMember = membersData.find((m: any) => (m.userId || m.user?.id) === group.createdBy);
      
      if (creatorMember) {
        setCreator({
          name: creatorMember.user?.name || creatorMember.name || 'Unknown',
          email: creatorMember.user?.email || creatorMember.email || 'Unknown',
        });
      } else {
        // If not found in members, we'll just show the ID or try to get from auth
        setCreator({
          name: 'Unknown',
          email: 'Unknown',
        });
      }
    } catch (error) {
      console.error('Error loading creator:', error);
      setCreator({
        name: 'Unknown',
        email: 'Unknown',
      });
    } finally {
      setLoadingCreator(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleMemberPress = (member: GroupMember) => {
    setSelectedMember({
      name: member.name,
      email: member.email,
    });
    setShowMemberModal(true);
  };

  if (!visible || !groupId) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
          },
        ]}
      >
        <View style={styles.overlayTouchable}>
          <TouchableOpacity
            style={styles.overlayBackground}
            activeOpacity={1}
            onPress={handleClose}
          />
          <View style={styles.modalWrapper}>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: colors.background,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Group Information
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {groupsLoading || expensesLoading ? (
                  <View style={styles.loadingContainer}>
                    <View style={styles.skeletonContainer}>
                      <View style={[styles.skeletonLine, { backgroundColor: colors.muted }]} />
                      <View style={[styles.skeletonLine, { backgroundColor: colors.muted }]} />
                      <View style={[styles.skeletonLine, { backgroundColor: colors.muted }]} />
                    </View>
                    <SkeletonExpenseList count={3} />
                  </View>
                ) : group ? (
                  <>
                    {/* Group Information */}
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                        Group Details
                      </Text>
                      <View style={styles.groupInfo}>
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            Group Name
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {group.name}
                          </Text>
                        </View>
                        
                        {group.description && (
                          <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                              Description
                            </Text>
                            <Text style={[styles.infoValue, { color: colors.foreground }]}>
                              {group.description}
                            </Text>
                          </View>
                        )}
                        
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            Created By
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {loadingCreator ? 'Loading...' : (creator?.name || 'Unknown')}
                          </Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            Members
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {group.memberCount} members
                          </Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            Default Split
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {group.defaultSplitType.charAt(0).toUpperCase() + group.defaultSplitType.slice(1)}
                          </Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            Currency
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {group.currency}
                          </Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            Created
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {new Date(group.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Members List */}
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                        Members ({members.length})
                      </Text>
                      {loadingMembers ? (
                        <View style={styles.emptyState}>
                          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                            Loading members...
                          </Text>
                        </View>
                      ) : members.length === 0 ? (
                        <View style={styles.emptyState}>
                          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                            No members found.
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.membersList}>
                          {members.map((member) => (
                            <View
                              key={member.id}
                              style={[
                                styles.memberRow,
                                {
                                  backgroundColor: theme === 'dark' 
                                    ? '#1A1A1A' 
                                    : '#F8F8F8',
                                  borderColor: theme === 'dark' 
                                    ? '#333333' 
                                    : '#E0E0E0',
                                },
                              ]}
                            >
                              <View style={styles.memberInfo}>
                                <View style={[styles.memberAvatar, { backgroundColor: colors.primary + '20' }]}>
                                  <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
                                    {member.name.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={styles.memberDetails}>
                                  <Text style={[styles.memberName, { color: colors.foreground }]}>
                                    {member.name}
                                  </Text>
                                  <Text style={[styles.memberRole, { color: colors.mutedForeground }]}>
                                    {member.role === 'admin' ? 'Admin' : 'Member'}
                                  </Text>
                                </View>
                              </View>
                              <TouchableOpacity
                                style={styles.memberEyeButton}
                                onPress={() => handleMemberPress(member)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <Ionicons name="eye-outline" size={20} color={colors.foreground} />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Group Expenses */}
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                        Group Expenses ({groupExpenses.length})
                      </Text>
                      {groupExpenses.length === 0 ? (
                        <View style={styles.emptyState}>
                          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                            No expenses in this group yet.
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.expensesList}>
                          {groupExpenses.map((expense) => (
                            <ExpenseItem key={expense.id} item={expense} />
                          ))}
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colors.destructive }]}>
                      Group not found
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>

      {/* Member Info Modal */}
      <MemberInfoModal
        visible={showMemberModal}
        onClose={() => {
          setShowMemberModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '60%',
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  groupInfo: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  expensesList: {
    gap: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    gap: 20,
  },
  skeletonContainer: {
    gap: 12,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
    opacity: 0.3,
  },
  membersList: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
    fontWeight: '500',
  },
  memberEyeButton: {
    padding: 8,
  },
});
