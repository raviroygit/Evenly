import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { ResponsiveLiquidGlassCard } from '../../ui/ResponsiveLiquidGlassCard';

interface ExpenseSummaryProps {
  totalExpenses: number;
  totalIncome: number;
  netBalance?: number;
}

export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  totalExpenses,
  totalIncome,
  netBalance,
}) => {
  const { colors } = useTheme();
  
  // Calculate wider card width
  const screenWidth = Dimensions.get('window').width;
  const horizontalPadding = 40; // 20px on each side (handled by parent container)
  const cardGaps = 24; // 12px gap between each card (2 gaps for 3 cards)
  const availableWidth = screenWidth - horizontalPadding - cardGaps;
  const cardWidth = Math.floor(availableWidth / 3); // Divide by 3 for 3 cards
  
  return (
    <View style={styles.container}>
      <ResponsiveLiquidGlassCard
        padding={{
          small: 12,
          medium: 16,
          large: 20,
          tablet: 24,
        }}
        borderRadius={{
          small: 12,
          medium: 14,
          large: 16,
          tablet: 18,
        }}
        glassEffectStyle="clear"
        isInteractive={false}
        style={{ ...styles.card, alignItems: 'center', width: cardWidth, minHeight: 100 }}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Total Expenses
        </Text>
        <Text style={[styles.amount, { color: colors.destructive }]}>
          ${totalExpenses.toFixed(2)}
        </Text>
      </ResponsiveLiquidGlassCard>

      <ResponsiveLiquidGlassCard
        padding={{
          small: 12,
          medium: 16,
          large: 20,
          tablet: 24,
        }}
        borderRadius={{
          small: 12,
          medium: 14,
          large: 16,
          tablet: 18,
        }}
        glassEffectStyle="clear"
        isInteractive={false}
        style={{ ...styles.card, alignItems: 'center', width: cardWidth, minHeight: 100 }}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Total Income
        </Text>
        <Text style={[styles.amount, { color: '#007AFF' }]}>
          ${totalIncome.toFixed(2)}
        </Text>
      </ResponsiveLiquidGlassCard>

      {netBalance !== undefined && (
        <ResponsiveLiquidGlassCard
          padding={{
            small: 12,
            medium: 16,
            large: 20,
            tablet: 24,
          }}
          borderRadius={{
            small: 12,
            medium: 14,
            large: 16,
            tablet: 18,
          }}
          glassEffectStyle="clear"
          isInteractive={false}
          style={{ ...styles.card, alignItems: 'center', width: cardWidth, minHeight: 100 }}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>
            Net Balance
          </Text>
          <Text style={[
            styles.amount, 
            { color: netBalance >= 0 ? '#10B981' : colors.destructive }
          ]}>
            ${netBalance.toFixed(2)}
          </Text>
        </ResponsiveLiquidGlassCard>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    opacity: 0.8,
    textAlign: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
