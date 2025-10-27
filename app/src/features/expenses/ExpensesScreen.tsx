import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, ActivityIndicator, FlatList } from 'react-native';
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
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';
// import { InfiniteScrollScreen } from '../../components/ui/InfiniteScrollScreen';
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
      <ScreenContainer scrollable={false}>
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
      <ScreenContainer scrollable={false}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
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

          {/* Expenses List Header */}
          <View style={styles.expensesListHeader}>
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
              style={styles.glassCardHeader}
            >
              <View style={styles.headerContent}>
                {/* Header content only, no list here */}
              </View>
            </GlassListCard>
          </View>

          {/* Expenses List - Full Height */}
          <View style={styles.expensesListContainer}>
            {showSkeletonLoading ? (
              <SkeletonExpenseList count={5} />
            ) : expensesError ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{expensesError}</Text>
            ) : (
              <FlatList
                data={expenses}
                renderItem={({ item: expense }) => (
                  <ExpenseItem 
                    item={expense} 
                    groupName={groupMap.get(expense.groupId)}
                  />
                )}
                keyExtractor={(expense, index) => `${expense.id}-${index}`}
                onEndReached={() => {
                  if (expensesHasMore && !expensesLoadingMore) {
                    console.log('[ExpensesScreen] Loading more expenses...');
                    expensesLoadMore();
                  }
                }}
                onEndReachedThreshold={0.1}
                showsVerticalScrollIndicator={false}
                style={styles.expensesList}
                contentContainerStyle={styles.expensesListContent}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListHeaderComponent={() => (
                  <View style={styles.listHeader}>
                    {/* Add any header content here if needed */}
                  </View>
                )}
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
          </View>
        </View>
      </ScreenContainer>

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

      {/* Floating Action Button */}
      <FloatingActionButton
        actions={[
          {
            id: 'search',
            title: 'Search',
            icon: '🔍',
            onPress: () => {
              console.log('Search button pressed, isSearchVisible:', isSearchVisible);
              console.log('Search items count:', searchItems.length);
              openSearch();
            },
          },
          {
            id: 'add-expense',
            title: 'Add Expense',
            icon: '💰',
            onPress: () => {
              if (groups.length === 0) {
                Alert.alert('No Groups', 'Please create a group first before adding expenses.');
              } else {
                setShowAddModal(true);
              }
            },
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
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  expensesListHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  glassCardHeader: {
    // Header card doesn't need flex
  },
  headerContent: {
    height: 0, // No content in header card
  },
  expensesListContainer: {
    paddingHorizontal: 20,
    flex: 1,
  },
  expensesList: {
    flex: 1,
  },
  expensesListContent: {
    paddingBottom: 100, // Add padding to prevent items from being hidden behind bottom tabs
  },
  listHeader: {
    height: 0, // No header content for now
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
});
