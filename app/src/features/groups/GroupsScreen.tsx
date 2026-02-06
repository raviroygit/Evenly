import React, { useState } from 'react';
import { View, StyleSheet, Text, Platform, TouchableOpacity, Alert } from 'react-native';
import { useGroupsInfinite } from '../../hooks/useGroupsInfinite';
import { GlassListCard } from '../../components/ui/GlassListCard';
import { GroupItem } from '../../components/features/groups/GroupItem';
import { CreateGroupModal } from '../../components/modals/CreateGroupModal';
import { InviteUserModal } from '../../components/modals/InviteUserModal';
import { InvitationsModal } from '../../components/modals/InvitationsModal';
import { SearchModal } from '../../components/modals/SearchModal';
import { AddExpenseModal } from '../../components/modals/AddExpenseModal';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { MemberSelectionModal } from '../../components/modals/MemberSelectionModal';
import { useGroupInvitations } from '../../hooks/useGroupInvitations';
import { useTheme } from '../../contexts/ThemeContext';
import { SkeletonGroupList } from '../../components/ui/SkeletonLoader';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';
import { InfiniteScrollScreen } from '../../components/ui/InfiniteScrollScreen';
import { useSearch } from '../../hooks/useSearch';
import { useApiError } from '../../hooks/useApiError';
import ErrorHandler from '../../utils/ErrorHandler';
import { Group } from '../../types';
import { useSwipeAction } from '../../contexts/SwipeActionContext';
import { emitGroupDeleted, emitGroupCreated, emitGroupUpdated } from '../../utils/groupEvents';
import { useAuth } from '../../contexts/AuthContext';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';

