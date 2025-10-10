import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  blurIntensity?: number;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  blurIntensity = 20,
  ...textInputProps
}) => {
  const { colors, theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getInputContainerStyle = () => {
    // Unified styling for both platforms to ensure consistency
    const baseStyle = {
      borderRadius: 12,
      overflow: 'hidden' as const,
      minHeight: 48, // Increased height to accommodate more internal padding
      justifyContent: 'center' as const, // Center content vertically
      backgroundColor: theme === 'dark'
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(255, 255, 255, 0.9)',
      borderWidth: isFocused ? 2 : 1.5,
      borderColor: isFocused 
        ? colors.primary 
        : theme === 'dark'
          ? 'rgba(255, 255, 255, 0.4)'
          : 'rgba(0, 0, 0, 0.2)',
    };

    // Android-specific additions
    if (Platform.OS === 'android') {
      return {
        ...baseStyle,
        elevation: isFocused ? 4 : 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
        shadowRadius: 4,
      };
    }
    
    // iOS-specific additions
    return {
      ...baseStyle,
      borderRadius: 12, // Match Android for consistency
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.12,
      shadowRadius: 16,
      elevation: 8,
    };
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
        </Text>
      )}
      
      {Platform.OS === 'android' ? (
        <View style={[getInputContainerStyle(), inputStyle]}>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: 'transparent',
                textAlign: 'left', // Ensure left alignment
                textAlignVertical: 'center', // Ensure vertical centering
                includeFontPadding: false, // Remove extra font padding on Android
                textShadowColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }
            ]}
            placeholderTextColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)'}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...textInputProps}
          />
        </View>
      ) : (
        <BlurView
          style={[getInputContainerStyle(), inputStyle]}
          tint={theme === 'dark' ? 'dark' : 'light'}
          intensity={blurIntensity}
        >
          <TextInput
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: 'transparent',
                textAlign: 'left', // Ensure left alignment
                textAlignVertical: 'center', // Ensure vertical centering
                includeFontPadding: false, // Remove extra font padding on Android
                textShadowColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }
            ]}
            placeholderTextColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)'}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...textInputProps}
          />
        </BlurView>
      )}
      
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
    minHeight: 64, // Match the input field height
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 20,
    fontSize: 16,
    fontWeight: '500',
    height: 24, // Fixed height for text
    letterSpacing: 0.5,
    textAlign: 'left', // Left align text horizontally
    includeFontPadding: false, // Remove extra font padding on Android
    textAlignVertical: 'center', // Center text vertically
  },
  error: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
  },
});
