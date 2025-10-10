import React, { useState } from 'react';
import { View, StyleSheet, Platform, Text, Alert, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useExpensesInfinite } from '../../hooks/useExpensesInfinite';
import { useGroups } from '../../hooks/useGroups';
import { useAuth } from '../../contexts/AuthContext';
import { GlassListCard } from '../../components/ui/GlassListCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ExpenseItem } from '../../components/features/expenses/ExpenseItem';
import { ExpenseSummary } from '../../components/features/expenses/ExpenseSummary';
import { SkeletonExpenseList, SkeletonExpenseSummary } from '../../components/ui/SkeletonLoader';
import { AddExpenseModal } from '../../components/modals/AddExpenseModal';
import { SearchModal } from '../../components/modals/SearchModal';
import { SearchFloatingButton } from '../../components/ui/SearchFloatingButton';
// import { InfiniteScrollScreen } from '../../components/ui/InfiniteScrollScreen';
import { PullToRefreshSpinner } from '../../components/ui/PullToRefreshSpinner';
import { PullToRefreshScrollView } from '../../components/ui/PullToRefreshScrollView';
import { createPullToRefreshHandlers } from '../../utils/pullToRefreshUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { useSearch } from '../../hooks/useSearch';

export const ExpensesScreen: React.FC = () => {
  const { groups, refreshGroups } = useGroups();
  const { user, isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Use infinite scroll expenses hook
  const {
    expenses,
    loading: expensesLoading,
    loadingMore: expensesLoadingMore,
    error: expensesError,
    hasMore: expensesHasMore,
    loadMore: expensesLoadMore,
    refresh: expensesRefresh,
    totalExpenses,
    addExpense,
  } = useExpensesInfinite();

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
    screenType: 'expenses',
    expenses,
    groups,
  });

  // Debug logging
  console.log('[ExpensesScreen] Expenses data:', {
    expenses,
    expensesLength: expenses.length,
    loading: expensesLoading,
    error: expensesError,
    totalExpenses,
    refreshing,
    groupsLength: groups.length
  });

  const onRefresh = async () => {
    console.log('[ExpensesScreen] onRefresh called');
    setRefreshing(true);
    try {
      console.log('[ExpensesScreen] Starting refresh...');
      // Refresh both groups and expenses
      if (refreshGroups) {
        console.log('[ExpensesScreen] Refreshing groups...');
        await refreshGroups();
      }
      console.log('[ExpensesScreen] Refreshing expenses...');
      await expensesRefresh();
      console.log('[ExpensesScreen] Refresh completed');
    } catch (error) {
      console.error('[ExpensesScreen] Refresh error:', error);
    } finally {
      setRefreshing(false);
      console.log('[ExpensesScreen] Refresh state reset');
    }
  };

  // Create pull-to-refresh handlers using utility function
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag } = createPullToRefreshHandlers({
    onRefresh,
    refreshing,
  });

  const handleAddExpense = async (expenseData: {
    groupId: string;
    title: string;
    totalAmount: string;
    date: string;
  }) => {
    try {
      // Check if user is authenticated
      if (!user) {
        Alert.alert('Error', 'You must be logged in to add expenses');
        return;
      }
      
      // Convert simplified expense data to full expense data
      // Backend will automatically handle user information from sso_token
      const fullExpenseData = {
        groupId: expenseData.groupId,
        title: expenseData.title,
        totalAmount: expenseData.totalAmount,
        // paidBy: removed - backend will set this automatically from authenticated user
        splitType: 'equal' as const, // Default to equal split
        category: 'Other', // Default category
        date: new Date(expenseData.date).toISOString(), // Convert to ISO datetime format
        // splits: removed - backend will auto-generate split for current user
        // description: omitted - not needed for simplified form
      };
      
      await addExpense(fullExpenseData);
      
      // Refresh the expenses list to show the new expense
      await expensesRefresh();
      
      Alert.alert('Success', 'Expense added successfully!');
      setShowAddModal(false); // Close modal after success
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add expense');
    }
  };


  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
        <GlassListCard
          title="Authentication Required"
          subtitle="Please log in to view expenses"
          contentGap={0}
        >
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            You need to be logged in to access this feature.
          </Text>
        </GlassListCard>
      </ScreenContainer>
    );
  }

  // Show skeleton loading on initial load OR during refresh
  const showSkeletonLoading = expensesLoading || refreshing;

  // Create a map of group IDs to group names for quick lookup
  const groupMap = new Map(groups.map(group => [group.id, group.name]));

  return (
    <>
      {/* Reusable Pull-to-Refresh Spinner */}
      <PullToRefreshSpinner refreshing={refreshing} />
      
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <PullToRefreshScrollView
          refreshing={refreshing}
          onRefresh={onRefresh}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          contentContainerStyle={styles.contentContainer}
          style={styles.scrollView}
        >
        {/* Summary Cards */}
        {showSkeletonLoading ? (
          <View style={styles.summaryContainer}>
            <SkeletonExpenseSummary />
          </View>
        ) : (
          <View style={styles.summaryContainer}>
            <ExpenseSummary
              totalExpenses={totalExpenses}
              totalIncome={0} // Not applicable for group expenses
              netBalance={totalExpenses}
            />
          </View>
        )}

        {/* Expenses List */}
        <View style={styles.expensesListContainer}>
          <GlassListCard
            title="Recent Transactions"
            subtitle={
              refreshing 
                ? "Refreshing..."
                : showSkeletonLoading 
                  ? "Loading expenses..." 
                  : "View your recent transactions"
            }
            contentGap={8}
            badge={refreshing || showSkeletonLoading ? undefined : (expenses.length > 0 ? expenses.length : undefined)}
          >
            {showSkeletonLoading ? (
              <SkeletonExpenseList count={5} />
            ) : expensesError ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{expensesError}</Text>
            ) : (
              <FlatList
                data={expenses}
                renderItem={({ item: expense }) => (
                  <ExpenseItem 
                    key={expense.id} 
                    item={expense} 
                    groupName={groupMap.get(expense.groupId)}
                  />
                )}
                keyExtractor={(expense) => expense.id}
                onEndReached={() => {
                  if (expensesHasMore && !expensesLoadingMore) {
                    console.log('[ExpensesScreen] Loading more expenses...');
                    expensesLoadMore();
                  }
                }}
                onEndReachedThreshold={0.1}
                showsVerticalScrollIndicator={false}
                style={styles.expensesList}
                ListFooterComponent={() => {
                  if (expensesLoadingMore) {
                    return (
                      <View style={styles.loadingMore}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.loadingMoreText, { color: colors.mutedForeground }]}>
                          Loading more...
                        </Text>
                      </View>
                    );
                  }
                  return null;
                }}
              />
            )}
          </GlassListCard>
        </View>

        {/* Extra spacing for iOS pull-to-refresh */}
        {Platform.OS === 'ios' && <View style={styles.iosExtraSpacing} />}
        </PullToRefreshScrollView>

        {/* Add Expense Modal */}
        {user && (
          <AddExpenseModal
            visible={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAddExpense={handleAddExpense}
            currentUserId={user.id}
          />
        )}

        {/* Search Modal */}
        <SearchModal
          visible={isSearchVisible}
          onClose={() => {
            console.log('Search modal closing');
            closeSearch();
          }}
          onItemSelect={handleItemSelect}
          searchItems={searchItems}
          placeholder={getSearchPlaceholder()}
          title={getSearchTitle()}
        />
      </View>

      {/* Search Floating Button */}
      <SearchFloatingButton
        onPress={() => {
          console.log('Search button pressed, isSearchVisible:', isSearchVisible);
          console.log('Search items count:', searchItems.length);
          openSearch();
        }}
        position="bottom-right"
        size="medium"
      />

      {/* Floating Action Button - Directly opens add expense modal */}
      <View style={[styles.fabContainer, { bottom: Platform.OS === 'android' ? 120 : 100 }]}>
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (groups.length === 0) {
              Alert.alert('No Groups', 'Please create a group first before adding expenses.');
            } else {
              setShowAddModal(true);
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.fabIcon, { color: colors.primaryForeground }]}>💰</Text>
        </TouchableOpacity>
      </View>
    </>
  );
    };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 10 : 20, // Reduce top padding on iOS
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
  summarySkeleton: {
    marginBottom: 24,
    marginTop: Platform.OS === 'ios' ? -10 : 0, // Move up on iOS
  },
  iosExtraSpacing: {
    height: 100, // Extra space to ensure content is scrollable on iOS
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  expensesListContainer: {
    paddingHorizontal: 20,
  },
  expensesList: {
    maxHeight: 400,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingMoreText: {
    fontSize: 14,
  },
  loadMoreButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  loadMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
