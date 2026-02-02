import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { UserBalance, SimplifiedDebt } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { CacheManager } from '../utils/cacheManager';
import { sessionEvents, SESSION_EVENTS } from '../utils/sessionEvents';
import { DataRefreshCoordinator } from '../utils/dataRefreshCoordinator';
import { useAuth } from '../contexts/AuthContext';

// Global state for user balances shared across all hook instances
let globalUserBalancesIsFirstFetch = true;
let globalUserBalancesLastFetchTime = 0;
let globalUserBalancesIsLoading = false;
let globalUserBalancesCache: any = null;
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

      // If another instance is already loading, wait and use cached data
      if (globalUserBalancesIsLoading && !globalUserBalancesIsFirstFetch) {
        console.log('[useUserBalances] Another instance is loading - waiting for cache...');

        // Wait for the other instance to finish loading (max 5 seconds)
        let attempts = 0;
        while (globalUserBalancesIsLoading && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        // Use the cached data that was just loaded
        if (globalUserBalancesCache) {
          console.log('[useUserBalances] Using freshly loaded cache');
          setBalances(globalUserBalancesCache.balances);
          setNetBalance(globalUserBalancesCache.netBalance);
        } else {
          console.log('[useUserBalances] Cache still empty after wait - force loading');
          // Cache is still empty, don't skip - continue to load below
        }
        setLoading(false);

        // Only return if we have cache data, otherwise continue to load
        if (globalUserBalancesCache) {
          return;
        }
      }

      // Only show loader for non-silent refreshes AND if this is the first instance loading
      if (!silent && !globalUserBalancesIsLoading) {
        setLoading(true);
      }
      setError(null);
      globalUserBalancesIsLoading = true;

      // Always bypass cache on first fetch to ensure fresh data on app reopen
      // After first fetch, use cache for better performance
      let cacheTTL: number;
      if (globalUserBalancesIsFirstFetch) {
        cacheTTL = 0; // Bypass cache - force fresh fetch
        console.log('[useUserBalances] 🔄 First fetch - bypassing cache for fresh data');
        globalUserBalancesIsFirstFetch = false;
        globalUserBalancesLastFetchTime = Date.now();
      } else {
        // Check if cache has expired (1 minute)
        const timeSinceLastFetch = Date.now() - globalUserBalancesLastFetchTime;
        if (timeSinceLastFetch > USER_BALANCES_CACHE_DURATION) {
          cacheTTL = 0; // Cache expired - fetch fresh data silently
          console.log('[useUserBalances] 🔄 Cache expired - silent refresh');
          globalUserBalancesLastFetchTime = Date.now();
        } else {
          // Use cache for subsequent fetches within 1 minute
          cacheTTL = USER_BALANCES_CACHE_DURATION - timeSinceLastFetch;
          console.log('[useUserBalances] Loading with cache TTL:', cacheTTL);
        }
      }

      const [balancesData, netBalanceData] = await Promise.all([
        EvenlyBackendService.getUserBalances({ cacheTTLMs: cacheTTL }),
        EvenlyBackendService.getUserNetBalance({ cacheTTLMs: cacheTTL }),
      ]);

      console.log('[useUserBalances] ✅ Balances loaded:', {
        balancesCount: balancesData.length,
        silent,
        netBalance: netBalanceData
      });

      // Update global cache
      globalUserBalancesCache = {
        balances: balancesData,
        netBalance: netBalanceData
      };

      setBalances(balancesData);
      setNetBalance(netBalanceData);
    } catch (err: any) {
      // If in offline mode (session expired), don't show error to user
      if (err._offlineMode) {
        console.warn('[useUserBalances] ⚠️ Offline mode - using cached data');
        // Don't set error message - user is in offline mode
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load user balances');
        console.error('Error loading user balances:', err);
      }
    } finally {
      globalUserBalancesIsLoading = false;
      setLoading(false);
    }
  }, []);

  // Wait for auth to be ready before loading data
  useEffect(() => {
    // Clear data when user logs out
    if (authState === 'unauthenticated') {
      console.log('[useUserBalances] User logged out - clearing balances');
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
      console.log('[useUserBalances] Auth initializing - waiting...');
      return;
    }

    // Only load data when authenticated
    if (authState !== 'authenticated') {
      console.log('[useUserBalances] Auth not ready, skipping data load. State:', authState);
      return;
    }

    console.log('[useUserBalances] Auth ready, loading balances...', {
      hasCache: !!globalUserBalancesCache,
      isFirstFetch: globalUserBalancesIsFirstFetch
    });
    // Load balances immediately - first fetch will bypass cache
    loadUserBalances();
  }, [authState, loadUserBalances]);

  // Register with DataRefreshCoordinator
  useEffect(() => {
    console.log('[useUserBalances] Registering with DataRefreshCoordinator');
    const unregister = DataRefreshCoordinator.register(async () => {
      console.log('[useUserBalances] Coordinator triggered refresh');
      await loadUserBalances({ silent: true }); // Silent - automatic background coordination
    });

    return () => {
      console.log('[useUserBalances] Unregistering from DataRefreshCoordinator');
      unregister();
    };
  }, [loadUserBalances]);

  // Listen for token refresh events (backwards compatibility)
  useEffect(() => {
    const handleTokenRefreshed = () => {
      console.log('[useUserBalances] Token refreshed event received, reloading balances...');
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
        console.log('[useUserBalances] Cache expired - triggering silent refresh');
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
