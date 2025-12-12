import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { ResponsiveLiquidGlassCard } from '../../components/ui/ResponsiveLiquidGlassCard';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';
import { AddTransactionModal } from '../../components/modals/AddTransactionModal';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { SkeletonTransactionList } from '../../components/ui/SkeletonLoader';
import { AppCache } from '../../utils/cache';

interface Transaction {
  id: string;
  date: string;
  time: string;
  balance: string;
  amountGiven: string;
  amountGot: string;
  hasAttachment: boolean;
  imageUrl?: string;
}

export const CustomerDetailScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ customerId?: string; customerName?: string; customerInitials?: string }>();
  const { colors, theme } = useTheme();
  const [customer, setCustomer] = useState<{
    id: string;
    name: string;
    initials: string;
    balance: string;
    type: 'give' | 'get' | 'settled';
  } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'give' | 'get'>('give');

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string): { date: string; time: string } => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date: dateStr, time: timeStr };
  };

  const formatAmount = (amount: string): string => {
    return new Intl.NumberFormat('en-IN').format(parseFloat(amount));
  };

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      if (params.customerId) {
        const [customerData, transactionsData] = await Promise.all([
          EvenlyBackendService.getKhataCustomerById(params.customerId),
          EvenlyBackendService.getKhataCustomerTransactions(params.customerId),
        ]);

        setCustomer({
          id: customerData.id,
          name: customerData.name,
          initials: getInitials(customerData.name),
          balance: customerData.balance,
          type: customerData.type,
        });

        const formattedTransactions: Transaction[] = transactionsData.map((t) => {
          const { date, time } = formatDate(t.transactionDate);
          return {
            id: t.id,
            date,
            time,
            balance: formatAmount(Math.abs(parseFloat(t.balance)).toString()),
            amountGiven: t.type === 'give' ? formatAmount(t.amount) : '',
            amountGot: t.type === 'get' ? formatAmount(t.amount) : '',
            hasAttachment: !!t.imageUrl,
            imageUrl: t.imageUrl || undefined,
          };
        });

        setTransactions(formattedTransactions);
      } else {
        // Fallback to params if customerId not available
        setCustomer({
          id: '',
          name: params.customerName || 'Customer',
          initials: params.customerInitials || 'CU',
          balance: '0.00',
          type: 'settled',
        });
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.customerId, params.customerName, params.customerInitials]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.customerId]);

  const customerName = customer?.name || params.customerName || 'Customer';
  const customerInitials = customer?.initials || params.customerInitials || 'CU';
  const totalAmount = customer ? formatAmount(Math.abs(parseFloat(customer.balance)).toString()) : '0';

  const handleBack = () => {
    router.back();
  };

  const handleYouGave = () => {
    setTransactionType('give');
    setShowTransactionModal(true);
  };

  const handleYouGot = () => {
    setTransactionType('get');
    setShowTransactionModal(true);
  };

  const handleTransactionAdded = async () => {
    // Refresh customer data and transactions
    if (params.customerId) {
      try {
        // Show skeleton loader while refreshing
        setLoading(true);
        
        // Manually invalidate cache to ensure fresh data
        await AppCache.invalidateByPrefixes(['/khata']);
        
        // Small delay to ensure cache invalidation completes
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const [customerData, transactionsData] = await Promise.all([
          EvenlyBackendService.getKhataCustomerById(params.customerId),
          EvenlyBackendService.getKhataCustomerTransactions(params.customerId),
        ]);

        setCustomer({
          id: customerData.id,
          name: customerData.name,
          initials: getInitials(customerData.name),
          balance: customerData.balance,
          type: customerData.type,
        });

        const formattedTransactions: Transaction[] = transactionsData.map((t) => {
          const { date, time } = formatDate(t.transactionDate);
          return {
            id: t.id,
            date,
            time,
            balance: formatAmount(Math.abs(parseFloat(t.balance)).toString()),
            amountGiven: t.type === 'give' ? formatAmount(t.amount) : '',
            amountGot: t.type === 'get' ? formatAmount(t.amount) : '',
            hasAttachment: !!t.imageUrl,
            imageUrl: t.imageUrl || undefined,
          };
        });

        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Error refreshing data:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    console.log('CustomerDetailScreen: onRefresh called');
    await loadData(true);
  }, [loadData]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#000000' }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {customerInitials}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{customerName}</Text>
            <Text style={styles.headerSubtitle}>Click here to view settings.</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={Platform.OS === 'ios'}
        alwaysBounceVertical={Platform.OS === 'ios'}
        scrollEventThrottle={16}
        decelerationRate="normal"
        scrollIndicatorInsets={{ right: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Platform.OS === 'ios' ? colors.primary : undefined}
            colors={Platform.OS === 'android' ? [colors.primary] : undefined}
            enabled={true}
          />
        }
      >
        {/* Summary Card */}
        <View style={styles.summaryContainer}>
          <ResponsiveLiquidGlassCard
            padding={{ small: 12, medium: 16, large: 20 }}
            marginBottom={0}
            marginHorizontal={0}
            borderRadius={{ small: 16, medium: 18, large: 20 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.foreground }]}>
                {customer?.type === 'get' ? 'You will give' : customer?.type === 'give' ? 'You will get' : 'Settled'}
              </Text>
              <Text style={[styles.summaryAmount, { color: '#FF3B30' }]}>
                ₹{totalAmount}
              </Text>
            </View>
          </ResponsiveLiquidGlassCard>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionsContainer}>
          {loading ? (
            <SkeletonTransactionList count={5} />
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No transactions found
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => (
            <ResponsiveLiquidGlassCard
              key={transaction.id}
              padding={{ small: 10, medium: 12, large: 14 }}
              marginBottom={8}
              borderRadius={{ small: 12, medium: 14, large: 16 }}
            >
              <View style={styles.transactionRow}>
                <View style={styles.imageContainer}>
                  <View style={styles.attachmentThumbnail}>
                    {transaction.imageUrl ? (
                      <Image
                        source={{ uri: transaction.imageUrl }}
                        style={styles.attachmentImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.imagePlaceholder, { backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8' }]}>
                        <Ionicons name="image-outline" size={24} color={colors.mutedForeground} />
                      </View>
                    )}
                  </View>
                  <View style={styles.badgesRow}>
                    <View style={[styles.dateTimeBadge, { backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8' }]}>
                      <Text style={[styles.dateTimeBadgeText, { color: colors.foreground }]}>
                        {transaction.date}
                      </Text>
                      <Text style={[styles.dateTimeBadgeText, { color: colors.foreground }]}>
                        {transaction.time}
                      </Text>
                    </View>
                    <View style={[styles.balanceBadge, { 
                      backgroundColor: theme === 'dark' 
                        ? 'rgba(255, 59, 48, 0.15)' 
                        : 'rgba(255, 59, 48, 0.1)',
                      borderColor: 'rgba(255, 59, 48, 0.4)',
                      borderWidth: 1,
                    }]}>
                      <Text style={[styles.balanceBadgeText, { color: '#FF3B30' }]}>
                        ₹{transaction.balance}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  {transaction.amountGiven ? (
                    <Text style={[styles.transactionAmount, { color: '#FF3B30' }]}>
                      ₹{transaction.amountGiven}
                    </Text>
                  ) : null}
                  {transaction.amountGot ? (
                    <Text style={[styles.transactionAmount, { color: '#10B981' }]}>
                      ₹{transaction.amountGot}
                    </Text>
                  ) : null}
                </View>
              </View>
            </ResponsiveLiquidGlassCard>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <FloatingActionButton
        actions={[
          {
            id: 'add-customer',
            title: 'Add Customer',
            icon: '👤',
            onPress: () => {
              // TODO: Implement add customer functionality
              console.log('Add customer');
            },
          },
          {
            id: 'you-gave',
            title: 'You Gave ₹',
            icon: '💰',
            onPress: handleYouGave,
            color: '#D9433D',
          },
          {
            id: 'you-got',
            title: 'You Got ₹',
            icon: '💵',
            onPress: handleYouGot,
            color: '#519F51',
          },
        ]}
        position="bottom-right"
      />

      {/* Add Transaction Modal */}
      {customer?.id && (
        <AddTransactionModal
          visible={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSuccess={handleTransactionAdded}
          customerId={customer.id}
          transactionType={transactionType}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 7 : 20,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryCard: {
    minHeight: 70,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  transactionsContainer: {
    marginTop: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  imageContainer: {
    alignItems: 'flex-start',
    gap: 8,
  },
  attachmentThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeBadge: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  dateTimeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  balanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  balanceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  transactionRight: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  attachmentImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});


