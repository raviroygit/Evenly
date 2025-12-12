import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { ResponsiveLiquidGlassCard } from './ResponsiveLiquidGlassCard';
import { GlassListCard } from './GlassListCard';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  children?: React.ReactNode;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  children,
}) => {
  const { colors, theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    ],
  });

  if (children) {
    return (
      <Animated.View style={[styles.container, { backgroundColor }, style]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; width?: number | string }> = ({
  lines = 1,
  width = '100%',
}) => (
  <View style={styles.textContainer}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        height={16}
        width={index === lines - 1 ? '80%' : width}
        borderRadius={8}
        style={[styles.textLine, { marginBottom: index < lines - 1 ? 8 : 0 }]}
      />
    ))}
  </View>
);

export const SkeletonCard: React.FC<{ height?: number }> = ({ height = 120 }) => (
  <SkeletonLoader
    height={height}
    borderRadius={16}
    style={styles.card}
  />
);

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <SkeletonLoader
    width={size}
    height={size}
    borderRadius={size / 2}
    style={styles.avatar}
  />
);

export const SkeletonButton: React.FC<{ width?: number | string; height?: number }> = ({
  width = 120,
  height = 40,
}) => (
  <SkeletonLoader
    width={width}
    height={height}
    borderRadius={20}
    style={styles.button}
  />
);

// Skeleton for expense items - EXACT match to ExpenseItem structure
export const SkeletonExpenseItem: React.FC = () => {
  return (
    <ResponsiveLiquidGlassCard
      padding={{
        small: 12,
        medium: 16,
        large: 20,
        tablet: 24,
      }}
      marginBottom={8}
      borderRadius={{
        small: 12,
        medium: 14,
        large: 16,
        tablet: 18,
      }}
      glassEffectStyle="thick"
      isInteractive={true}
      style={styles.expenseCardOverrides}
    >
      <View style={styles.expenseContent}>
        {/* Row 1: Title and Status Text */}
        <View style={styles.expenseRow}>
          <SkeletonLoader width={200} height={16} borderRadius={8} style={styles.expenseTitle} />
          <View style={styles.expenseRightSection}>
            <SkeletonLoader width={80} height={14} borderRadius={6} />
          </View>
        </View>
        
        {/* Row 2: Paid By and Amount */}
        <View style={styles.expenseRow}>
          <SkeletonLoader width={150} height={14} borderRadius={6} style={styles.expensePaidBy} />
          <View style={styles.expenseRightSection}>
            <SkeletonLoader width={60} height={14} borderRadius={6} />
          </View>
        </View>

        {/* Row 3: Group Badge - EXACT match to actual ExpenseItem */}
        <View style={styles.expenseGroupBadgeContainer}>
          <View style={styles.expenseGroupBadge}>
            <SkeletonLoader width={60} height={12} borderRadius={6} />
          </View>
        </View>
      </View>
    </ResponsiveLiquidGlassCard>
  );
};

// Skeleton for expense list
export const SkeletonExpenseList: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.expenseList, { backgroundColor: colors.background }]}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonExpenseItem key={index} />
      ))}
    </View>
  );
};

// Skeleton for group items - EXACT match to GroupItem structure
export const SkeletonGroupItem: React.FC = () => {
  return (
    <ResponsiveLiquidGlassCard
      padding={{
        small: 12,
        medium: 16,
        large: 20,
        tablet: 24,
      }}
      marginBottom={8}
      borderRadius={{
        small: 12,
        medium: 14,
        large: 16,
        tablet: 18,
      }}
      glassEffectStyle="thick"
      isInteractive={true}
      style={styles.groupCardOverrides}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupIcon}>
          <SkeletonLoader width={20} height={20} borderRadius={10} />
        </View>
        <View style={styles.groupInfo}>
          <SkeletonLoader width={140} height={16} borderRadius={8} style={styles.groupName} />
          <SkeletonLoader width={120} height={14} borderRadius={6} style={styles.groupMembers} />
          <SkeletonLoader width={100} height={12} borderRadius={6} style={styles.groupDescription} />
        </View>
        <View style={styles.groupAmount}>
          <SkeletonLoader width={50} height={16} borderRadius={8} />
        </View>
      </View>
      
      <View style={styles.groupActions}>
        <SkeletonLoader width={70} height={32} borderRadius={8} />
      </View>
    </ResponsiveLiquidGlassCard>
  );
};

