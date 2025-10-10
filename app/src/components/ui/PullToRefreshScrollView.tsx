import React, { useRef } from 'react';
import { ScrollView, StyleSheet, RefreshControl } from 'react-native';

interface PullToRefreshScrollViewProps {
  children: React.ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
  onScroll?: (event: any) => void;
  onScrollBeginDrag?: (event: any) => void;
  onScrollEndDrag?: (event: any) => void;
  contentContainerStyle?: any;
  style?: any;
  showsVerticalScrollIndicator?: boolean;
}

export const PullToRefreshScrollView: React.FC<PullToRefreshScrollViewProps> = ({
  children,
  refreshing,
  onRefresh,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  contentContainerStyle,
  style,
  showsVerticalScrollIndicator = false,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    // Call the passed onScroll handler
    if (onScroll) {
      onScroll(event);
    }
  };

  const handleScrollBeginDrag = (event: any) => {
    // Call the passed onScrollBeginDrag handler
    if (onScrollBeginDrag) {
      onScrollBeginDrag(event);
    }
  };

  const handleScrollEndDrag = (event: any) => {
    // Call the passed onScrollEndDrag handler
    if (onScrollEndDrag) {
      onScrollEndDrag(event);
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.scrollView, style]}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      onScroll={handleScroll}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={handleScrollEndDrag}
      scrollEventThrottle={16}
      bounces={true}
      alwaysBounceVertical={true}
      decelerationRate="normal"
      scrollIndicatorInsets={{ right: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={onRefresh}
          progressBackgroundColor="transparent"
          tintColor="transparent"
          title=""
          titleColor="transparent"
        />
      }
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});
