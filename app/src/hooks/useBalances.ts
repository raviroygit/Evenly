import { useState, useEffect, useMemo } from 'react';
import { UserBalance, SimplifiedDebt } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { CacheManager } from '../utils/cacheManager';
import { sessionEvents, SESSION_EVENTS } from '../utils/sessionEvents';

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

  // Listen for token refresh events to reload data with fresh token
  useEffect(() => {
    const handleTokenRefreshed = () => {
      console.log('[useBalances] Token refreshed event received, reloading balances...');
      if (groupId) {
        loadGroupBalances(groupId);
      }
    };

    sessionEvents.on(SESSION_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);

    return () => {
      sessionEvents.off(SESSION_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);
    };
  }, [groupId]);

  const loadGroupBalances = async (groupId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Use token's remaining lifetime as cache TTL
      const cacheTTL = await CacheManager.getCacheTTL();

      console.log('[useBalances] Loading group balances with cache TTL:', cacheTTL);

      const [balancesData, debtsData] = await Promise.all([
        EvenlyBackendService.getGroupBalances(groupId, { cacheTTLMs: cacheTTL }),
        EvenlyBackendService.getSimplifiedDebts(groupId, { cacheTTLMs: cacheTTL }),
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

  // Listen for token refresh events to reload data with fresh token
  useEffect(() => {
    const handleTokenRefreshed = () => {
      console.log('[useUserBalances] Token refreshed event received, reloading balances...');
      loadUserBalances();
    };

    sessionEvents.on(SESSION_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);

    return () => {
      sessionEvents.off(SESSION_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);
    };
  }, []);

  const loadUserBalances = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use token's remaining lifetime as cache TTL
      const cacheTTL = await CacheManager.getCacheTTL();

      console.log('[useUserBalances] Loading with cache TTL:', cacheTTL);

      const [balancesData, netBalanceData] = await Promise.all([
        EvenlyBackendService.getUserBalances({ cacheTTLMs: cacheTTL }),
        EvenlyBackendService.getUserNetBalance({ cacheTTLMs: cacheTTL }),
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