// Skeleton for group list - Just the group items, no header (header is handled by parent GlassListCard)
export const SkeletonGroupList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={styles.groupList}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonGroupItem key={index} />
    ))}
  </View>
);

// Skeleton for dashboard stats using EXACT same structure as actual cards
export const SkeletonDashboardStats: React.FC = () => {
  const { theme } = useTheme();
  
  const SkeletonStatCard: React.FC<{ index: number }> = ({ index }) => (
    <View
      key={index}
      style={{
        ...styles.statCard,
        backgroundColor: theme === 'dark' 
          ? '#2C2C2C' 
          : '#FFFFFF',
        borderColor: theme === 'dark' 
          ? '#404040' 
          : '#E0E0E0',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginHorizontal: '1.5%',
        marginBottom: 12,
      }}
    >
      <View style={styles.statContent}>
        <View style={styles.statHeader}>
          <SkeletonLoader
            height={12}
            width="60%"
            borderRadius={6}
          />
          {/* Optional trend badge skeleton - only show sometimes */}
          {index % 3 === 0 && (
            <SkeletonLoader
              height={16}
              width={40}
              borderRadius={8}
            />
          )}
        </View>
        
        <SkeletonLoader
          height={24}
          width="80%"
          borderRadius={8}
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.dashboardStatsContainer}>
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonStatCard key={index} index={index} />
      ))}
    </View>
  );
};

// Skeleton for activity items - EXACT match to RecentActivity structure
export const SkeletonActivityItem: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View style={{
      ...styles.activityItem,
      backgroundColor: theme === 'dark' 
        ? '#1A1A1A' 
        : '#F8F8F8',
      borderColor: theme === 'dark' 
        ? '#333333' 
        : '#E0E0E0',
    }}>
      <View style={styles.activityIcon}>
        <SkeletonLoader width={24} height={24} borderRadius={12} />
      </View>
      
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <SkeletonLoader width={180} height={16} borderRadius={8} style={styles.activityTitle} />
          <SkeletonLoader width={60} height={16} borderRadius={8} />
        </View>
        
        <SkeletonLoader width={120} height={14} borderRadius={6} style={styles.activityDescription} />
        
        <View style={styles.activityFooter}>
          <SkeletonLoader width={80} height={12} borderRadius={6} />
          <SkeletonLoader width={60} height={16} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};

// Skeleton for activity list
export const SkeletonActivityList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={styles.activityList}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonActivityItem key={index} />
    ))}
  </View>
);

// Skeleton for Recent Activity using EXACT same GlassListCard structure
export const SkeletonRecentActivity: React.FC = () => {
  return (
    <GlassListCard
      title="Recent Activity"
      subtitle="Loading activities..."
      contentGap={8}
    >
      <SkeletonActivityList count={3} />
    </GlassListCard>
  );
};

// Skeleton for expense summary using EXACT same ResponsiveLiquidGlassCard structure
export const SkeletonExpenseSummary: React.FC = () => {
  const { theme } = useTheme();
  
  // Calculate EXACT same card width as actual ExpenseSummary
  const screenWidth = Dimensions.get('window').width;
  const horizontalPadding = 40; // 20px on each side (total screen padding)
  const cardGaps = 24; // 12px gap between each card (2 gaps for 3 cards)
  const availableWidth = screenWidth - horizontalPadding - cardGaps;
  const cardWidth = Math.floor(availableWidth / 3); // Divide by 3 for 3 cards
  
  const SkeletonExpenseCard: React.FC = () => (
    <ResponsiveLiquidGlassCard
      padding={{
        small: 12,
        medium: 16,
        large: 20,
        tablet: 24,
      }}
      borderRadius={{
        small: 12,
        medium: 14,
        large: 16,
        tablet: 18,
      }}
      glassEffectStyle="thick"
      isInteractive={false}
      style={{ 
        ...styles.expenseSummaryCard, 
        alignItems: 'center', 
        width: cardWidth, 
        minHeight: 100,
        justifyContent: 'center'
      }}
    >
      <SkeletonLoader
        height={12}
        width="80%"
        borderRadius={6}
        style={{ marginBottom: 6, opacity: 0.8 }}
      />
      <SkeletonLoader
        height={18}
        width="60%"
        borderRadius={8}
      />
    </ResponsiveLiquidGlassCard>
  );

  return (
    <View style={styles.expenseSummaryContainer}>
      <SkeletonExpenseCard />
      <SkeletonExpenseCard />
      <SkeletonExpenseCard />
    </View>
  );
};

