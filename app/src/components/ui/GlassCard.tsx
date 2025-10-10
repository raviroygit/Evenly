import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  marginBottom?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  padding = 20,
  marginBottom = 16,
}) => {
  const { theme } = useTheme();

  // Platform-aware card styles
  const getCardStyle = () => {
    if (Platform.OS === 'android') {
      // Clean Android Material Design styling
      return {
        backgroundColor: theme === 'dark' 
          ? '#2C2C2C' 
          : '#FFFFFF',
        borderColor: theme === 'dark' 
          ? '#404040' 
          : '#E0E0E0',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
      };
    }
    
    // iOS glassmorphism styling
    return {
      backgroundColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.15)' 
        : 'rgba(0, 0, 0, 0.08)',
      borderColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.4)' 
        : 'rgba(0, 0, 0, 0.15)',
      borderWidth: 2,
      // Theme-aware inner glow
      borderTopColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.6)' 
        : 'rgba(255, 255, 255, 0.8)',
      borderLeftColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.6)' 
        : 'rgba(255, 255, 255, 0.8)',
      borderRightColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.2)' 
        : 'rgba(0, 0, 0, 0.1)',
      borderBottomColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.2)' 
        : 'rgba(0, 0, 0, 0.1)',
      // Enhanced shadows
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: theme === 'dark' ? 0.4 : 0.15,
      shadowRadius: 24,
      elevation: 16,
    };
  };

  return (
    <>
      {Platform.OS === 'android' ? (
        <View
          style={[
            styles.card,
            getCardStyle(),
            {
              padding,
              marginBottom,
            },
            style,
          ]}
        >
          {children}
        </View>
      ) : (
        <GlassView
          style={[
            styles.card,
            getCardStyle(),
            {
              padding,
              marginBottom,
            },
            style,
          ]}
          glassEffectStyle="regular"
          isInteractive={true}
          tint={theme === 'dark' ? 'dark' : 'light'}
        >
          {children}
        </GlassView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Platform.OS === 'android' ? 12 : 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
