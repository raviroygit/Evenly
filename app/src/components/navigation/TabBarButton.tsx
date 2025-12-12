import { View, Text, Pressable, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import { icons } from '../../assets/icons';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface TabBarButtonProps {
  isFocused: boolean;
  label: string;
  routeName: string;
  color: string;
  onPress: () => void;
  onLongPress: () => void;
  badge?: string | number;
}

const TabBarButton: React.FC<TabBarButtonProps> = (props) => {
  const { isFocused, label, routeName, color, badge } = props;

  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(
      typeof isFocused === 'boolean' ? (isFocused ? 1 : 0) : isFocused,
      { duration: 350 }
    );
  }, [scale, isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(
      scale.value,
      [0, 1],
      [1, 1.4]
    );
    const top = interpolate(
      scale.value,
      [0, 1],
      [0, 8]
    );

    return {
      transform: [{ scale: scaleValue }],
      top
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scale.value,
      [0, 1],
      [1, 0]
    );

    return {
      opacity
    };
  });

  return (
    <Pressable {...props} style={styles.container}>
      <View style={styles.iconContainer}>
        <Animated.View style={[animatedIconStyle]}>
          {icons[routeName as keyof typeof icons]({
            color,
            isFocused
          })}
        </Animated.View>
        
        {/* Badge */}
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {typeof badge === 'number' ? badge.toString() : badge}
            </Text>
          </View>
        )}
      </View>
      
      <Animated.Text style={[{ 
        color,
        fontSize: 11
      }, animatedTextStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TabBarButton;
