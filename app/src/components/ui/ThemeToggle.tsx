import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const getThemeIcon = () => {
    return theme === 'dark' ? '🌙' : '☀️';
  };

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={styles.iconContainer}
      activeOpacity={1}
    >
      <Text style={styles.icon}>{getThemeIcon()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    minWidth: 48,
    minHeight: 48,
  },
  icon: {
    fontSize: 28,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
