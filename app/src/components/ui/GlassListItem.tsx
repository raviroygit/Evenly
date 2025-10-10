import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Platform } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassListItemProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export const GlassListItem: React.FC<GlassListItemProps> = ({
  title,
  subtitle,
  rightElement,
  onPress,
  style,
}) => {
  const { theme, colors } = useTheme();

  // Platform-aware list item styles
  const getListItemStyle = () => {
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 2,
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
      // Theme-aware inner glow with heavy effect
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
      // Heavy shadows like main cards
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.12,
      shadowRadius: 16,
      elevation: 8,
    };
  };

  const content = (
    <>
      {Platform.OS === 'android' ? (
        <View
          style={[
            styles.listItem,
            getListItemStyle(),
            style,
          ]}
        >
          <View style={styles.listItemContent}>
            <View style={styles.listItemText}>
              <Text style={[styles.listItemTitle, { color: colors.foreground }]}>
                {title}
              </Text>
              {subtitle && (
                <Text style={[styles.listItemSubtitle, { color: colors.mutedForeground }]}>
                  {subtitle}
                </Text>
              )}
            </View>
            {rightElement || (
              <Text style={[styles.listItemArrow, { color: colors.mutedForeground }]}>
                ›
              </Text>
            )}
          </View>
        </View>
      ) : (
        <GlassView
          style={[
            styles.listItem,
            getListItemStyle(),
            style,
          ]}
          glassEffectStyle="thick"
          isInteractive={true}
          tint={theme === 'dark' ? 'dark' : 'light'}
        >
          <View style={styles.listItemContent}>
            <View style={styles.listItemText}>
              <Text style={[styles.listItemTitle, { color: colors.foreground }]}>
                {title}
              </Text>
              {subtitle && (
                <Text style={[styles.listItemSubtitle, { color: colors.mutedForeground }]}>
                  {subtitle}
                </Text>
              )}
            </View>
            {rightElement || (
              <Text style={[styles.listItemArrow, { color: colors.mutedForeground }]}>
                ›
              </Text>
            )}
          </View>
        </GlassView>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={Platform.OS === 'android' ? 0.7 : 0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  listItem: {
    padding: 16,
    borderRadius: Platform.OS === 'android' ? 8 : 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemText: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  listItemArrow: {
    fontSize: 20,
    fontWeight: '300',
  },
});
