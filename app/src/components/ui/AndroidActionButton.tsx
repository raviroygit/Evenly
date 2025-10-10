import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

interface AndroidActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const AndroidActionButton: React.FC<AndroidActionButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  style,
  disabled = false,
  loading = false,
  icon,
}) => {
  const { colors, theme } = useTheme();

  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'transparent',
          textColor: colors.primary,
          borderColor: colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          textColor: colors.foreground,
          borderColor: colors.border,
        };
      case 'success':
        return {
          backgroundColor: 'transparent',
          textColor: '#10B981',
          borderColor: '#10B981',
        };
      case 'warning':
        return {
          backgroundColor: 'transparent',
          textColor: '#F59E0B',
          borderColor: '#F59E0B',
        };
      case 'destructive':
        return {
          backgroundColor: 'transparent',
          textColor: colors.destructive,
          borderColor: colors.destructive,
        };
      default:
        return {
          backgroundColor: 'transparent',
          textColor: colors.primary,
          borderColor: colors.primary,
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
          borderRadius: 16,
        };
      case 'large':
        return {
          paddingHorizontal: 32,
          paddingVertical: 16,
          fontSize: 18,
          minWidth: 160,
          borderRadius: 24,
        };
      default:
        return {
          paddingHorizontal: 24,
          paddingVertical: 12,
          fontSize: 16,
          minWidth: 120,
          borderRadius: 20,
        };
    }
  };

  const buttonColors = getButtonColors();
  const sizeStyles = getSizeStyles();


  const getBlurStyle = () => {
    // Remove border from BlurView to avoid double borders
    return {
      borderRadius: sizeStyles.borderRadius,
      overflow: 'hidden' as const,
    };
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={style}
    >
      <BlurView
        intensity={theme === 'dark' ? 5 : 10}
        tint={theme === 'dark' ? 'dark' : 'light'}
        style={getBlurStyle()}
      >
        <View style={[
          {
            backgroundColor: theme === 'dark' 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            borderRadius: sizeStyles.borderRadius,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            paddingVertical: sizeStyles.paddingVertical,
            minWidth: sizeStyles.minWidth,
            opacity: disabled || loading ? 0.6 : 1,
            borderWidth: 2, // Single clean border
            borderColor: (variant === 'primary' || variant === 'destructive') 
              ? buttonColors.borderColor 
              : (theme === 'dark' 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'rgba(0, 0, 0, 0.1)'),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }
        ]}>
        <View style={styles.buttonContent}>
          {loading ? (
            <ActivityIndicator 
              size="small" 
              color={buttonColors.textColor} 
              style={styles.loadingIndicator}
            />
          ) : (
            icon && <View style={styles.iconContainer}>{icon}</View>
          )}
          <Text
            style={[
              styles.buttonText,
              {
                color: buttonColors.textColor,
                fontSize: sizeStyles.fontSize,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            {loading ? 'Loading...' : title}
          </Text>
        </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  iconContainer: {
    marginRight: 8,
  },
  loadingIndicator: {
    marginRight: 8,
  },
});
