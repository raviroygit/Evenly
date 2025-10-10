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
          date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString(),
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
          date: new Date(Date.now() - (index + groups.length) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        });
      });

      // Add mock activities for better testing
      const mockActivities: ActivityItem[] = [
        {
          id: 'mock-activity-1',
          type: 'expense',
          title: '🍽️ Dinner at Restaurant (TEST)',
          description: 'Mock expense activity for testing',
          amount: '₹1,250.00',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
        {
          id: 'mock-activity-2',
          type: 'group',
          title: '🎯 Weekend Trip (TEST)',
          description: 'Mock group activity for testing',
          memberCount: 4,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
        {
          id: 'mock-activity-3',
          type: 'expense',
          title: '🎬 Movie Tickets (TEST)',
          description: 'Mock expense activity for testing',
          amount: '₹800.00',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
        {
          id: 'mock-activity-4',
          type: 'payment',
          title: '💰 Payment received (TEST)',
          description: 'Mock payment activity for testing',
          amount: '₹500.00',
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
        {
          id: 'mock-activity-5',
          type: 'invitation',
          title: '📧 Group invitation (TEST)',
          description: 'Mock invitation activity for testing',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'pending',
        },
        {
          id: 'mock-activity-6',
          type: 'expense',
          title: '🛒 Grocery Shopping (TEST)',
          description: 'Mock expense activity for testing',
          amount: '₹2,100.00',
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
        {
          id: 'mock-activity-7',
          type: 'group',
          title: '🍽️ Office Lunch (TEST)',
          description: 'Mock group activity for testing',
          memberCount: 6,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
        {
          id: 'mock-activity-8',
          type: 'expense',
          title: '🎂 Birthday Cake (TEST)',
          description: 'Mock expense activity for testing',
          amount: '₹1,500.00',
          date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
      ];

      // Combine real and mock activities
      const combinedActivities = [...generatedActivities, ...mockActivities];

      console.log('[useActivitiesInfinite] Real activities:', generatedActivities.length);
      console.log('[useActivitiesInfinite] Mock activities:', mockActivities.length);
      console.log('[useActivitiesInfinite] Combined activities:', combinedActivities.length);

      // Sort by date (newest first)
      combinedActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Simulate pagination
      const pageSize = 3;
      const startIndex = 0; // Always start from beginning for initial load
      const endIndex = startIndex + pageSize;
      const paginatedActivities = combinedActivities.slice(startIndex, endIndex);
      
      console.log('[useActivitiesInfinite] Paginated activities:', paginatedActivities.length);
      console.log('[useActivitiesInfinite] Activity titles:', paginatedActivities.map(a => a.title));
      
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
          date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString(),
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
          date: new Date(Date.now() - (index + groups.length) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        });
      });

      // Add mock activities for better testing
      const mockActivities: ActivityItem[] = [
        {
          id: 'mock-activity-1',
          type: 'expense',
          title: '🍽️ Dinner at Restaurant (TEST)',
          description: 'Mock expense activity for testing',
          amount: '₹1,250.00',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
        {
          id: 'mock-activity-2',
          type: 'group',
          title: '🎯 Weekend Trip (TEST)',
          description: 'Mock group activity for testing',
          memberCount: 4,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
        {
          id: 'mock-activity-3',
          type: 'expense',
          title: '🎬 Movie Tickets (TEST)',
          description: 'Mock expense activity for testing',
          amount: '₹800.00',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
        {
          id: 'mock-activity-4',
          type: 'payment',
          title: '💰 Payment received (TEST)',
          description: 'Mock payment activity for testing',
          amount: '₹500.00',
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
        {
          id: 'mock-activity-5',
          type: 'invitation',
          title: '📧 Group invitation (TEST)',
          description: 'Mock invitation activity for testing',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'pending',
        },
        {
          id: 'mock-activity-6',
          type: 'expense',
          title: '🛒 Grocery Shopping (TEST)',
          description: 'Mock expense activity for testing',
          amount: '₹2,100.00',
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
        {
          id: 'mock-activity-7',
          type: 'group',
          title: '🍽️ Office Lunch (TEST)',
          description: 'Mock group activity for testing',
          memberCount: 6,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
        {
          id: 'mock-activity-8',
          type: 'expense',
          title: '🎂 Birthday Cake (TEST)',
          description: 'Mock expense activity for testing',
          amount: '₹1,500.00',
          date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          status: 'completed',
        },
      ];

      // Combine real and mock activities
      const combinedActivities = [...generatedActivities, ...mockActivities];

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
