import { useState, useEffect, useMemo } from 'react';
import { useGroups } from './useGroups';
import { useUserBalances } from './useBalances';
import { usePayments } from './usePayments';

interface DashboardStats {
  totalGroups: number;
  totalExpenses: number;
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  pendingPayments: number;
  completedPayments: number;
  recentActivityCount: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivities: any[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useDashboard = (): DashboardData => {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get data from existing hooks
  const { groups, loading: groupsLoading, refreshGroups } = useGroups();
  const { netBalance, loading: balancesLoading, refreshUserBalances } = useUserBalances();
  // Note: usePayments requires a groupId, so we'll skip it for now in dashboard
  // const { payments, loading: paymentsLoading, refreshPayments } = usePayments();

  // Calculate dashboard stats
  const stats = useMemo((): DashboardStats => {
    const totalGroups = groups.length;
    
    // Calculate total expenses across all groups
    const totalExpenses = groups.reduce((sum, group) => {
      // This would need to be calculated from actual expense data
      // For now, we'll use a placeholder
      return sum + 0; // TODO: Calculate from actual expenses
    }, 0);

    const totalOwed = netBalance?.totalOwed || 0;
    const totalOwing = netBalance?.totalOwing || 0;
    const netBalanceAmount = netBalance?.netBalance || 0;

    // Calculate payment stats (placeholder for now since we don't have payments data)
    const pendingPayments = 0; // payments.filter(p => p.status === 'pending').length;
    const completedPayments = 0; // payments.filter(p => p.status === 'completed').length;

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivityCount = groups.filter(group => {
      const groupDate = new Date(group.updatedAt);
      return groupDate >= sevenDaysAgo;
    }).length;

    return {
      totalGroups,
      totalExpenses,
      totalOwed,
      totalOwing,
      netBalance: netBalanceAmount,
      pendingPayments,
      completedPayments,
      recentActivityCount,
    };
  }, [groups, netBalance]);

  // Generate recent activities
  const recentActivities = useMemo(() => {
    const activities: any[] = [];

    // Add group activities
    groups.slice(0, 3).forEach(group => {
      activities.push({
        id: `group-${group.id}`,
        type: 'group',
        title: group.name,
        description: '',
        memberCount: group.memberCount,
        date: new Date(group.updatedAt).toLocaleDateString(),
        status: 'completed',
      });
    });

    // Add payment activities (placeholder for now since we don't have payments data)
    // payments.slice(0, 2).forEach(payment => {
    //   activities.push({
    //     id: `payment-${payment.id}`,
    //     type: 'payment',
    //     title: `Payment to ${payment.toUser?.name || 'User'}`,
    //     description: payment.description || 'Payment sent',
    //     amount: payment.amount.toString(),
    //     date: new Date(payment.createdAt).toLocaleDateString(),
    //     status: payment.status,
    //   });
    // });

    // Sort by date (most recent first)
    return activities.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [groups]);

  // Refresh function
  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const promises = [];
      
      if (refreshGroups) promises.push(refreshGroups());
      if (refreshUserBalances) promises.push(refreshUserBalances());
      // if (refreshPayments) promises.push(refreshPayments());
      
      await Promise.all(promises);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh dashboard data');
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate overall loading state
  const loading = groupsLoading || balancesLoading || refreshing;

  return {
    stats,
    recentActivities,
    loading,
    error,
    refresh,
  };
};
