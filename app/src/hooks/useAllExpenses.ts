import { useState, useEffect, useMemo } from 'react';
import { Expense, EnhancedExpense } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { useGroups } from './useGroups';

export const useAllExpenses = () => {
  const [expenses, setExpenses] = useState<EnhancedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { groups, loading: groupsLoading } = useGroups();

  useEffect(() => {
    if (groupsLoading) {
      setLoading(true);
    } else if (groups.length > 0) {
      loadAllExpenses();
    } else {
      setLoading(false);
    }
  }, [groups, groupsLoading]);

  const loadAllExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[useAllExpenses] Loading all expenses from groups:', groups.length);
      
      // Fetch expenses from all groups
      const allExpensesPromises = groups.map(group => 
        EvenlyBackendService.getGroupExpenses(group.id)
      );
      
      const allExpensesResults = await Promise.all(allExpensesPromises);
      
      // Flatten all expenses into a single array
      const allExpenses = allExpensesResults.flatMap(result => result.expenses);
      
      console.log('[useAllExpenses] Received expenses:', allExpenses);
      console.log('[useAllExpenses] Number of expenses:', allExpenses.length);
      setExpenses(allExpenses);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load expenses';
      console.error('[useAllExpenses] Error loading expenses:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('[useAllExpenses] Loading completed');
    }
  };

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
      setExpenses(prev => [newExpense, ...prev]);
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