// Skeleton for GlassStatCard using same ResponsiveLiquidGlassCard structure
export const SkeletonGlassStatCard: React.FC<{
  title?: boolean;
  subtitle?: boolean;
  statsCount?: number;
  padding?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginBottom?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  borderRadius?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  style?: any;
}> = ({
  title = true,
  subtitle = false,
  statsCount = 3,
  padding = {
    small: 20,
    medium: 24,
    large: 28,
    tablet: 32,
  },
  marginBottom = 24,
  borderRadius = {
    small: 16,
    medium: 18,
    large: 20,
    tablet: 22,
  },
  style,
}) => {
  return (
    <ResponsiveLiquidGlassCard
      padding={padding}
      marginBottom={marginBottom}
      borderRadius={borderRadius}
      glassEffectStyle="thick"
      isInteractive={false}
      style={style}
    >
      {title && (
        <View style={styles.glassStatHeader}>
          <SkeletonLoader
            height={18}
            width="60%"
            borderRadius={8}
            style={{ marginBottom: 4 }}
          />
          {subtitle && (
            <SkeletonLoader
              height={14}
              width="40%"
              borderRadius={6}
            />
          )}
        </View>
      )}
      
      <View style={styles.glassStatsContainer}>
        {Array.from({ length: statsCount }).map((_, index) => (
          <View key={index} style={styles.glassStatItem}>
            <SkeletonLoader
              height={20}
              width="80%"
              borderRadius={8}
              style={{ marginBottom: 4 }}
            />
            <SkeletonLoader
              height={14}
              width="60%"
              borderRadius={6}
            />
          </View>
        ))}
      </View>
    </ResponsiveLiquidGlassCard>
  );
};

// Skeleton for GlassInfoCard using same ResponsiveLiquidGlassCard structure
export const SkeletonGlassInfoCard: React.FC<{
  title?: boolean;
  subtitle?: boolean;
  itemsCount?: number;
  padding?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginBottom?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  borderRadius?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  style?: any;
}> = ({
  title = true,
  subtitle = false,
  itemsCount = 4,
  padding = {
    small: 16,
    medium: 20,
    large: 24,
    tablet: 28,
  },
  marginBottom = 24,
  borderRadius = {
    small: 16,
    medium: 18,
    large: 20,
    tablet: 22,
  },
  style,
}) => {
  return (
    <ResponsiveLiquidGlassCard
      padding={padding}
      marginBottom={marginBottom}
      borderRadius={borderRadius}
      glassEffectStyle="thick"
      isInteractive={false}
      style={style}
    >
      {title && (
        <View style={styles.glassInfoHeader}>
          <SkeletonLoader
            height={18}
            width="70%"
            borderRadius={8}
            style={{ marginBottom: 4 }}
          />
          {subtitle && (
            <SkeletonLoader
              height={14}
              width="50%"
              borderRadius={6}
            />
          )}
        </View>
      )}
      
      <View style={styles.glassInfoContainer}>
        {Array.from({ length: itemsCount }).map((_, index) => (
          <View key={index} style={styles.glassInfoItem}>
            <SkeletonLoader
              height={14}
              width="40%"
              borderRadius={6}
              style={{ marginBottom: 4 }}
            />
            <SkeletonLoader
              height={16}
              width="60%"
              borderRadius={8}
            />
          </View>
        ))}
      </View>
    </ResponsiveLiquidGlassCard>
  );
};

