import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { useGroups } from '../../hooks/useGroups';
import { useAllExpenses } from '../../hooks/useAllExpenses';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { groupEvents, GROUP_EVENTS, emitGroupCreated, emitExpenseCreated } from '../../utils/groupEvents';
import { ResponsiveLiquidGlassCard } from '../../components/ui/ResponsiveLiquidGlassCard';
import { GlassListCard } from '../../components/ui/GlassListCard';
import { SectionHeader } from '../../components/common/SectionHeader';
import { CreateGroupModal } from '../../components/modals/CreateGroupModal';
import { AddExpenseModal } from '../../components/modals/AddExpenseModal';
import { DashboardStats } from '../../components/features/dashboard/DashboardStats';
import { RecentActivity } from '../../components/features/dashboard/RecentActivity';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';

export const HomeScreen: React.FC = () => {
  const { colors, theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { stats, loading: dashboardLoading, refresh: refreshDashboard } = useDashboard();
  const { createGroup, refreshGroups } = useGroups();
  const { refreshExpenses } = useAllExpenses();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const activitiesRefreshRef = useRef<(() => void) | null>(null);

  // Note: Removed useFocusEffect to prevent infinite loops
  // Dashboard and groups will refresh via pull-to-refresh

  // Listen for group events to refresh when groups are created/updated from other screens
  useEffect(() => {
    const handleGroupsRefreshNeeded = async () => {
      console.log('[HomeScreen] Groups refresh needed event received, refreshing...');
      try {
        // Refresh groups first
        if (refreshGroups) {
          await refreshGroups();
        }
        // Wait for state to propagate
        await new Promise(resolve => setTimeout(resolve, 200));
        // Refresh expenses
        if (refreshExpenses) {
          await refreshExpenses();
        }
        // Wait for state to propagate
        await new Promise(resolve => setTimeout(resolve, 200));
        // Refresh dashboard
        await refreshDashboard();
        // Wait for all state updates
        await new Promise(resolve => setTimeout(resolve, 300));
        // Refresh activities
        if (activitiesRefreshRef.current) {
          activitiesRefreshRef.current();
        }
      } catch (error) {
        console.error('[HomeScreen] Error refreshing on event:', error);
      }
    };
    
    // Listen for expense events to refresh when expenses are created/updated from other screens
    const handleExpensesRefreshNeeded = async () => {
      console.log('[HomeScreen] Expenses refresh needed event received, refreshing...');
      try {
        // Refresh expenses first - this will trigger useAllExpenses to reload
        if (refreshExpenses) {
          await refreshExpenses();
        }
        // Wait longer for expenses to fully load and state to propagate
        await new Promise(resolve => setTimeout(resolve, 800));
        // Refresh dashboard
        await refreshDashboard();
        // Wait for all state updates
        await new Promise(resolve => setTimeout(resolve, 500));
        // Refresh activities to show the new expense activity - now async
        if (activitiesRefreshRef.current) {
          console.log('[HomeScreen] Calling activities refresh after expense event');
          await activitiesRefreshRef.current();
        }
      } catch (error) {
        console.error('[HomeScreen] Error refreshing on expense event:', error);
      }
    };
    
    groupEvents.on(GROUP_EVENTS.GROUPS_REFRESH_NEEDED, handleGroupsRefreshNeeded);
    groupEvents.on(GROUP_EVENTS.EXPENSES_REFRESH_NEEDED, handleExpensesRefreshNeeded);
    
    return () => {
      groupEvents.off(GROUP_EVENTS.GROUPS_REFRESH_NEEDED, handleGroupsRefreshNeeded);
      groupEvents.off(GROUP_EVENTS.EXPENSES_REFRESH_NEEDED, handleExpensesRefreshNeeded);
    };
  }, [refreshGroups, refreshExpenses, refreshDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh groups first - this will force fresh data from server
      if (refreshGroups) {
        await refreshGroups();
      }
      
      // Wait for groups state to propagate (increased wait time)
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Refresh expenses after groups are updated
      if (refreshExpenses) {
        await refreshExpenses();
      }
      
      // Wait for expenses state to propagate (increased wait time)
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Refresh dashboard after groups and expenses are updated
      await refreshDashboard();
      
      // Wait for all state updates to complete (increased wait time)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force refresh activities - this will regenerate from fresh data
      // The refresh function now directly uses current groups/expenses
      if (activitiesRefreshRef.current) {
        console.log('[HomeScreen] Calling activities refresh after data refresh');
        activitiesRefreshRef.current();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };


  const handleCreateGroup = async (groupData: {
    name: string;
    description?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }) => {
    try {
      setIsCreatingGroup(true);
      const newGroup = await createGroup(groupData);
      // Emit event to notify other screens (though we're already on HomeScreen)
      emitGroupCreated(newGroup);
      setShowCreateGroupModal(false);
      
      // Force refresh groups first - this will invalidate cache and reload from server
      if (refreshGroups) {
        await refreshGroups();
      }
      
      // Wait a bit for state to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh expenses
      if (refreshExpenses) {
        await refreshExpenses();
      }
      
      // Refresh dashboard after groups are refreshed
      await refreshDashboard();
      
      // Wait a bit more for all state updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh activities to show the new group activity
      if (activitiesRefreshRef.current) {
        activitiesRefreshRef.current();
      }
    } catch (error) {
      console.error('Error creating group:', error);
      // Silent error - user can see it in the UI state
    } finally {
      setIsCreatingGroup(false);
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
      const fullExpenseData = {
        groupId: expenseData.groupId,
        title: expenseData.title,
        totalAmount: expenseData.totalAmount,
        splitType: 'equal' as const,
        category: 'Other',
        date: new Date(expenseData.date).toISOString(),
        paidBy: user.id,
        description: expenseData.title,
      };
      
      const newExpense = await EvenlyBackendService.createExpense(fullExpenseData);
      // Emit event to notify other screens
      emitExpenseCreated(newExpense);
      setShowAddExpenseModal(false);
      
      // Refresh all data to show the new expense - wait for all to complete
      await Promise.all([
        refreshGroups ? refreshGroups() : Promise.resolve(),
        refreshExpenses ? refreshExpenses() : Promise.resolve(),
      ]);
      
      // Refresh dashboard after expenses are refreshed
      await refreshDashboard();
      
      // Wait for all state updates
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Refresh activities to show the new expense activity
      if (activitiesRefreshRef.current) {
        console.log('[HomeScreen] Calling activities refresh after expense creation');
        activitiesRefreshRef.current();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      // Silent error - user can see it in the UI state
    } finally {
      setIsAddingExpense(false);
    }
  };

  // Use consistent styling for both platforms
  const getPlatformAwareStyles = () => {
    return {
      headerCard: {
        backgroundColor: theme === 'dark' ? '#2C2C2C' : '#FFFFFF',
        borderColor: theme === 'dark' ? '#404040' : '#E0E0E0',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
      activityCard: {
        backgroundColor: theme === 'dark' ? '#2C2C2C' : '#FFFFFF',
        borderColor: theme === 'dark' ? '#404040' : '#E0E0E0',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      activityItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginBottom: 6,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 8,
        backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
        borderColor: theme === 'dark' ? '#333333' : '#E0E0E0',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: theme === 'dark' ? 0.2 : 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    };
  };

  const platformStyles = getPlatformAwareStyles();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassListCard
          title="Authentication Required"
          subtitle="Please log in to access the app"
          contentGap={0}
        >
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            You need to be logged in to access this feature.
          </Text>
        </GlassListCard>
      </View>
    );
  }

  // Prepare dashboard stats
  const dashboardStats = [
    {
      label: 'Total Groups',
      value: stats.totalGroups,
      color: '#2196F3',
    },
    {
      label: 'Net Balance',
      value: `₹${stats.netBalance.toFixed(2)}`,
      color: stats.netBalance >= 0 ? '#4CAF50' : '#F44336',
    },
    {
      label: 'You Owe',
      value: `₹${stats.totalOwing.toFixed(2)}`,
      color: '#F44336',
    },
    {
      label: 'You\'re Owed',
      value: `₹${stats.totalOwed.toFixed(2)}`,
      color: '#4CAF50',
    },
  ];

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Welcome Header */}
        <ResponsiveLiquidGlassCard
          padding={{
            small: 20,
            medium: 24,
            large: 28,
            tablet: 32,
          }}
          marginBottom={24}
          borderRadius={{
            small: 20,
            medium: 22,
            large: 24,
            tablet: 26,
          }}
          style={[platformStyles.headerCard, styles.headerCard] as any}
        >
          <SectionHeader
            title={`Welcome back, ${user?.name || 'User'}!`}
            subtitle="Here's your expense overview"
            style={styles.headerContent}
          />
        </ResponsiveLiquidGlassCard>

        {/* Dashboard Stats */}
        <DashboardStats stats={dashboardStats} loading={dashboardLoading || isCreatingGroup || isAddingExpense} />

        {/* Recent Activity */}
        <RecentActivity
          onViewAll={() => {
            // Navigate to activity screen
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onRefreshRef={activitiesRefreshRef}
        />
      </View>

      {/* Modals */}
      <CreateGroupModal
        visible={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onCreateGroup={handleCreateGroup}
      />

      {user && (
        <AddExpenseModal
          visible={showAddExpenseModal}
          onClose={() => setShowAddExpenseModal(false)}
          onAddExpense={handleAddExpense}
          currentUserId={user.id}
        />
      )}

      {/* Floating Action Button - Outside container for proper positioning */}
      <FloatingActionButton
        actions={[
          {
            id: 'create-group',
            title: 'Create Group',
            icon: '👥',
            onPress: () => setShowCreateGroupModal(true),
          },
          {
            id: 'add-expense',
            title: 'Add Expense',
            icon: '💰',
            onPress: () => {
              if (stats.totalGroups === 0) {
                // Silent - just don't open the modal
                return;
              } else {
                setShowAddExpenseModal(true);
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
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  headerCard: {
    marginBottom: 24,
  },
  headerContent: {
    marginBottom: 0,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
