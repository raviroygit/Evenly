import React from 'react';
import { FlatList, FlatListProps, StyleSheet, ViewStyle, View, Platform } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassFlatListProps<T> extends Omit<FlatListProps<T>, 'style'> {
  style?: ViewStyle;
  glassStyle?: ViewStyle;
  glassEffectStyle?: 'regular' | 'thick' | 'thin' | 'ultraThin' | 'extraLight' | 'light' | 'dark' | 'extraDark';
  isInteractive?: boolean;
  tint?: 'light' | 'dark' | 'default';
}

export const GlassFlatList = <T,>({
  style,
  glassStyle,
  glassEffectStyle = 'regular',
  isInteractive = true,
  tint = 'default',
  contentContainerStyle,
  ...props
}: GlassFlatListProps<T>) => {
  const { theme } = useTheme();

  // Determine tint based on theme if not specified
  const glassTint = tint === 'default' ? (theme === 'dark' ? 'dark' : 'light') : tint;

  // Platform-aware container styles
  const getContainerStyle = () => {
    return {
      borderRadius: 12,
      overflow: 'hidden' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
      backgroundColor: theme === 'dark'
        ? '#1C1C2E'
        : '#FFFFFF',
      borderWidth: 1,
      borderColor: theme === 'dark'
        ? '#2E2E45'
        : '#E5E7EB',
      ...glassStyle,
    };
  };

  return (
    <>
      {Platform.OS === 'android' ? (
        <View style={[getContainerStyle(), style]}>
          <FlatList
            {...props}
            contentContainerStyle={[
              styles.contentContainer,
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      ) : (
        <GlassView
          style={[getContainerStyle(), style]}
          glassEffectStyle={glassEffectStyle}
          isInteractive={isInteractive}
          tint={glassTint}
        >
          <FlatList
            {...props}
            contentContainerStyle={[
              styles.contentContainer,
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          />
        </GlassView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
  },
});
