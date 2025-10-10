import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ResponsiveLiquidGlassCard } from './ResponsiveLiquidGlassCard';
import { useTheme } from '../../contexts/ThemeContext';

interface StatItem {
  label: string;
  value: string | number;
  color?: string;
}

interface GlassStatCardProps {
  stats: StatItem[];
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  padding?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginBottom?: number;
  borderRadius?: number | { small?: number; medium?: number; large?: number; tablet?: number };
}

export const GlassStatCard: React.FC<GlassStatCardProps> = ({
  stats,
  title,
  subtitle,
  style,
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
}) => {
  const { colors } = useTheme();

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
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={[
              styles.statValue, 
              { color: stat.color || colors.foreground }
            ]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </ResponsiveLiquidGlassCard>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
});
