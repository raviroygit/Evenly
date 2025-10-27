import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useSwipeAction } from '../../contexts/SwipeActionContext';

interface SwipeAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

interface SwipeActionRowProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  threshold?: number;
  disabled?: boolean;
  swipeId: string; // Unique identifier for this swipe row
}

const { width: screenWidth } = Dimensions.get('window');

export const SwipeActionRow: React.FC<SwipeActionRowProps> = ({
  children,
  actions,
  threshold = 80,
  disabled = false,
  swipeId,
}) => {
  const { colors } = useTheme();
  const { activeSwipeId, setActiveSwipeId } = useSwipeAction();
  const translateX = useSharedValue(0);
  const [isOpen, setIsOpen] = useState(false);

  // Close this swipe when another becomes active
  useEffect(() => {
    if (activeSwipeId && activeSwipeId !== swipeId && isOpen) {
      translateX.value = withSpring(0);
      setIsOpen(false);
    }
  }, [activeSwipeId, swipeId, isOpen, translateX]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Close any other open swipe actions
      if (activeSwipeId && activeSwipeId !== swipeId) {
        runOnJS(setActiveSwipeId)(null);
      }
    })
    .onUpdate((event) => {
      if (disabled) return;
      
      // Only allow swiping left (negative values)
      if (event.translationX <= 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (disabled) return;
      
      const shouldOpen = Math.abs(event.translationX) > threshold;
      
      if (shouldOpen) {
        // Calculate the width needed for all actions
        const actionWidth = actions.length * 50 + (actions.length - 1) * 12; // 50px width + 12px spacing between buttons
        const paddingRight = 8; // Account for container padding
        const totalWidth = actionWidth + paddingRight;
        const maxTranslateX = -Math.min(totalWidth, screenWidth * 0.6); // Reduced back to 60% since we have less padding
        
        translateX.value = withSpring(maxTranslateX);
        runOnJS(setIsOpen)(true);
        runOnJS(setActiveSwipeId)(swipeId);
      } else {
        translateX.value = withSpring(0);
        runOnJS(setIsOpen)(false);
        runOnJS(setActiveSwipeId)(null);
      }
    });

  // Tap gesture to close when tapping on the main content
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      if (isOpen) {
        translateX.value = withSpring(0);
        runOnJS(setIsOpen)(false);
        runOnJS(setActiveSwipeId)(null);
      }
    });

  // Combined gesture - use Race instead of Simultaneous for better compatibility
  const combinedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const actionContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleActionPress = (action: SwipeAction) => {
    console.log('Action pressed:', action.title, action.id);
    
    // Execute the action first
    console.log('Executing action:', action.title);
    action.onPress();
    
    // Close the swipe actions but keep activeSwipeId to prevent interference
    translateX.value = withSpring(0);
    setIsOpen(false);
    
    // Don't clear activeSwipeId immediately - let it be cleared by other interactions
  };

  const closeActions = () => {
    translateX.value = withSpring(0);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Action buttons container */}
      <View style={styles.actionContainer}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionButton,
              {
                backgroundColor: action.backgroundColor,
                marginLeft: index === 0 ? 0 : 12, // Add spacing between buttons
                zIndex: actions.length - index, // Higher z-index for buttons closer to content
              },
            ]}
            onPress={() => handleActionPress(action)}
            activeOpacity={0.8}
          >
            <Ionicons name={action.icon as any} size={18} color={action.color} />
            <Text style={[styles.actionText, { color: action.color }]}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.contentContainer, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>

      {/* Overlay to close actions when tapping outside */}
      {isOpen && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={closeActions}
          activeOpacity={1}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 8, // Reduced padding to minimize right space
    zIndex: 0,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionText: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  contentContainer: {
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    top: -1000, // Extend above the screen
    left: -1000, // Extend left of the screen
    right: -1000, // Extend right of the screen
    bottom: -1000, // Extend below the screen
    backgroundColor: 'transparent',
    zIndex: 0,
  },
});
