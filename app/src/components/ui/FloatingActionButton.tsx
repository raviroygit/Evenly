import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, StatusBar } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

// Custom Grid Icon Component with 4x4 grid that fits perfectly to button border
const GridIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 48 }) => {
  const iconSize = size;
  const numSquares = 4; // 4x4 grid = 16 squares
  const spacing = 2; // Spacing between squares
  
  // Calculate square size to fit perfectly with spacing
  const squareSize = (iconSize - (numSquares - 1) * spacing) / numSquares;
  
  // Define multiple colors for the grid squares (16 colors for 4x4 grid)
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#FF9F43', // Orange
    '#A55EEA', // Purple
    '#26C6DA', // Cyan
    '#66BB6A', // Light Green
    '#FFA726', // Amber
    '#EF5350', // Light Red
    '#42A5F5', // Light Blue
    '#AB47BC', // Light Purple
    '#26A69A', // Teal Green
    '#FFEB3B', // Light Yellow
  ];
  
  return (
    <View style={{ 
      width: iconSize, 
      height: iconSize, 
      justifyContent: 'center', 
      alignItems: 'center',
      borderRadius: iconSize / 2, // Circular mask to hide overflow
      overflow: 'hidden' // Hide the parts that go outside circular border
    }}>
      <View style={{ 
        width: iconSize, 
        height: iconSize, 
        flexDirection: 'row', 
        flexWrap: 'wrap'
      }}>
        {/* 4x4 grid of 16 colored squares */}
        {Array.from({ length: 16 }).map((_, index) => {
          const row = Math.floor(index / 4);
          const col = index % 4;
          
          return (
            <View 
              key={index}
              style={{ 
                width: squareSize, 
                height: squareSize, 
                backgroundColor: colors[index], 
                borderRadius: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 1,
                elevation: 1,
                marginRight: col < 2 ? spacing : 0, // Add right margin except for last column
                marginBottom: row < 2 ? spacing : 0, // Add bottom margin except for last row
              }} 
            />
          );
        })}
      </View>
    </View>
  );
};

interface ActionItem {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: ActionItem[];
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  actions,
  position = 'bottom-right'
}) => {
  const { colors, theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleMenu = useCallback(() => {
    // Update state immediately - use functional update to avoid stale closure
    setIsOpen(prevIsOpen => {
      const newIsOpen = !prevIsOpen;
      const toValue = newIsOpen ? 1 : 0;
      
      // Set animation value immediately for instant visual feedback
      animation.setValue(toValue);
      
      // Then start smooth animation
      Animated.timing(animation, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      return newIsOpen;
    });
  }, [animation]);

  // Control status bar appearance when menu is open
  useEffect(() => {
    if (isOpen) {
      StatusBar.setBarStyle('light-content', true);
      StatusBar.setBackgroundColor('#00000080', true); // Use hex with alpha for better consistency
    } else {
      StatusBar.setBarStyle(theme === 'dark' ? 'light-content' : 'dark-content', true);
      StatusBar.setBackgroundColor('transparent', true);
    }
  }, [isOpen, theme]);

  const getPositionStyle = () => {
    // Platform-specific bottom positioning
    const bottomPosition = Platform.OS === 'android' ? 120 : 100;
    
    switch (position) {
      case 'bottom-left':
        return { bottom: bottomPosition, left: 20 };
      case 'bottom-center':
        return { bottom: bottomPosition, alignSelf: 'center' as const };
      case 'bottom-right':
      default:
        return { bottom: bottomPosition, right: 20 };
    }
  };

  const mainButtonStyle = {
    width: 56,
    height: 56,
    borderRadius: 28, // Circular button
    backgroundColor: 'transparent', // Transparent to show glass background
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    // Remove shadow from inner button since glass background has it
  };

  const actionButtonStyle = {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation:Platform.OS === 'ios' ? 8 : 0, // Increased elevation
    borderWidth: 1,
    borderColor: colors.border,
  };

  const actionTextStyle = {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '600' as const,
    marginTop: 4,
    textAlign: 'center' as const,
    backgroundColor: theme === 'dark' 
      ? 'rgba(0, 0, 0, 0.8)' 
      : 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  };

  const actionIconStyle = {
    color: colors.foreground,
    fontSize: 20,
  };

  return (
    <View style={styles.container}>
      {/* Action Items */}
      {isOpen && (
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: animation,
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                {
                  scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Background container for better visual separation */}
          <View style={[
            styles.actionsBackground,
            {
              backgroundColor: theme === 'dark' 
                ? 'rgba(0, 0, 0, 0.4)' 
                : 'rgba(255, 255, 255, 0.2)',
            }
          ]}>
          {actions.map((action, index) => (
            <Animated.View
              key={action.id}
              style={[
                styles.actionItem,
                {
                  transform: [
                    {
                      translateY: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20 * (index + 1), 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={actionButtonStyle}
                onPress={() => {
                  action.onPress();
                  toggleMenu();
                }}
                activeOpacity={0.8}
              >
                <Text style={actionIconStyle}>{action.icon}</Text>
              </TouchableOpacity>
              <Text style={actionTextStyle}>{action.title}</Text>
            </Animated.View>
          ))}
          </View>
        </Animated.View>
      )}

      {/* Main FAB Button with Glass Effect */}
      <View style={[styles.mainButtonContainer, getPositionStyle()]}>
        {/* Glass Effect Background */}
        <View style={[styles.glassBackground, { 
          backgroundColor: theme === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.1)',
          borderColor: theme === 'dark' 
            ? 'rgba(255, 255, 255, 0.2)' 
            : 'rgba(255, 255, 255, 0.3)',
        }]}>
          <TouchableOpacity
            style={mainButtonStyle}
            onPress={toggleMenu}
            activeOpacity={0.8}
            delayPressIn={0}
            delayPressOut={0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '45deg'],
                    }),
                  },
                ],
              }}
            >
              <GridIcon color={colors.primaryForeground} size={48} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Overlay to close menu when tapping outside */}
      {isOpen && (
        <View style={styles.fullScreenOverlay}>
          <TouchableOpacity
            style={styles.overlay}
            onPress={toggleMenu}
            activeOpacity={1}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
    pointerEvents: 'box-none',
    zIndex: 1000, // Lower z-index than SearchFloatingButton
  },
  mainButtonContainer: {
    position: 'absolute',
    zIndex: 1001, // Lower than SearchFloatingButton
    pointerEvents: 'auto',
  },
  glassBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation:Platform.OS === 'ios' ? 10 : 0, // Increased elevation for better visibility
  },
  actionsContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 210 : 190, // Increased spacing to prevent overlap
    right: 20,
    alignItems: 'center',
    zIndex: 1002, // Higher than main button but lower than search
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  actionItem: {
    alignItems: 'center',
    marginBottom: 8,
  },
  actionsBackground: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation:Platform.OS === 'ios' ? 6 : 0,
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 998, // Lower than FAB but higher than content
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#00000080', // Match status bar color exactly using hex
    zIndex: 999, // Lower than FAB menu but higher than content
  },
});
