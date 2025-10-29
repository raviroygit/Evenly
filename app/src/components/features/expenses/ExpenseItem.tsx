import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { ResponsiveLiquidGlassCard } from '../../ui/ResponsiveLiquidGlassCard';
import { SwipeActionRow } from '../../ui/SwipeActionRow';
import { EnhancedExpense } from '../../../types';
import { formatHumanDateTime } from '../../../utils/date';

interface ExpenseItemProps {
  item: EnhancedExpense;
  groupName?: string;
  onPress?: () => void;
  onEditExpense?: (expense: EnhancedExpense) => void;
  onDeleteExpense?: (expenseId: string, expenseTitle: string) => void;
  onActionExecuted?: () => void;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({ 
  item, 
  groupName, 
  onPress, 
  onEditExpense, 
  onDeleteExpense,
  onActionExecuted
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Check if current user is the one who paid for the expense
  const isPayer = user && item.paidBy === user.id;

  // Show permission alert for non-payers
  const showPermissionAlert = (action: string) => {
    Alert.alert(
      'Permission Denied',
      `You don't have permission to ${action} this expense because you didn't add it. Only the person who added the expense can ${action} it.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  // Prepare swipe actions - show all buttons but check permissions
  const swipeActions = [
    ...(onEditExpense ? [{
      id: 'edit',
      title: 'Edit',
      icon: 'pencil-outline',
      color: '#FFFFFF',
      backgroundColor: '#FF9500', // Orange for edit
      onPress: () => {
        if (isPayer) {
          console.log('=== ExpenseItem: Edit action pressed ===');
          console.log('Expense:', item.title, item.id);
          console.log('onEditExpense function:', typeof onEditExpense);
          onEditExpense(item);
          console.log('=== ExpenseItem: Edit action completed ===');
        } else {
          showPermissionAlert('edit');
        }
      },
    }] : []),
    ...(onDeleteExpense ? [{
      id: 'delete',
      title: 'Delete',
      icon: 'trash-outline',
      color: '#FFFFFF',
      backgroundColor: '#FF3B30', // Red for delete
      onPress: () => {
        if (isPayer) {
          console.log('=== ExpenseItem: Delete action pressed ===');
          console.log('Expense:', item.title, item.id);
          console.log('onDeleteExpense function:', typeof onDeleteExpense);
          onDeleteExpense(item.id, item.title);
          console.log('=== ExpenseItem: Delete action completed ===');
        } else {
          showPermissionAlert('delete');
        }
      },
    }] : []),
  ];

  const content = (
    <ResponsiveLiquidGlassCard
      padding={{
        small: 12,
        medium: 16,
        large: 20,
        tablet: 24,
      }}
      marginBottom={4}
      borderRadius={{
        small: 12,
        medium: 14,
        large: 16,
        tablet: 18,
      }}
      // glassEffectStyle="regular"
      onPress={onPress}
      style={styles.expenseCardOverrides}
    >
      <View style={styles.content}>
        {/* Main Content Row */}
        <View style={styles.mainRow}>
          {/* Left Section */}
          <View style={styles.leftSection}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {item.title}
            </Text>
            <Text style={[styles.paidBy, { color: colors.mutedForeground }]}>
              {item.paidByDisplay || (item.paidByUser ? `${item.paidByUser.name.split(' ')[0]} paid` : 'Paid')} ₹{item.totalAmount ? (typeof item.totalAmount === 'string' ? parseFloat(item.totalAmount) : item.totalAmount).toFixed(2) : '0.00'}
            </Text>
            {/* Badges Row: Group + Date-Time */}
            <View style={styles.groupBadgeContainer}>
              {groupName && (
                <View style={[styles.groupBadge, { backgroundColor: '#2196F3' + '20' }]}> 
                  <Text style={[styles.groupBadgeText, { color: '#2196F3' }]}> 
                    {groupName}
                  </Text>
                </View>
              )}
              {!!item.date && (
                <View style={[styles.groupBadge, { backgroundColor: '#6B7280' + '20' }]}> 
                  <Text style={[styles.groupBadgeText, { color: '#6B7280' }]}> 
                    {formatHumanDateTime(item.date as any)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Right Section */}
          <View style={styles.rightSection}>
            {item.netBalance ? (
              <>
                <Text style={[styles.statusText, { color: item.netBalance.color }]}>
                  {item.netBalance.text.includes('you lent') ? 'You Lent' : 
                   item.netBalance.text.includes('you borrowed') ? 'You Borrowed' : 
                   item.netBalance.text}
                </Text>
                <Text style={[styles.amountText, { color: item.netBalance.color }]}>
                  ₹{item.netBalance.amount.toFixed(2)}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                  Even
                </Text>
                <Text style={[styles.amountText, { color: colors.mutedForeground }]}>
                  ₹0.00
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    </ResponsiveLiquidGlassCard>
  );

  // If there are actions, wrap with SwipeActionRow
  if (swipeActions.length > 0) {
    return (
      <SwipeActionRow 
        actions={swipeActions} 
        swipeId={`expense-${item.id}`}
        onActionExecuted={onActionExecuted}
      >
        {content}
      </SwipeActionRow>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  expenseCardOverrides: {
   
    // Only override specific properties, don't override glassmorphism
    // The ResponsiveLiquidGlassCard will handle the glassmorphism styling
  },
  content: {
    flexDirection: 'column',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Changed from 'center' to 'flex-start' for better alignment
  },
  leftSection: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  paidBy: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
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
