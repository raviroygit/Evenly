import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { ResponsiveLiquidGlassCard } from '../../components/ui/ResponsiveLiquidGlassCard';
import { CustomerFilterModal, FilterType, SortType } from '../../components/modals/CustomerFilterModal';
import { AddCustomerModal } from '../../components/modals/AddCustomerModal';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';
import { useRouter } from 'expo-router';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { SkeletonCustomerList } from '../../components/ui/SkeletonLoader';

interface Customer {
  id: string;
  name: string;
  initials: string;
  amount: string;
  timestamp: string;
  type: 'give' | 'get' | 'settled';
  balance: string;
}

export const BooksScreen: React.FC = () => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
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

  const handleCustomerAdded = () => {
    // Refresh the customer list after adding a new customer
    loadCustomers();
  };

  const onRefresh = useCallback(async () => {
    console.log('BooksScreen: onRefresh called');
    await loadCustomers(true);
  }, [loadCustomers]);


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        {/* Financial Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCardWrapper}>
            <ResponsiveLiquidGlassCard
              padding={{ small: 16, medium: 20, large: 24 }}
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
              padding={{ small: 16, medium: 20, large: 24 }}
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
              <TouchableOpacity
                key={customer.id}
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
                activeOpacity={0.7}
              >
                <ResponsiveLiquidGlassCard
                  padding={{ small: 12, medium: 16, large: 20 }}
                  marginBottom={8}
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
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

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

      {/* Add Customer Modal */}
      <AddCustomerModal
        visible={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onSuccess={handleCustomerAdded}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingHorizontal: 20,
    gap: 16,
  },
  summaryCardWrapper: {
    flex: 1,
  },
  summaryCard: {
    minHeight: 120,
    width: '100%',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
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
    gap: 8,
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


