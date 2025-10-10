import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  glassStyle?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const GlassActionButton: React.FC<GlassActionButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  style,
  glassStyle,
  disabled = false,
  loading = false,
  icon,
}) => {
  const { colors } = useTheme();

  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'transparent', // Outlined style for both platforms
          textColor: colors.primary, // Primary color for outlined text
          borderColor: colors.primary, // Primary color border for outlined style
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent', // Outlined style for both platforms
          textColor: colors.foreground, // Foreground color for outlined text
          borderColor: colors.border, // Border color for outlined style
        };
      case 'success':
        return {
          backgroundColor: 'transparent', // Outlined style for both platforms
          textColor: '#10B981', // Success color for outlined text
          borderColor: '#10B981', // Success color border for outlined style
        };
      case 'warning':
        return {
          backgroundColor: 'transparent', // Outlined style for both platforms
          textColor: '#F59E0B', // Warning color for outlined text
          borderColor: '#F59E0B', // Warning color border for outlined style
        };
      case 'destructive':
        return {
          backgroundColor: 'transparent', // Outlined style for both platforms
          textColor: colors.destructive, // Destructive color for outlined text
          borderColor: colors.destructive, // Destructive color border for outlined style
        };
      default:
        return {
          backgroundColor: 'transparent', // Outlined style for both platforms
          textColor: colors.primary, // Primary color for outlined text
          borderColor: colors.primary, // Primary color border for outlined style
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

  const getContainerStyle = () => {
    return {
      borderRadius: sizeStyles.borderRadius,
      overflow: 'hidden' as const,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
      minWidth: sizeStyles.minWidth,
      opacity: disabled || loading ? 0.6 : 1,
      backgroundColor: buttonColors.backgroundColor,
      borderWidth: 2,
      borderColor: buttonColors.borderColor,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      ...glassStyle,
    };
  };

  const renderButton = () => (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={style}
    >
      <View style={getContainerStyle()}>
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
    </TouchableOpacity>
  );

  return renderButton();
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