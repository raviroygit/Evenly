import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PlatformActionButton } from './PlatformActionButton';
import { useScreenDimensions } from '../../hooks/useScreenDimensions';

interface ButtonConfig {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
}

interface CustomButtonConfig {
  component: React.ReactNode;
}

interface ResponsiveButtonRowProps {
  buttons: (ButtonConfig | CustomButtonConfig)[];
  style?: any;
}

export const ResponsiveButtonRow: React.FC<ResponsiveButtonRowProps> = ({
  buttons,
  style,
}) => {
  const { width, isSmallScreen, isVerySmallScreen, isExtraSmallScreen } = useScreenDimensions();
  const buttonCount = buttons.length;
  
  // Debug logging
  console.log('ResponsiveButtonRow - Screen width:', width, 'Button count:', buttonCount);
  console.log('ResponsiveButtonRow - isSmallScreen:', isSmallScreen, 'isVerySmallScreen:', isVerySmallScreen, 'isExtraSmallScreen:', isExtraSmallScreen);
  
  // Force vertical layout for small screens to ensure buttons are always visible
  // Use vertical layout for:
  // 1. Extra small screens (< 320px) - ALWAYS vertical
  // 2. Very small screens (< 350px) - ALWAYS vertical
  // 3. Small screens (< 400px) - ALWAYS vertical
  // 4. Any screen with 3+ buttons
  const useVerticalLayout = 
    isExtraSmallScreen || 
    isVerySmallScreen || 
    isSmallScreen ||
    buttonCount >= 3;
  
  console.log('ResponsiveButtonRow - useVerticalLayout:', useVerticalLayout);
  
  // For larger screens with only 2 buttons, use horizontal layout
  const useHorizontalLayout = !useVerticalLayout;

  const containerStyle = [
    styles.container,
    useVerticalLayout ? styles.verticalContainer : styles.horizontalContainer,
    style,
  ];

  const buttonStyle = [
    styles.button,
    useVerticalLayout ? styles.verticalButton : styles.horizontalButton,
  ];

  return (
    <View style={containerStyle}>
      {buttons.map((button, index) => {
        if ('component' in button) {
          // Custom button component
          return (
            <View key={index} style={buttonStyle}>
              {button.component}
            </View>
          );
        } else {
          // Standard PlatformActionButton
          return (
            <PlatformActionButton
              key={index}
              title={button.title}
              onPress={button.onPress}
              variant={button.variant}
              size="large"
              loading={button.loading}
              disabled={button.disabled}
              style={buttonStyle}
            />
          );
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 4, // Add small horizontal padding to prevent edge issues
  },
  horizontalContainer: {
    flexDirection: 'row',
    gap: 8, // Reduced gap for small screens
    justifyContent: 'space-between',
  },
  verticalContainer: {
    flexDirection: 'column',
    gap: 8, // Reduced gap for small screens
    width: '100%',
  },
  button: {
    // Base button styles
  },
  horizontalButton: {
    flex: 1,
    minWidth: 100, // Increased minimum width for better text fit
    maxWidth: 200, // Increased maximum width to prevent text wrapping
  },
  verticalButton: {
    width: '100%',
    minHeight: 40, // Further reduced minimum height for small screens
    maxHeight: 52, // Further reduced maximum height for small screens
  },
});
