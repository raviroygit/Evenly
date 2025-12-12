import { useCallback, useState, useEffect, useRef } from 'react';
import { useGroups } from './useGroups';
import { useAllExpenses } from './useAllExpenses';
import { groupEvents, GROUP_EVENTS } from '../utils/groupEvents';

interface ActivityItem {
  id: string;
  type: 'expense' | 'payment' | 'group' | 'invitation';
  title: string;
  description: string;
  amount?: string;
  memberCount?: number;
  date: string;
  dateTimestamp?: number; // Timestamp for proper sorting
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
  
  // Keep refs to latest groups/expenses for refresh function
  const groupsRef = useRef(groups);
  const expensesRef = useRef(expenses);
  
  // Update refs when groups/expenses change
  useEffect(() => {
    groupsRef.current = groups;
    expensesRef.current = expenses;
  }, [groups, expenses]);

  const generateActivities = useCallback(() => {
    try {
      setLoading(true);
      const generatedActivities: ActivityItem[] = [];

      // Add group activities - use actual group creation/update dates
      groups.forEach((group) => {
        const groupDate = group.updatedAt instanceof Date 
          ? group.updatedAt 
          : new Date(group.updatedAt);
        generatedActivities.push({
          id: `group-${group.id}`,
          type: 'group',
          title: group.name,
          description: 'Group activity',
          memberCount: group.memberCount,
          date: groupDate.toLocaleString(),
          dateTimestamp: groupDate.getTime(), // Store timestamp for proper sorting
          status: 'completed',
        });
      });

      // Add expense activities - use createdAt/updatedAt for sorting (latest first)
      expenses.forEach((expense) => {
        // Use createdAt or updatedAt (whichever is more recent) for sorting
        const expenseCreatedAt = expense.createdAt instanceof Date 
          ? expense.createdAt 
          : new Date(expense.createdAt);
        const expenseUpdatedAt = expense.updatedAt instanceof Date 
          ? expense.updatedAt 
          : new Date(expense.updatedAt);
        // Use the more recent date for sorting
        const expenseSortDate = expenseUpdatedAt > expenseCreatedAt ? expenseUpdatedAt : expenseCreatedAt;
        // Use expense.date for display (when the expense occurred)
        const expenseDisplayDate = expense.date instanceof Date 
          ? expense.date 
          : new Date(expense.date);
        const amount = typeof expense.totalAmount === 'string' 
          ? parseFloat(expense.totalAmount) 
          : expense.totalAmount || 0;
        generatedActivities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          title: expense.description || expense.title || 'Untitled Expense',
          description: 'Expense added',
          amount: `₹${amount.toFixed(2)}`,
          date: expenseDisplayDate.toLocaleString(),
          dateTimestamp: expenseSortDate.getTime(), // Use createdAt/updatedAt for sorting (latest first)
          status: 'completed',
        });
      });

      // Use only real activities
      const combinedActivities = [...generatedActivities];

      // Sort by date timestamp (newest first) - descending order
      combinedActivities.sort((a, b) => {
        const timestampA = a.dateTimestamp || new Date(a.date).getTime();
        const timestampB = b.dateTimestamp || new Date(b.date).getTime();
        return timestampB - timestampA; // Descending: newest first
      });

      // Simulate pagination
      const pageSize = 3;
      const startIndex = 0; // Always start from beginning for initial load
      const endIndex = startIndex + pageSize;
      const paginatedActivities = combinedActivities.slice(startIndex, endIndex);
      
      // Force new array reference to ensure React detects the change
      setActivities([...paginatedActivities]);
      setPage(1);
      setHasMore(endIndex < combinedActivities.length);
      
      console.log('[useActivitiesInfinite] generateActivities: Activities updated', {
        total: combinedActivities.length,
        showing: paginatedActivities.length
      });
    } catch (err) {
      setError('Failed to generate activities');
      console.error('Error generating activities:', err);
    } finally {
      setLoading(false);
    }
  }, [groups, expenses]);

  // Generate activities when groups and expenses are loaded or changed
  // Use a ref to track previous values and force update when arrays change
  const prevGroupsRef = useRef<string>('');
  const prevExpensesRef = useRef<string>('');
  const refreshTriggerRef = useRef<number>(0);
  
  // Listen for expense refresh events to force regeneration
  useEffect(() => {
    const handleExpensesRefreshNeeded = () => {
      console.log('[useActivitiesInfinite] Expense refresh event received, forcing activities regeneration');
      // Reset prev refs to force regeneration
      prevExpensesRef.current = '';
      // Force regeneration by clearing activities and regenerating
      setActivities([]);
      setTimeout(() => {
        generateActivities();
      }, 100); // Small delay to ensure expenses state has updated
    };

    groupEvents.on(GROUP_EVENTS.EXPENSES_REFRESH_NEEDED, handleExpensesRefreshNeeded);
    groupEvents.on(GROUP_EVENTS.EXPENSE_CREATED, handleExpensesRefreshNeeded);
    groupEvents.on(GROUP_EVENTS.EXPENSE_UPDATED, handleExpensesRefreshNeeded);
    groupEvents.on(GROUP_EVENTS.EXPENSE_DELETED, handleExpensesRefreshNeeded);

    return () => {
      groupEvents.off(GROUP_EVENTS.EXPENSES_REFRESH_NEEDED, handleExpensesRefreshNeeded);
      groupEvents.off(GROUP_EVENTS.EXPENSE_CREATED, handleExpensesRefreshNeeded);
      groupEvents.off(GROUP_EVENTS.EXPENSE_UPDATED, handleExpensesRefreshNeeded);
      groupEvents.off(GROUP_EVENTS.EXPENSE_DELETED, handleExpensesRefreshNeeded);
    };
  }, [generateActivities]);
  
  useEffect(() => {
    if (!groupsLoading && !expensesLoading) {
      // Create a string representation of groups/expenses to detect changes
      // Include more fields to catch all changes
      const groupsKey = JSON.stringify(groups.map(g => ({ 
        id: g.id, 
        name: g.name, 
        updatedAt: g.updatedAt instanceof Date ? g.updatedAt.toISOString() : (typeof g.updatedAt === 'string' ? g.updatedAt : new Date(g.updatedAt).toISOString()),
        memberCount: g.memberCount || 0
      })).sort((a, b) => a.id.localeCompare(b.id))); // Sort to ensure consistent comparison
      const expensesKey = JSON.stringify(expenses.map(e => ({ 
        id: e.id, 
        title: e.title || e.description || '', 
        date: e.date instanceof Date ? e.date.toISOString() : (typeof e.date === 'string' ? e.date : new Date(e.date).toISOString()),
        totalAmount: typeof e.totalAmount === 'string' ? e.totalAmount : String(e.totalAmount || 0),
        description: e.description || ''
      })).sort((a, b) => a.id.localeCompare(b.id))); // Sort to ensure consistent comparison
      
      // Always regenerate if groups or expenses changed, or if this is the first load
      const groupsChanged = groupsKey !== prevGroupsRef.current;
      const expensesChanged = expensesKey !== prevExpensesRef.current;
      
      console.log('[useActivitiesInfinite] useEffect triggered', {
        groupsChanged,
        expensesChanged,
        groupsCount: groups.length,
        expensesCount: expenses.length,
        groupsKey: groupsKey.substring(0, 100),
        prevGroupsKey: prevGroupsRef.current.substring(0, 100)
      });
      
      if (groupsChanged || expensesChanged || prevGroupsRef.current === '') {
        prevGroupsRef.current = groupsKey;
        prevExpensesRef.current = expensesKey;
        refreshTriggerRef.current += 1;
        console.log('[useActivitiesInfinite] useEffect: Regenerating activities', {
          trigger: refreshTriggerRef.current,
          groupsCount: groups.length,
          expensesCount: expenses.length
        });
        // Force regeneration by resetting activities first
        setActivities([]);
        // Use setTimeout to ensure state is cleared before regenerating
        setTimeout(() => {
          generateActivities();
        }, 0);
      }
    }
  }, [groups, expenses, groupsLoading, expensesLoading, generateActivities]);

  const loadMoreActivities = useCallback(async (pageNum: number) => {
    try {
      const generatedActivities: ActivityItem[] = [];

      // Add group activities - use actual dates
      groups.forEach((group) => {
        const groupDate = group.updatedAt instanceof Date 
          ? group.updatedAt 
          : new Date(group.updatedAt);
        generatedActivities.push({
          id: `group-${group.id}`,
          type: 'group',
          title: group.name,
          description: 'Group activity',
          memberCount: group.memberCount,
          date: groupDate.toLocaleString(),
          dateTimestamp: groupDate.getTime(), // Store timestamp for proper sorting
          status: 'completed',
        });
      });

      // Add expense activities - use createdAt/updatedAt for sorting (latest first)
      expenses.forEach((expense) => {
        // Use createdAt or updatedAt (whichever is more recent) for sorting
        const expenseCreatedAt = expense.createdAt instanceof Date 
          ? expense.createdAt 
          : new Date(expense.createdAt);
        const expenseUpdatedAt = expense.updatedAt instanceof Date 
          ? expense.updatedAt 
          : new Date(expense.updatedAt);
        // Use the more recent date for sorting
        const expenseSortDate = expenseUpdatedAt > expenseCreatedAt ? expenseUpdatedAt : expenseCreatedAt;
        // Use expense.date for display (when the expense occurred)
        const expenseDisplayDate = expense.date instanceof Date 
          ? expense.date 
          : new Date(expense.date);
        const amount = typeof expense.totalAmount === 'string' 
          ? parseFloat(expense.totalAmount) 
          : expense.totalAmount || 0;
        generatedActivities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          title: expense.description || expense.title || 'Untitled Expense',
          description: 'Expense added',
          amount: `₹${amount.toFixed(2)}`,
          date: expenseDisplayDate.toLocaleString(),
          dateTimestamp: expenseSortDate.getTime(), // Use createdAt/updatedAt for sorting (latest first)
          status: 'completed',
        });
      });

      // Use only real activities
      const combinedActivities = [...generatedActivities];

      // Sort by date timestamp (newest first) - descending order
      combinedActivities.sort((a, b) => {
        const timestampA = a.dateTimestamp || new Date(a.date).getTime();
        const timestampB = b.dateTimestamp || new Date(b.date).getTime();
        return timestampB - timestampA; // Descending: newest first
      });

      // Simulate pagination
      const pageSize = 3;
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedActivities = combinedActivities.slice(startIndex, endIndex);
      
      setActivities(prev => [...prev, ...paginatedActivities]);
      setHasMore(endIndex < combinedActivities.length);
    } catch (err) {
      setError('Failed to load more activities');
      console.error('Error loading more activities:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [groups, expenses]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    setPage(prevPage => {
      const nextPage = prevPage + 1;
      // Call loadMoreActivities directly
      loadMoreActivities(nextPage);
      return nextPage;
    });
  }, [hasMore, loadingMore, loadMoreActivities]);

  const refresh = useCallback(async () => {
    console.log('[useActivitiesInfinite] Refresh called', {
      groupsCount: groupsRef.current.length,
      expensesCount: expensesRef.current.length,
      groupsLoading,
      expensesLoading
    });
    
    // Wait for expenses to actually have data, not just for loading to be false
    // Poll until expenses are loaded or timeout
    let attempts = 0;
    const maxAttempts = 50; // Wait up to 5 seconds (50 * 100ms)
    
    // First wait for loading to finish
    while (expensesLoading && attempts < maxAttempts) {
      console.log('[useActivitiesInfinite] Waiting for expenses loading to finish...', attempts);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    // Then wait for expenses to actually have data (they might finish loading but be empty initially)
    while (expensesRef.current.length === 0 && attempts < maxAttempts) {
      console.log('[useActivitiesInfinite] Waiting for expenses data...', attempts, 'current count:', expensesRef.current.length);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    // Give additional time for state to propagate and refs to update
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get latest data from refs (they should be updated by now)
    let currentGroups = groupsRef.current;
    let currentExpenses = expensesRef.current;
    
    console.log('[useActivitiesInfinite] Refresh proceeding with data', {
      groupsCount: currentGroups.length,
      expensesCount: currentExpenses.length,
      groups: currentGroups.map(g => ({ id: g.id, name: g.name })),
      expenses: currentExpenses.map(e => ({ id: e.id, title: e.title || e.description }))
    });
    
    // If expenses are still empty after all that waiting, log a warning but proceed
    if (currentExpenses.length === 0) {
      console.warn('[useActivitiesInfinite] Expenses still empty after waiting, proceeding anyway');
    }
    
    // Force refresh by resetting state first
    setActivities([]);
    setLoading(true);
    
    // Reset the refs to force regeneration on next useEffect run
    prevGroupsRef.current = '';
    prevExpensesRef.current = '';
    refreshTriggerRef.current += 1;
    
    // Generate activities directly with current groups/expenses from refs
    // This ensures we use the absolute latest data
    try {
      const generatedActivities: ActivityItem[] = [];

      // Add group activities - use actual group creation/update dates
      currentGroups.forEach((group) => {
        const groupDate = group.updatedAt instanceof Date 
          ? group.updatedAt 
          : new Date(group.updatedAt);
        generatedActivities.push({
          id: `group-${group.id}`,
          type: 'group',
          title: group.name,
          description: 'Group activity',
          memberCount: group.memberCount,
          date: groupDate.toLocaleString(),
          dateTimestamp: groupDate.getTime(), // Store timestamp for proper sorting
          status: 'completed',
        });
      });

      // Add expense activities - use createdAt/updatedAt for sorting (latest first)
      // Use the latest expenses (already updated above)
      console.log('[useActivitiesInfinite] Using expenses for activities:', currentExpenses.length);
      currentExpenses.forEach((expense) => {
        // Use createdAt or updatedAt (whichever is more recent) for sorting
        const expenseCreatedAt = expense.createdAt instanceof Date 
          ? expense.createdAt 
          : new Date(expense.createdAt);
        const expenseUpdatedAt = expense.updatedAt instanceof Date 
          ? expense.updatedAt 
          : new Date(expense.updatedAt);
        // Use the more recent date for sorting
        const expenseSortDate = expenseUpdatedAt > expenseCreatedAt ? expenseUpdatedAt : expenseCreatedAt;
        // Use expense.date for display (when the expense occurred)
        const expenseDisplayDate = expense.date instanceof Date 
          ? expense.date 
          : new Date(expense.date);
        const amount = typeof expense.totalAmount === 'string' 
          ? parseFloat(expense.totalAmount) 
          : expense.totalAmount || 0;
        generatedActivities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          title: expense.description || expense.title || 'Untitled Expense',
          description: 'Expense added',
          amount: `₹${amount.toFixed(2)}`,
          date: expenseDisplayDate.toLocaleString(),
          dateTimestamp: expenseSortDate.getTime(), // Use createdAt/updatedAt for sorting (latest first)
          status: 'completed',
        });
      });

      // Use only real activities
      const combinedActivities = [...generatedActivities];

      // Sort by date timestamp (newest first) - descending order
      combinedActivities.sort((a, b) => {
        const timestampA = a.dateTimestamp || new Date(a.date).getTime();
        const timestampB = b.dateTimestamp || new Date(b.date).getTime();
        return timestampB - timestampA; // Descending: newest first
      });

      // Simulate pagination
      const pageSize = 3;
      const startIndex = 0;
      const endIndex = startIndex + pageSize;
      const paginatedActivities = combinedActivities.slice(startIndex, endIndex);
      
      console.log('[useActivitiesInfinite] Generated activities:', {
        total: combinedActivities.length,
        showing: paginatedActivities.length,
        groupsCount: currentGroups.length,
        expensesCount: currentExpenses.length,
        activities: paginatedActivities.map(a => ({ id: a.id, type: a.type, title: a.title, date: a.date }))
      });
      
      // Force new array reference to ensure React detects the change
      setActivities([...paginatedActivities]);
      setPage(1);
      setHasMore(endIndex < combinedActivities.length);
      setLoading(false);
      
      console.log('[useActivitiesInfinite] Activities state updated, count:', paginatedActivities.length);
    } catch (err) {
      setError('Failed to generate activities');
      console.error('Error generating activities in refresh:', err);
      setLoading(false);
    }
  }, [groupsLoading, expensesLoading]); // Don't depend on groups/expenses - use refs instead

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
