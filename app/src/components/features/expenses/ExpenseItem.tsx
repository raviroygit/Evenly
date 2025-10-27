import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { ResponsiveLiquidGlassCard } from '../../ui/ResponsiveLiquidGlassCard';
import { EnhancedExpense } from '../../../types';

interface ExpenseItemProps {
  item: EnhancedExpense;
  groupName?: string;
  onPress?: () => void;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({ item, groupName, onPress }) => {
  const { colors,theme } = useTheme();
  
  return (
    <ResponsiveLiquidGlassCard
      padding={{
        small: 12,
        medium: 16,
        large: 20,
        tablet: 24,
      }}
      marginBottom={8}
      borderRadius={{
        small: 12,
        medium: 14,
        large: 16,
        tablet: 18,
      }}
      // glassEffectStyle="regular"
      isInteractive={true}
      onPress={onPress}
      style={styles.expenseCardOverrides}
    >
      <View style={styles.content}>
        {/* Row 1: Title and Status Text */}
        <View style={styles.row}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {item.title}
          </Text>
          <View style={styles.rightSection}>
            {item.netBalance ? (
              <Text style={[styles.statusText, { color: item.netBalance.color }]}>
                {item.netBalance.text.includes('you lent') ? 'You Lent' : 
                 item.netBalance.text.includes('you borrowed') ? 'You Borrowed' : 
                 item.netBalance.text}
              </Text>
            ) : (
              <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                Even
              </Text>
            )}
          </View>
        </View>
        
        {/* Row 2: Paid By and Amount */}
        <View style={styles.row}>
          <Text style={[styles.paidBy, { color: colors.mutedForeground }]}>
            {item.paidByDisplay || (item.paidByUser ? `${item.paidByUser.name.split(' ')[0]} paid` : 'Paid')} ₹{item.totalAmount ? (typeof item.totalAmount === 'string' ? parseFloat(item.totalAmount) : item.totalAmount).toFixed(2) : '0.00'}
          </Text>
          <View style={styles.rightSection}>
            {item.netBalance ? (
              <Text style={[styles.amountText, { color: item.netBalance.color }]}>
                ₹{item.netBalance.amount.toFixed(2)}
              </Text>
            ) : (
              <Text style={[styles.amountText, { color: colors.mutedForeground }]}>
                ₹0.00
              </Text>
            )}
          </View>
        </View>

        {/* Row 3: Group Badge */}
        {groupName && (
          <View style={styles.groupBadgeContainer}>
            <View style={[styles.groupBadge, { backgroundColor: '#2196F3' + '20' }]}>
              <Text style={[styles.groupBadgeText, { color: '#2196F3' }]}>
                {groupName}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ResponsiveLiquidGlassCard>
  );
};

const styles = StyleSheet.create({
  expenseCardOverrides: {
   
    // Only override specific properties, don't override glassmorphism
    // The ResponsiveLiquidGlassCard will handle the glassmorphism styling
  },
  content: {
    flexDirection: 'column',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  paidBy: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
