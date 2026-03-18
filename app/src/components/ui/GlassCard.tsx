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

  // Consistent solid card styling for both platforms
  const getCardStyle = () => {
    return {
      backgroundColor: theme === 'dark'
        ? '#1C1C2E'
        : '#FFFFFF',
      borderColor: theme === 'dark'
        ? '#2E2E45'
        : '#E5E7EB',
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
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
