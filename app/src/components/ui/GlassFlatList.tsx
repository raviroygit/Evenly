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
    if (Platform.OS === 'android') {
      // Clean Android Material Design styling
      return {
        borderRadius: 12,
        overflow: 'hidden' as const,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
        backgroundColor: theme === 'dark' 
          ? '#2C2C2C' 
          : '#FFFFFF',
        borderWidth: 1,
        borderColor: theme === 'dark' 
          ? '#404040' 
          : '#E0E0E0',
        ...glassStyle,
      };
    }
    
    // iOS glassmorphism styling
    return {
      borderRadius: 16,
      overflow: 'hidden' as const,
      // Theme-aware glassmorphism effect
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.12,
      shadowRadius: 16,
      elevation: 12,
      // Theme-aware background
      backgroundColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.05)',
      borderWidth: 1.5,
      borderColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.3)' 
        : 'rgba(0, 0, 0, 0.12)',
      // Theme-aware inner glow
      borderTopColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.5)' 
        : 'rgba(255, 255, 255, 0.7)',
      borderLeftColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.5)' 
        : 'rgba(255, 255, 255, 0.7)',
      borderRightColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.15)' 
        : 'rgba(0, 0, 0, 0.08)',
      borderBottomColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.15)' 
        : 'rgba(0, 0, 0, 0.08)',
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
