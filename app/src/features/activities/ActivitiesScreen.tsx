import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useActivitiesContext } from '../../contexts/ActivitiesContext';
import { usePreferredCurrency } from '../../hooks/usePreferredCurrency';
import { SkeletonActivityList } from '../../components/ui/SkeletonLoader';
import { GroupInfoModal } from '../../components/modals/GroupInfoModal';

interface ActivityItem {
  id: string;
  type: 'expense' | 'payment' | 'group' | 'invitation' | 'khata';
  title: string;
  description: string;
  amount?: number;
  memberCount?: number;
  groupName?: string;
  customerName?: string;
  khataType?: 'give' | 'get';
  date: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

export const ActivitiesScreen: React.FC = () => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { formatAmount } = usePreferredCurrency();
  const {
    activities,
    totalCount,
    loading,
    refresh,
  } = useActivitiesContext();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

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
      const groupId = activity.id.replace('group-', '');
      setSelectedGroupId(groupId);
      setIsGroupModalVisible(true);
    }
  };

  const handleCloseGroupModal = () => {
    setIsGroupModalVisible(false);
    setSelectedGroupId(null);
  };

  const renderActivityItem = ({ item: activity }: { item: ActivityItem }) => (
    <TouchableOpacity
      style={[
        styles.activityItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          ...(Platform.OS === 'ios' && {
            shadowColor: theme === 'dark' ? colors.foreground : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: theme === 'dark' ? 0.12 : 0.05,
            shadowRadius: 4,
          }),
        },
      ]}
      onPress={() => handleActivityPress(activity)}
      activeOpacity={activity.type === 'group' ? 0.7 : 1}
      disabled={activity.type !== 'group'}
    >
      <View style={[styles.activityIcon, { backgroundColor: colors.muted }]}>
        <Text style={styles.iconText}>{getActivityIcon(activity.type)}</Text>
      </View>

      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={[styles.activityTitle, { color: colors.foreground }]}>
            {activity.title}
          </Text>
          {(activity.amount !== undefined && activity.amount !== null) && (
            <Text
              style={[
                styles.activityAmount,
                {
                  color:
                    activity.type === 'khata'
                      ? activity.khataType === 'give'
                        ? '#10B981'
                        : '#EF4444'
                      : getActivityColor(activity.type),
                },
              ]}
            >
              {formatAmount(activity.amount ?? 0)}
            </Text>
          )}
        </View>

        {activity.description && (
          <Text
            style={[
              styles.activityDescription,
              {
                color:
                  activity.type === 'khata'
                    ? activity.khataType === 'give'
                      ? '#10B981'
                      : '#EF4444'
                    : colors.mutedForeground,
              },
            ]}
          >
            {activity.description}
          </Text>
        )}

        <View style={styles.activityFooter}>
          <Text style={[styles.activityDate, { color: colors.mutedForeground }]}>
            {activity.date}
          </Text>
          <View style={styles.badgesContainer}>
            {activity.groupName && activity.type === 'expense' && (
              <View style={[styles.groupBadge, { backgroundColor: '#2196F3' + '20' }]}>
                <Text style={[styles.groupText, { color: '#2196F3' }]}>
                  {activity.groupName}
                </Text>
              </View>
            )}
            {activity.customerName && activity.type === 'khata' && (
              <View style={[styles.customerBadge, { backgroundColor: '#E91E63' + '20' }]}>
                <Text style={[styles.customerText, { color: '#E91E63' }]}>
                  {activity.customerName}
                </Text>
              </View>
            )}
            {activity.khataType && activity.type === 'khata' && (
              <View
                style={[
                  styles.khataTypeBadge,
                  {
                    backgroundColor:
                      activity.khataType === 'give' ? '#10B981' + '20' : '#EF4444' + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.khataTypeText,
                    {
                      color: activity.khataType === 'give' ? '#10B981' : '#EF4444',
                    },
                  ]}
                >
                  {activity.khataType === 'get' ? 'You will give' : 'You will get'}
                </Text>
              </View>
            )}
            {activity.memberCount && (
              <View
                style={[
                  styles.memberBadge,
                  { backgroundColor: getActivityColor(activity.type) + '20' },
                ]}
              >
                <Text
                  style={[styles.memberText, { color: getActivityColor(activity.type) }]}
                >
                  {activity.memberCount} members
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.muted }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={[styles.backIcon, { color: colors.foreground }]}>←</Text>
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>All Activities</Text>
        {totalCount > 0 && (
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {totalCount} {totalCount === 1 ? 'activity' : 'activities'}
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        No Activities Yet
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        Your activity history will appear here. Start by creating a group or adding an expense.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <View style={styles.content}>
          <SkeletonActivityList count={10} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={20}
        windowSize={10}
        initialNumToRender={20}
      />

      <GroupInfoModal
        visible={isGroupModalVisible}
        onClose={handleCloseGroupModal}
        groupId={selectedGroupId}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  activityDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  groupText: {
    fontSize: 10,
    fontWeight: '600',
  },
  customerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  customerText: {
    fontSize: 10,
    fontWeight: '600',
  },
  khataTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  khataTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  memberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
  },
});
