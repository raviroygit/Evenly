import React from 'react';
import { View, Text } from 'react-native';
import { LiquidGlassCard, LiquidGlassCardVariants } from './LiquidGlassCard';
import { ResponsiveLiquidGlassCard, ResponsiveLiquidGlassCardVariants } from './ResponsiveLiquidGlassCard';

// Example usage of LiquidGlassCard components
export const LiquidGlassCardExamples = () => {
  return (
    <View style={{ padding: 20, gap: 16 }}>
      {/* Basic LiquidGlassCard */}
      <LiquidGlassCard padding={16} borderRadius={12}>
        <Text>Basic Liquid Glass Card</Text>
      </LiquidGlassCard>

      {/* Card with custom tint */}
      <LiquidGlassCard padding={20} tint="light" borderRadius={16}>
        <Text>Light Tint Glass Effect</Text>
      </LiquidGlassCard>

      {/* Card with press handler */}
      <LiquidGlassCard 
        padding={16} 
        onPress={() => {}}
        borderRadius={12}
      >
        <Text>Pressable Glass Card</Text>
      </LiquidGlassCard>

      {/* Using predefined variants */}
      <LiquidGlassCardVariants.large>
        <Text>Large Variant Card</Text>
      </LiquidGlassCardVariants.large>

      <LiquidGlassCardVariants.light>
        <Text>Light Tint Glass Effect</Text>
      </LiquidGlassCardVariants.light>

      {/* Responsive card that adapts to screen size */}
      <ResponsiveLiquidGlassCard
        padding={{
          small: 12,
          medium: 16,
          large: 20,
          tablet: 24,
        }}
        borderRadius={{
          small: 12,
          medium: 16,
          large: 18,
          tablet: 20,
        }}
      >
        <Text>Responsive Glass Card</Text>
      </ResponsiveLiquidGlassCard>

      {/* Using responsive variants */}
      <ResponsiveLiquidGlassCardVariants.adaptive>
        <Text>Adaptive Responsive Card</Text>
      </ResponsiveLiquidGlassCardVariants.adaptive>

      <ResponsiveLiquidGlassCardVariants.compact>
        <Text>Compact Responsive Card</Text>
      </ResponsiveLiquidGlassCardVariants.compact>

      <ResponsiveLiquidGlassCardVariants.spacious>
        <Text>Spacious Responsive Card</Text>
      </ResponsiveLiquidGlassCardVariants.spacious>
    </View>
  );
};
