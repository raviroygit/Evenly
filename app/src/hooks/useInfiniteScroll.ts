import { useState, useCallback, useRef, useEffect } from 'react';

interface UseInfiniteScrollOptions {
  initialPage?: number;
  pageSize?: number;
  hasMore?: boolean;
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  totalCount: number;
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
}

export function useInfiniteScroll<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean; totalCount?: number }>,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn<T> {
  const {
    initialPage = 1,
    pageSize = 10,
    hasMore: initialHasMore = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(initialPage);

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

      if (result.totalCount !== undefined) {
        setTotalCount(result.totalCount);
      }

      setHasMore(result.hasMore);
      setPage(pageNum);
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
    setTotalCount(0);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setError(null);
    setLoading(false);
    setLoadingMore(false);
    isLoadingRef.current = false;
  }, [initialPage, initialHasMore]);

  // Auto-load initial data
  useEffect(() => {
    loadData(initialPage, false);
  }, [loadData, initialPage]);

  return {
    data,
    totalCount,
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
  };
}
