import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useGroups } from '../../hooks/useGroups';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { ExpenseItem } from '../../components/features/expenses/ExpenseItem';
import { GroupInfoModal } from '../../components/modals/GroupInfoModal';
import { InfiniteScrollScreen } from '../../components/ui/InfiniteScrollScreen';
import { SkeletonExpenseList, SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EnhancedExpense } from '../../types';

export const GroupDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { colors, theme } = useTheme();
  const { groups, loading: groupsLoading } = useGroups();
  const [expenses, setExpenses] = useState<EnhancedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);

  const group = groups.find(g => g.id === groupId);

  useEffect(() => {
    if (groupId) {
      loadExpenses();
    }
  }, [groupId]);

  const loadExpenses = async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      const response = await EvenlyBackendService.getGroupExpenses(groupId);
      setExpenses(response.expenses || []);
      setHasMore(false); // For now, we'll load all expenses
    } catch (error) {
      console.error('Error loading group expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const renderExpenseItem = ({ item }: { item: EnhancedExpense }) => (
    <ExpenseItem 
      key={item.id} 
      item={item} 
      groupName={group?.name}
    />
  );

  const ListHeaderComponent = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {group?.name || 'Group Details'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {expenses.length} {expenses.length === 1 ? 'transaction' : 'transactions'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setShowGroupInfoModal(true)}
        >
          <Ionicons name="eye-outline" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Show skeleton loading state while groups are loading
  if (groupsLoading) {
    return (
      <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.container, styles.skeletonContainer, { backgroundColor: colors.background }]}>
          {/* Skeleton Header */}
          <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
            <View style={styles.headerRow}>
              <View style={styles.backButton}>
                <SkeletonLoader width={24} height={24} borderRadius={12} />
              </View>
              <View style={styles.headerTitleContainer}>
                <SkeletonLoader width={120} height={20} borderRadius={10} style={styles.skeletonTitle} />
                <SkeletonLoader width={100} height={14} borderRadius={7} style={styles.skeletonSubtitle} />
              </View>
              <View style={styles.infoButton}>
                <SkeletonLoader width={24} height={24} borderRadius={12} />
              </View>
            </View>
          </View>
          
          {/* Skeleton Expense List */}
          <View style={[styles.skeletonContentContainer, { backgroundColor: colors.background }]}>
            <SkeletonExpenseList count={5} />
          </View>
        </View>
      </View>
    );
  }

  // Only show error if groups have loaded but group is not found
  if (!group) {
    return (
      <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.errorContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              Group not found
            </Text>
            <Text style={[styles.errorSubtext, { color: colors.mutedForeground }]}>
              The group you're looking for doesn't exist or you don't have access to it.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <InfiniteScrollScreen
            data={expenses}
            renderItem={renderExpenseItem}
            keyExtractor={(expense) => expense.id}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={() => {}}
            onRefresh={onRefresh}
            refreshing={refreshing}
            emptyMessage="No transactions in this group yet."
            loadingMessage="Loading transactions..."
            ListHeaderComponent={ListHeaderComponent}
            contentContainerStyle={[styles.contentContainer, { paddingBottom: 100 }]}
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: colors.background, flex: 1 }}
          />
        </View>
      </View>

      {/* Group Info Modal */}
      <GroupInfoModal
        visible={showGroupInfoModal}
        onClose={() => setShowGroupInfoModal(false)}
        groupId={groupId}
      />
    </>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  skeletonContainer: {
    // Additional styling for skeleton state if needed
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  infoButton: {
    padding: 8,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 0,
  },
  skeletonContentContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
    overflow: 'hidden',
  },
  skeletonTitle: {
    marginBottom: 8,
  },
  skeletonSubtitle: {
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
