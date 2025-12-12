import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Pressable } from 'react-native';
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
  onActionExecuted?: () => void; // Callback after action is executed
  onPress?: () => void; // Callback when content is pressed (when swipe is closed)
}

const { width: screenWidth } = Dimensions.get('window');

export const SwipeActionRow: React.FC<SwipeActionRowProps> = ({
  children,
  actions,
  threshold = 80,
  disabled = false,
  swipeId,
  onActionExecuted,
  onPress,
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
      
      if (isOpen) {
        // When swipe actions are open, allow swiping right to close them
        if (event.translationX >= 0) {
          translateX.value = Math.max(event.translationX, -Math.min(actions.length * 50 + (actions.length - 1) * 12 + 8, screenWidth * 0.6));
        }
      } else {
        // When closed, only allow swiping left to open
        if (event.translationX <= 0) {
          translateX.value = event.translationX;
        }
      }
    })
    .onEnd((event) => {
      if (disabled) return;
      
      if (isOpen) {
        // If swipe actions are open, check if we should close them
        const shouldClose = event.translationX > threshold / 2; // Easier to close than open
        
        if (shouldClose) {
          translateX.value = withSpring(0);
          runOnJS(setIsOpen)(false);
          runOnJS(setActiveSwipeId)(null);
        } else {
          // Snap back to open position
          const actionWidth = actions.length * 50 + (actions.length - 1) * 12;
          const paddingRight = 8;
          const totalWidth = actionWidth + paddingRight;
          const maxTranslateX = -Math.min(totalWidth, screenWidth * 0.6);
          translateX.value = withSpring(maxTranslateX);
        }
      } else {
        // If closed, check if we should open them
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
      }
    });

  // Tap gesture to close when tapping on the main content (when open)
  // or trigger onPress when closed
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      if (isOpen) {
        console.log('Tap gesture triggered - closing swipe actions');
        translateX.value = withSpring(0);
        runOnJS(setIsOpen)(false);
        runOnJS(setActiveSwipeId)(null);
      } else if (onPress) {
        // When closed, trigger onPress if provided
        console.log('Tap gesture triggered - calling onPress');
        runOnJS(onPress)();
      }
    })
    .enabled(true); // Always enabled

  // Combined gesture - use Simultaneous to allow both gestures
  const combinedGesture = Gesture.Simultaneous(panGesture, tapGesture);

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
    console.log('=== SwipeActionRow: Action pressed ===');
    console.log('Action:', action.title, action.id);
    console.log('SwipeId:', swipeId);
    console.log('IsOpen:', isOpen);
    
    // Execute the action first
    console.log('Executing action:', action.title);
    try {
      action.onPress();
      console.log('Action executed successfully');
    } catch (error) {
      console.error('Error executing action:', error);
    }
    
    // Call the callback if provided
    if (onActionExecuted) {
      console.log('Calling onActionExecuted callback');
      onActionExecuted();
    }
    
    console.log('=== SwipeActionRow: Action handling complete ===');
  };

  return (
    <View style={styles.container}>
      {/* Action buttons container */}
      <View style={styles.actionContainer}>
        {actions.map((action, index) => (
          <Pressable
            key={action.id}
            style={[
              styles.actionButton,
              {
                backgroundColor: action.backgroundColor,
                marginLeft: index === 0 ? 0 : 12, // Add spacing between buttons
                zIndex: isOpen ? 10 + (actions.length - index) : 0, // Higher z-index when open
              },
            ]}
            onPress={() => {
              console.log('Pressable onPress triggered for:', action.title);
              handleActionPress(action);
            }}
          >
            <Ionicons name={action.icon as any} size={18} color={action.color} />
            <Text style={[styles.actionText, { color: action.color }]}>
              {action.title}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Main content */}
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={[styles.contentContainer, animatedStyle]}>
          {isOpen ? (
            <TouchableOpacity 
              style={{ flex: 1 }} 
              onPress={() => {
                console.log('TouchableOpacity tap - closing swipe actions');
                translateX.value = withSpring(0);
                setIsOpen(false);
                setActiveSwipeId(null);
              }}
              activeOpacity={1}
            >
              {children}
            </TouchableOpacity>
          ) : (
            children
          )}
        </Animated.View>
      </GestureDetector>

      {/* Overlay removed to prevent interference with action buttons */}
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
    zIndex: 0, // Lower than content to be hidden by default
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
    // Ensure content covers action buttons when not swiped
    elevation: 1,
  },
});
