import { useState, useEffect, useMemo } from 'react';
import { UserBalance, SimplifiedDebt } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';

export const useBalances = (groupId?: string) => {
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      loadGroupBalances(groupId);
    }
  }, [groupId]);

  const loadGroupBalances = async (groupId: string) => {
    try {
      setLoading(true);
      setError(null);
      const [balancesData, debtsData] = await Promise.all([
        EvenlyBackendService.getGroupBalances(groupId),
        EvenlyBackendService.getSimplifiedDebts(groupId),
      ]);
      setBalances(balancesData);
      setSimplifiedDebts(debtsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balances');
      console.error('Error loading balances:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalOwed = useMemo(() => 
    balances
      .filter(balance => balance.balance > 0)
      .reduce((sum, balance) => sum + balance.balance, 0), 
    [balances]
  );

  const totalOwing = useMemo(() => 
    balances
      .filter(balance => balance.balance < 0)
      .reduce((sum, balance) => sum + Math.abs(balance.balance), 0), 
    [balances]
  );

  const netBalance = useMemo(() => totalOwed - totalOwing, [totalOwed, totalOwing]);

  const creditors = useMemo(() => 
    balances.filter(balance => balance.balance > 0), 
    [balances]
  );

  const debtors = useMemo(() => 
    balances.filter(balance => balance.balance < 0), 
    [balances]
  );

  const isBalanced = useMemo(() => 
    Math.abs(netBalance) < 0.01, 
    [netBalance]
  );

  return {
    balances,
    simplifiedDebts,
    loading,
    error,
    totalOwed,
    totalOwing,
    netBalance,
    creditors,
    debtors,
    isBalanced,
    refreshBalances: groupId ? () => loadGroupBalances(groupId) : undefined,
  };
};

export const useUserBalances = () => {
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [netBalance, setNetBalance] = useState<{
    totalOwed: number;
    totalOwing: number;
    netBalance: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserBalances();
  }, []);

  const loadUserBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      const [balancesData, netBalanceData] = await Promise.all([
        EvenlyBackendService.getUserBalances(),
        EvenlyBackendService.getUserNetBalance(),
      ]);
      setBalances(balancesData);
      setNetBalance(netBalanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user balances');
      console.error('Error loading user balances:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    balances,
    netBalance,
    loading,
    error,
    refreshUserBalances: loadUserBalances,
  };
};
