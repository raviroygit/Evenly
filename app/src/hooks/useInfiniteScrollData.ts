import { useState, useCallback, useRef, useEffect } from 'react';

interface UseInfiniteScrollDataOptions {
  initialPage?: number;
  pageSize?: number;
  hasMore?: boolean;
  autoLoad?: boolean;
}

interface UseInfiniteScrollDataReturn<T> {
  data: T[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  loadMore: () => void;
  refresh: () => void;
  setData: (data: T[]) => void;
  appendData: (newData: T[]) => void;
  reset: () => void;
  totalCount: number;
}

export function useInfiniteScrollData<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean; totalCount?: number }>,
  options: UseInfiniteScrollDataOptions = {}
): UseInfiniteScrollDataReturn<T> {
  const {
    initialPage = 1,
    pageSize = 10,
    hasMore: initialHasMore = true,
    autoLoad = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(0);
  
  const isLoadingRef = useRef(false);

  const loadData = useCallback(async (pageNum: number, isLoadMore: boolean = false) => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      const result = await fetchFunction(pageNum, pageSize);
      
      if (isLoadMore) {
        setData(prev => [...prev, ...result.data]);
      } else {
        setData(result.data);
      }
      
      setHasMore(result.hasMore);
      setPage(pageNum);
      setTotalCount(result.totalCount || result.data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [fetchFunction, pageSize]);

  const loadMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      loadData(page + 1, true);
    }
  }, [loadData, page, loadingMore, loading, hasMore]);

  const refresh = useCallback(() => {
    setPage(initialPage);
    setHasMore(initialHasMore);
    loadData(initialPage, false);
  }, [loadData, initialPage, initialHasMore]);

  const appendData = useCallback((newData: T[]) => {
    setData(prev => [...prev, ...newData]);
  }, []);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setError(null);
    setLoading(false);
    setLoadingMore(false);
    setTotalCount(0);
    isLoadingRef.current = false;
  }, [initialPage, initialHasMore]);

  // Auto-load initial data
  useEffect(() => {
    if (autoLoad) {
      loadData(initialPage, false);
    }
  }, [autoLoad, loadData, initialPage]);

  return {
    data,
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
    totalCount,
  };
}
