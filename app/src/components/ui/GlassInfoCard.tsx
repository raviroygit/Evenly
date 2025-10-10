import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ResponsiveLiquidGlassCard } from './ResponsiveLiquidGlassCard';
import { useTheme } from '../../contexts/ThemeContext';

interface InfoItem {
  label: string;
  value: string;
  color?: string;
}

interface GlassInfoCardProps {
  title?: string;
  subtitle?: string;
  items: InfoItem[];
  style?: ViewStyle;
  padding?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginBottom?: number;
  borderRadius?: number | { small?: number; medium?: number; large?: number; tablet?: number };
}

export const GlassInfoCard: React.FC<GlassInfoCardProps> = ({
  title,
  subtitle,
  items,
  style,
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
      
      <View style={styles.infoContainer}>
        {items.map((item, index) => (
          <View key={index} style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              {item.label}
            </Text>
            <Text style={[
              styles.infoValue, 
              { color: item.color || colors.foreground }
            ]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </ResponsiveLiquidGlassCard>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  infoContainer: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
