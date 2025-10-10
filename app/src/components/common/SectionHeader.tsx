import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  style?: any;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
});
