import { useCallback } from 'react';
import { Group } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { useInfiniteScroll } from './useInfiniteScroll';

export const useGroupsInfinite = () => {
  const fetchGroups = useCallback(async (page: number, pageSize: number) => {
    try {
      // For now, we'll simulate pagination by slicing the full groups list
      // In a real implementation, the backend would support pagination
      const allGroups = await EvenlyBackendService.getGroups();
      
      // Add mock data for better testing
      const mockGroups = [
        {
          id: 'mock-1',
          name: '🎯 Weekend Trip (TEST)',
          description: 'Mock group for testing infinite scroll',
          memberCount: 4,
          defaultSplitType: 'equal' as const,
          currency: 'INR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-2',
          name: '🍽️ Office Lunch (TEST)',
          description: 'Mock group for testing infinite scroll',
          memberCount: 6,
          defaultSplitType: 'equal' as const,
          currency: 'INR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-3',
          name: '🎬 Movie Night (TEST)',
          description: 'Mock group for testing infinite scroll',
          memberCount: 3,
          defaultSplitType: 'equal' as const,
          currency: 'INR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-4',
          name: '🛒 Grocery Shopping (TEST)',
          description: 'Mock group for testing infinite scroll',
          memberCount: 2,
          defaultSplitType: 'equal' as const,
          currency: 'INR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'mock-5',
          name: '🎉 Birthday Party (TEST)',
          description: 'Mock group for testing infinite scroll',
          memberCount: 8,
          defaultSplitType: 'equal' as const,
          currency: 'INR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Combine real and mock data
      const combinedGroups = [...allGroups, ...mockGroups];
      
      console.log('[useGroupsInfinite] Real groups:', allGroups.length);
      console.log('[useGroupsInfinite] Mock groups:', mockGroups.length);
      console.log('[useGroupsInfinite] Combined groups:', combinedGroups.length);
      console.log('[useGroupsInfinite] Page:', page, 'PageSize:', pageSize);
      
      // Simulate pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedGroups = combinedGroups.slice(startIndex, endIndex);
      
      console.log('[useGroupsInfinite] Paginated groups:', paginatedGroups.length);
      console.log('[useGroupsInfinite] Group names:', paginatedGroups.map(g => g.name));
      
      const hasMore = endIndex < combinedGroups.length;
      
      return {
        data: paginatedGroups,
        hasMore,
        totalCount: combinedGroups.length,
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
