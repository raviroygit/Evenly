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
  const { user, authState } = useAuth();

  // DON'T use shared hooks - fetch our own data to avoid state sync issues
  const [groups, setGroups] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(true);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [khataTransactions, setKhataTransactions] = useState<any[]>([]);
  const [khataLoading, setKhataLoading] = useState(true);

  // Track if this is the first fetch after login to force bypass cache
  const isFirstKhataFetchAfterLogin = useRef(true);
  const isFirstGroupsFetchAfterLogin = useRef(true);
  const isFirstExpensesFetchAfterLogin = useRef(true);

  // Track the user ID we last generated activities for
  // This prevents generating activities with mixed old/new data during user transitions
  const lastGeneratedForUserId = useRef<string | null>(null);

  // Refs for latest data
  const groupsRef = useRef(groups);
  const expensesRef = useRef(expenses);
  const khataRef = useRef(khataTransactions);

  useEffect(() => {
    groupsRef.current = groups;
    expensesRef.current = expenses;
    khataRef.current = khataTransactions;
  }, [groups, expenses, khataTransactions]);

  // Auto-reset when user logs out (watch BOTH user and authState for immediate reset)
  useEffect(() => {
    if (!user || authState === 'unauthenticated' || authState === 'initializing') {
      setActivities([]);
      setTotalCount(0);
      setLoading(true);
      setHasInitiallyLoaded(false);
      setKhataTransactions([]);
      setKhataLoading(true);
      // Clear groups and expenses
      setGroups([]);
      setExpenses([]);
      setGroupsLoading(true);
      setExpensesLoading(true);
      // Reset flags so next login will bypass cache and regenerate for new user
      isFirstKhataFetchAfterLogin.current = true;
      isFirstGroupsFetchAfterLogin.current = true;
      isFirstExpensesFetchAfterLogin.current = true;
      lastGeneratedForUserId.current = null;
    }
  }, [user, authState]);

  // Fetch groups directly (don't use useGroups hook to avoid state sync issues)
  useEffect(() => {
    if (!user || authState !== 'authenticated') {
      // Don't set loading to false during initialization - keep it true
      // This prevents generateActivities from running with empty data before login
      return;
    }

    const fetchGroups = async () => {
      try {
        setGroupsLoading(true);
        const cacheTTL = isFirstGroupsFetchAfterLogin.current ? 0 : 30000;
        if (isFirstGroupsFetchAfterLogin.current) {
          isFirstGroupsFetchAfterLogin.current = false;
        }
        const groupsData = await EvenlyBackendService.getGroups({ cacheTTLMs: cacheTTL });
        setGroups(groupsData);
      } catch (error) {
      } finally {
        setGroupsLoading(false);
      }
    };
    fetchGroups();
  }, [user, authState]);

  // Fetch expenses directly (don't use useAllExpenses hook to avoid state sync issues)
  useEffect(() => {
    if (!user || authState !== 'authenticated') {
      // Don't set loading to false during initialization - keep it true
      return;
    }

    if (groupsLoading || groups.length === 0) {
      setExpenses([]);
      setExpensesLoading(false);
      return;
    }

    const fetchExpenses = async () => {
      try {
        setExpensesLoading(true);
        const cacheTTL = isFirstExpensesFetchAfterLogin.current ? 0 : 30000;
        if (isFirstExpensesFetchAfterLogin.current) {
          isFirstExpensesFetchAfterLogin.current = false;
        }

        const allExpensesPromises = groups.map(group =>
          EvenlyBackendService.getGroupExpenses(group.id, { cacheTTLMs: cacheTTL })
        );
        const allExpensesResults = await Promise.all(allExpensesPromises);
        const allExpenses = allExpensesResults.flatMap(result => result.expenses);
        setExpenses(allExpenses);
      } catch (error) {
      } finally {
        setExpensesLoading(false);
      }
    };
    fetchExpenses();
  }, [user, authState, groupsLoading, groups]);

  // Fetch khata transactions once (only when user is logged in and authenticated)
  useEffect(() => {
    if (!user || authState !== 'authenticated') {
      // Don't set loading to false during initialization - keep it true
      return;
    }

    const fetchKhata = async () => {
      try {
        setKhataLoading(true);

        // Force bypass cache on first fetch after login to ensure fresh data
        // This prevents showing old user's cached khata transactions
        let cacheTTL: number;
        if (isFirstKhataFetchAfterLogin.current) {
          cacheTTL = 0; // Bypass cache - force fresh fetch
          isFirstKhataFetchAfterLogin.current = false;
        } else {
          // Use a reasonable cache TTL for subsequent fetches (30 seconds)
          cacheTTL = 30000;
        }

        const transactions = await EvenlyBackendService.getKhataRecentTransactions({
          limit: 10,
          cacheTTLMs: cacheTTL
        });


        setKhataTransactions(transactions);
      } catch (error) {
      } finally {
        setKhataLoading(false);
      }
    };
    fetchKhata();
  }, [user, authState]);

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

    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [groups, expenses, khataTransactions]);

  // Generate activities when data changes (only when user is logged in AND authenticated)
  useEffect(() => {
    // Prevent generating activities if not authenticated
    if (!user || authState !== 'authenticated') {
      return;
    }

    // Log current loading states for debugging

    // Wait for ALL data sources to finish loading before generating
    // This prevents using stale data from previous user during the loading phase
    if (!groupsLoading && !expensesLoading && !khataLoading) {
      // Safety check: Only generate if this is a NEW user
      // This prevents generating with mixed old/new data during user transitions
      const currentUserId = user.id;

      if (lastGeneratedForUserId.current !== currentUserId) {
        lastGeneratedForUserId.current = currentUserId;
        generateActivities();
      } else {
        // Data changed for same user - regenerate
        generateActivities();
      }
    }
  }, [user, authState, groups, expenses, khataTransactions, groupsLoading, expensesLoading, khataLoading, generateActivities]);

  // Listen for events to regenerate
  useEffect(() => {
    const handleRefreshNeeded = () => {
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
    if (!user || authState !== 'authenticated') {
      return;
    }

    try {
      // Always bypass cache on manual refresh
      const freshKhata = await EvenlyBackendService.getKhataRecentTransactions({ limit: 10, cacheTTLMs: 0 });
      setKhataTransactions(freshKhata);
      generateActivities();
    } catch (error) {
    }
  }, [user, authState, generateActivities]);

  /**
   * Reset all activities state - used on logout
   */
  const reset = useCallback(() => {
    setActivities([]);
    setTotalCount(0);
    setLoading(true);
    setHasInitiallyLoaded(false);
    setKhataTransactions([]);
    setKhataLoading(true);
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
