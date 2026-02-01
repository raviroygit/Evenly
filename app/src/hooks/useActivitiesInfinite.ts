import { useCallback, useState, useEffect, useRef } from 'react';
import { useGroups } from './useGroups';
import { useAllExpenses } from './useAllExpenses';
import { groupEvents, GROUP_EVENTS } from '../utils/groupEvents';
import { EvenlyBackendService } from '../services/EvenlyBackendService';

interface ActivityItem {
  id: string;
  type: 'expense' | 'payment' | 'group' | 'invitation' | 'khata';
  title: string;
  description: string;
  amount?: string;
  memberCount?: number;
  groupName?: string; // Group name for expense activities
  customerName?: string; // Customer name for khata activities
  khataType?: 'give' | 'get'; // Transaction type for khata activities
  date: string;
  dateTimestamp?: number; // Timestamp for proper sorting
  status?: 'pending' | 'completed' | 'cancelled';
}

export const useActivitiesInfinite = () => {
  const { groups, loading: groupsLoading } = useGroups();
  const { expenses, loading: expensesLoading } = useAllExpenses();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [khataTransactions, setKhataTransactions] = useState<any[]>([]);
  const [khataLoading, setKhataLoading] = useState(true);
  
  // Keep refs to latest groups/expenses/khata for refresh function
  const groupsRef = useRef(groups);
  const expensesRef = useRef(expenses);
  const khataRef = useRef(khataTransactions);

  // Update refs when groups/expenses/khata change
  useEffect(() => {
    groupsRef.current = groups;
    expensesRef.current = expenses;
    khataRef.current = khataTransactions;
  }, [groups, expenses, khataTransactions]);

  // Fetch khata transactions
  useEffect(() => {
    const fetchKhataTransactions = async () => {
      try {
        setKhataLoading(true);
        const transactions = await EvenlyBackendService.getKhataRecentTransactions({ limit: 10 });
        setKhataTransactions(transactions);
      } catch (error) {
        console.error('Error fetching khata transactions:', error);
      } finally {
        setKhataLoading(false);
      }
    };

    fetchKhataTransactions();
  }, []);

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
        // Find group name for this expense
        const group = groups.find(g => g.id === expense.groupId);
        const groupName = group ? group.name : undefined;
        generatedActivities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          title: expense.description || expense.title || 'Untitled Expense',
          description: 'Expense added',
          amount: `₹${amount.toFixed(2)}`,
          groupName,
          date: expenseDisplayDate.toLocaleString(),
          dateTimestamp: expenseSortDate.getTime(), // Use createdAt/updatedAt for sorting (latest first)
          status: 'completed',
        });
      });

      // Add khata transaction activities
      khataTransactions.forEach((transaction) => {
        const transactionDate = transaction.transactionDate
          ? new Date(transaction.transactionDate)
          : new Date(transaction.createdAt);
        const amount = typeof transaction.amount === 'string'
          ? parseFloat(transaction.amount)
          : transaction.amount || 0;
        generatedActivities.push({
          id: `khata-${transaction.id}`,
          type: 'khata',
          title: transaction.description || `Transaction with ${transaction.customerName}`,
          description: transaction.type === 'give' ? 'You gave money' : 'You got money',
          amount: `₹${amount.toFixed(2)}`,
          customerName: transaction.customerName,
          khataType: transaction.type,
          date: transactionDate.toLocaleString(),
          dateTimestamp: transactionDate.getTime(),
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
      setTotalCount(combinedActivities.length);
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
  }, [groups, expenses, khataTransactions]);

  // Generate activities when groups and expenses are loaded or changed
  // Use a ref to track previous values and force update when arrays change
  const prevGroupsRef = useRef<string>('');
  const prevExpensesRef = useRef<string>('');
  const prevKhataRef = useRef<string>('');
  const refreshTriggerRef = useRef<number>(0);
  
  // Listen for expense refresh events to force regeneration
  useEffect(() => {
    const handleExpensesRefreshNeeded = () => {
      console.log('[useActivitiesInfinite] Expense refresh event received, forcing activities regeneration');
      // Reset prev refs to force regeneration
      prevExpensesRef.current = '';
      // Don't clear activities - just regenerate to preserve data during refresh
      // This prevents skeleton loader from showing when navigating back
      generateActivities();
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
    if (!groupsLoading && !expensesLoading && !khataLoading) {
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
      const khataKey = JSON.stringify(khataTransactions.map(t => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        customerName: t.customerName
      })).sort((a, b) => a.id.localeCompare(b.id)));

      // Always regenerate if groups or expenses or khata changed, or if this is the first load
      const groupsChanged = groupsKey !== prevGroupsRef.current;
      const expensesChanged = expensesKey !== prevExpensesRef.current;
      const khataChanged = khataKey !== prevKhataRef.current;

      console.log('[useActivitiesInfinite] useEffect triggered', {
        groupsChanged,
        expensesChanged,
        khataChanged,
        groupsCount: groups.length,
        expensesCount: expenses.length,
        khataCount: khataTransactions.length,
        groupsKey: groupsKey.substring(0, 100),
        prevGroupsKey: prevGroupsRef.current.substring(0, 100)
      });

      if (groupsChanged || expensesChanged || khataChanged || prevGroupsRef.current === '') {
        prevGroupsRef.current = groupsKey;
        prevExpensesRef.current = expensesKey;
        prevKhataRef.current = khataKey;
        refreshTriggerRef.current += 1;
        console.log('[useActivitiesInfinite] useEffect: Regenerating activities', {
          trigger: refreshTriggerRef.current,
          groupsCount: groups.length,
          expensesCount: expenses.length,
          khataCount: khataTransactions.length
        });
        // Regenerate activities immediately
        generateActivities();
      }
    }
  }, [groups, expenses, khataTransactions, groupsLoading, expensesLoading, khataLoading, generateActivities]);

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
        // Find group name for this expense
        const group = groups.find(g => g.id === expense.groupId);
        const groupName = group ? group.name : undefined;
        generatedActivities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          title: expense.description || expense.title || 'Untitled Expense',
          description: 'Expense added',
          amount: `₹${amount.toFixed(2)}`,
          groupName,
          date: expenseDisplayDate.toLocaleString(),
          dateTimestamp: expenseSortDate.getTime(), // Use createdAt/updatedAt for sorting (latest first)
          status: 'completed',
        });
      });

      // Add khata transaction activities
      khataTransactions.forEach((transaction) => {
        const transactionDate = transaction.transactionDate
          ? new Date(transaction.transactionDate)
          : new Date(transaction.createdAt);
        const amount = typeof transaction.amount === 'string'
          ? parseFloat(transaction.amount)
          : transaction.amount || 0;
        generatedActivities.push({
          id: `khata-${transaction.id}`,
          type: 'khata',
          title: transaction.description || `Transaction with ${transaction.customerName}`,
          description: transaction.type === 'give' ? 'You gave money' : 'You got money',
          amount: `₹${amount.toFixed(2)}`,
          customerName: transaction.customerName,
          khataType: transaction.type,
          date: transactionDate.toLocaleString(),
          dateTimestamp: transactionDate.getTime(),
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
    } finally{
      setLoadingMore(false);
    }
  }, [groups, expenses, khataTransactions]);

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

    // Get latest data from refs immediately - no waiting
    let currentGroups = groupsRef.current;
    let currentExpenses = expensesRef.current;

    // Fetch fresh khata transactions in parallel with regenerating activities
    let currentKhata = khataRef.current;
    const khataPromise = EvenlyBackendService.getKhataRecentTransactions({ limit: 10, cacheTTLMs: 0 })
      .then(freshKhata => {
        setKhataTransactions(freshKhata);
        currentKhata = freshKhata;
        return freshKhata;
      })
      .catch(error => {
        console.error('[useActivitiesInfinite] Error fetching fresh khata:', error);
        return currentKhata;
      });

    // Wait for khata to load
    currentKhata = await khataPromise;

    console.log('[useActivitiesInfinite] Refresh proceeding with data', {
      groupsCount: currentGroups.length,
      expensesCount: currentExpenses.length,
      khataCount: currentKhata.length,
    });

    // Force refresh by resetting state first
    setActivities([]);
    setLoading(true);

    // Reset the refs to force regeneration on next useEffect run
    prevGroupsRef.current = '';
    prevExpensesRef.current = '';
    prevKhataRef.current = '';
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
      // Use the latest expenses and khata (already updated above)
      console.log('[useActivitiesInfinite] Using expenses for activities:', currentExpenses.length);
      console.log('[useActivitiesInfinite] Using khata for activities:', currentKhata.length);
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
        // Find group name for this expense
        const group = currentGroups.find(g => g.id === expense.groupId);
        const groupName = group ? group.name : undefined;
        generatedActivities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          title: expense.description || expense.title || 'Untitled Expense',
          description: 'Expense added',
          amount: `₹${amount.toFixed(2)}`,
          groupName,
          date: expenseDisplayDate.toLocaleString(),
          dateTimestamp: expenseSortDate.getTime(), // Use createdAt/updatedAt for sorting (latest first)
          status: 'completed',
        });
      });

      // Add khata transaction activities
      currentKhata.forEach((transaction) => {
        const transactionDate = transaction.transactionDate
          ? new Date(transaction.transactionDate)
          : new Date(transaction.createdAt);
        const amount = typeof transaction.amount === 'string'
          ? parseFloat(transaction.amount)
          : transaction.amount || 0;
        generatedActivities.push({
          id: `khata-${transaction.id}`,
          type: 'khata',
          title: transaction.description || `Transaction with ${transaction.customerName}`,
          description: transaction.type === 'give' ? 'You gave money' : 'You got money',
          amount: `₹${amount.toFixed(2)}`,
          customerName: transaction.customerName,
          khataType: transaction.type,
          date: transactionDate.toLocaleString(),
          dateTimestamp: transactionDate.getTime(),
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
      setTotalCount(combinedActivities.length);
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
    totalCount,
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
      setTotalCount(0);
      setPage(1);
      setHasMore(false);
      setError(null);
      setLoading(false);
      setLoadingMore(false);
    },
  };
};
