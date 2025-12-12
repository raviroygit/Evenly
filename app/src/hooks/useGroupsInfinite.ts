import { useCallback } from 'react';
import { Group } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { useInfiniteScroll } from './useInfiniteScroll';
import { emitGroupCreated, emitGroupUpdated } from '../utils/groupEvents';

export const useGroupsInfinite = () => {
  const fetchGroups = useCallback(async (page: number, pageSize: number) => {
    try {
      // Get groups from backend with pagination support
      const allGroups = await EvenlyBackendService.getGroups();
      
      // Simulate pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedGroups = allGroups.slice(startIndex, endIndex);
      
      const hasMore = endIndex < allGroups.length;
      
      return {
        data: paginatedGroups,
        hasMore,
        totalCount: allGroups.length,
      };
    } catch (error) {
      throw new Error('Failed to load groups');
    }
  }, []);

  const {
    data: groups,
    loading,
    loadingMore,
    error,
    hasMore,
    page,
    loadMore,
    refresh,
    setData,
    appendData,
    reset,
  } = useInfiniteScroll<Group>(fetchGroups, {
    initialPage: 1,
    pageSize: 3, // Page size for testing infinite scroll
  });

  const createGroup = useCallback(async (groupData: {
    name: string;
    description?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }) => {
    try {
      const newGroup = await EvenlyBackendService.createGroup(groupData);
      // Add the new group to the beginning of the list
      setData([newGroup, ...groups]);
      // Emit event to notify other screens (like HomeScreen)
      emitGroupCreated(newGroup);
      return newGroup;
    } catch (error) {
      throw error;
    }
  }, [groups, setData]);

  const updateGroup = useCallback(async (groupId: string, groupData: {
    name: string;
    description?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }) => {
    try {
      const updatedGroup = await EvenlyBackendService.updateGroup(groupId, groupData);
      // Update the group in the list
      setData(groups.map(group => group.id === groupId ? updatedGroup : group));
      // Emit event to notify other screens
      emitGroupUpdated(updatedGroup);
      return updatedGroup;
    } catch (error) {
      throw error;
    }
  }, [groups, setData]);

  const deleteGroup = useCallback(async (groupId: string) => {
    try {
      await EvenlyBackendService.deleteGroup(groupId);
      // Remove the group from the list
      setData(groups.filter(group => group.id !== groupId));
    } catch (error) {
      throw error;
    }
  }, [groups, setData]);

  return {
    groups,
    loading,
    loadingMore,
    error,
    hasMore,
    page,
    loadMore,
    refresh,
    createGroup,
    updateGroup,
    deleteGroup,
    setData,
    appendData,
    reset,
  };
};
