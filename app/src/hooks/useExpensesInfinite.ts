import { useCallback, useState, useEffect } from 'react';
import { EnhancedExpense } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { useGroups } from './useGroups';
import { emitExpenseCreated, emitExpenseUpdated, emitExpenseDeleted } from '../utils/groupEvents';

export const useExpensesInfinite = () => {
  const { groups, loading: groupsLoading } = useGroups();
  const [expenses, setExpenses] = useState<EnhancedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const loadAllExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Filter out any groups that might be invalid (defensive programming)
      const validGroups = groups.filter(group => group && group.id);
      
      if (validGroups.length === 0) {
        setExpenses([]);
        setPage(1);
        setHasMore(false);
        return;
      }
      
      // Fetch expenses from all valid groups with individual error handling
      const allExpensesPromises = validGroups.map(async (group) => {
        try {
          return await EvenlyBackendService.getGroupExpenses(group.id);
        } catch (error) {
          // Return empty result for failed groups instead of throwing
          return { expenses: [], total: 0 };
        }
      });
      
      const allExpensesResults = await Promise.all(allExpensesPromises);
      
      // Flatten all expenses into a single array
      const allExpenses = allExpensesResults.flatMap(result => result.expenses);
      
      // Simulate pagination
      const pageSize = 3;
      const startIndex = 0; // Always start from beginning for initial load
      const endIndex = startIndex + pageSize;
      const paginatedExpenses = allExpenses.slice(startIndex, endIndex);
      
      setExpenses(paginatedExpenses);
      setPage(1);
      setHasMore(endIndex < allExpenses.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load expenses';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [groups]);

  // Load expenses when groups are loaded
  useEffect(() => {
    if (!groupsLoading) {
      if (groups.length > 0) {
        loadAllExpenses();
      } else {
        // No groups available, set empty expenses and stop loading
        setExpenses([]);
        setLoading(false);
        setError(null);
        setHasMore(false);
      }
    }
  }, [groups, groupsLoading, loadAllExpenses]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    setPage(prevPage => {
      const nextPage = prevPage + 1;
      loadAllExpensesForPage(nextPage);
      return nextPage;
    });
  }, [hasMore, loadingMore]);

  const loadAllExpensesForPage = useCallback(async (pageNum: number) => {
    try {
      // Filter out any groups that might be invalid (defensive programming)
      const validGroups = groups.filter(group => group && group.id);
      
      if (validGroups.length === 0) {
        setExpenses([]);
        setHasMore(false);
        return;
      }
      
      // Fetch expenses from all valid groups with individual error handling
      const allExpensesPromises = validGroups.map(async (group) => {
        try {
          return await EvenlyBackendService.getGroupExpenses(group.id);
        } catch (error) {
          // Return empty result for failed groups instead of throwing
          return { expenses: [], total: 0 };
        }
      });
      
      const allExpensesResults = await Promise.all(allExpensesPromises);
      
      // Flatten all expenses into a single array
      const allExpenses = allExpensesResults.flatMap(result => result.expenses);
      
      // Simulate pagination
      const pageSize = 3;
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedExpenses = allExpenses.slice(startIndex, endIndex);
      
      setExpenses(prev => [...prev, ...paginatedExpenses]);
      setHasMore(endIndex < allExpenses.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more expenses';
      setError(errorMessage);
    } finally {
      setLoadingMore(false);
    }
  }, [groups]);

  const refresh = useCallback(() => {
    loadAllExpenses();
  }, [loadAllExpenses]);

  const addExpense = useCallback(async (expenseData: any) => {
    try {
      const newExpense = await EvenlyBackendService.createExpense(expenseData);
      
      // Add the new expense to the beginning of the list
      setExpenses(prev => {
        const updated = [newExpense, ...prev];
        return updated;
      });
      
      // Emit event to notify other screens
      emitExpenseCreated(newExpense);
      
      return newExpense;
    } catch (error) {
      throw error;
    }
  }, []);

  const updateExpense = useCallback(async (expenseId: string, expenseData: {
    title: string;
    totalAmount: string;
    date: string;
  }) => {
    try {
      const updatedExpense = await EvenlyBackendService.updateExpense(expenseId, expenseData);
      setExpenses(prev => prev.map(expense => expense.id === expenseId ? updatedExpense : expense));
      // Emit event to notify other screens
      emitExpenseUpdated(updatedExpense);
      return updatedExpense;
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteExpense = useCallback(async (expenseId: string) => {
    try {
      await EvenlyBackendService.deleteExpense(expenseId);
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      // Emit event to notify other screens
      emitExpenseDeleted(expenseId);
    } catch (error) {
      throw error;
    }
  }, []);

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  return {
    expenses,
    loading,
    loadingMore,
    error,
    hasMore,
    page,
    loadMore,
    refresh,
    addExpense,
    updateExpense,
    deleteExpense,
    totalExpenses,
    setData: setExpenses,
    appendData: (newData: EnhancedExpense[]) => setExpenses(prev => [...prev, ...newData]),
    reset: () => {
      setExpenses([]);
      setPage(1);
      setHasMore(false);
      setError(null);
      setLoading(false);
      setLoadingMore(false);
    },
  };
};