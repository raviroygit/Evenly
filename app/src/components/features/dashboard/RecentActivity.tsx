import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { SkeletonActivityList } from '../../ui/SkeletonLoader';
import { GlassListCard } from '../../ui/GlassListCard';
// import { InfiniteScrollList } from '../../ui/InfiniteScrollList';
import { GroupInfoModal } from '../../modals/GroupInfoModal';
import { useActivitiesInfinite } from '../../../hooks/useActivitiesInfinite';

interface ActivityItem {
  id: string;
  type: 'expense' | 'payment' | 'group' | 'invitation';
  title: string;
  description: string;
  amount?: string;
  memberCount?: number;
  date: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

interface RecentActivityProps {
  onViewAll?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ 
  onViewAll,
  refreshing = false,
  onRefresh
}) => {
  const {
    activities,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = useActivitiesInfinite();
  const { colors, theme } = useTheme();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);

  if (loading) {
    return (
      <GlassListCard
        title="Recent Activity"
        subtitle="Loading activities..."
        contentGap={8}
      >
        <SkeletonActivityList count={3} />
      </GlassListCard>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return '💰';
      case 'payment':
        return '💳';
      case 'group':
        return '👥';
      case 'invitation':
        return '📧';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'expense':
        return '#FF9800';
      case 'payment':
        return '#4CAF50';
      case 'group':
        return '#2196F3';
      case 'invitation':
        return '#9C27B0';
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return colors.mutedForeground;
    }
  };

  const handleActivityPress = (activity: ActivityItem) => {
    if (activity.type === 'group') {
      // Extract group ID from activity ID (format: "group-{groupId}")
      const groupId = activity.id.replace('group-', '');
      setSelectedGroupId(groupId);
      setIsGroupModalVisible(true);
    }
    // Add other modal logic for different activity types here
  };

  const handleCloseGroupModal = () => {
    setIsGroupModalVisible(false);
    setSelectedGroupId(null);
  };

  const ActivityItemComponent: React.FC<{ activity: ActivityItem }> = React.memo(({ activity }) => (
    <TouchableOpacity
      style={{
        ...styles.activityItem,
        backgroundColor: theme === 'dark' 
          ? '#1A1A1A' 
          : '#F8F8F8',
        borderColor: theme === 'dark' 
          ? '#333333' 
          : '#E0E0E0',
      }}
      onPress={() => handleActivityPress(activity)}
      activeOpacity={activity.type === 'group' ? 0.7 : 1}
      disabled={activity.type !== 'group'}
    >
      <View style={styles.activityIcon}>
        <Text style={styles.iconText}>{getActivityIcon(activity.type)}</Text>
      </View>
      
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={[styles.activityTitle, { color: colors.foreground }]}>
            {activity.title}
          </Text>
          {activity.amount && (
            <Text style={[
              styles.activityAmount,
              { color: getActivityColor(activity.type) }
            ]}>
              ₹{activity.amount}
            </Text>
          )}
        </View>
        
        {activity.description && (
          <Text style={[styles.activityDescription, { color: colors.mutedForeground }]}>
            {activity.description}
          </Text>
        )}
        
        <View style={styles.activityFooter}>
          <Text style={[styles.activityDate, { color: colors.mutedForeground }]}>
            {activity.date}
          </Text>
          <View style={styles.badgesContainer}>
            {activity.memberCount && (
              <View style={[
                styles.memberBadge,
                { backgroundColor: getActivityColor(activity.type) + '20' }
              ]}>
                <Text style={[
                  styles.memberText,
                  { color: getActivityColor(activity.type) }
                ]}>
                  {activity.memberCount} members
                </Text>
              </View>
            )}
            {activity.status && (
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(activity.status) + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(activity.status) }
                ]}>
                  {activity.status}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ));

  // const SkeletonActivityItem: React.FC<{ index: number }> = ({ index }) => (
  //   <View key={index} style={styles.activityItem}>
  //     <SkeletonLoader
  //       width={40}
  //       height={40}
  //       borderRadius={20}
  //       style={styles.activityIcon}
  //     />
      
  //     <View style={styles.activityContent}>
  //       <View style={styles.activityHeader}>
  //         <SkeletonText lines={1} width="60%" />
  //         <SkeletonLoader width={60} height={16} borderRadius={8} />
  //       </View>
        
  //       <SkeletonText lines={1} width="80%" />
        
  //       <View style={styles.activityFooter}>
  //         <SkeletonLoader width={80} height={12} borderRadius={6} />
  //         <SkeletonLoader width={50} height={16} borderRadius={8} />
  //       </View>
  //     </View>
  //   </View>
  // );

  return (
    <>
      <GlassListCard
        title="Recent Activity"
        subtitle={loading ? "Loading..." : "View your recent activities"}
        contentGap={6}
        badge={loading ? undefined : (activities.length > 0 ? activities.length : undefined)}
        style={styles.glassCard}
      >
        {loading ? (
          <SkeletonActivityList count={3} />
        ) : activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No recent activity. Start by creating a group or adding an expense.
            </Text>
          </View>
        ) : (
          <FlatList
            data={activities}
            renderItem={({ item: activity }) => (
              <ActivityItemComponent key={activity.id} activity={activity} />
            )}
            keyExtractor={(activity) => activity.id}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            style={styles.activitiesList}
            contentContainerStyle={styles.activitiesContainer}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReached={() => {
              if (hasMore && !loadingMore) {
                console.log('[RecentActivity] Loading more activities...');
                loadMore();
              }
            }}
            onEndReachedThreshold={0.1}
            ListFooterComponent={() => {
              if (loadingMore) {
                return (
                  <View style={styles.loadingMore}>
                    <Text style={[styles.loadingMoreText, { color: colors.mutedForeground }]}>
                      Loading more activities...
                    </Text>
                  </View>
                );
              }
              return null;
            }}
            removeClippedSubviews={false}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={5}
            getItemLayout={(data, index) => ({
              length: 100, // Approximate height of each item
              offset: 100 * index,
              index,
            })}
          />
        )}
      </GlassListCard>
      
      {/* Group Info Modal */}
      <GroupInfoModal
        visible={isGroupModalVisible}
        onClose={handleCloseGroupModal}
        groupId={selectedGroupId}
      />
    </>
  );
};

