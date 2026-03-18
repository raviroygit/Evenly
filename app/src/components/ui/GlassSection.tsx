import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassSectionProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  glassStyle?: ViewStyle;
  glassEffectStyle?: 'regular' | 'thick' | 'thin' | 'ultraThin' | 'extraLight' | 'light' | 'dark' | 'extraDark';
  isInteractive?: boolean;
  tint?: 'light' | 'dark' | 'default';
  padding?: number;
  marginBottom?: number;
}

export const GlassSection: React.FC<GlassSectionProps> = ({
  title,
  subtitle,
  children,
  style,
  glassStyle,
  glassEffectStyle = 'regular',
  isInteractive = false,
  tint = 'default',
  padding = 20,
  marginBottom = 16,
}) => {
  const { colors, theme } = useTheme();

  // Determine tint based on theme if not specified
  const glassTint = tint === 'default' ? (theme === 'dark' ? 'dark' : 'light') : tint;

  // Consistent solid card styling for both platforms
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
      padding,
      marginBottom,
      ...glassStyle,
    };
  };

  return (
    <>
      {Platform.OS === 'android' ? (
        <View style={[getContainerStyle(), style]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {subtitle}
              </Text>
            )}
          </View>
          {children && (
            <View style={styles.content}>
              {children}
            </View>
          )}
        </View>
      ) : (
        <GlassView
          style={[getContainerStyle(), style]}
          glassEffectStyle={glassEffectStyle}
          isInteractive={isInteractive}
          tint={glassTint}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {subtitle}
              </Text>
            )}
          </View>
          {children && (
            <View style={styles.content}>
              {children}
            </View>
          )}
        </GlassView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    opacity: 0.8,
  },
  content: {
    gap: 12,
  },
});
