import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Group } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { CacheManager } from '../utils/cacheManager';
import { groupEvents, GROUP_EVENTS } from '../utils/groupEvents';
import { sessionEvents, SESSION_EVENTS } from '../utils/sessionEvents';
import { DataRefreshCoordinator } from '../utils/dataRefreshCoordinator';
import { useAuth } from '../contexts/AuthContext';

// Global state shared across all hook instances
let globalIsFirstFetch = true;
let globalLastFetchTime = 0;
let globalIsLoading = false; // Track if any instance is currently loading
let globalGroupsCache: Group[] = []; // Cache loaded groups
let globalFetchPromise: Promise<void> | null = null; // Share fetch promise across instances
const CACHE_DURATION = 60000; // 1 minute

export const useGroups = () => {
  const { authState } = useAuth();
  const [groups, setGroups] = useState<Group[]>(globalGroupsCache); // Initialize with cached data
  const [loading, setLoading] = useState(!globalGroupsCache.length); // Don't show loader if cache exists
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async (options: { silent?: boolean } = {}) => {
    try {
      const { silent = false } = options;

      // If there's already a fetch in progress, wait for it instead of starting a new one
      if (globalFetchPromise) {
        console.log('🔄 [useGroups] Waiting for existing fetch to complete...');
        await globalFetchPromise;
        setGroups([...globalGroupsCache]);
        setLoading(false);
        return;
      }

      // If we have recent cache data (< 5 seconds old), use it immediately
      const timeSinceLastFetch = Date.now() - globalLastFetchTime;
      if (globalGroupsCache.length >= 0 && timeSinceLastFetch < 5000 && !globalIsFirstFetch) {
        console.log('⚡ [useGroups] Using recent cache (age: ' + Math.round(timeSinceLastFetch/1000) + 's)');
        setGroups([...globalGroupsCache]);
        setLoading(false);
        return;
      }

      // Only show loader for non-silent refreshes
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      // Create a shared fetch promise to prevent duplicate fetches
      globalFetchPromise = (async () => {
        try {
          globalIsLoading = true;

          // Always bypass cache on first fetch to ensure fresh data on app reopen
          // After first fetch, use cache for better performance
          let cacheTTL: number;
          if (globalIsFirstFetch) {
            cacheTTL = 0; // Bypass cache - force fresh fetch
            globalIsFirstFetch = false;
            globalLastFetchTime = Date.now();
          } else {
            // Check if cache has expired (1 minute)
            const timeSinceLastFetch = Date.now() - globalLastFetchTime;
            if (timeSinceLastFetch > CACHE_DURATION) {
              cacheTTL = 0; // Cache expired - fetch fresh data silently
              globalLastFetchTime = Date.now();
            } else {
              // Use cache for subsequent fetches within 1 minute
              cacheTTL = CACHE_DURATION - timeSinceLastFetch;
            }
          }

          // Fetch groups with cache TTL (0 = bypass, >0 = use cache)
          const groupsData = await EvenlyBackendService.getGroups({
            cacheTTLMs: cacheTTL
          });

          console.log('✅ [useGroups] Fetched groups:', groupsData?.length || 0, 'groups');

          // Update global cache
          globalGroupsCache = groupsData;
          globalLastFetchTime = Date.now();

          // Force update by replacing the entire array - this ensures React detects the change
          setGroups(() => [...groupsData]);
        } finally {
          globalIsLoading = false;
          globalFetchPromise = null; // Clear the promise
        }
      })();

      await globalFetchPromise;
    } catch (err: any) {
      // If in offline mode (session expired), don't show error to user
      // They're still logged in with cached data
      if (err._offlineMode) {
        // Don't set error message - user is in offline mode
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load groups';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Wait for auth to be ready before loading data
  useEffect(() => {
    // Clear data when user logs out
    if (authState === 'unauthenticated') {
      setGroups([]);
      setLoading(true);
      setError(null);
      // Reset global state so next app reopen will bypass cache
      globalIsFirstFetch = true;
      globalGroupsCache = [];
      globalIsLoading = false;
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

    // Load groups immediately - first fetch will bypass cache
    loadGroups();
  }, [authState, loadGroups]);

  // Register with DataRefreshCoordinator
  useEffect(() => {
    const unregister = DataRefreshCoordinator.register(async () => {
      await loadGroups({ silent: true }); // Silent - automatic background coordination
    });

    return () => {
      unregister();
    };
  }, [loadGroups]);

  // Listen for group events to refresh when groups are created/updated/deleted from other screens
  useEffect(() => {
    const handleGroupsRefreshNeeded = () => {
      loadGroups({ silent: false }); // Show loader - user action (create/update/delete)
    };

    // Listen for token refresh events (backwards compatibility)
    const handleTokenRefreshed = () => {
      loadGroups({ silent: true }); // Silent - automatic background event
    };

    groupEvents.on(GROUP_EVENTS.GROUPS_REFRESH_NEEDED, handleGroupsRefreshNeeded);
    sessionEvents.on(SESSION_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);

    return () => {
      groupEvents.off(GROUP_EVENTS.GROUPS_REFRESH_NEEDED, handleGroupsRefreshNeeded);
      sessionEvents.off(SESSION_EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);
    };
  }, [loadGroups]);


  const totalGroups = useMemo(() => groups.length, [groups]);

  const totalGroupExpenses = useMemo(() => 
    groups.reduce((sum, group) => sum + group.memberCount, 0), // Using memberCount as proxy for activity
    [groups]
  );

  const averageGroupSize = useMemo(() => 
    groups.length > 0 ? groups.reduce((sum, group) => sum + group.memberCount, 0) / groups.length : 0, 
    [groups]
  );

  const activeGroups = useMemo(() => 
    groups.filter(group => {
      // Consider groups active if they have recent updates (within last 7 days)
      const daysSinceUpdate = (Date.now() - group.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    }), 
    [groups]
  );

  const createGroup = async (groupData: {
    name: string;
    description?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }) => {
    try {
      setError(null);
      const newGroup = await EvenlyBackendService.createGroup(groupData);
      setGroups(prev => [...prev, newGroup]);
      return newGroup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create group';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      setError(null);
      // This would typically involve adding the current user to the group
      // For now, we'll just reload the groups
      await loadGroups();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join group';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      setError(null);
      await EvenlyBackendService.removeGroupMember(groupId, 'current-user-id'); // Would need current user ID
      setGroups(prev => prev.filter(group => group.id !== groupId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave group';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateGroup = async (id: string, updates: {
    name?: string;
    description?: string;
    currency?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }) => {
    try {
      setError(null);
      const updatedGroup = await EvenlyBackendService.updateGroup(id, updates);
      setGroups(prev => prev.map(group => group.id === id ? updatedGroup : group));
      return updatedGroup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update group';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      setError(null);
      await EvenlyBackendService.deleteGroup(id);
      setGroups(prev => prev.filter(group => group.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete group';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Auto-refresh when cache expires (silent refresh during app use)
  useEffect(() => {
    if (authState !== 'authenticated') return;

    const checkCacheExpiry = () => {
      const timeSinceLastFetch = Date.now() - globalLastFetchTime;
      if (timeSinceLastFetch > CACHE_DURATION && !globalIsFirstFetch) {
        loadGroups({ silent: true }); // Silent - automatic cache expiry refresh
      }
    };

    // Check every 30 seconds if cache has expired
    const interval = setInterval(checkCacheExpiry, 30000);

    return () => clearInterval(interval);
  }, [authState, loadGroups]);

  return {
    groups,
    loading,
    error,
    totalGroups,
    totalGroupExpenses,
    averageGroupSize,
    activeGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    updateGroup,
    deleteGroup,
    refreshGroups: () => loadGroups({ silent: false }), // Explicit user refresh
  };
};