const styles = StyleSheet.create({
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12, // Reduced from 16
    borderRadius: 8, // Reduced from 12
    borderWidth: 1,
    marginBottom: 3, // Reduced from 4
    // shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Reduced shadow
    shadowOpacity: 0.03, // Reduced shadow
    shadowRadius: 2, // Reduced shadow
    // elevation: 1, // Reduced elevation
  },
  activityIcon: {
    width: 32, // Reduced from 40
    height: 32, // Reduced from 40
    borderRadius: 16, // Reduced from 20
    // backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10, // Reduced from 12
  },
  iconText: {
    fontSize: 16, // Reduced from 18
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2, // Reduced from 4
  },
  activityTitle: {
    fontSize: 14, // Reduced from 16
    fontWeight: '600',
    flex: 1,
  },
  activityAmount: {
    fontSize: 14, // Reduced from 16
    fontWeight: '700',
    marginLeft: 6, // Reduced from 8
  },
  activityDescription: {
    fontSize: 12, // Reduced from 14
    marginBottom: 4, // Reduced from 8
    lineHeight: 16, // Reduced from 18
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityDate: {
    fontSize: 10, // Reduced from 12
    fontWeight: '500',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // Reduced from 6
  },
  memberBadge: {
    paddingHorizontal: 6, // Reduced from 8
    paddingVertical: 2, // Reduced from 4
    borderRadius: 8, // Reduced from 12
  },
  memberText: {
    fontSize: 9, // Reduced from 10
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 6, // Reduced from 8
    paddingVertical: 2, // Reduced from 4
    borderRadius: 8, // Reduced from 12
  },
  statusText: {
    fontSize: 9, // Reduced from 10
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  activitiesContainer: {
    gap: 3, // Reduced from 6
    paddingBottom: 80, // Reduced from 100
  },
  glassCard: {
    // Remove flex to allow natural height
  },
  activitiesList: {
    maxHeight: 300, // Reduced height for smaller cards
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
  },
});
