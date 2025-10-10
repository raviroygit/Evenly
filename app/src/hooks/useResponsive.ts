import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

interface ResponsiveDimensions {
  width: number;
  height: number;
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
  isTablet: boolean;
}

export const useResponsive = (): ResponsiveDimensions => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;

  return {
    width,
    height,
    isSmallScreen: width < 375,
    isMediumScreen: width >= 375 && width < 414,
    isLargeScreen: width >= 414 && width < 768,
    isTablet: width >= 768,
  };
};

// Responsive breakpoints
export const BREAKPOINTS = {
  small: 375,
  medium: 414,
  large: 768,
  tablet: 1024,
} as const;

// Helper functions for responsive values
export const getResponsiveValue = <T>(
  values: {
    small?: T;
    medium?: T;
    large?: T;
    tablet?: T;
  },
  screenWidth: number
): T | undefined => {
  if (screenWidth < BREAKPOINTS.small) return values.small;
  if (screenWidth < BREAKPOINTS.medium) return values.medium;
  if (screenWidth < BREAKPOINTS.large) return values.large;
  if (screenWidth < BREAKPOINTS.tablet) return values.large;
  return values.tablet;
};
