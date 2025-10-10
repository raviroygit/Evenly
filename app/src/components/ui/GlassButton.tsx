import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
}) => {
  const { colors, theme } = useTheme();
  
  const getButtonColors = () => {
    if (variant === 'primary') {
      return {
        backgroundColor: colors.primary,
        textColor: colors.primaryForeground,
        borderColor: colors.primary,
      };
    } else {
      return {
        backgroundColor: colors.secondary,
        textColor: colors.secondaryForeground,
        borderColor: colors.border,
      };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          fontSize: 14,
          minWidth: 100,
        };
      case 'large':
        return {
          paddingHorizontal: 32,
          paddingVertical: 16,
          fontSize: 18,
          minWidth: 160,
        };
      default:
        return {
          paddingHorizontal: 24,
          paddingVertical: 12,
          fontSize: 16,
          minWidth: 120,
        };
    }
  };

  const buttonColors = getButtonColors();
  const sizeStyles = getSizeStyles();

  // Platform-aware container styles
  const getContainerStyle = () => {
    if (Platform.OS === 'android') {
      return {
        borderRadius: 8,
        overflow: 'hidden' as const,
        elevation: variant === 'primary' ? 8 : 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme === 'dark' ? 0.3 : 0.15,
        shadowRadius: 6,
        backgroundColor: variant === 'primary' 
          ? buttonColors.backgroundColor
          : theme === 'dark' 
            ? '#2C2C2C' 
            : '#FFFFFF',
        borderWidth: variant === 'primary' ? 0 : 1,
        borderColor: theme === 'dark' 
          ? '#404040' 
          : '#E0E0E0',
      };
    }
    
    // iOS glassmorphism styling
    return {
      borderRadius: 20,
      overflow: 'hidden' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme === 'dark' ? 0.35 : 0.12,
      shadowRadius: 16,
      elevation: 12,
      backgroundColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.12)' 
        : 'rgba(0, 0, 0, 0.06)',
      borderWidth: 2,
      borderColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.4)' 
        : 'rgba(0, 0, 0, 0.12)',
      borderTopColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.6)' 
        : 'rgba(255, 255, 255, 0.8)',
      borderLeftColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.6)' 
        : 'rgba(255, 255, 255, 0.8)',
      borderRightColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.2)' 
        : 'rgba(0, 0, 0, 0.08)',
      borderBottomColor: theme === 'dark' 
        ? 'rgba(255, 255, 255, 0.2)' 
        : 'rgba(0, 0, 0, 0.08)',
    };
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={Platform.OS === 'android' ? 0.7 : 0.8}>
      {Platform.OS === 'android' ? (
        <View
          style={[
            getContainerStyle(),
            {
              paddingHorizontal: sizeStyles.paddingHorizontal,
              paddingVertical: sizeStyles.paddingVertical,
              minWidth: sizeStyles.minWidth,
            },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: buttonColors.textColor,
                fontSize: sizeStyles.fontSize,
                textAlign: 'center',
              },
            ]}
          >
            {title}
          </Text>
        </View>
      ) : (
        <GlassView
          style={[
            getContainerStyle(),
            {
              paddingHorizontal: sizeStyles.paddingHorizontal,
              paddingVertical: sizeStyles.paddingVertical,
              minWidth: sizeStyles.minWidth,
            },
          ]}
          glassEffectStyle="thick"
          isInteractive={true}
          tint={theme === 'dark' ? 'dark' : 'light'}
        >
          <View
            style={[
              styles.buttonContent,
              {
                backgroundColor: `${buttonColors.backgroundColor}30`, // 30 for transparency
              },
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: buttonColors.textColor,
                  fontSize: sizeStyles.fontSize,
                },
              ]}
            >
              {title}
            </Text>
          </View>
        </GlassView>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContent: {
    borderRadius: 20, // Match the container
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  buttonText: {
    fontWeight: Platform.OS === 'android' ? '500' : '600',
    textAlign: 'center',
    letterSpacing: Platform.OS === 'android' ? 0.5 : 0,
  },
});
