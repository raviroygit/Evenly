import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, Platform } from 'react-native';
import { useGroupsInfinite } from '../../hooks/useGroupsInfinite';
import { GlassListCard } from '../../components/ui/GlassListCard';
import { GroupItem } from '../../components/features/groups/GroupItem';
import { CreateGroupModal } from '../../components/modals/CreateGroupModal';
import { InviteUserModal } from '../../components/modals/InviteUserModal';
import { InvitationsModal } from '../../components/modals/InvitationsModal';
import { SearchModal } from '../../components/modals/SearchModal';
import { SearchFloatingButton } from '../../components/ui/SearchFloatingButton';
import { useGroupInvitations } from '../../hooks/useGroupInvitations';
import { useTheme } from '../../contexts/ThemeContext';
import { PullToRefreshSpinner } from '../../components/ui/PullToRefreshSpinner';
import { PullToRefreshScrollView } from '../../components/ui/PullToRefreshScrollView';
import { createPullToRefreshHandlers } from '../../utils/pullToRefreshUtils';
import { SkeletonGroupList } from '../../components/ui/SkeletonLoader';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';
import { InfiniteScrollScreen } from '../../components/ui/InfiniteScrollScreen';
import { useSearch } from '../../hooks/useSearch';

export const GroupsScreen: React.FC = () => {
  const { 
    groups, 
    loading, 
    loadingMore, 
    error, 
    hasMore, 
    loadMore, 
    refresh, 
    createGroup 
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
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Create pull-to-refresh handlers using utility function
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag } = createPullToRefreshHandlers({
    onRefresh,
    refreshing,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<{ id: string; name: string } | null>(null);
  const [processingToken, setProcessingToken] = useState<string | null>(null);


  const handleCreateGroup = async (groupData: {
    name: string;
    description?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }) => {
    try {
      await createGroup(groupData);
      Alert.alert('Success', 'Group created successfully!');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create group');
    }
  };



  const handleInviteUser = (groupId: string, groupName: string) => {
    setSelectedGroupForInvite({ id: groupId, name: groupName });
    setShowInviteModal(true);
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


  if (loading) {
    return (
      <>
        <PullToRefreshSpinner refreshing={refreshing} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <PullToRefreshScrollView
            refreshing={refreshing}
            onRefresh={onRefresh}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            contentContainerStyle={styles.contentContainer}
          >
            <GlassListCard
              title="Groups"
              contentGap={8}
            >
              <SkeletonGroupList count={3} />
            </GlassListCard>
          </PullToRefreshScrollView>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PullToRefreshSpinner refreshing={refreshing} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <PullToRefreshScrollView
            refreshing={refreshing}
            onRefresh={onRefresh}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            contentContainerStyle={styles.contentContainer}
          >
            <GlassListCard
              title="Groups"
              subtitle="Error loading groups"
              contentGap={0}
            >
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </GlassListCard>
          </PullToRefreshScrollView>
        </View>
      </>
    );
  }

  const renderGroupItem = ({ item: group }: { item: any }) => (
    <GroupItem key={group.id} group={group} onInviteUser={handleInviteUser} />
  );

  const ListHeaderComponent = () => (
    <View style={styles.headerContainer}>
      <GlassListCard
        title="Your Groups"
        subtitle={groups.length === 0 ? "No groups yet. Create your first group!" : "Manage your expense groups"}
        contentGap={8}
        badge={groups.length > 0 ? groups.length : undefined}
      >
        <View style={styles.emptyPlaceholder} />
      </GlassListCard>
    </View>
  );

  return (
    <>
      {/* Reusable Pull-to-Refresh Spinner */}
      <PullToRefreshSpinner refreshing={refreshing} />
      
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
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        />

          {/* Create Group Modal */}
          <CreateGroupModal
            visible={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreateGroup={handleCreateGroup}
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

        {/* Search Modal */}
        <SearchModal
          visible={isSearchVisible}
          onClose={closeSearch}
          onItemSelect={handleItemSelect}
          searchItems={searchItems}
          placeholder={getSearchPlaceholder()}
          title={getSearchTitle()}
        />
      </View>

      {/* Search Floating Button */}
      <SearchFloatingButton
        onPress={openSearch}
        position="bottom-right"
        size="medium"
      />

      {/* Floating Action Button - Outside container for proper positioning */}
      <FloatingActionButton
        actions={[
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
    marginBottom: 16,
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
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
