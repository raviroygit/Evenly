import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { ResponsiveLiquidGlassCard } from '../../components/ui/ResponsiveLiquidGlassCard';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';
import { AddTransactionModal } from '../../components/modals/AddTransactionModal';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { TransactionDetailModal } from '../../components/modals/TransactionDetailModal';
import { ImageViewer } from '../../components/ui/ImageViewer';
import { CustomerInfoModal } from '../../components/modals/CustomerInfoModal';
import { ShareBalanceModal } from '../../components/modals/ShareBalanceModal';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { SkeletonTransactionList } from '../../components/ui/SkeletonLoader';
import { AppCache } from '../../utils/cache';
import { PullToRefreshSpinner } from '../../components/ui/PullToRefreshSpinner';
import { PullToRefreshScrollView } from '../../components/ui/PullToRefreshScrollView';
import { createPullToRefreshHandlers } from '../../utils/pullToRefreshUtils';
import { SwipeActionRow } from '../../components/ui/SwipeActionRow';
import { useSwipeAction } from '../../contexts/SwipeActionContext';
import { generateKhataBalanceMessage } from '../../utils/messageTemplates';

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
  const { setActiveSwipeId } = useSwipeAction();
  const [customer, setCustomer] = useState<{
    id: string;
    name: string;
    initials: string;
    balance: string;
    type: 'give' | 'get' | 'settled';
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'give' | 'get'>('give');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showCustomerInfoModal, setShowCustomerInfoModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          notes: customerData.notes,
          createdAt: customerData.createdAt,
          updatedAt: customerData.updatedAt,
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

        // Force cache bypass to get fresh data
        const [customerData, transactionsData] = await Promise.all([
          EvenlyBackendService.getKhataCustomerById(params.customerId, { cacheTTLMs: 0 }),
          EvenlyBackendService.getKhataCustomerTransactions(params.customerId, { cacheTTLMs: 0 }),
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

  const handleUpdateTransaction = async (transactionId: string, data: FormData, onProgress?: (progress: number) => void) => {
    console.log('[CustomerDetailScreen] ========== UPDATE TRANSACTION START ==========');
    console.log('[CustomerDetailScreen] Transaction ID:', transactionId);
    console.log('[CustomerDetailScreen] Data is FormData:', data instanceof FormData);
    console.log('[CustomerDetailScreen] Progress callback provided:', !!onProgress);

    try {
      console.log('[CustomerDetailScreen] Calling updateKhataTransaction...');
      const result = await EvenlyBackendService.updateKhataTransaction(transactionId, data, onProgress);
      console.log('[CustomerDetailScreen] ✅ Update successful:', result);

      setEditingTransaction(null);

      // Refresh data with cache bypass
      if (params.customerId) {
        console.log('[CustomerDetailScreen] Refreshing customer data...');
        setLoading(true);
        const [customerData, transactionsData] = await Promise.all([
          EvenlyBackendService.getKhataCustomerById(params.customerId, { cacheTTLMs: 0 }),
          EvenlyBackendService.getKhataCustomerTransactions(params.customerId, { cacheTTLMs: 0 }),
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
        setLoading(false);
        console.log('[CustomerDetailScreen] Data refresh complete');
      }
    } catch (error: any) {
      console.error('[CustomerDetailScreen] ========== UPDATE TRANSACTION FAILED ==========');
      console.error('[CustomerDetailScreen] Error type:', error.constructor.name);
      console.error('[CustomerDetailScreen] Error message:', error.message);
      console.error('[CustomerDetailScreen] Error code:', error.code);
      console.error('[CustomerDetailScreen] Error response:', error.response?.data);
      console.error('[CustomerDetailScreen] Error status:', error.response?.status);
      console.error('[CustomerDetailScreen] Full error:', error);
      Alert.alert('Error', 'Failed to update transaction. Please try again.');
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setDeletingTransactionId(transactionId);
    setShowDeleteModal(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!deletingTransactionId) return;

    try {
      setLoading(true);
      await EvenlyBackendService.deleteKhataTransaction(deletingTransactionId);

      // Refresh data with cache bypass
      if (params.customerId) {
        const [customerData, transactionsData] = await Promise.all([
          EvenlyBackendService.getKhataCustomerById(params.customerId, { cacheTTLMs: 0 }),
          EvenlyBackendService.getKhataCustomerTransactions(params.customerId, { cacheTTLMs: 0 }),
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
      }

      setLoading(false);
      // Modal will close automatically, show success alert
      Alert.alert('Success', 'Transaction deleted successfully');
    } catch (error) {
      console.error('[CustomerDetailScreen] Error deleting transaction:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to delete transaction. Please try again.');
      throw error; // Re-throw to prevent modal from closing
    }
  };

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleImagePress = () => {
    // Close detail modal first
    setShowDetailModal(false);
    // Then open image viewer with a small delay
    setTimeout(() => {
      setShowImageViewer(true);
    }, 300);
  };

  const handleImageViewerClose = () => {
    setShowImageViewer(false);
    // Reopen detail modal after image viewer closes
    setTimeout(() => {
      setShowDetailModal(true);
    }, 300);
  };

  const onRefresh = useCallback(async () => {
    console.log('CustomerDetailScreen: onRefresh called');
    await loadData(true);
  }, [loadData]);

  // Create pull-to-refresh handlers using utility function
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag } = createPullToRefreshHandlers({
    onRefresh,
    refreshing,
  });

  return (
    <>
      <PullToRefreshSpinner refreshing={refreshing} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, {
          backgroundColor: theme === 'dark' ? '#1A1A1A' : '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: theme === 'dark' ? '#2A2A2A' : '#E5E5E5',
        }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCustomerInfoModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {customerInitials}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: colors.foreground }]}>{customerName}</Text>
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>View details</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => setShowShareModal(true)}
              >
                <Ionicons name="share-outline" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <PullToRefreshScrollView
          refreshing={refreshing}
          onRefresh={onRefresh}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Summary Card */}
        <View style={styles.summaryContainer}>
          <ResponsiveLiquidGlassCard
            padding={{ small: 8, medium: 10, large: 12 }}
            marginBottom={0}
            marginHorizontal={0}
            borderRadius={{ small: 16, medium: 18, large: 20 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, {
                color: customer?.type === 'give' ? '#10B981' : customer?.type === 'get' ? '#FF3B30' : colors.foreground
              }]}>
                {customer?.type === 'get' ? 'You will give' : customer?.type === 'give' ? 'You will get' : 'Settled'}
              </Text>
              <Text style={[styles.summaryAmount, {
                color: customer?.type === 'give' ? '#10B981' : customer?.type === 'get' ? '#FF3B30' : colors.foreground
              }]}>
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
            <SwipeActionRow
              key={transaction.id}
              swipeId={`transaction-${transaction.id}`}
              actions={[
                {
                  id: 'edit',
                  title: 'Edit',
                  icon: 'pencil-outline',
                  color: '#FFFFFF',
                  backgroundColor: '#FF9500',
                  onPress: () => {
                    setEditingTransaction(transaction);
                  },
                },
                {
                  id: 'delete',
                  title: 'Delete',
                  icon: 'trash-outline',
                  color: '#FFFFFF',
                  backgroundColor: '#FF3B30',
                  onPress: () => {
                    handleDeleteTransaction(transaction.id);
                  },
                },
              ]}
              onActionExecuted={() => {
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    setActiveSwipeId(null);
                  });
                });
              }}
            >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleTransactionPress(transaction)}
            >
              <ResponsiveLiquidGlassCard
                padding={{ small: 6, medium: 8, large: 10 }}
                marginBottom={0}
                borderRadius={{ small: 12, medium: 14, large: 16 }}
              >
                <View style={styles.transactionRow}>
                  {/* Image thumbnail - only show if exists */}
                  {transaction.imageUrl && (
                    <View style={styles.attachmentThumbnail}>
                      <Image
                        source={{ uri: transaction.imageUrl }}
                        style={styles.attachmentImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  {/* Content area with badges */}
                  <View style={styles.transactionContent}>
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

                  {/* Amount on the right */}
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
            </TouchableOpacity>
            </SwipeActionRow>
            ))
          )}
        </View>
        </PullToRefreshScrollView>

        {/* Floating Action Buttons */}
        <FloatingActionButton
          actions={[
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

        {/* Add/Edit Transaction Modal */}
        {customer?.id && (
          <AddTransactionModal
            visible={showTransactionModal || !!editingTransaction}
            onClose={() => {
              setShowTransactionModal(false);
              setEditingTransaction(null);
            }}
            onSuccess={handleTransactionAdded}
            customerId={customer.id}
            transactionType={transactionType}
            editTransaction={editingTransaction}
            onUpdateTransaction={handleUpdateTransaction}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          visible={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingTransactionId(null);
          }}
          onConfirm={confirmDeleteTransaction}
          title="Delete Transaction"
          description="Are you sure you want to delete this transaction? This action cannot be undone."
        />

        {/* Transaction Detail Modal */}
        <TransactionDetailModal
          visible={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          onImagePress={handleImagePress}
        />

        {/* Image Viewer */}
        {selectedTransaction?.imageUrl && (
          <ImageViewer
            visible={showImageViewer}
            imageUrl={selectedTransaction.imageUrl}
            onClose={handleImageViewerClose}
          />
        )}

        {/* Customer Info Modal */}
        <CustomerInfoModal
          visible={showCustomerInfoModal}
          onClose={() => setShowCustomerInfoModal(false)}
          customer={customer}
        />

        {/* Share Balance Modal */}
        {customer && (
          <ShareBalanceModal
            visible={showShareModal}
            onClose={() => setShowShareModal(false)}
            message={generateKhataBalanceMessage({
              name: customer.name,
              amount: formatAmount(Math.abs(parseFloat(customer.balance)).toString()),
              type: customer.type,
            })}
            phoneNumber={customer.phone}
            recipientName={customer.name}
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 7 : 20,
    paddingBottom: 8,
    paddingLeft: 20,
    paddingRight: 20,
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
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    padding: 4,
  },
  scrollContent: {
    paddingTop: 6,
    paddingHorizontal: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  summaryContainer: {
    marginBottom: 6,
  },
  summaryCard: {
    minHeight: 45,
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
    gap: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 50,
  },
  attachmentThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  badgesRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
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
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 80,
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


