import React from 'react';
import { View, StyleSheet, ViewStyle, Text } from 'react-native';
import { ResponsiveLiquidGlassCard } from './ResponsiveLiquidGlassCard';
import { PlatformActionButton } from './PlatformActionButton';

interface ActionButton {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  iconName?: string;
}

interface GlassActionCardProps {
  title?: string;
  subtitle?: string;
  buttons: ActionButton[];
  style?: ViewStyle;
  padding?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginBottom?: number;
  borderRadius?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  buttonLayout?: 'horizontal' | 'vertical' | 'grid';
}

export const GlassActionCard: React.FC<GlassActionCardProps> = ({
  title,
  subtitle,
  buttons,
  style,
  padding = {
    small: 16,
    medium: 20,
    large: 24,
    tablet: 28,
  },
  marginBottom = 24,
  borderRadius = {
    small: 16,
    medium: 18,
    large: 20,
    tablet: 22,
  },
  buttonLayout = 'horizontal',
}) => {
  const getButtonLayoutStyle = () => {
    switch (buttonLayout) {
      case 'vertical':
        return styles.verticalLayout;
      case 'grid':
        return styles.gridLayout;
      default:
        return styles.horizontalLayout;
    }
  };

  return (
    <ResponsiveLiquidGlassCard
      padding={padding}
      marginBottom={marginBottom}
      borderRadius={borderRadius}
      glassEffectStyle="thick"
      isInteractive={false}
      style={style}
    >
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
      )}
      
      <View style={[styles.buttonsContainer, getButtonLayoutStyle()]}>
        {buttons.map((button, index) => (
          <PlatformActionButton
            key={index}
            title={button.title}
            onPress={button.onPress}
            variant={button.variant}
            size={button.size}
            iconName={button.iconName as any}
          />
        ))}
      </View>
    </ResponsiveLiquidGlassCard>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  buttonsContainer: {
    gap: 12,
  },
  horizontalLayout: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  verticalLayout: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  gridLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
