import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Platform } from 'react-native';
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

  // Consistent solid card styling for both platforms
  const getListItemStyle = () => {
    return {
      backgroundColor: theme === 'dark'
        ? '#1C1C2E'
        : '#FFFFFF',
      borderColor: theme === 'dark'
        ? '#2E2E45'
        : '#E5E7EB',
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 2,
    };
  };

  const content = (
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
