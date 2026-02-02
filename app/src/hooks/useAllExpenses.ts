import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Expense, EnhancedExpense } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { CacheManager } from '../utils/cacheManager';
import { useGroups } from './useGroups';
import { emitExpenseCreated, emitExpensesRefreshNeeded, groupEvents, GROUP_EVENTS } from '../utils/groupEvents';
import { sessionEvents, SESSION_EVENTS } from '../utils/sessionEvents';
import { DataRefreshCoordinator } from '../utils/dataRefreshCoordinator';
import { useAuth } from '../contexts/AuthContext';

// Global state for expenses shared across all hook instances
let globalExpensesIsFirstFetch = true;
let globalExpensesLastFetchTime = 0;
let globalExpensesIsLoading = false;
let globalExpensesCache: EnhancedExpense[] = [];
const EXPENSES_CACHE_DURATION = 60000; // 1 minute

export const useAllExpenses = () => {
  const { authState } = useAuth();
  const [expenses, setExpenses] = useState<EnhancedExpense[]>(globalExpensesCache);
  const [loading, setLoading] = useState(!globalExpensesCache.length);
  const [error, setError] = useState<string | null>(null);
  const { groups, loading: groupsLoading } = useGroups();

  // Wait for auth to be ready before loading data
  useEffect(() => {
    // Clear data when user logs out
    if (authState === 'unauthenticated') {
      setExpenses([]);
      setLoading(true);
      setError(null);
      // Reset global state so next app reopen will bypass cache
      globalExpensesIsFirstFetch = true;
      globalExpensesCache = [];
      globalExpensesIsLoading = false;
      return;
    }

    // Skip during initialization phase - wait for authenticated state
    if (authState === 'initializing') {
      return;
    }

    // Only load data when authenticated
    if (authState !== 'authenticated') {
      return;
    }

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
    const unregister = DataRefreshCoordinator.register(async () => {
      await loadAllExpenses({ silent: true }); // Silent - automatic background coordination
    });

    return () => {
      unregister();
    };
  }, [loadAllExpenses]);

  // Listen for expense refresh events from other screens
  useEffect(() => {
    const handleExpensesRefreshNeeded = async () => {
      // Wait for groups to be loaded if they're still loading
      if (groupsLoading) {
        let attempts = 0;
        while (groupsLoading && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }
      // Always refresh, even if groups array is empty (groups might be loading)
      // The loadAllExpenses function will handle empty groups gracefully
      // Show loader for manual user actions (create/update/delete)
      await loadAllExpenses({ silent: false });
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
  // Token refresh is automatic, so keep it silent
  useEffect(() => {
    const handleTokenRefreshed = () => {
      loadAllExpenses({ silent: true }); // Silent - automatic background event
    };

    sessionEvents.on(SESSION_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);

    return () => {
      sessionEvents.off(SESSION_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);
    };
  }, [loadAllExpenses]);

  // Fix closure issue by using current groups, not stale closure
  const loadAllExpenses = useCallback(async (options: { silent?: boolean } = {}) => {
    try {
      const { silent = false } = options;

      // If another instance is already loading, wait and use cached data
      if (globalExpensesIsLoading && !globalExpensesIsFirstFetch) {

        // Wait for the other instance to finish loading (max 5 seconds)
        let attempts = 0;
        while (globalExpensesIsLoading && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        // Use the cached data that was just loaded
        if (globalExpensesCache.length > 0) {
          setExpenses(globalExpensesCache);
        } else {
          // Cache is still empty, don't skip - continue to load below
        }
        setLoading(false);

        // Only return if we have cache data, otherwise continue to load
        if (globalExpensesCache.length > 0) {
          return;
        }
      }

      // Only show loader for non-silent refreshes AND if this is the first instance loading
      if (!silent && !globalExpensesIsLoading) {
        setLoading(true);
      }
      setError(null);
      globalExpensesIsLoading = true;

      // Fetch fresh groups to avoid closure issue
      const currentGroups = await EvenlyBackendService.getGroups({ cacheTTLMs: 0 });


      if (currentGroups.length === 0) {
        setExpenses([]);
        setLoading(false);
        return;
      }

      // Always bypass cache on first fetch to ensure fresh data on app reopen
      // After first fetch, use cache for better performance
      let cacheTTL: number;
      if (globalExpensesIsFirstFetch) {
        cacheTTL = 0; // Bypass cache - force fresh fetch
        globalExpensesIsFirstFetch = false;
        globalExpensesLastFetchTime = Date.now();
      } else {
        // Check if cache has expired (1 minute)
        const timeSinceLastFetch = Date.now() - globalExpensesLastFetchTime;
        if (timeSinceLastFetch > EXPENSES_CACHE_DURATION) {
          cacheTTL = 0; // Cache expired - fetch fresh data silently
          globalExpensesLastFetchTime = Date.now();
        } else {
          // Use cache for subsequent fetches within 1 minute
          cacheTTL = EXPENSES_CACHE_DURATION - timeSinceLastFetch;
        }
      }

      // Fetch expenses from all groups with cache TTL (0 = bypass, >0 = use cache)
      const allExpensesPromises = currentGroups.map(group =>
        EvenlyBackendService.getGroupExpenses(group.id, { cacheTTLMs: cacheTTL })
      );

      const allExpensesResults = await Promise.all(allExpensesPromises);

      // Flatten all expenses into a single array
      const allExpenses = allExpensesResults.flatMap(result => result.expenses);


      // Update global cache
      globalExpensesCache = allExpenses;

      // Force update by creating new array reference
      setExpenses(() => [...allExpenses]);
    } catch (err: any) {
      // If in offline mode (session expired), don't show error to user
      if (err._offlineMode) {
        // Don't set error message - user is in offline mode
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load expenses';
        setError(errorMessage);
      }
    } finally {
      globalExpensesIsLoading = false;
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

  // Auto-refresh when cache expires (silent refresh during app use)
  useEffect(() => {
    if (authState !== 'authenticated') return;

    const checkCacheExpiry = () => {
      const timeSinceLastFetch = Date.now() - globalExpensesLastFetchTime;
      if (timeSinceLastFetch > EXPENSES_CACHE_DURATION && !globalExpensesIsFirstFetch) {
        loadAllExpenses({ silent: true }); // Silent - automatic cache expiry refresh
      }
    };

    // Check every 30 seconds if cache has expired
    const interval = setInterval(checkCacheExpiry, 30000);

    return () => clearInterval(interval);
  }, [authState, loadAllExpenses]);

  return {
    expenses,
    loading,
    error,
    totalExpenses,
    expensesByCategory,
    recentExpenses,
    addExpense,
    refreshExpenses: () => loadAllExpenses({ silent: false }), // Explicit user refresh
  };
};
