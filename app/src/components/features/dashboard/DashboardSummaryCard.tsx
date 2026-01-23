import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

interface DashboardSummaryCardProps {
  totalGroups: number;
  netBalance: number;
  youOwe: number;
  youreOwed: number;
  loading?: boolean;
  onPress?: () => void;
}

export const DashboardSummaryCard: React.FC<DashboardSummaryCardProps> = ({
  totalGroups,
  netBalance,
  youOwe,
  youreOwed,
  loading = false,
  onPress,
}) => {
  const { colors, theme } = useTheme();

  const CardWrapper = onPress ? TouchableOpacity : View;
  const cardProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <View style={styles.container}>
      <CardWrapper
        style={[
          styles.summaryCard,
          {
            backgroundColor: theme === 'dark' ? '#2C2C2C' : '#FFFFFF',
            borderColor: theme === 'dark' ? '#404040' : '#E0E0E0',
          },
        ]}
        {...cardProps}
      >
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
            👥 Groups Summary
          </Text>
        </View>
        <View style={styles.summaryContent}>
          {/* Total Groups */}
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Groups
            </Text>
            <Text style={[styles.summaryValue, { color: '#2196F3' }]}>
              {loading ? '...' : totalGroups}
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#404040' : '#E0E0E0' }]} />

          {/* Net Balance */}
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Net
            </Text>
            <Text
              style={[
                styles.summaryValue,
                { color: netBalance >= 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              {loading ? '...' : `₹${Math.abs(netBalance).toFixed(0)}`}
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#404040' : '#E0E0E0' }]} />

          {/* You Owe */}
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              You Owe
            </Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {loading ? '...' : `₹${youOwe.toFixed(0)}`}
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme === 'dark' ? '#404040' : '#E0E0E0' }]} />

          {/* You're Owed */}
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              You Get
            </Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              {loading ? '...' : `₹${youreOwed.toFixed(0)}`}
            </Text>
          </View>
        </View>
      </CardWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
