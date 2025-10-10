import { useState, useEffect, useMemo } from 'react';
import { Expense, EnhancedExpense } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';

export const useExpenses = (groupId?: string) => {
  const [expenses, setExpenses] = useState<EnhancedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      loadGroupExpenses(groupId);
    }
  }, [groupId]);

  const loadGroupExpenses = async (groupId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading expenses for group:', groupId);
      const { expenses: expensesData } = await EvenlyBackendService.getGroupExpenses(groupId);
      console.log('Expenses loaded successfully:', expensesData);
      console.log('First expense details:', expensesData[0] ? {
        id: expensesData[0].id,
        title: expensesData[0].title,
        totalAmount: expensesData[0].totalAmount,
        paidByDisplay: expensesData[0].paidByDisplay,
        netBalance: expensesData[0].netBalance
      } : 'No expenses');
      setExpenses(expensesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load expenses';
      setError(errorMessage);
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
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
      .slice(0, 5), 
    [expenses]
  );

  const addExpense = async (expenseData: {
    groupId: string;
    title: string;
    description?: string;
    totalAmount: string;
    paidBy?: string; // Optional - backend will set from authenticated user
    splitType: 'equal' | 'percentage' | 'shares' | 'exact';
    category: string;
    date: string;
    receipt?: string;
    splits?: { // Optional - backend will auto-generate
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
      console.error('Error creating expense:', err);
      throw new Error(errorMessage);
    }
  };

  const updateExpense = async (id: string, updates: {
    title?: string;
    description?: string;
    totalAmount?: string;
    category?: string;
    date?: string;
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
      const updatedExpense = await EvenlyBackendService.updateExpense(id, updates);
      setExpenses(prev => prev.map(expense => expense.id === id ? updatedExpense : expense));
      return updatedExpense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update expense';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      setError(null);
      await EvenlyBackendService.deleteExpense(id);
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete expense';
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
    updateExpense,
    deleteExpense,
    refreshExpenses: groupId ? () => loadGroupExpenses(groupId) : undefined,
  };
};