// Skeleton for GlassListCard using same ResponsiveLiquidGlassCard structure
export const SkeletonGlassListCard: React.FC<{
  title?: boolean;
  subtitle?: boolean;
  itemsCount?: number;
  padding?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginBottom?: number;
  borderRadius?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  contentGap?: number;
  style?: any;
}> = ({
  title = true,
  subtitle = false,
  itemsCount = 3,
  padding = {
    small: 12,
    medium: 16,
    large: 20,
    tablet: 24,
  },
  marginBottom = 24,
  borderRadius = {
    small: 14,
    medium: 16,
    large: 18,
    tablet: 20,
  },
  contentGap = 8,
  style,
}) => {
  return (
    <ResponsiveLiquidGlassCard
      padding={padding}
      marginBottom={marginBottom}
      borderRadius={borderRadius}
      glassEffectStyle="thick"
      isInteractive={true}
      style={style}
    >
      {title && (
        <View style={styles.glassListHeader}>
          <SkeletonLoader
            height={20}
            width="70%"
            borderRadius={8}
            style={{ marginBottom: 4 }}
          />
          {subtitle && (
            <SkeletonLoader
              height={14}
              width="50%"
              borderRadius={6}
            />
          )}
        </View>
      )}
      
      <View style={[styles.glassListContent, { gap: contentGap }]}>
        {Array.from({ length: itemsCount }).map((_, index) => (
          <View key={index} style={styles.glassListItem}>
            <SkeletonLoader
              height={16}
              width="80%"
              borderRadius={8}
              style={{ marginBottom: 4 }}
            />
            <SkeletonLoader
              height={12}
              width="60%"
              borderRadius={6}
            />
          </View>
        ))}
      </View>
    </ResponsiveLiquidGlassCard>
  );
};

// Skeleton for GlassActionCard using same ResponsiveLiquidGlassCard structure
export const SkeletonGlassActionCard: React.FC<{
  title?: boolean;
  subtitle?: boolean;
  buttonsCount?: number;
  padding?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginBottom?: number;
  borderRadius?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  buttonLayout?: 'horizontal' | 'vertical' | 'grid';
  style?: any;
}> = ({
  title = true,
  subtitle = false,
  buttonsCount = 2,
  padding = {
    small: 16,
    medium: 20,
    large: 24,
    tablet: 28,
  },
  marginBottom = 24,
  borderRadius = {
    small: 16,
    medium: 18,
    large: 20,
    tablet: 22,
  },
  buttonLayout = 'horizontal',
  style,
}) => {
  const getButtonLayoutStyle = () => {
    switch (buttonLayout) {
      case 'vertical':
        return styles.verticalLayout;
      case 'grid':
        return styles.gridLayout;
      default:
        return styles.horizontalLayout;
    }
  };

  return (
    <ResponsiveLiquidGlassCard
      padding={padding}
      marginBottom={marginBottom}
      borderRadius={borderRadius}
      glassEffectStyle="thick"
      isInteractive={false}
      style={style}
    >
      {title && (
        <View style={styles.glassActionHeader}>
          <SkeletonLoader
            height={20}
            width="60%"
            borderRadius={8}
            style={{ marginBottom: 4 }}
          />
          {subtitle && (
            <SkeletonLoader
              height={14}
              width="40%"
              borderRadius={6}
            />
          )}
        </View>
      )}
      
      <View style={[styles.glassActionButtons, getButtonLayoutStyle()]}>
        {Array.from({ length: buttonsCount }).map((_, index) => (
          <SkeletonLoader
            key={index}
            height={40}
            width={120}
            borderRadius={20}
          />
        ))}
      </View>
    </ResponsiveLiquidGlassCard>
  );
};

