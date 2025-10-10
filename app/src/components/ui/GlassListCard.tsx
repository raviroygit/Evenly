import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ResponsiveLiquidGlassCard } from './ResponsiveLiquidGlassCard';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassListCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginBottom?: number;
  borderRadius?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  contentGap?: number;
  badge?: string | number;
}

export const GlassListCard: React.FC<GlassListCardProps> = ({
  title,
  subtitle,
  children,
  style,
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
  badge,
}) => {
  const { colors } = useTheme();

  return (
    <ResponsiveLiquidGlassCard
      padding={padding}
      marginBottom={marginBottom}
      borderRadius={borderRadius}
      style={style}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>
          {badge && badge !== null && badge !== undefined && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {typeof badge === 'number' ? badge.toString() : String(badge)}
              </Text>
            </View>
          )}
        </View>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {subtitle}
          </Text>
        )}
      </View>
      
      <View style={[styles.content, { gap: contentGap }]}>
        {children}
      </View>
    </ResponsiveLiquidGlassCard>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  titleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    paddingRight: 20, // Add padding to ensure text doesn't overlap with badge
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: 0,
    backgroundColor: '#10B981',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  content: {
    // Gap will be applied dynamically
  },
});
