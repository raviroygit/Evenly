import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { ResponsiveButtonRow } from './ResponsiveButtonRow';
import { useTheme } from '../../contexts/ThemeContext';

interface ButtonConfig {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
}

interface CustomButtonConfig {
  component: React.ReactNode;
}

interface ModalButtonContainerProps {
  buttons: (ButtonConfig | CustomButtonConfig)[];
  style?: any;
  forceVertical?: boolean; // Force vertical layout regardless of screen size
}

export const ModalButtonContainer: React.FC<ModalButtonContainerProps> = ({
  buttons,
  style,
  forceVertical = false,
}) => {
  const { width } = Dimensions.get('window');
  const { colors } = useTheme();
  
  // If forceVertical is true or screen is very small, always use vertical layout
  const shouldForceVertical = forceVertical || width < 400;
  
  if (shouldForceVertical) {
    return (
      <View style={[styles.verticalContainer, style]}>
        {buttons.map((button, index) => {
          if ('component' in button) {
            return (
              <View key={index} style={styles.verticalButton}>
                {button.component}
              </View>
            );
          } else {
            // For standard buttons, preserve the original variant colors
            const getButtonColors = () => {
              switch (button.variant) {
                case 'primary':
                  return {
                    backgroundColor: 'transparent',
                    borderColor: colors.primary,
                    textColor: colors.primary,
                  };
                case 'destructive':
                  return {
                    backgroundColor: 'transparent',
                    borderColor: colors.destructive,
                    textColor: colors.destructive,
                  };
                case 'secondary':
                  return {
                    backgroundColor: 'transparent',
                    borderColor: colors.border,
                    textColor: colors.foreground,
                  };
                case 'success':
                  return {
                    backgroundColor: 'transparent',
                    borderColor: '#10B981',
                    textColor: '#10B981',
                  };
                case 'warning':
                  return {
                    backgroundColor: 'transparent',
                    borderColor: '#F59E0B',
                    textColor: '#F59E0B',
                  };
                default:
                  return {
                    backgroundColor: 'transparent',
                    borderColor: colors.primary,
                    textColor: colors.primary,
                  };
              }
            };

            const buttonColors = getButtonColors();
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.verticalButton, 
                  styles.simpleButton,
                  {
                    borderColor: buttonColors.borderColor,
                    backgroundColor: buttonColors.backgroundColor,
                  }
                ]}
                onPress={button.onPress}
                disabled={button.disabled}
              >
                {button.loading ? (
                  <ActivityIndicator 
                    size="small" 
                    color={buttonColors.textColor} 
                  />
                ) : (
                  <Text 
                    style={[styles.buttonText, { color: buttonColors.textColor }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {button.title}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }
        })}
      </View>
    );
  }
  
  // Use the responsive button row for larger screens
  return (
    <ResponsiveButtonRow
      buttons={buttons}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  verticalContainer: {
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    paddingHorizontal: 4,
  },
  verticalButton: {
    width: '100%',
    minHeight: 44,
  },
  simpleButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 16, // Add horizontal padding for better text spacing
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100, // Ensure minimum width for text
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