// Skeleton for GlassMenuCard using same ResponsiveLiquidGlassCard structure
export const SkeletonGlassMenuCard: React.FC<{
  title?: boolean;
  subtitle?: boolean;
  itemsCount?: number;
  padding?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginBottom?: number;
  borderRadius?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  style?: any;
}> = ({
  title = true,
  subtitle = false,
  itemsCount = 4,
  padding = {
    small: 16,
    medium: 20,
    large: 24,
    tablet: 28,
  },
  marginBottom = 24,
  borderRadius = {
    small: 16,
    medium: 18,
    large: 20,
    tablet: 22,
  },
  style,
}) => {
  return (
    <ResponsiveLiquidGlassCard
      padding={padding}
      marginBottom={marginBottom}
      borderRadius={borderRadius}
      glassEffectStyle="thick"
      isInteractive={true}
      style={style}
    >
      {title && (
        <View style={styles.glassMenuHeader}>
          <SkeletonLoader
            height={20}
            width="70%"
            borderRadius={8}
            style={{ marginBottom: 4 }}
          />
          {subtitle && (
            <SkeletonLoader
              height={14}
              width="50%"
              borderRadius={6}
            />
          )}
        </View>
      )}
      
      <View style={styles.glassMenuItems}>
        {Array.from({ length: itemsCount }).map((_, index) => (
          <View key={index} style={styles.glassMenuItem}>
            <View style={styles.glassMenuItemContent}>
              <SkeletonLoader
                height={16}
                width="70%"
                borderRadius={8}
                style={{ marginBottom: 4 }}
              />
              <SkeletonLoader
                height={12}
                width="50%"
                borderRadius={6}
              />
            </View>
            <SkeletonLoader
              height={20}
              width={20}
              borderRadius={10}
            />
          </View>
        ))}
      </View>
    </ResponsiveLiquidGlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  skeleton: {
    overflow: 'hidden',
  },
  textContainer: {
    flex: 1,
  },
  textLine: {
    alignSelf: 'flex-start',
  },
  card: {
    marginBottom: 16,
  },
  avatar: {
    marginRight: 12,
  },
  button: {
    marginHorizontal: 4,
  },
  // Expense skeleton styles - EXACT match to ExpenseItem
  expenseCardOverrides: {
    // Only override specific properties, don't override glassmorphism
    // The ResponsiveLiquidGlassCard will handle the glassmorphism styling
  },
  expenseContent: {
    flexDirection: 'column',
    gap: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseTitle: {
    flex: 1,
  },
  expensePaidBy: {
    flex: 1,
  },
  expenseRightSection: {
    alignItems: 'flex-end',
  },
  expenseGroupBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  expenseGroupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expenseList: {
    gap: 8,
  },
  // Group skeleton styles - EXACT match to GroupItem
  groupCardOverrides: {
    // Only override specific properties, don't override glassmorphism
    // The ResponsiveLiquidGlassCard will handle the glassmorphism styling
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)', // Light blue background like actual GroupItem
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    marginBottom: 4,
  },
  groupMembers: {
    marginBottom: 2,
  },
  groupDescription: {
    opacity: 0.8,
  },
  groupAmount: {
    alignItems: 'flex-end',
  },
  groupActions: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  groupList: {
    gap: 8,
  },
  // Dashboard stats skeleton styles - EXACT match to actual DashboardStats
  dashboardStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  statCard: {
    width: '47%',
    minHeight: 80,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: '1.5%',
    marginBottom: 12,
  },
  // Activity skeleton styles - EXACT match to RecentActivity
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitle: {
    flex: 1,
    marginRight: 8,
  },
  activityDescription: {
    marginBottom: 8,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityList: {
    gap: 4,
  },
  // Dashboard stats skeleton styles
  statCard: {
    width: '47%',
    minHeight: 80,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: '1.5%',
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  // Expense summary skeleton styles - EXACT match to ExpenseSummary
  expenseSummaryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  expenseSummaryCard: {
    padding: 16,
    justifyContent: 'center',
  },
  // Glass card skeleton styles
  glassStatHeader: {
    marginBottom: 16,
  },
  glassStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  glassStatItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
  },
  glassInfoHeader: {
    marginBottom: 16,
  },
  glassInfoContainer: {
    gap: 12,
  },
  glassInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Additional glass card skeleton styles
  glassListHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  glassListContent: {
    // Gap will be applied dynamically
  },
  glassListItem: {
    marginBottom: 8,
  },
  glassActionHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  glassActionButtons: {
    gap: 12,
  },
  horizontalLayout: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  verticalLayout: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  gridLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  glassMenuHeader: {
    marginBottom: 16,
  },
  glassMenuItems: {
    gap: 8,
  },
  glassMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  glassMenuItemContent: {
    flex: 1,
  },
});
