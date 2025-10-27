import { useCallback, useState, useEffect } from 'react';
import { EnhancedExpense } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { useGroups } from './useGroups';

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
      // Fetch expenses from all groups
      const allExpensesPromises = groups.map(group => 
        EvenlyBackendService.getGroupExpenses(group.id)
      );
      
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
      console.error('[useExpensesInfinite] Error loading expenses:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [groups]);

  // Load expenses when groups are loaded
  useEffect(() => {
    if (!groupsLoading && groups.length > 0) {
      loadAllExpenses();
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
      // Fetch expenses from all groups
      const allExpensesPromises = groups.map(group => 
        EvenlyBackendService.getGroupExpenses(group.id)
      );
      
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
      console.error('[useExpensesInfinite] Error loading more expenses:', errorMessage);
    } finally {
      setLoadingMore(false);
    }
  }, [groups]);

  const refresh = useCallback(() => {
    loadAllExpenses();
  }, [loadAllExpenses]);

  const addExpense = useCallback(async (expenseData: any) => {
    try {
      const newExpense = await EvenlyBackendService.addExpense(expenseData);
      setExpenses(prev => [newExpense, ...prev]);
      return newExpense;
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