export const GroupsScreen: React.FC = () => {
  const { user } = useAuth();
  const {
    groups,
    totalCount,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    createGroup,
    updateGroup,
    deleteGroup
  } = useGroupsInfinite();
  const { 
    sendInvitation, 
    invitations, 
    acceptInvitation, 
    declineInvitation, 
    refreshInvitations 
  } = useGroupInvitations();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { showErrorWithRetry } = useApiError();
  const { setActiveSwipeId } = useSwipeAction();

  // Search functionality
  const {
    isSearchVisible,
    searchItems,
    openSearch,
    closeSearch,
    handleItemSelect,
    getSearchPlaceholder,
    getSearchTitle,
  } = useSearch({
    screenType: 'groups',
    groups,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh both groups and invitations
      await refresh();
      if (refreshInvitations) {
        await refreshInvitations();
      }
    } catch (error) {
      showErrorWithRetry(error, () => onRefresh());
    } finally {
      setRefreshing(false);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<{ id: string; name: string } | null>(null);
  const [processingToken, setProcessingToken] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<{ id: string; name: string } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedGroupForShare, setSelectedGroupForShare] = useState<{ id: string; name: string } | null>(null);

  // Note: Removed useFocusEffect to prevent infinite loops
  // Groups will refresh via pull-to-refresh

  // Note: Swipe actions are now closed via onActionExecuted callback instead of useEffect

  const handleCreateGroup = async (groupData: {
    name: string;
    description?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }) => {
    try {
      const newGroup = await createGroup(groupData);
      // Emit event to notify other screens
      emitGroupCreated(newGroup);
      // Silently refresh to show the new group
      await refresh();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err instanceof Error ? err.message : 'Failed to create group. Please try again.');
      Alert.alert('Error', message);
    }
  };

  const handleUpdateGroup = async (groupId: string, groupData: {
    name: string;
    description?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }) => {
    try {
      const updatedGroup = await updateGroup(groupId, groupData);
      // Emit event to notify other screens
      emitGroupUpdated(updatedGroup);
      setEditingGroup(null);
      // Silently refresh to show updated group
      await refresh();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err instanceof Error ? err.message : 'Failed to update group. Please try again.');
      Alert.alert('Error', message);
    }
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    setDeletingGroup({ id: groupId, name: groupName });
    setShowDeleteModal(true);
  };

  const confirmDeleteGroup = async () => {
    if (!deletingGroup) return;

    try {
      await deleteGroup(deletingGroup.id);
      // Refresh groups to update the list
      await refresh();
      // Emit event to notify other screens
      emitGroupDeleted(deletingGroup.id);
      // Modal will close automatically, show success alert
      Alert.alert('Success', `"${deletingGroup.name}" has been deleted successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete group. Please try again.');
      throw error; // Re-throw to prevent modal from closing
    }
  };



  const handleInviteUser = (groupId: string, groupName: string) => {

    setSelectedGroupForInvite({ id: groupId, name: groupName });
    setShowInviteModal(true);

  };

  const handleShareBalance = (groupId: string, groupName: string) => {
    setSelectedGroupForShare({ id: groupId, name: groupName });
    setShowShareModal(true);
  };

  const handleSendInvitation = async (email: string) => {
    if (!selectedGroupForInvite) return;
    
    try {
      await sendInvitation(selectedGroupForInvite.id, email);
    } catch (error) {
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setSelectedGroupForInvite(null);
  };

  const handleAcceptInvitation = async (token: string) => {
    try {
      setProcessingToken(token);
      await acceptInvitation(token);
      Alert.alert('Success', 'You have joined the group successfully!');
      await refreshInvitations(); // Refresh the invitations list
      await refresh(); // Refresh the groups list to show the new group and updated member counts
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setProcessingToken(null);
    }
  };

  const handleDeclineInvitation = async (token: string) => {
    try {
      setProcessingToken(token);
      await declineInvitation(token);
      Alert.alert('Success', 'Invitation declined');
      await refreshInvitations(); // Refresh the invitations list
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to decline invitation');
    } finally {
      setProcessingToken(null);
    }
  };

  const handleAddExpense = async (expenseData: {
    groupId: string;
    title: string;
    totalAmount: string;
    date: string;
  }) => {
    try {
      // Convert date to ISO datetime format (backend requires date-time format)
      const dateWithTime = expenseData.date.includes('T')
        ? expenseData.date
        : `${expenseData.date}T00:00:00.000Z`;

      // Add required fields that the modal doesn't collect yet
      const fullExpenseData = {
        ...expenseData,
        date: dateWithTime,
        splitType: 'equal' as const, // Default to equal split
        category: 'Other', // Default category
      };

      await EvenlyBackendService.createExpense(fullExpenseData);
      // Refresh groups to show updated data
      await refresh();
      Alert.alert('Success', 'Expense added successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add expense');
      throw error; // Re-throw to let modal handle it
    }
  };


  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassListCard
          title="Groups"
          contentGap={8}
        >
          <SkeletonGroupList count={3} />
        </GlassListCard>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassListCard
          title="Groups"
          subtitle="Unable to load groups"
          contentGap={0}
        >
          <View style={styles.errorContainer}>
            <Text style={[styles.errorIcon, { color: colors.destructive }]}>⚠️</Text>
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {ErrorHandler.handleApiError(error).message}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => showErrorWithRetry(error, () => refresh())}
            >
              <Text style={[styles.retryButtonText, { color: colors.primaryForeground }]}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </GlassListCard>
      </View>
    );
  }

  const renderGroupItem = ({ item: group }: { item: any }) => {
    const handleEditGroup = (group: any) => {
      
      setEditingGroup(group);
      
    };

    return (
      <GroupItem
        key={group.id}
        group={group}
        onInviteUser={handleInviteUser}
        onEditGroup={handleEditGroup}
        onDeleteGroup={handleDeleteGroup}
        onShareBalance={handleShareBalance}
        onActionExecuted={() => {
          // Use requestAnimationFrame to ensure modal has time to render
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setActiveSwipeId(null);
            });
          });
        }}
      />
    );
  };

  const ListHeaderComponent = () => (
    <View style={styles.headerContainer}>
      <GlassListCard
        title="Your Groups"
        subtitle={totalCount === 0 ? "No groups yet. Create your first group!" : "Manage your expense groups"}
        contentGap={8}
        badge={totalCount > 0 ? totalCount : undefined}
      >
        <View style={styles.emptyPlaceholder} />
      </GlassListCard>
    </View>
  );

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <InfiniteScrollScreen
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(group) => group.id}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onRefresh={onRefresh}
          refreshing={refreshing}
          emptyMessage="Create a group to start splitting expenses with friends and family."
          loadingMessage="Loading groups..."
          ListHeaderComponent={ListHeaderComponent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        />

          {/* Create/Edit Group Modal */}
          <CreateGroupModal
            visible={showCreateModal || !!editingGroup}
            onClose={() => {
              setShowCreateModal(false);
              setEditingGroup(null);
            }}
            onCreateGroup={handleCreateGroup}
            onUpdateGroup={handleUpdateGroup}
            editGroup={editingGroup}
          />

          {/* Invite User Modal */}
          {selectedGroupForInvite && (
            <InviteUserModal
              visible={showInviteModal}
              onClose={handleCloseInviteModal}
              onSendInvitation={handleSendInvitation}
              groupName={selectedGroupForInvite.name}
            />
          )}

          {/* Invitations Modal */}
          <InvitationsModal
            visible={showInvitationsModal}
            onClose={() => setShowInvitationsModal(false)}
            invitations={invitations}
            onAccept={handleAcceptInvitation}
            onDecline={handleDeclineInvitation}
            onRefresh={refreshInvitations}
            processingToken={processingToken || undefined}
          />

          {/* Add Expense Modal */}
          <AddExpenseModal
            visible={showAddExpenseModal}
            onClose={() => setShowAddExpenseModal(false)}
            onAddExpense={handleAddExpense}
            currentUserId={user?.id || ''}
          />

        {/* Search Modal */}
        <SearchModal
          visible={isSearchVisible}
          onClose={closeSearch}
          onItemSelect={handleItemSelect}
          searchItems={searchItems}
          placeholder={getSearchPlaceholder()}
          title={getSearchTitle()}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          visible={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingGroup(null);
          }}
          onConfirm={confirmDeleteGroup}
          title="Delete Group"
          description={`Are you sure you want to delete "${deletingGroup?.name}"? This will also delete all expenses in this group. This action cannot be undone.`}
        />

        {/* Member Selection Modal for Sharing */}
        <MemberSelectionModal
          visible={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedGroupForShare(null);
          }}
          groupId={selectedGroupForShare?.id || null}
          groupName={selectedGroupForShare?.name || 'Group'}
        />
      </View>

      {/* Floating Action Button - Outside container for proper positioning */}
      <FloatingActionButton
        actions={[
          {
            id: 'add-expense',
            title: 'Add Expense',
            icon: '💰',
            onPress: () => setShowAddExpenseModal(true),
            color: '#10B981',
          },
          {
            id: 'search',
            title: 'Search',
            icon: '🔍',
            onPress: openSearch,
          },
          {
            id: 'create-group',
            title: 'Create Group',
            icon: '👥',
            onPress: () => setShowCreateModal(true),
          },
          {
            id: 'view-invitations',
            title: 'View Invitations',
            icon: '📧',
            onPress: () => setShowInvitationsModal(true),
          },
        ]}
        position="bottom-right"
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 6,
  },
  emptyPlaceholder: {
    height: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
