import React from 'react';
import { ViewStyle } from 'react-native';
import { LiquidGlassCard } from './LiquidGlassCard';
import { useResponsive, getResponsiveValue } from '../../hooks/useResponsive';

interface ResponsiveLiquidGlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  margin?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginBottom?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginTop?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginHorizontal?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginVertical?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  borderRadius?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  onPress?: () => void;
  disabled?: boolean;
}

export const ResponsiveLiquidGlassCard: React.FC<ResponsiveLiquidGlassCardProps> = ({
  children,
  style,
  padding,
  margin,
  marginBottom,
  marginTop,
  marginHorizontal,
  marginVertical,
  borderRadius,
  onPress,
  disabled,
}) => {
  const { width } = useResponsive();

  // Helper function to get responsive value
  const getResponsiveProp = (prop: any) => {
    if (typeof prop === 'object' && prop !== null) {
      return getResponsiveValue(prop, width);
    }
    return prop;
  };

  return (
    <LiquidGlassCard
      style={style}
      padding={getResponsiveProp(padding)}
      margin={getResponsiveProp(margin)}
      marginBottom={getResponsiveProp(marginBottom)}
      marginTop={getResponsiveProp(marginTop)}
      marginHorizontal={getResponsiveProp(marginHorizontal)}
      marginVertical={getResponsiveProp(marginVertical)}
      borderRadius={getResponsiveProp(borderRadius)}
      onPress={onPress}
      disabled={disabled}
    >
      {children}
    </LiquidGlassCard>
  );
};

// Predefined responsive variants
export const ResponsiveLiquidGlassCardVariants = {
  // Responsive card that adapts to screen size
  adaptive: (props: Omit<ResponsiveLiquidGlassCardProps, 'padding' | 'borderRadius'>) => (
    <ResponsiveLiquidGlassCard
      {...props}
      padding={{
        small: 12,
        medium: 16,
        large: 20,
        tablet: 24,
      }}
      borderRadius={{
        small: 12,
        medium: 16,
        large: 18,
        tablet: 20,
      }}
    />
  ),

  // Compact card for small screens
  compact: (props: Omit<ResponsiveLiquidGlassCardProps, 'padding' | 'borderRadius'>) => (
    <ResponsiveLiquidGlassCard
      {...props}
      padding={{
        small: 8,
        medium: 12,
        large: 16,
        tablet: 20,
      }}
      borderRadius={{
        small: 8,
        medium: 12,
        large: 14,
        tablet: 16,
      }}
    />
  ),

  // Spacious card for larger screens
  spacious: (props: Omit<ResponsiveLiquidGlassCardProps, 'padding' | 'borderRadius'>) => (
    <ResponsiveLiquidGlassCard
      {...props}
      padding={{
        small: 16,
        medium: 20,
        large: 24,
        tablet: 32,
      }}
      borderRadius={{
        small: 16,
        medium: 20,
        large: 24,
        tablet: 28,
      }}
    />
  ),
};
