import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, FlatList, Alert } from 'react-native';
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
  const { groups, refreshGroups, loading: groupsLoading } = useGroups();
  const { user, isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingExpense, setEditingExpense] = useState<EnhancedExpense | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isUpdatingExpense, setIsUpdatingExpense] = useState(false);
  const { setActiveSwipeId } = useSwipeAction();

  // Note: Removed useEffect to prevent infinite loops
  // Groups will be refreshed only when needed (button press or events)

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

  // Note: Removed useEffect to prevent infinite loops
  // Groups will be refreshed when user clicks add expense button

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
      }, 2000); // Increased debounce time to 2 seconds
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
        return;
      }
      
      setIsAddingExpense(true);
      
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
      setShowAddModal(false); // Close modal immediately
      
      // Refresh both expenses and groups to show the new expense
      console.log('[ExpensesScreen] Expense added successfully, refreshing data...');
      await Promise.all([
        expensesRefresh(),
        refreshGroups ? refreshGroups() : Promise.resolve()
      ]);
    } catch (error) {
      console.error('[ExpensesScreen] Error adding expense:', error);
      // Silent error - user can see it in the UI state
    } finally {
      setIsAddingExpense(false);
    }
  };

  const handleUpdateExpense = async (expenseId: string, expenseData: {
    title: string;
    totalAmount: string;
    date: string;
  }) => {
    try {
      setIsUpdatingExpense(true);
      await updateExpense(expenseId, expenseData);
      setEditingExpense(null);
      // Silently refresh to show updated expense
      await expensesRefresh();
    } catch (error) {
      console.error('[ExpensesScreen] Error updating expense:', error);
      // Silent error - user can see it in the UI state
    } finally {
      setIsUpdatingExpense(false);
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
              // Silently refresh to show updated list
              await expensesRefresh();
            } catch (error) {
              console.error('Error deleting expense:', error);
              // Silent error - user can see it in the UI state
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

  // Show skeleton loading on initial load OR during refresh OR when adding/updating expense
  const showSkeletonLoading = expensesLoading || refreshing || isAddingExpense || isUpdatingExpense;

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
            netBalance={0} // Show 0 when no expenses
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
          marginBottom={8}
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
          {showSkeletonLoading && !refreshing ? (
            <>
              <SkeletonExpenseSummary />
              <SkeletonExpenseList count={5} />
            </>
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
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.mutedForeground }]}>
                    No expenses found. Create a group and add some expenses to get started!
                  </Text>
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
            onPress: async () => {
              console.log('Add expense pressed - groups:', groups.length, groups, 'loading:', groupsLoading);
              
              // Always try to refresh groups first to ensure we have latest data
              if (refreshGroups) {
                console.log('Add expense: Refreshing groups to get latest data...');
                try {
                  await refreshGroups();
                  // Wait a moment for groups to update
                  setTimeout(() => {
                    console.log('After refresh - groups:', groups.length, groups);
                    if (groups.length === 0) {
                      Alert.alert('No Groups', 'Please create a group first before adding expenses.');
                    } else {
                      setShowAddModal(true);
                    }
                  }, 500);
                } catch (error) {
                  console.error('Error refreshing groups:', error);
                  Alert.alert('Error', 'Failed to load groups. Please try again.');
                }
              } else {
                // Fallback if refreshGroups is not available
                if (groups.length === 0) {
                  Alert.alert('No Groups', 'Please create a group first before adding expenses.');
                } else {
                  setShowAddModal(true);
                }
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20, // Changed from 40 to match other cards
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryContainer: {
    marginBottom: 8,
  },
  expensesListHeader: {
    marginBottom: 0,
  },
  glassCardHeader: {
    // Header card doesn't need flex
  },
  headerContent: {
    height: 0, // No content in header card
  },
  expensesListContainer: {
    flex: 1,
  },
  expensesList: {
    flex: 1,
  },
  expensesListContent: {
    paddingHorizontal: 20, // Add horizontal padding to match header
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
