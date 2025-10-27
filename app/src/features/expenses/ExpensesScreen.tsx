import React, { useState, useEffect } from 'react';
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
import { useSwipeAction } from '../../contexts/SwipeActionContext';
import { EnhancedExpense } from '../../types';
import { groupEvents, GROUP_EVENTS } from '../../utils/groupEvents';

export const ExpensesScreen: React.FC = () => {
  const { groups, refreshGroups } = useGroups();
  const { user, isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingExpense, setEditingExpense] = useState<EnhancedExpense | null>(null);
  const { setActiveSwipeId } = useSwipeAction();

  // Note: Swipe actions are now closed via onActionExecuted callback instead of useEffect

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
    updateExpense,
    deleteExpense,
  } = useExpensesInfinite();

  // Note: Removed useFocusEffect to prevent infinite loops
  // Groups and expenses will refresh via pull-to-refresh and event system

  // Listen for group deletion events with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleGroupDeleted = () => {
      console.log('ExpensesScreen: Group deleted event received - scheduling refresh');
      
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Debounce the refresh to prevent rapid calls
      timeoutId = setTimeout(() => {
        console.log('ExpensesScreen: Executing debounced refresh');
        if (refreshGroups) {
          refreshGroups();
        }
        expensesRefresh();
      }, 500); // 500ms debounce
    };

    groupEvents.on(GROUP_EVENTS.GROUPS_REFRESH_NEEDED, handleGroupDeleted);

    return () => {
      groupEvents.off(GROUP_EVENTS.GROUPS_REFRESH_NEEDED, handleGroupDeleted);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [refreshGroups, expensesRefresh]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh both groups and expenses
      if (refreshGroups) {
        await refreshGroups();
      }
      await expensesRefresh();
    } catch (error) {
      console.error('[ExpensesScreen] Refresh error:', error);
    } finally {
      setRefreshing(false);
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

  const handleUpdateExpense = async (expenseId: string, expenseData: {
    title: string;
    totalAmount: string;
    date: string;
  }) => {
    try {
      await updateExpense(expenseId, expenseData);
      Alert.alert('Success', 'Expense updated successfully!');
      setEditingExpense(null);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update expense');
    }
  };

  const handleDeleteExpense = async (expenseId: string, expenseTitle: string) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expenseTitle}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(expenseId);
              Alert.alert('Success', 'Expense deleted successfully!');
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete expense');
            }
          },
        },
      ]
    );
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
  
  // Filter out expenses from deleted groups
  const validExpenses = expenses.filter(expense => groupMap.has(expense.groupId));

  // Create header component for FlatList
  const ListHeaderComponent = () => (
    <>
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
          badge={refreshing || showSkeletonLoading ? undefined : (validExpenses.length > 0 ? validExpenses.length : undefined)}
          style={styles.glassCardHeader}
        >
          <View style={styles.headerContent}>
            {/* Header content only, no list here */}
          </View>
        </GlassListCard>
      </View>
    </>
  );

  return (
    <>
      <ScreenContainer scrollable={false}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {showSkeletonLoading ? (
            <SkeletonExpenseList count={5} />
          ) : expensesError ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{expensesError}</Text>
          ) : (
            <FlatList
              data={validExpenses}
              renderItem={({ item: expense }) => (
                <ExpenseItem 
                  item={expense} 
                  groupName={groupMap.get(expense.groupId) || 'Unknown Group'}
                  onEditExpense={setEditingExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onActionExecuted={() => {
                    console.log('ExpenseItem action executed, closing swipe actions with animation frames');
                    // Use requestAnimationFrame to ensure modal has time to render
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        setActiveSwipeId(null);
                      });
                    });
                  }}
                />
              )}
              keyExtractor={(expense, index) => `${expense.id}-${index}`}
              onEndReached={() => {
                if (expensesHasMore && !expensesLoadingMore) {
                  expensesLoadMore();
                }
              }}
              onEndReachedThreshold={0.1}
              showsVerticalScrollIndicator={false}
              style={styles.expensesList}
              contentContainerStyle={styles.expensesListContent}
              refreshing={refreshing}
              onRefresh={onRefresh}
              ListHeaderComponent={ListHeaderComponent}
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
      </ScreenContainer>

      {/* Add/Edit Expense Modal */}
      {user && (
        <AddExpenseModal
          visible={showAddModal || !!editingExpense}
          onClose={() => {
            setShowAddModal(false);
            setEditingExpense(null);
          }}
          onAddExpense={handleAddExpense}
          onUpdateExpense={handleUpdateExpense}
          currentUserId={user.id}
          editExpense={editingExpense}
        />
      )}

      {/* Search Modal */}
      <SearchModal
        visible={isSearchVisible}
        onClose={() => {
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
