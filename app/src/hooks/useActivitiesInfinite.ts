import { useCallback, useState, useEffect } from 'react';
import { useGroups } from './useGroups';
import { useAllExpenses } from './useAllExpenses';

interface ActivityItem {
  id: string;
  type: 'expense' | 'payment' | 'group' | 'invitation';
  title: string;
  description: string;
  amount?: string;
  memberCount?: number;
  date: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

export const useActivitiesInfinite = () => {
  const { groups, loading: groupsLoading } = useGroups();
  const { expenses, loading: expensesLoading } = useAllExpenses();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const generateActivities = useCallback(() => {
    try {
      const generatedActivities: ActivityItem[] = [];

      // Add group activities
      groups.forEach((group, index) => {
        generatedActivities.push({
          id: `group-${group.id}`,
          type: 'group',
          title: group.name,
          description: 'Group activity',
          memberCount: group.memberCount,
          date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleString(),
          status: 'completed',
        });
      });

      // Add expense activities
      expenses.slice(0, 3).forEach((expense, index) => {
        generatedActivities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          title: expense.description || expense.title || 'Untitled Expense',
          description: 'Expense added',
          amount: `₹${expense.amount?.toFixed(2) || '0.00'}`,
          date: new Date(Date.now() - (index + groups.length) * 24 * 60 * 60 * 1000).toLocaleString(),
          status: 'completed',
        });
      });

      // Use only real activities
      const combinedActivities = [...generatedActivities];

      // Sort by date (newest first)
      combinedActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Simulate pagination
      const pageSize = 3;
      const startIndex = 0; // Always start from beginning for initial load
      const endIndex = startIndex + pageSize;
      const paginatedActivities = combinedActivities.slice(startIndex, endIndex);
      
      setActivities(paginatedActivities);
      setPage(1);
      setHasMore(endIndex < combinedActivities.length);
    } catch (err) {
      setError('Failed to generate activities');
    } finally {
      setLoading(false);
    }
  }, [groups, expenses]);

  // Generate activities when groups and expenses are loaded
  useEffect(() => {
    if (!groupsLoading && !expensesLoading) {
      generateActivities();
    }
  }, [groups, expenses, groupsLoading, expensesLoading, generateActivities]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    setPage(prevPage => {
      const nextPage = prevPage + 1;
      loadMoreActivities(nextPage);
      return nextPage;
    });
  }, [hasMore, loadingMore]);

  const loadMoreActivities = useCallback(async (pageNum: number) => {
    try {
      const generatedActivities: ActivityItem[] = [];

      // Add group activities
      groups.forEach((group, index) => {
        generatedActivities.push({
          id: `group-${group.id}`,
          type: 'group',
          title: group.name,
          description: 'Group activity',
          memberCount: group.memberCount,
          date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleString(),
          status: 'completed',
        });
      });

      // Add expense activities
      expenses.slice(0, 3).forEach((expense, index) => {
        generatedActivities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          title: expense.description || expense.title || 'Untitled Expense',
          description: 'Expense added',
          amount: `₹${expense.amount?.toFixed(2) || '0.00'}`,
          date: new Date(Date.now() - (index + groups.length) * 24 * 60 * 60 * 1000).toLocaleString(),
          status: 'completed',
        });
      });

      // Use only real activities
      const combinedActivities = [...generatedActivities];

      // Sort by date (newest first)
      combinedActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Simulate pagination
      const pageSize = 3;
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedActivities = combinedActivities.slice(startIndex, endIndex);
      
      setActivities(prev => [...prev, ...paginatedActivities]);
      setHasMore(endIndex < combinedActivities.length);
    } catch (err) {
      setError('Failed to load more activities');
    } finally {
      setLoadingMore(false);
    }
  }, [groups, expenses]);

  const refresh = useCallback(() => {
    generateActivities();
  }, [generateActivities]);

  return {
    activities,
    loading,
    loadingMore,
    error,
    hasMore,
    page,
    loadMore,
    refresh,
    setData: setActivities,
    appendData: (newData: ActivityItem[]) => setActivities(prev => [...prev, ...newData]),
    reset: () => {
      setActivities([]);
      setPage(1);
      setHasMore(false);
      setError(null);
      setLoading(false);
      setLoadingMore(false);
    },
  };
};
