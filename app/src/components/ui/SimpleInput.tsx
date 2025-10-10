import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SimpleInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
}

export const SimpleInput: React.FC<SimpleInputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  ...textInputProps
}) => {
  const { colors, theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getInputContainerStyle = () => {
    return {
      borderRadius: 12,
      minHeight: 48,
      justifyContent: 'center' as const,
      backgroundColor: colors.muted,
      borderWidth: isFocused ? 2 : 1,
      borderColor: isFocused 
        ? colors.primary 
        : colors.border,
      // Add shadow for better visibility
      ...(Platform.OS === 'ios' ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
        shadowRadius: 4,
      } : {
        elevation: 2,
      }),
    };
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
        </Text>
      )}
      
      <View style={[getInputContainerStyle(), inputStyle]}>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.foreground, // Use theme foreground color
              backgroundColor: 'transparent',
            }
          ]}
          placeholderTextColor={colors.mutedForeground}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="next"
          blurOnSubmit={false}
          {...textInputProps}
        />
      </View>
      
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'left',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  error: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
  },
});
