import { useState, useEffect, useMemo } from 'react';
import { Group } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { groupEvents, GROUP_EVENTS } from '../utils/groupEvents';

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test connection first
    EvenlyBackendService.testConnection().then(isConnected => {
      if (isConnected) {
        loadGroups();
      } else {
        setError('Cannot connect to backend server');
        setLoading(false);
      }
    });
    
    // Listen for group events to refresh when groups are created/updated/deleted from other screens
    const handleGroupsRefreshNeeded = () => {
      console.log('[useGroups] Groups refresh needed event received, refreshing...');
      loadGroups();
    };
    
    groupEvents.on(GROUP_EVENTS.GROUPS_REFRESH_NEEDED, handleGroupsRefreshNeeded);
    
    return () => {
      groupEvents.off(GROUP_EVENTS.GROUPS_REFRESH_NEEDED, handleGroupsRefreshNeeded);
    };
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      // Force fresh data by not using cache
      const groupsData = await EvenlyBackendService.getGroups({ cacheTTLMs: 0 });
      // Force update by replacing the entire array - this ensures React detects the change
      setGroups(() => [...groupsData]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load groups';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
