import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { ResponsiveLiquidGlassCard } from '../../components/ui/ResponsiveLiquidGlassCard';
import { SwipeActionRow } from '../../components/ui/SwipeActionRow';
import { CustomerFilterModal, FilterType, SortType } from '../../components/modals/CustomerFilterModal';
import { AddCustomerModal } from '../../components/modals/AddCustomerModal';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';
import { useRouter } from 'expo-router';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { SkeletonCustomerList } from '../../components/ui/SkeletonLoader';
import { useSwipeAction } from '../../contexts/SwipeActionContext';
import { PullToRefreshSpinner } from '../../components/ui/PullToRefreshSpinner';
import { PullToRefreshScrollView } from '../../components/ui/PullToRefreshScrollView';
import { createPullToRefreshHandlers } from '../../utils/pullToRefreshUtils';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  initials: string;
  amount: string;
  timestamp: string;
  type: 'give' | 'get' | 'settled';
  balance: string;
}

export const BooksScreen: React.FC = () => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { setActiveSwipeId } = useSwipeAction();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<{ id: string; name: string } | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('most-recent');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ totalGive: '0.00', totalGet: '0.00' });

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeAgo = (date: string): string => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  const loadCustomers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const [customersData, summaryData] = await Promise.all([
        EvenlyBackendService.getKhataCustomers({
          search: searchQuery || undefined,
          filterType,
          sortType,
        }),
        EvenlyBackendService.getKhataFinancialSummary(),
      ]);

      const formattedCustomers: Customer[] = customersData.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        initials: getInitials(c.name),
        amount: parseFloat(c.balance).toFixed(2),
        timestamp: formatTimeAgo(c.updatedAt),
        type: c.type,
        balance: c.balance,
      }));

      setCustomers(formattedCustomers);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filterType, sortType]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN').format(numAmount);
  };

  const handleAddCustomer = () => {
    setShowAddCustomerModal(true);
  };

  const handleCustomerAdded = async () => {
    // Refresh the customer list after adding a new customer
    // Force fresh data by bypassing cache
    setLoading(true);
    try {
      const [customersData, summaryData] = await Promise.all([
        EvenlyBackendService.getKhataCustomers({
          search: searchQuery || undefined,
          filterType,
          sortType,
          cacheTTLMs: 0, // Bypass cache to get fresh data
        }),
        EvenlyBackendService.getKhataFinancialSummary(),
      ]);

      const formattedCustomers: Customer[] = customersData.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        initials: getInitials(c.name),
        amount: parseFloat(c.balance).toFixed(2),
        timestamp: formatTimeAgo(c.updatedAt),
        type: c.type,
        balance: c.balance,
      }));

      setCustomers(formattedCustomers);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    console.log('BooksScreen: onRefresh called');
    await loadCustomers(true);
  }, [loadCustomers]);

  // Create pull-to-refresh handlers using utility function
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag } = createPullToRefreshHandlers({
    onRefresh,
    refreshing,
  });

  const handleUpdateCustomer = async (customerId: string, data: { name: string; email?: string; phone?: string }) => {
    try {
      await EvenlyBackendService.updateKhataCustomer(customerId, data);
      setEditingCustomer(null);

      // Reload customers with fresh data (bypass cache)
      const [customersData, summaryData] = await Promise.all([
        EvenlyBackendService.getKhataCustomers({
          search: searchQuery || undefined,
          filterType,
          sortType,
          cacheTTLMs: 0, // Bypass cache to get fresh data
        }),
        EvenlyBackendService.getKhataFinancialSummary(),
      ]);

      const formattedCustomers: Customer[] = customersData.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        initials: getInitials(c.name),
        amount: parseFloat(c.balance).toFixed(2),
        timestamp: formatTimeAgo(c.updatedAt),
        type: c.type,
        balance: c.balance,
      }));

      setCustomers(formattedCustomers);
      setSummary(summaryData);
    } catch (error) {
      console.error('[BooksScreen] Error updating customer:', error);
      Alert.alert('Error', 'Failed to update customer. Please try again.');
    }
  };

  const handleDeleteCustomer = (customerId: string, customerName: string) => {
    setDeletingCustomer({ id: customerId, name: customerName });
    setShowDeleteModal(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!deletingCustomer) return;

    try {
      setLoading(true);
      await EvenlyBackendService.deleteKhataCustomer(deletingCustomer.id);

      // Reload customers with fresh data (bypass cache)
      const [customersData, summaryData] = await Promise.all([
        EvenlyBackendService.getKhataCustomers({
          search: searchQuery || undefined,
          filterType,
          sortType,
          cacheTTLMs: 0, // Bypass cache to get fresh data
        }),
        EvenlyBackendService.getKhataFinancialSummary(),
      ]);

      const formattedCustomers: Customer[] = customersData.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        initials: getInitials(c.name),
        amount: parseFloat(c.balance).toFixed(2),
        timestamp: formatTimeAgo(c.updatedAt),
        type: c.type,
        balance: c.balance,
      }));

      setCustomers(formattedCustomers);
      setSummary(summaryData);
      setLoading(false);

      // Modal will close automatically, show success alert
      Alert.alert('Success', `"${deletingCustomer.name}" and all their transactions have been deleted successfully`);
    } catch (error) {
      console.error('[BooksScreen] Error deleting customer:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to delete customer. Please try again.');
      throw error; // Re-throw to prevent modal from closing
    }
  };


  return (
    <>
      <PullToRefreshSpinner refreshing={refreshing} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <PullToRefreshScrollView
          refreshing={refreshing}
          onRefresh={onRefresh}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Financial Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCardWrapper}>
            <ResponsiveLiquidGlassCard
              padding={{ small: 12, medium: 14, large: 16 }}
              marginBottom={0}
              marginHorizontal={0}
              borderRadius={{ small: 16, medium: 18, large: 20 }}
              style={styles.summaryCard}
            >
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                You will get
              </Text>
              <Text style={[styles.summaryAmount, { color: colors.foreground }]}>
                ₹{formatAmount(summary.totalGive)}
              </Text>

            </ResponsiveLiquidGlassCard>
          </View>

          <View style={styles.summaryCardWrapper}>
            <ResponsiveLiquidGlassCard
              padding={{ small: 12, medium: 14, large: 16 }}
              marginBottom={0}
              marginHorizontal={0}
              borderRadius={{ small: 16, medium: 18, large: 20 }}
              style={styles.summaryCard}
            >
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                You will give
              </Text>
              <Text style={[styles.summaryAmount, { color: '#FF3B30' }]}>
                ₹{formatAmount(summary.totalGet)}
              </Text>

            </ResponsiveLiquidGlassCard>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8' }]}>
            <Ionicons name="search-outline" size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search Customer"
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8' }]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options-outline" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8' }]}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Customer List */}
        <View style={styles.listContainer}>
          {loading ? (
            <SkeletonCustomerList count={5} />
          ) : customers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No customers found
              </Text>
            </View>
          ) : (
            customers.map((customer) => (
              <SwipeActionRow
                key={customer.id}
                swipeId={`customer-${customer.id}`}
                actions={[
                  {
                    id: 'edit',
                    title: 'Edit',
                    icon: 'pencil-outline',
                    color: '#FFFFFF',
                    backgroundColor: '#FF9500',
                    onPress: () => {
                      setEditingCustomer(customer);
                    },
                  },
                  {
                    id: 'delete',
                    title: 'Delete',
                    icon: 'trash-outline',
                    color: '#FFFFFF',
                    backgroundColor: '#FF3B30',
                    onPress: () => {
                      handleDeleteCustomer(customer.id, customer.name);
                    },
                  },
                ]}
                onPress={() => {
                  router.push({
                    pathname: '/tabs/books/[customerId]',
                    params: {
                      customerId: customer.id,
                      customerName: customer.name,
                      customerInitials: customer.initials,
                    },
                  } as any);
                }}
                onActionExecuted={() => {
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      setActiveSwipeId(null);
                    });
                  });
                }}
              >
                <ResponsiveLiquidGlassCard
                  padding={{ small: 12, medium: 16, large: 20 }}
                  marginBottom={0}
                  borderRadius={{ small: 12, medium: 14, large: 16 }}
                >
                  <View style={styles.customerRow}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {customer.initials}
                      </Text>
                    </View>
                    <View style={styles.customerInfo}>
                      <Text style={[styles.customerName, { color: colors.foreground }]}>
                        {customer.name}
                      </Text>
                      <Text style={[styles.customerTimestamp, { color: colors.mutedForeground }]}>
                        {customer.timestamp}
                      </Text>
                    </View>
                    <View style={styles.customerAmount}>
                      <Text style={[styles.amountText, { color: '#FF3B30' }]}>
                        ₹{formatAmount(Math.abs(parseFloat(customer.balance)))}
                      </Text>
                      <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>
                        You&apos;ll {customer.type === 'get' ? 'Give' : customer.type === 'give' ? 'Get' : 'Settled'}
                      </Text>
                    </View>
                  </View>
                </ResponsiveLiquidGlassCard>
              </SwipeActionRow>
            ))
          )}
        </View>
        </PullToRefreshScrollView>

        {/* Floating Action Button */}
        <FloatingActionButton
          actions={[
            {
              id: 'add-customer',
              title: 'Add Customer',
              icon: '👤',
              onPress: handleAddCustomer,
            },
          ]}
          position="bottom-right"
        />

        {/* Filter Modal */}
        <CustomerFilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApply={(filter, sort) => {
            setFilterType(filter);
            setSortType(sort);
            setShowFilterModal(false);
          }}
          currentFilter={filterType}
          currentSort={sortType}
        />

        {/* Add/Edit Customer Modal */}
        <AddCustomerModal
          visible={showAddCustomerModal || !!editingCustomer}
          onClose={() => {
            setShowAddCustomerModal(false);
            setEditingCustomer(null);
          }}
          onSuccess={handleCustomerAdded}
          editCustomer={editingCustomer}
          onUpdateCustomer={handleUpdateCustomer}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          visible={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingCustomer(null);
          }}
          onConfirm={confirmDeleteCustomer}
          title="Delete Customer"
          description={`Are you sure you want to delete "${deletingCustomer?.name}"? This will also delete all transactions with this customer. This action cannot be undone.`}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 10 : 12,
    paddingBottom: 100,
    flexGrow: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  summaryCardWrapper: {
    flex: 1,
  },
  summaryCard: {
    minHeight: 80,
    width: '100%',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    gap: 6,
    paddingHorizontal: 20,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerTimestamp: {
    fontSize: 12,
  },
  customerAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 12,
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


