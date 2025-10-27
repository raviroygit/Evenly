import { useCallback } from 'react';
import { Group } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { useInfiniteScroll } from './useInfiniteScroll';

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
      return newGroup;
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
    setData,
    appendData,
    reset,
  };
};
