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
      console.log('[useExpensesInfinite] Loading all expenses from groups:', groups.length);
      
      // Fetch expenses from all groups
      const allExpensesPromises = groups.map(group => 
        EvenlyBackendService.getGroupExpenses(group.id)
      );
      
      const allExpensesResults = await Promise.all(allExpensesPromises);
      
      // Flatten all expenses into a single array
      const allExpenses = allExpensesResults.flatMap(result => result.expenses);
      
      console.log('[useExpensesInfinite] Received expenses:', allExpenses);
      console.log('[useExpensesInfinite] Number of expenses:', allExpenses.length);
      
      // Add mock data for better testing
      const mockExpenses: EnhancedExpense[] = [
        {
          id: 'mock-expense-1',
          title: '🍽️ Dinner at Restaurant (TEST)',
          description: 'Mock expense for testing infinite scroll',
          amount: 1250.00,
          groupId: 'mock-1',
          groupName: 'Weekend Trip',
          paidBy: 'user1',
          paidByName: 'John Doe',
          splitType: 'equal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-expense-2',
          title: '🎬 Movie Tickets (TEST)',
          description: 'Mock expense for testing infinite scroll',
          amount: 800.00,
          groupId: 'mock-2',
          groupName: 'Movie Night',
          paidBy: 'user2',
          paidByName: 'Jane Smith',
          splitType: 'equal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-expense-3',
          title: '🛒 Grocery Shopping (TEST)',
          description: 'Mock expense for testing infinite scroll',
          amount: 2100.00,
          groupId: 'mock-3',
          groupName: 'Grocery Shopping',
          paidBy: 'user3',
          paidByName: 'Bob Wilson',
          splitType: 'equal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-expense-4',
          title: '🎂 Birthday Cake (TEST)',
          description: 'Mock expense for testing infinite scroll',
          amount: 1500.00,
          groupId: 'mock-4',
          groupName: 'Birthday Party',
          paidBy: 'user4',
          paidByName: 'Alice Brown',
          splitType: 'equal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-expense-5',
          title: '🍽️ Office Lunch (TEST)',
          description: 'Mock expense for testing infinite scroll',
          amount: 1800.00,
          groupId: 'mock-5',
          groupName: 'Office Lunch',
          paidBy: 'user5',
          paidByName: 'Charlie Davis',
          splitType: 'equal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-expense-6',
          title: '🚕 Taxi Ride (TEST)',
          description: 'Mock expense for testing infinite scroll',
          amount: 450.00,
          groupId: 'mock-1',
          groupName: 'Weekend Trip',
          paidBy: 'user1',
          paidByName: 'John Doe',
          splitType: 'equal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Combine real and mock data
      const combinedExpenses = [...allExpenses, ...mockExpenses];
      
      console.log('[useExpensesInfinite] Real expenses:', allExpenses.length);
      console.log('[useExpensesInfinite] Mock expenses:', mockExpenses.length);
      console.log('[useExpensesInfinite] Combined expenses:', combinedExpenses.length);
      
      // Simulate pagination
      const pageSize = 3;
      const startIndex = 0; // Always start from beginning for initial load
      const endIndex = startIndex + pageSize;
      const paginatedExpenses = combinedExpenses.slice(startIndex, endIndex);
      
      console.log('[useExpensesInfinite] Paginated expenses:', paginatedExpenses.length);
      console.log('[useExpensesInfinite] Expense titles:', paginatedExpenses.map(e => e.title));
      
      setExpenses(paginatedExpenses);
      setPage(1);
      setHasMore(endIndex < combinedExpenses.length);
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
      console.log('[useExpensesInfinite] Loading page:', pageNum);
      
      // Fetch expenses from all groups
      const allExpensesPromises = groups.map(group => 
        EvenlyBackendService.getGroupExpenses(group.id)
      );
      
      const allExpensesResults = await Promise.all(allExpensesPromises);
      
      // Flatten all expenses into a single array
      const allExpenses = allExpensesResults.flatMap(result => result.expenses);
      
      // Add mock data for better testing
      const mockExpenses: EnhancedExpense[] = [
        {
          id: 'mock-expense-1',
          title: '🍽️ Dinner at Restaurant (TEST)',
          description: 'Mock expense for testing infinite scroll',
          amount: 1250.00,
          groupId: 'mock-1',
          groupName: 'Weekend Trip',
          paidBy: 'user1',
          paidByName: 'John Doe',
          splitType: 'equal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-expense-2',
          title: '🎬 Movie Tickets (TEST)',
          description: 'Mock expense for testing infinite scroll',
          amount: 800.00,
          groupId: 'mock-2',
          groupName: 'Movie Night',
          paidBy: 'user2',
          paidByName: 'Jane Smith',
          splitType: 'equal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-expense-3',
          title: '🛒 Grocery Shopping (TEST)',
          description: 'Mock expense for testing infinite scroll',
          amount: 2100.00,
          groupId: 'mock-3',
          groupName: 'Grocery Shopping',
          paidBy: 'user3',
          paidByName: 'Bob Wilson',
          splitType: 'equal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-expense-4',
          title: '🎂 Birthday Cake (TEST)',
          description: 'Mock expense for testing infinite scroll',
          amount: 1500.00,
          groupId: 'mock-4',
          groupName: 'Birthday Party',
          paidBy: 'user4',
          paidByName: 'Alice Brown',
          splitType: 'equal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-expense-5',
          title: '🍽️ Office Lunch (TEST)',
          description: 'Mock expense for testing infinite scroll',
          amount: 1800.00,
          groupId: 'mock-5',
          groupName: 'Office Lunch',
          paidBy: 'user5',
          paidByName: 'Charlie Davis',
          splitType: 'equal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-expense-6',
          title: '🚕 Taxi Ride (TEST)',
          description: 'Mock expense for testing infinite scroll',
          amount: 450.00,
          groupId: 'mock-1',
          groupName: 'Weekend Trip',
          paidBy: 'user1',
          paidByName: 'John Doe',
          splitType: 'equal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Combine real and mock data
      const combinedExpenses = [...allExpenses, ...mockExpenses];
      
      // Simulate pagination
      const pageSize = 3;
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedExpenses = combinedExpenses.slice(startIndex, endIndex);
      
      setExpenses(prev => [...prev, ...paginatedExpenses]);
      setHasMore(endIndex < combinedExpenses.length);
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