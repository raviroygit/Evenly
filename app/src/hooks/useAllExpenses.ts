import { useState, useEffect, useMemo, useCallback } from 'react';
import { Expense, EnhancedExpense } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { CacheManager } from '../utils/cacheManager';
import { useGroups } from './useGroups';
import { emitExpenseCreated, emitExpensesRefreshNeeded, groupEvents, GROUP_EVENTS } from '../utils/groupEvents';
import { sessionEvents, SESSION_EVENTS } from '../utils/sessionEvents';
import { DataRefreshCoordinator } from '../utils/dataRefreshCoordinator';
import { useAuth } from '../contexts/AuthContext';

export const useAllExpenses = () => {
  const { authState } = useAuth();
  const [expenses, setExpenses] = useState<EnhancedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { groups, loading: groupsLoading } = useGroups();

  // Wait for auth to be ready before loading data
  useEffect(() => {
    if (authState !== 'authenticated') {
      console.log('[useAllExpenses] Auth not ready, skipping data load. State:', authState);
      return;
    }

    console.log('[useAllExpenses] Auth ready, loading expenses...');
    if (groupsLoading) {
      setLoading(true);
    } else if (groups.length > 0) {
      loadAllExpenses();
    } else {
      setExpenses([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, groups, groupsLoading, loadAllExpenses]); // Depend on groups array to reload when groups change

  // Register with DataRefreshCoordinator
  useEffect(() => {
    console.log('[useAllExpenses] Registering with DataRefreshCoordinator');
    const unregister = DataRefreshCoordinator.register(async () => {
      console.log('[useAllExpenses] Coordinator triggered refresh');
      await loadAllExpenses();
    });

    return () => {
      console.log('[useAllExpenses] Unregistering from DataRefreshCoordinator');
      unregister();
    };
  }, [loadAllExpenses]);

  // Listen for expense refresh events from other screens
  useEffect(() => {
    const handleExpensesRefreshNeeded = async () => {
      console.log('[useAllExpenses] Expenses refresh needed event received, refreshing...', {
        groupsCount: groups.length,
        groupsLoading
      });
      // Wait for groups to be loaded if they're still loading
      if (groupsLoading) {
        console.log('[useAllExpenses] Groups are loading, waiting...');
        let attempts = 0;
        while (groupsLoading && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }
      // Always refresh, even if groups array is empty (groups might be loading)
      // The loadAllExpenses function will handle empty groups gracefully
      await loadAllExpenses();
      console.log('[useAllExpenses] Expenses refresh completed', {
        expensesCount: expenses.length
      });
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
  }, [groups, groupsLoading, expenses.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for token refresh events (backwards compatibility)
  useEffect(() => {
    const handleTokenRefreshed = () => {
      console.log('[useAllExpenses] Token refreshed event received, reloading expenses...');
      loadAllExpenses();
    };

    sessionEvents.on(SESSION_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);

    return () => {
      sessionEvents.off(SESSION_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);
    };
  }, [loadAllExpenses]);

  // Fix closure issue by using current groups, not stale closure
  const loadAllExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch fresh groups to avoid closure issue
      const currentGroups = await EvenlyBackendService.getGroups({ cacheTTLMs: 0 });

      console.log('[useAllExpenses] loadAllExpenses called', {
        groupsCount: currentGroups.length,
      });

      if (currentGroups.length === 0) {
        console.log('[useAllExpenses] No groups, setting empty expenses');
        setExpenses([]);
        setLoading(false);
        return;
      }

      // Use token's remaining lifetime as cache TTL
      const cacheTTL = await CacheManager.getCacheTTL();

      console.log('[useAllExpenses] Loading all expenses with cache TTL:', cacheTTL);

      // Fetch expenses from all groups with token-based cache TTL
      const allExpensesPromises = currentGroups.map(group =>
        EvenlyBackendService.getGroupExpenses(group.id, { cacheTTLMs: cacheTTL })
      );

      const allExpensesResults = await Promise.all(allExpensesPromises);

      // Flatten all expenses into a single array
      const allExpenses = allExpensesResults.flatMap(result => result.expenses);

      console.log('[useAllExpenses] Expenses loaded', {
        totalExpenses: allExpenses.length,
        expenses: allExpenses.map(e => ({ id: e.id, title: e.title || e.description }))
      });

      // Force update by creating new array reference
      setExpenses(() => [...allExpenses]);
    } catch (err: any) {
      // If in offline mode (session expired), don't show error to user
      if (err._offlineMode) {
        console.warn('[useAllExpenses] ⚠️ Offline mode - using cached data');
        // Don't set error message - user is in offline mode
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load expenses';
        console.error('[useAllExpenses] Error loading expenses:', err);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const totalExpenses = useMemo(() => 
    expenses.reduce((sum, expense) => {
      const amount = typeof expense.totalAmount === 'string' ? parseFloat(expense.totalAmount) : expense.totalAmount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0), 
    [expenses]
  );

  const expensesByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    expenses.forEach(expense => {
      const amount = typeof expense.totalAmount === 'string' ? parseFloat(expense.totalAmount) : expense.totalAmount;
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + (isNaN(amount) ? 0 : amount));
    });
    return Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [expenses]);

  const recentExpenses = useMemo(() => 
    expenses
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10), // Show more recent expenses since we're showing all groups
    [expenses]
  );

  const addExpense = async (expenseData: {
    groupId: string;
    title: string;
    description?: string;
    totalAmount: string;
    paidBy?: string;
    splitType: 'equal' | 'percentage' | 'shares' | 'exact';
    category: string;
    date: string;
    receipt?: string;
    splits?: {
      userId: string;
      amount: string;
      percentage?: string;
      shares?: number;
    }[];
  }) => {
    try {
      setError(null);
      const newExpense = await EvenlyBackendService.createExpense(expenseData);
      // Force new array reference
      setExpenses(prev => [newExpense, ...prev]);
      // Emit event to notify other screens
      emitExpenseCreated(newExpense);
      return newExpense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create expense';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    expenses,
    loading,
    error,
    totalExpenses,
    expensesByCategory,
    recentExpenses,
    addExpense,
    refreshExpenses: loadAllExpenses,
  };
};
