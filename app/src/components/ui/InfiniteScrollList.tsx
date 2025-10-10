import React, { useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface InfiniteScrollListProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  style?: any;
  contentContainerStyle?: any;
  showsVerticalScrollIndicator?: boolean;
  onEndReachedThreshold?: number;
}

export function InfiniteScrollList<T>({
  data,
  renderItem,
  keyExtractor,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onRefresh,
  refreshing = false,
  emptyMessage = 'No items found',
  loadingMessage = 'Loading...',
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  onEndReachedThreshold = 0.1,
}: InfiniteScrollListProps<T>) {
  const { colors } = useTheme();

  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loadingMore, loading, onLoadMore]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          Loading more...
        </Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {loadingMessage}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          {emptyMessage}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={style}
      contentContainerStyle={[
        styles.contentContainer,
        data.length === 0 && styles.emptyContentContainer,
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  footerText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
