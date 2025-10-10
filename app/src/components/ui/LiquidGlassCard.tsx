import React, { useState } from 'react';
import { ViewStyle, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * LiquidGlassCard - A reusable card component with consistent styling across platforms
 * 
 * This component provides a consistent card appearance across both iOS and Android
 * platforms, using opaque backgrounds instead of glass effects.
 * 
 * Features:
 * - Consistent styling across platforms
 * - Theme-aware colors (light/dark)
 * - Responsive design support
 * - Touchable with press handlers
 * - Customizable styling
 */

interface LiquidGlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  margin?: number;
  marginBottom?: number;
  marginTop?: number;
  marginHorizontal?: number;
  marginVertical?: number;
  borderRadius?: number;
  onPress?: () => void;
  disabled?: boolean;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  style,
  padding = 16,
  margin = 0,
  marginBottom = 0,
  marginTop = 0,
  marginHorizontal = 0,
  marginVertical = 0,
  borderRadius = 16,
  onPress,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [animatedValue] = useState(new Animated.Value(1));

  // Handle press animations for both platforms
  const handlePressIn = () => {
    if (!disabled) {
      setIsPressed(true);
      Animated.spring(animatedValue, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      setIsPressed(false);
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const getCardStyle = (): ViewStyle => {
    // Use the same opaque styling for both platforms
    return {
      padding,
      margin,
      marginBottom,
      marginTop,
      marginHorizontal,
      marginVertical,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: isPressed ? 8 : (theme === 'dark' ? 6 : 4) },
      shadowOpacity: isPressed ? 0.4 : (theme === 'dark' ? 0.4 : 0.2),
      shadowRadius: isPressed ? 16 : (theme === 'dark' ? 12 : 8),
      backgroundColor: theme === 'dark' 
        ? '#2C2C2C' 
        : '#FFFFFF',
      borderWidth: 1,
      borderColor: theme === 'dark' 
        ? '#404040' 
        : '#E0E0E0',
      transform: [{ scale: animatedValue }], // Animation transform
      ...style,
    };
  };

  const cardStyle = getCardStyle();

  // Use the same rendering logic for both platforms
  const content = (
    <Animated.View style={cardStyle}>
      {children}
    </Animated.View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1} // Disable default opacity since we're using custom animation
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Predefined variants for common use cases
export const LiquidGlassCardVariants = {
  // Small card with minimal padding
  small: (props: Omit<LiquidGlassCardProps, 'padding' | 'borderRadius'>) => (
    <LiquidGlassCard {...props} padding={12} borderRadius={12} />
  ),

  // Medium card with standard padding
  medium: (props: Omit<LiquidGlassCardProps, 'padding' | 'borderRadius'>) => (
    <LiquidGlassCard {...props} padding={16} borderRadius={16} />
  ),

  // Large card with generous padding
  large: (props: Omit<LiquidGlassCardProps, 'padding' | 'borderRadius'>) => (
    <LiquidGlassCard {...props} padding={24} borderRadius={20} />
  ),

  // Card with light tint (no longer needed, but kept for compatibility)
  light: (props: LiquidGlassCardProps) => (
    <LiquidGlassCard {...props} />
  ),

  // Card with dark tint (no longer needed, but kept for compatibility)
  dark: (props: LiquidGlassCardProps) => (
    <LiquidGlassCard {...props} />
  ),

  // Rounded card
  rounded: (props: Omit<LiquidGlassCardProps, 'borderRadius'>) => (
    <LiquidGlassCard {...props} borderRadius={24} />
  ),

  // Square card
  square: (props: Omit<LiquidGlassCardProps, 'borderRadius'>) => (
    <LiquidGlassCard {...props} borderRadius={8} />
  ),
};

// Responsive helper function
export const getResponsivePadding = (screenWidth: number) => {
  if (screenWidth < 375) return 12; // Small phones
  if (screenWidth < 414) return 16; // Regular phones
  if (screenWidth < 768) return 20; // Large phones
  return 24; // Tablets
};

export const getResponsiveBorderRadius = (screenWidth: number) => {
  if (screenWidth < 375) return 12; // Small phones
  if (screenWidth < 414) return 16; // Regular phones
  if (screenWidth < 768) return 18; // Large phones
  return 20; // Tablets
};
