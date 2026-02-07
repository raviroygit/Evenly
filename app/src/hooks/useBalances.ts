import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { UserBalance, SimplifiedDebt } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { CacheManager } from '../utils/cacheManager';
import { sessionEvents, SESSION_EVENTS } from '../utils/sessionEvents';
import { DataRefreshCoordinator } from '../utils/dataRefreshCoordinator';
import { OfflineDataCache } from '../utils/offlineDataCache';
import { useAuth } from '../contexts/AuthContext';

// Global state for user balances shared across all hook instances
let globalUserBalancesIsFirstFetch = true;
let globalUserBalancesLastFetchTime = 0;
let globalUserBalancesIsLoading = false;
let globalUserBalancesCache: any = null;
let globalUserBalancesFetchPromise: Promise<void> | null = null;
const USER_BALANCES_CACHE_DURATION = 60000; // 1 minute

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


      const [balancesData, debtsData] = await Promise.all([
        EvenlyBackendService.getGroupBalances(groupId, { cacheTTLMs: cacheTTL }),
        EvenlyBackendService.getSimplifiedDebts(groupId, { cacheTTLMs: cacheTTL }),
      ]);
      setBalances(balancesData);
      setSimplifiedDebts(debtsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balances');
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
  const { authState } = useAuth();
  const [balances, setBalances] = useState<UserBalance[]>(globalUserBalancesCache?.balances || []);
  const [netBalance, setNetBalance] = useState<{
    totalOwed: number;
    totalOwing: number;
    netBalance: number;
  } | null>(globalUserBalancesCache?.netBalance || null);
  const [loading, setLoading] = useState(!globalUserBalancesCache);
  const [error, setError] = useState<string | null>(null);

  const loadUserBalances = useCallback(async (options: { silent?: boolean } = {}) => {
    try {
      const { silent = false } = options;

      // If there's already a fetch in progress, wait for it
      if (globalUserBalancesFetchPromise) {
        console.log('🔄 [useUserBalances] Waiting for existing fetch...');
        await globalUserBalancesFetchPromise;
        if (globalUserBalancesCache) {
          setBalances(globalUserBalancesCache.balances);
          setNetBalance(globalUserBalancesCache.netBalance);
        }
        setLoading(false);
        return;
      }

      // If we have recent cache data (< 5 seconds old), use it immediately
      const timeSinceLastFetch = Date.now() - globalUserBalancesLastFetchTime;
      if (globalUserBalancesCache && timeSinceLastFetch < 5000 && !globalUserBalancesIsFirstFetch) {
        console.log('⚡ [useUserBalances] Using recent cache (age: ' + Math.round(timeSinceLastFetch/1000) + 's)');
        setBalances(globalUserBalancesCache.balances);
        setNetBalance(globalUserBalancesCache.netBalance);
        setLoading(false);
        return;
      }

      // Restore from offline cache when in-memory cache is empty (e.g. app reopen)
      if (!globalUserBalancesCache) {
        try {
          const cached = await OfflineDataCache.getUserBalances();
          if (cached && Array.isArray(cached.balances)) {
            globalUserBalancesCache = { balances: cached.balances, netBalance: cached.netBalance || null };
            setBalances(cached.balances);
            setNetBalance(cached.netBalance || null);
          }
        } catch {
          // ignore
        }
      }

      // Only show loader for non-silent refreshes
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      // Create a shared fetch promise
      globalUserBalancesFetchPromise = (async () => {
        try {
          globalUserBalancesIsLoading = true;

          // Always bypass cache on first fetch to ensure fresh data on app reopen
          // After first fetch, use cache for better performance
          let cacheTTL: number;
          if (globalUserBalancesIsFirstFetch) {
            cacheTTL = 0; // Bypass cache - force fresh fetch
            globalUserBalancesIsFirstFetch = false;
            globalUserBalancesLastFetchTime = Date.now();
          } else {
            // Check if cache has expired (1 minute)
            const timeSinceLastFetch = Date.now() - globalUserBalancesLastFetchTime;
            if (timeSinceLastFetch > USER_BALANCES_CACHE_DURATION) {
              cacheTTL = 0; // Cache expired - fetch fresh data silently
              globalUserBalancesLastFetchTime = Date.now();
            } else {
              // Use cache for subsequent fetches within 1 minute
              cacheTTL = USER_BALANCES_CACHE_DURATION - timeSinceLastFetch;
            }
          }

          const [balancesData, netBalanceData] = await Promise.all([
            EvenlyBackendService.getUserBalances({ cacheTTLMs: cacheTTL }),
            EvenlyBackendService.getUserNetBalance({ cacheTTLMs: cacheTTL }),
          ]);

          console.log('✅ [useUserBalances] Fetched balances:', {
            balances: balancesData?.length || 0,
            netBalance: netBalanceData
          });

          // Update global cache
          globalUserBalancesCache = {
            balances: balancesData,
            netBalance: netBalanceData
          };
          globalUserBalancesLastFetchTime = Date.now();
          await OfflineDataCache.setUserBalances({ balances: balancesData, netBalance: netBalanceData });

          setBalances(balancesData);
          setNetBalance(netBalanceData);
        } finally {
          globalUserBalancesIsLoading = false;
          globalUserBalancesFetchPromise = null;
        }
      })();

      await globalUserBalancesFetchPromise;
    } catch (err: any) {
      // If in offline mode (session expired), don't show error to user
      if (err._offlineMode) {
        // Don't set error message - user is in offline mode
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load user balances');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Wait for auth to be ready before loading data
  useEffect(() => {
    // Clear data when user logs out
    if (authState === 'unauthenticated') {
      setBalances([]);
      setNetBalance(null);
      setLoading(true);
      setError(null);
      // Reset global state so next app reopen will bypass cache
      globalUserBalancesIsFirstFetch = true;
      globalUserBalancesCache = null;
      globalUserBalancesIsLoading = false;
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

    // Load balances immediately - first fetch will bypass cache
    loadUserBalances();
  }, [authState, loadUserBalances]);

  // Register with DataRefreshCoordinator
  useEffect(() => {
    const unregister = DataRefreshCoordinator.register(async () => {
      await loadUserBalances({ silent: true }); // Silent - automatic background coordination
    });

    return () => {
      unregister();
    };
  }, [loadUserBalances]);

  // Listen for token refresh events (backwards compatibility)
  useEffect(() => {
    const handleTokenRefreshed = () => {
      loadUserBalances({ silent: true }); // Silent - automatic background event
    };

    sessionEvents.on(SESSION_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);

    return () => {
      sessionEvents.off(SESSION_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);
    };
  }, [loadUserBalances]);

  // Auto-refresh when cache expires (silent refresh during app use)
  useEffect(() => {
    if (authState !== 'authenticated') return;

    const checkCacheExpiry = () => {
      const timeSinceLastFetch = Date.now() - globalUserBalancesLastFetchTime;
      if (timeSinceLastFetch > USER_BALANCES_CACHE_DURATION && !globalUserBalancesIsFirstFetch) {
        loadUserBalances({ silent: true }); // Silent - automatic cache expiry refresh
      }
    };

    // Check every 30 seconds if cache has expired
    const interval = setInterval(checkCacheExpiry, 30000);

    return () => clearInterval(interval);
  }, [authState, loadUserBalances]);

  return {
    balances,
    netBalance,
    loading,
    error,
    refreshUserBalances: () => loadUserBalances({ silent: false }), // Explicit user refresh
  };
};
