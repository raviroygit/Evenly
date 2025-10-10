import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ResponsiveLiquidGlassCard } from './ResponsiveLiquidGlassCard';
import { GlassListItem } from './GlassListItem';
import { useTheme } from '../../contexts/ThemeContext';

interface MenuItem {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

interface GlassMenuCardProps {
  title: string;
  subtitle?: string;
  items: MenuItem[];
  style?: ViewStyle;
  padding?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginBottom?: number;
  borderRadius?: number | { small?: number; medium?: number; large?: number; tablet?: number };
}

export const GlassMenuCard: React.FC<GlassMenuCardProps> = ({
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
      isInteractive={true}
      style={style}
    >
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
      
      <View style={styles.menuItems}>
        {items.map((item, index) => (
          <GlassListItem
            key={index}
            title={item.title}
            subtitle={item.subtitle}
            rightElement={item.rightElement}
            onPress={item.onPress}
          />
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
  menuItems: {
    gap: 8,
  },
});
