import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
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
import { CustomersListModal } from '../../components/modals/CustomersListModal';
import { SkeletonKhataSummary } from '../../components/ui/SkeletonLoader';
import { PullToRefreshSpinner } from '../../components/ui/PullToRefreshSpinner';
import { PullToRefreshScrollView } from '../../components/ui/PullToRefreshScrollView';
import { createPullToRefreshHandlers } from '../../utils/pullToRefreshUtils';
import { useRouter } from 'expo-router';
import { OrganizationSwitcher } from '../../components/navigation/OrganizationSwitcher';

export const HomeScreen: React.FC = () => {
  const router = useRouter();
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
  const [khataSummary, setKhataSummary] = useState<{ totalGive: string; totalGet: string } | null>(null);
  const [khataLoading, setKhataLoading] = useState(true);
  const [customerCount, setCustomerCount] = useState(0);
  const [showCustomersListModal, setShowCustomersListModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  // Note: Removed useFocusEffect to prevent infinite loops
  // Dashboard and groups will refresh via pull-to-refresh

  // Fetch khata summary on mount
  useEffect(() => {
    const fetchKhataSummary = async () => {
      try {
        setKhataLoading(true);
        const [summary, customersData] = await Promise.all([
          EvenlyBackendService.getKhataFinancialSummary(),
          EvenlyBackendService.getKhataCustomers({ cacheTTLMs: 30000 }),
        ]);
        setKhataSummary(summary);
        setCustomerCount(customersData.length);
        setCustomers(customersData);
      } catch (error) {
        console.error('Error fetching khata summary:', error);
      } finally {
        setKhataLoading(false);
      }
    };

    fetchKhataSummary();
  }, []);

  // Listen for group events to refresh when groups are created/updated from other screens
  useEffect(() => {
    const handleGroupsRefreshNeeded = async () => {
      console.log('[HomeScreen] Groups refresh needed event received, refreshing...');
      try {
        // Set khata loading
        setKhataLoading(true);

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

        // Refresh khata summary
        try {
          const [summary, customersData] = await Promise.all([
            EvenlyBackendService.getKhataFinancialSummary(),
            EvenlyBackendService.getKhataCustomers({ cacheTTLMs: 0 }),
          ]);
          setKhataSummary(summary);
          setCustomerCount(customersData.length);
          setCustomers(customersData);
        } catch (error) {
          console.error('Error refreshing khata summary:', error);
        } finally {
          setKhataLoading(false);
        }

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
        // Set khata loading
        setKhataLoading(true);

        // Refresh expenses first - this will trigger useAllExpenses to reload
        if (refreshExpenses) {
          await refreshExpenses();
        }
        // Wait longer for expenses to fully load and state to propagate
        await new Promise(resolve => setTimeout(resolve, 800));
        // Refresh dashboard
        await refreshDashboard();

        // Refresh khata summary
        try {
          const [summary, customersData] = await Promise.all([
            EvenlyBackendService.getKhataFinancialSummary(),
            EvenlyBackendService.getKhataCustomers({ cacheTTLMs: 0 }),
          ]);
          setKhataSummary(summary);
          setCustomerCount(customersData.length);
          setCustomers(customersData);
        } catch (error) {
          console.error('Error refreshing khata summary:', error);
        } finally {
          setKhataLoading(false);
        }

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
      // Set khata loading to show skeleton
      setKhataLoading(true);

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

      // Refresh khata summary
      try {
        const [summary, customersData] = await Promise.all([
          EvenlyBackendService.getKhataFinancialSummary(),
          EvenlyBackendService.getKhataCustomers({ cacheTTLMs: 0 }),
        ]);
        setKhataSummary(summary);
        setCustomerCount(customersData.length);
        setCustomers(customersData);
      } catch (error) {
        console.error('Error refreshing khata summary:', error);
      } finally {
        setKhataLoading(false);
      }

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

      // Set khata loading
      setKhataLoading(true);

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

      // Refresh khata summary
      try {
        const [summary, customersData] = await Promise.all([
          EvenlyBackendService.getKhataFinancialSummary(),
          EvenlyBackendService.getKhataCustomers({ cacheTTLMs: 0 }),
        ]);
        setKhataSummary(summary);
        setCustomerCount(customersData.length);
        setCustomers(customersData);
      } catch (error) {
        console.error('Error refreshing khata summary:', error);
      } finally {
        setKhataLoading(false);
      }

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

      // Set khata loading
      setKhataLoading(true);

      // Refresh all data to show the new expense - wait for all to complete
      await Promise.all([
        refreshGroups ? refreshGroups() : Promise.resolve(),
        refreshExpenses ? refreshExpenses() : Promise.resolve(),
      ]);

      // Refresh dashboard after expenses are refreshed
      await refreshDashboard();

      // Refresh khata summary
      try {
        const [summary, customersData] = await Promise.all([
          EvenlyBackendService.getKhataFinancialSummary(),
          EvenlyBackendService.getKhataCustomers({ cacheTTLMs: 0 }),
        ]);
        setKhataSummary(summary);
        setCustomerCount(customersData.length);
        setCustomers(customersData);
      } catch (error) {
        console.error('Error refreshing khata summary:', error);
      } finally {
        setKhataLoading(false);
      }

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

  const handleKhataSummaryPress = () => {
    setShowCustomersListModal(true);
  };

  const handleCustomerPress = (customerId: string, customerName: string, customerInitials: string) => {
    setShowCustomersListModal(false);
    // Small delay to allow modal to close smoothly before navigation
    setTimeout(() => {
      router.push({
        pathname: '/tabs/books/[customerId]',
        params: {
          customerId,
          customerName,
          customerInitials,
        },
      } as any);
    }, 300);
  };

  // Create pull-to-refresh handlers
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag } = createPullToRefreshHandlers({
    onRefresh,
    refreshing,
  });

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
      <PullToRefreshSpinner refreshing={refreshing} />
      <PullToRefreshScrollView
        refreshing={refreshing}
        onRefresh={onRefresh}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Organization Switcher */}
        <View style={styles.orgSwitcherContainer}>
          <OrganizationSwitcher />
        </View>

        {/* Welcome Header */}
        <ResponsiveLiquidGlassCard
          padding={{
            small: 20,
            medium: 24,
            large: 28,
            tablet: 32,
          }}
          marginBottom={12}
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

        {/* Khata Summary Card */}
        {khataLoading ? (
          <SkeletonKhataSummary />
        ) : (
          <View style={styles.khataSummaryContainer}>
            <TouchableOpacity
              style={[
                styles.khataSummaryCard,
                {
                  backgroundColor: theme === 'dark' ? '#2C2C2C' : '#FFFFFF',
                  borderColor: theme === 'dark' ? '#404040' : '#E0E0E0',
                },
              ]}
              onPress={handleKhataSummaryPress}
              activeOpacity={0.7}
            >
              <View style={styles.khataSummaryHeader}>
                <Text style={[styles.khataSummaryTitle, { color: colors.foreground }]}>
                  📒 Khata Summary
                </Text>
                <Text style={[styles.customerCount, { color: '#E91E63' }]}>
                  {`${customerCount} Customer${customerCount !== 1 ? 's' : ''}`}
                </Text>
              </View>
              <View style={styles.khataSummaryContent}>
                <View style={styles.khataSummaryItem}>
                  <Text style={[styles.khataSummaryLabel, { color: colors.mutedForeground }]}>
                    Will Get
                  </Text>
                  <Text style={[styles.khataSummaryValue, { color: '#10B981' }]}>
                    {`₹${parseFloat(khataSummary?.totalGive || '0').toFixed(2)}`}
                  </Text>
                </View>
                <View style={[styles.khataDivider, { backgroundColor: theme === 'dark' ? '#404040' : '#E0E0E0' }]} />
                <View style={styles.khataSummaryItem}>
                  <Text style={[styles.khataSummaryLabel, { color: colors.mutedForeground }]}>
                    Will Give
                  </Text>
                  <Text style={[styles.khataSummaryValue, { color: '#EF4444' }]}>
                    {`₹${parseFloat(khataSummary?.totalGet || '0').toFixed(2)}`}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Activity */}
        <RecentActivity
          onViewAll={() => {
            // Navigate to activity screen
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onRefreshRef={activitiesRefreshRef}
        />
      </PullToRefreshScrollView>

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

      {/* Customers List Modal */}
      <CustomersListModal
        visible={showCustomersListModal}
        onClose={() => setShowCustomersListModal(false)}
        customers={customers}
        onCustomerPress={handleCustomerPress}
        loading={khataLoading}
      />

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
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 100,
  },
  orgSwitcherContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
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
  khataSummaryContainer: {
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  khataSummaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  khataSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  khataSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  customerCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  khataSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  khataSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  khataDivider: {
    width: 1,
    height: 40,
  },
  khataSummaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  khataSummaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});
