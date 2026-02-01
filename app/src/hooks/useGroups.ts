import { useState, useEffect, useMemo, useCallback } from 'react';
import { Group } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { CacheManager } from '../utils/cacheManager';
import { groupEvents, GROUP_EVENTS } from '../utils/groupEvents';
import { sessionEvents, SESSION_EVENTS } from '../utils/sessionEvents';
import { DataRefreshCoordinator } from '../utils/dataRefreshCoordinator';
import { useAuth } from '../contexts/AuthContext';

export const useGroups = () => {
  const { authState } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use token's remaining lifetime as cache TTL
      const cacheTTL = await CacheManager.getCacheTTL();

      console.log('[useGroups] Loading with cache TTL:', cacheTTL);

      // Fetch groups with token-based cache TTL
      const groupsData = await EvenlyBackendService.getGroups({
        cacheTTLMs: cacheTTL
      });

      // Force update by replacing the entire array - this ensures React detects the change
      setGroups(() => [...groupsData]);
    } catch (err: any) {
      // If in offline mode (session expired), don't show error to user
      // They're still logged in with cached data
      if (err._offlineMode) {
        console.warn('[useGroups] ⚠️ Offline mode - using cached data');
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
    // Only load data when authenticated
    if (authState !== 'authenticated') {
      console.log('[useGroups] Auth not ready, skipping data load. State:', authState);
      return;
    }

    console.log('[useGroups] Auth ready, loading groups immediately...');
    // Load groups immediately - no connection test needed (adds delay)
    // The API call itself will fail if connection is down
    loadGroups();
  }, [authState, loadGroups]);

  // Register with DataRefreshCoordinator
  useEffect(() => {
    console.log('[useGroups] Registering with DataRefreshCoordinator');
    const unregister = DataRefreshCoordinator.register(async () => {
      console.log('[useGroups] Coordinator triggered refresh');
      await loadGroups();
    });

    return () => {
      console.log('[useGroups] Unregistering from DataRefreshCoordinator');
      unregister();
    };
  }, [loadGroups]);

  // Listen for group events to refresh when groups are created/updated/deleted from other screens
  useEffect(() => {
    const handleGroupsRefreshNeeded = () => {
      console.log('[useGroups] Groups refresh needed event received, refreshing...');
      loadGroups();
    };

    // Listen for token refresh events (backwards compatibility)
    const handleTokenRefreshed = () => {
      console.log('[useGroups] Token refreshed event received, reloading groups...');
      loadGroups();
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
    refreshGroups: loadGroups,
  };
};
