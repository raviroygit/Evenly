import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useActivitiesContext } from '../../../contexts/ActivitiesContext';
import { SkeletonActivityList } from '../../ui/SkeletonLoader';
import { GlassListCard } from '../../ui/GlassListCard';
import { GroupInfoModal } from '../../modals/GroupInfoModal';

interface ActivityItem {
  id: string;
  type: 'expense' | 'payment' | 'group' | 'invitation' | 'khata';
  title: string;
  description: string;
  amount?: string;
  memberCount?: number;
  groupName?: string; // Group name for expense activities
  customerName?: string; // Customer name for khata activities
  khataType?: 'give' | 'get'; // Transaction type for khata activities
  date: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

interface RecentActivityProps {
  onViewAll?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  onRefreshRef?: React.MutableRefObject<(() => void) | null>;
  isAddingExpense?: boolean; // Show skeleton loader when adding expense
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  onViewAll,
  refreshing = false,
  onRefresh,
  onRefreshRef,
  isAddingExpense = false
}) => {
  const {
    activities,
    totalCount,
    loading,
    hasInitiallyLoaded,
    refresh: refreshActivities,
  } = useActivitiesContext();

  // Expose refresh function to parent component
  useEffect(() => {
    if (onRefreshRef) {
      onRefreshRef.current = refreshActivities;
    }
    return () => {
      if (onRefreshRef) {
        onRefreshRef.current = null;
      }
    };
  }, [refreshActivities, onRefreshRef]);

  // Log when activities change to debug
  useEffect(() => {
    console.log('[RecentActivity] Activities changed:', {
      loaded: activities.length,
      total: totalCount,
      activities: activities.map(a => ({ id: a.id, title: a.title }))
    });
  }, [activities, totalCount]);

  const { colors, theme } = useTheme();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);

  // Show skeleton loader only on initial load (never loaded before) or when adding expense
  // Once data is loaded once, always show it (even during refreshes)
  // This prevents skeleton on navigation back when activities are cached in context
  const showSkeleton = (!hasInitiallyLoaded && loading) || isAddingExpense;

  // Limit to first 3 activities to keep the dashboard clean and focused
  const displayedActivities = activities.slice(0, 3);

  if (showSkeleton) {
    return (
      <GlassListCard
        title="Recent Activity"
        subtitle={isAddingExpense ? "Adding expense..." : "Loading activities..."}
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
      case 'khata':
        return '📒';
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
      case 'khata':
        return '#E91E63';
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
              {
                color: activity.type === 'khata'
                  ? (activity.khataType === 'give' ? '#10B981' : '#EF4444')
                  : getActivityColor(activity.type)
              }
            ]}>
              {activity.amount}
            </Text>
          )}
        </View>
        
        {activity.description && (
          <Text style={[
            styles.activityDescription,
            {
              color: activity.type === 'khata'
                ? (activity.khataType === 'give' ? '#10B981' : '#EF4444')
                : colors.mutedForeground
            }
          ]}>
            {activity.description}
          </Text>
        )}
        
        <View style={styles.activityFooter}>
          <Text style={[styles.activityDate, { color: colors.mutedForeground }]}>
            {activity.date}
          </Text>
          <View style={styles.badgesContainer}>
            {activity.groupName && activity.type === 'expense' && (
              <View style={[
                styles.groupBadge,
                { backgroundColor: '#2196F3' + '20' }
              ]}>
                <Text style={[
                  styles.groupText,
                  { color: '#2196F3' }
                ]}>
                  {activity.groupName}
                </Text>
              </View>
            )}
            {activity.customerName && activity.type === 'khata' && (
              <View style={[
                styles.customerBadge,
                { backgroundColor: '#E91E63' + '20' }
              ]}>
                <Text style={[
                  styles.customerText,
                  { color: '#E91E63' }
                ]}>
                  {activity.customerName}
                </Text>
              </View>
            )}
            {activity.khataType && activity.type === 'khata' && (
              <View style={[
                styles.khataTypeBadge,
                {
                  backgroundColor: activity.khataType === 'give'
                    ? '#10B981' + '20'
                    : '#EF4444' + '20'
                }
              ]}>
                <Text style={[
                  styles.khataTypeText,
                  {
                    color: activity.khataType === 'give' ? '#10B981' : '#EF4444'
                  }
                ]}>
                  {activity.khataType === 'get' ? 'You will give' : 'You will get'}
                </Text>
              </View>
            )}
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
        subtitle={showSkeleton ? (isAddingExpense ? "Adding expense..." : "Loading...") : "View your recent activities"}
        contentGap={6}
        badge={showSkeleton ? undefined : (totalCount > 0 ? totalCount : undefined)}
        style={styles.glassCard}
      >
        {showSkeleton ? (
          <SkeletonActivityList count={3} />
        ) : activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No recent activity. Start by creating a group or adding an expense.
            </Text>
          </View>
        ) : (
          <View style={styles.activitiesContainer}>
            {displayedActivities.map((activity) => (
              <ActivityItemComponent key={activity.id} activity={activity} />
            ))}
            {totalCount > 3 && (
              <TouchableOpacity
                style={[
                  styles.viewAllButton,
                  {
                    backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                    borderColor: theme === 'dark' ? '#333333' : '#E0E0E0',
                  },
                ]}
                onPress={onViewAll}
                activeOpacity={0.7}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View All {totalCount} Activities
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
  groupBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  groupText: {
    fontSize: 9,
    fontWeight: '600',
  },
  customerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customerText: {
    fontSize: 9,
    fontWeight: '600',
  },
  khataTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  khataTypeText: {
    fontSize: 9,
    fontWeight: '600',
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
    gap: 3,
  },
  glassCard: {
    // Remove flex to allow natural height
  },
  viewAllButton: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
