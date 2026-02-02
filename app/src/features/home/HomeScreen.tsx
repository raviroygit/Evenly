import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../hooks/useGroups';
import { useUserBalances } from '../../hooks/useBalances';
import { useAllExpenses } from '../../hooks/useAllExpenses';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { groupEvents, GROUP_EVENTS, emitGroupCreated, emitExpenseCreated } from '../../utils/groupEvents';
import { ResponsiveLiquidGlassCard } from '../../components/ui/ResponsiveLiquidGlassCard';
import { GlassListCard } from '../../components/ui/GlassListCard';
import { SectionHeader } from '../../components/common/SectionHeader';
import { CreateGroupModal } from '../../components/modals/CreateGroupModal';
import { AddExpenseModal } from '../../components/modals/AddExpenseModal';
import { DashboardSummaryCard } from '../../components/features/dashboard/DashboardSummaryCard';
import { RecentActivity } from '../../components/features/dashboard/RecentActivity';
import { CustomersListModal } from '../../components/modals/CustomersListModal';
import { GroupsListModal } from '../../components/modals/GroupsListModal';
import { SkeletonKhataSummary } from '../../components/ui/SkeletonLoader';
import { PullToRefreshSpinner } from '../../components/ui/PullToRefreshSpinner';
import { PullToRefreshScrollView } from '../../components/ui/PullToRefreshScrollView';
import { createPullToRefreshHandlers } from '../../utils/pullToRefreshUtils';
import { useRouter } from 'expo-router';

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { user, isAuthenticated, authState } = useAuth();

  // Use only useGroups and useUserBalances directly - no useDashboard to avoid duplicate calls
  const { groups, createGroup, refreshGroups, loading: groupsLoading } = useGroups();
  const { netBalance, loading: balancesLoading, refreshUserBalances } = useUserBalances();
  const { refreshExpenses } = useAllExpenses();

  // Calculate stats locally instead of using useDashboard
  const stats = useMemo(() => ({
    totalGroups: groups.length,
    totalExpenses: 0,
    totalOwed: netBalance?.totalOwed || 0,
    totalOwing: netBalance?.totalOwing || 0,
    netBalance: netBalance?.netBalance || 0,
    pendingPayments: 0,
    completedPayments: 0,
    recentActivityCount: groups.filter(group => {
      const groupDate = new Date(group.updatedAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return groupDate >= sevenDaysAgo;
    }).length,
  }), [groups, netBalance]);

  const dashboardLoading = groupsLoading || balancesLoading;
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
  const [showGroupsListModal, setShowGroupsListModal] = useState(false);
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
      setKhataLoading(true);

      try {
        // Load all data in parallel for speed
        await Promise.all([
          refreshGroups ? refreshGroups() : Promise.resolve(),
          refreshUserBalances ? refreshUserBalances() : Promise.resolve(),
          refreshExpenses ? refreshExpenses() : Promise.resolve(),
          (async () => {
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
            }
          })(),
        ]);

        // Refresh activities
        if (activitiesRefreshRef.current) {
          activitiesRefreshRef.current();
        }
      } catch (error) {
        console.error('[HomeScreen] Error refreshing on event:', error);
      } finally {
        setKhataLoading(false);
      }
    };

    // Listen for expense events to refresh when expenses are created/updated from other screens
    const handleExpensesRefreshNeeded = async () => {
      console.log('[HomeScreen] Expenses refresh needed event received, refreshing...');
      setKhataLoading(true);

      try {
        // Load all data in parallel for speed
        await Promise.all([
          refreshExpenses ? refreshExpenses() : Promise.resolve(),
          refreshUserBalances ? refreshUserBalances() : Promise.resolve(),
          (async () => {
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
            }
          })(),
        ]);

        // Refresh activities
        if (activitiesRefreshRef.current) {
          activitiesRefreshRef.current();
        }
      } catch (error) {
        console.error('[HomeScreen] Error refreshing on expense event:', error);
      } finally {
        setKhataLoading(false);
      }
    };

    groupEvents.on(GROUP_EVENTS.GROUPS_REFRESH_NEEDED, handleGroupsRefreshNeeded);
    groupEvents.on(GROUP_EVENTS.EXPENSES_REFRESH_NEEDED, handleExpensesRefreshNeeded);

    return () => {
      groupEvents.off(GROUP_EVENTS.GROUPS_REFRESH_NEEDED, handleGroupsRefreshNeeded);
      groupEvents.off(GROUP_EVENTS.EXPENSES_REFRESH_NEEDED, handleExpensesRefreshNeeded);
    };
  }, [refreshGroups, refreshExpenses, refreshUserBalances]);

  const onRefresh = async () => {
    setRefreshing(true);
    setKhataLoading(true);

    try {
      // Load all data in parallel for maximum speed
      await Promise.all([
        refreshGroups ? refreshGroups() : Promise.resolve(),
        refreshUserBalances ? refreshUserBalances() : Promise.resolve(),
        refreshExpenses ? refreshExpenses() : Promise.resolve(),
        (async () => {
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
          }
        })(),
      ]);

      // Refresh activities after all data is loaded
      if (activitiesRefreshRef.current) {
        activitiesRefreshRef.current();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setKhataLoading(false);
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

      setKhataLoading(true);

      // Load all data in parallel for speed
      await Promise.all([
        refreshGroups ? refreshGroups() : Promise.resolve(),
        refreshUserBalances ? refreshUserBalances() : Promise.resolve(),
        refreshExpenses ? refreshExpenses() : Promise.resolve(),
        (async () => {
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
        })(),
      ]);

      // Refresh activities
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

      setKhataLoading(true);

      // Load all data in parallel for speed
      await Promise.all([
        refreshGroups ? refreshGroups() : Promise.resolve(),
        refreshUserBalances ? refreshUserBalances() : Promise.resolve(),
        refreshExpenses ? refreshExpenses() : Promise.resolve(),
        (async () => {
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
        })(),
      ]);

      // Refresh activities
      if (activitiesRefreshRef.current) {
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

  const handleGroupsSummaryPress = () => {
    setShowGroupsListModal(true);
  };

  const handleGroupPress = (groupId: string) => {
    setShowGroupsListModal(false);
    // Small delay to allow modal to close smoothly before navigation
    setTimeout(() => {
      router.push(`/tabs/groups/${groupId}` as any);
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
        <View style={styles.scrollContent}>
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
      </View>
    );
  }

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

        {/* Dashboard Summary Card */}
        <DashboardSummaryCard
          totalGroups={stats.totalGroups}
          netBalance={stats.netBalance}
          youOwe={stats.totalOwing}
          youreOwed={stats.totalOwed}
          loading={dashboardLoading || isCreatingGroup || isAddingExpense}
          onPress={handleGroupsSummaryPress}
        />

        {/* Khata Summary Card */}
        {khataLoading ? (
          <SkeletonKhataSummary />
        ) : khataSummary ? (
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
        ) : null}

        {/* Recent Activity */}
        <RecentActivity
          onViewAll={() => {
            router.push('/activities' as any);
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onRefreshRef={activitiesRefreshRef}
          isAddingExpense={isAddingExpense}
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

      {/* Groups List Modal */}
      <GroupsListModal
        visible={showGroupsListModal}
        onClose={() => setShowGroupsListModal(false)}
        groups={groups}
        onGroupPress={handleGroupPress}
        loading={groupsLoading}
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
