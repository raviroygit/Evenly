import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { SkeletonDashboardStats } from '../../ui/SkeletonLoader';

interface StatItem {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface DashboardStatsProps {
  stats: StatItem[];
  loading?: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, loading = false }) => {
  const { theme } = useTheme();

  if (loading) {
    return <SkeletonDashboardStats />;
  }

  const StatCard: React.FC<{ stat: StatItem; index: number }> = ({ stat, index }) => {
    
    return (
    <View
      key={index}
      style={{
        ...styles.statCard,
        // Use opaque backgrounds to match Android appearance
        backgroundColor: theme === 'dark' 
        ? '#2C2C2C' 
        : '#FFFFFF',
        borderColor: theme === 'dark' 
          ? '#404040' 
          : '#E0E0E0',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
      }}
    >
      <View style={styles.statContent}>
        <View style={styles.statHeader}>
          <Text style={[styles.statLabel, { 
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            fontWeight: '600'
          }]}>
            {stat.label}
          </Text>
          {stat.trend && (
            <View style={[
              styles.trendBadge,
              { 
                backgroundColor: stat.trend.isPositive 
                  ? 'rgba(76, 175, 80, 0.2)' 
                  : 'rgba(244, 67, 54, 0.2)'
              }
            ]}>
              <Text style={[
                styles.trendText,
                { 
                  color: stat.trend.isPositive ? '#4CAF50' : '#F44336' 
                }
              ]}>
                {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
              </Text>
            </View>
          )}
        </View>
        
        <Text style={[
          styles.statValue,
          { 
            color: stat.color || (theme === 'dark' ? '#e2e8f0' : '#1e293b'),
            fontWeight: '700'
          }
        ]}>
          {stat.value}
        </Text>
      </View>
    </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <SkeletonDashboardStats />
      ) : (
        stats.map((stat, index) => (
          <StatCard key={index} stat={stat} index={index} />
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    // elevation: 4,
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
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
  },
});
