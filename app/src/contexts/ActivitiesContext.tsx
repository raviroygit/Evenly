import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useGroups } from '../hooks/useGroups';
import { useAllExpenses } from '../hooks/useAllExpenses';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { groupEvents, GROUP_EVENTS } from '../utils/groupEvents';
import { useAuth } from './AuthContext';

interface ActivityItem {
  id: string;
  type: 'expense' | 'payment' | 'group' | 'invitation' | 'khata';
  title: string;
  description: string;
  amount?: string;
  memberCount?: number;
  groupName?: string;
  customerName?: string;
  khataType?: 'give' | 'get';
  date: string;
  dateTimestamp?: number;
  status?: 'pending' | 'completed' | 'cancelled';
}

interface ActivitiesContextType {
  activities: ActivityItem[];
  totalCount: number;
  loading: boolean;
  hasInitiallyLoaded: boolean;
  refresh: () => Promise<void>;
  reset: () => void;
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined);

export const ActivitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { groups, loading: groupsLoading } = useGroups();
  const { expenses, loading: expensesLoading } = useAllExpenses();

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [khataTransactions, setKhataTransactions] = useState<any[]>([]);
  const [khataLoading, setKhataLoading] = useState(true);

  // Refs for latest data
  const groupsRef = useRef(groups);
  const expensesRef = useRef(expenses);
  const khataRef = useRef(khataTransactions);

  useEffect(() => {
    groupsRef.current = groups;
    expensesRef.current = expenses;
    khataRef.current = khataTransactions;
  }, [groups, expenses, khataTransactions]);

  // Auto-reset when user logs out
  useEffect(() => {
    if (!user) {
      console.log('[ActivitiesContext] User logged out - resetting activities');
      setActivities([]);
      setTotalCount(0);
      setLoading(true);
      setHasInitiallyLoaded(false);
      setKhataTransactions([]);
      setKhataLoading(true);
      console.log('[ActivitiesContext] ✅ Activities auto-reset on logout');
    }
  }, [user]);

  // Fetch khata transactions once (only when user is logged in)
  useEffect(() => {
    if (!user) {
      setKhataLoading(false);
      return;
    }

    const fetchKhata = async () => {
      try {
        setKhataLoading(true);
        const transactions = await EvenlyBackendService.getKhataRecentTransactions({ limit: 10 });
        setKhataTransactions(transactions);
      } catch (error) {
        console.error('[ActivitiesContext] Error fetching khata:', error);
      } finally {
        setKhataLoading(false);
      }
    };
    fetchKhata();
  }, [user]);

  const generateActivities = useCallback(() => {
    try {
      const generatedActivities: ActivityItem[] = [];

      // Add group activities
      groups.forEach((group) => {
        const groupDate = group.updatedAt instanceof Date ? group.updatedAt : new Date(group.updatedAt);
        generatedActivities.push({
          id: `group-${group.id}`,
          type: 'group',
          title: group.name,
          description: 'Group activity',
          memberCount: group.memberCount,
          date: groupDate.toLocaleString(),
          dateTimestamp: groupDate.getTime(),
          status: 'completed',
        });
      });

      // Add expense activities
      expenses.forEach((expense) => {
        const expenseCreatedAt = expense.createdAt instanceof Date ? expense.createdAt : new Date(expense.createdAt);
        const expenseUpdatedAt = expense.updatedAt instanceof Date ? expense.updatedAt : new Date(expense.updatedAt);
        const expenseSortDate = expenseUpdatedAt > expenseCreatedAt ? expenseUpdatedAt : expenseCreatedAt;
        const expenseDisplayDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
        const amount = typeof expense.totalAmount === 'string' ? parseFloat(expense.totalAmount) : expense.totalAmount || 0;
        const group = groups.find(g => g.id === expense.groupId);

        generatedActivities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          title: expense.description || expense.title || 'Untitled Expense',
          description: 'Expense added',
          amount: `₹${amount.toFixed(2)}`,
          groupName: group?.name,
          date: expenseDisplayDate.toLocaleString(),
          dateTimestamp: expenseSortDate.getTime(),
          status: 'completed',
        });
      });

      // Add khata activities
      khataTransactions.forEach((transaction) => {
        const transactionDate = transaction.transactionDate ? new Date(transaction.transactionDate) : new Date(transaction.createdAt);
        const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount || 0;

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

      // Sort by timestamp (newest first)
      generatedActivities.sort((a, b) => {
        const timestampA = a.dateTimestamp || new Date(a.date).getTime();
        const timestampB = b.dateTimestamp || new Date(b.date).getTime();
        return timestampB - timestampA;
      });

      setActivities(generatedActivities);
      setTotalCount(generatedActivities.length);
      setHasInitiallyLoaded(true);

      console.log('[ActivitiesContext] Activities generated:', generatedActivities.length);
    } catch (error) {
      console.error('[ActivitiesContext] Error generating activities:', error);
    } finally {
      setLoading(false);
    }
  }, [groups, expenses, khataTransactions]);

  // Generate activities when data changes (only when user is logged in)
  useEffect(() => {
    if (!user) {
      return;
    }

    if (!groupsLoading && !expensesLoading && !khataLoading) {
      generateActivities();
    }
  }, [user, groups, expenses, khataTransactions, groupsLoading, expensesLoading, khataLoading, generateActivities]);

  // Listen for events to regenerate
  useEffect(() => {
    const handleRefreshNeeded = () => {
      console.log('[ActivitiesContext] Refresh event received');
      generateActivities();
    };

    groupEvents.on(GROUP_EVENTS.EXPENSES_REFRESH_NEEDED, handleRefreshNeeded);
    groupEvents.on(GROUP_EVENTS.EXPENSE_CREATED, handleRefreshNeeded);
    groupEvents.on(GROUP_EVENTS.EXPENSE_UPDATED, handleRefreshNeeded);
    groupEvents.on(GROUP_EVENTS.EXPENSE_DELETED, handleRefreshNeeded);
    groupEvents.on(GROUP_EVENTS.GROUPS_REFRESH_NEEDED, handleRefreshNeeded);

    return () => {
      groupEvents.off(GROUP_EVENTS.EXPENSES_REFRESH_NEEDED, handleRefreshNeeded);
      groupEvents.off(GROUP_EVENTS.EXPENSE_CREATED, handleRefreshNeeded);
      groupEvents.off(GROUP_EVENTS.EXPENSE_UPDATED, handleRefreshNeeded);
      groupEvents.off(GROUP_EVENTS.EXPENSE_DELETED, handleRefreshNeeded);
      groupEvents.off(GROUP_EVENTS.GROUPS_REFRESH_NEEDED, handleRefreshNeeded);
    };
  }, [generateActivities]);

  const refresh = useCallback(async () => {
    if (!user) {
      console.log('[ActivitiesContext] Cannot refresh - user not logged in');
      return;
    }

    console.log('[ActivitiesContext] Manual refresh triggered');
    try {
      const freshKhata = await EvenlyBackendService.getKhataRecentTransactions({ limit: 10, cacheTTLMs: 0 });
      setKhataTransactions(freshKhata);
      generateActivities();
    } catch (error) {
      console.error('[ActivitiesContext] Error refreshing:', error);
    }
  }, [user, generateActivities]);

  /**
   * Reset all activities state - used on logout
   */
  const reset = useCallback(() => {
    console.log('[ActivitiesContext] Resetting all activities...');
    setActivities([]);
    setTotalCount(0);
    setLoading(true);
    setHasInitiallyLoaded(false);
    setKhataTransactions([]);
    setKhataLoading(true);
    console.log('[ActivitiesContext] ✅ Activities reset');
  }, []);

  const value = {
    activities,
    totalCount,
    loading,
    hasInitiallyLoaded,
    refresh,
    reset,
  };

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>;
};

export const useActivitiesContext = () => {
  const context = useContext(ActivitiesContext);
  if (context === undefined) {
    throw new Error('useActivitiesContext must be used within ActivitiesProvider');
  }
  return context;
};
