import React from 'react';
import { TouchableOpacity, StyleSheet, Platform, Text, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SearchFloatingButtonProps {
  onPress: () => void;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const SearchFloatingButton: React.FC<SearchFloatingButtonProps> = ({
  onPress,
  position = 'bottom-left',
  size = 'medium',
  style,
}) => {
  const { colors, theme } = useTheme();

  const getPositionStyle = () => {
    switch (position) {
      case 'bottom-left':
        return {
          bottom: Platform.OS === 'ios' ? 100 : 80,
          left: 20,
        };
      case 'bottom-right':
        return {
          bottom: Platform.OS === 'ios' ? 220 : 240, // Increased spacing to prevent overlap with FAB
          right: 20,
        };
      case 'top-left':
        return {
          top: Platform.OS === 'ios' ? 60 : 40,
          left: 20,
        };
      case 'top-right':
        return {
          top: Platform.OS === 'ios' ? 60 : 40,
          right: 20,
        };
      default:
        return {
          bottom: Platform.OS === 'ios' ? 100 : 80,
          left: 20,
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          width: 48,
          height: 48,
          borderRadius: 24,
        };
      case 'large':
        return {
          width: 64,
          height: 64,
          borderRadius: 32,
        };
      default: // medium
        return {
          width: 56,
          height: 56,
          borderRadius: 28,
        };
    }
  };

  return (
    <View style={[styles.container, getPositionStyle()]}>
      <TouchableOpacity
        style={[
          styles.button,
          getSizeStyle(),
          {
            backgroundColor: colors.primary,
            shadowColor: theme === 'dark' ? '#000' : '#000',
          },
          style,
        ]}
        onPress={() => {
          onPress();
        }}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <SearchIcon size={size === 'small' ? 20 : size === 'large' ? 28 : 24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

// Simple search icon component using text
const SearchIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Text style={{ fontSize: size, color, fontWeight: 'bold' }}>🔍</Text>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1003, // Higher z-index to appear above FAB
    pointerEvents: 'auto',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12, // Increased elevation for better visibility
  },
});
