import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { ResponsiveLiquidGlassCard } from '../../components/ui/ResponsiveLiquidGlassCard';
import { CustomerFilterModal, FilterType, SortType } from '../../components/modals/CustomerFilterModal';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';
import { useRouter } from 'expo-router';

interface Customer {
  id: string;
  name: string;
  initials: string;
  amount: string;
  timestamp: string;
  type: 'give' | 'get';
}

const dummyCustomers: Customer[] = [
  {
    id: '1',
    name: 'Sujeet Mistri Bengha',
    initials: 'SM',
    amount: '1,95,000',
    timestamp: '2 hours ago',
    type: 'get',
  },
  {
    id: '2',
    name: 'Deepak',
    initials: 'D',
    amount: '11,15,000',
    timestamp: '1 years ago',
    type: 'get',
  },
  {
    id: '3',
    name: 'Rajesh Kumar',
    initials: 'RK',
    amount: '50,000',
    timestamp: '3 days ago',
    type: 'give',
  },
  {
    id: '4',
    name: 'Priya Sharma',
    initials: 'PS',
    amount: '2,00,000',
    timestamp: '1 week ago',
    type: 'get',
  },
  {
    id: '5',
    name: 'Amit Patel',
    initials: 'AP',
    amount: '75,000',
    timestamp: '2 weeks ago',
    type: 'give',
  },
];

export const BooksScreen: React.FC = () => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('most-recent');

  // Filter customers
  let filteredCustomers = dummyCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'all') {
      return matchesSearch;
    } else if (filterType === 'get') {
      return matchesSearch && customer.type === 'get';
    } else if (filterType === 'give') {
      return matchesSearch && customer.type === 'give';
    } else if (filterType === 'settled') {
      // For now, we'll treat settled as customers with 0 amount
      return matchesSearch && customer.amount === '0';
    }
    return matchesSearch;
  });

  // Sort customers
  filteredCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortType === 'most-recent') {
      // Sort by timestamp (most recent first) - dummy implementation
      return 0;
    } else if (sortType === 'oldest') {
      // Sort by timestamp (oldest first) - dummy implementation
      return 0;
    } else if (sortType === 'highest-amount') {
      const amountA = parseInt(a.amount.replace(/,/g, ''));
      const amountB = parseInt(b.amount.replace(/,/g, ''));
      return amountB - amountA;
    } else if (sortType === 'least-amount') {
      const amountA = parseInt(a.amount.replace(/,/g, ''));
      const amountB = parseInt(b.amount.replace(/,/g, ''));
      return amountA - amountB;
    } else if (sortType === 'name-az') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const totalGive = dummyCustomers
    .filter(c => c.type === 'give')
    .reduce((sum, c) => sum + parseInt(c.amount.replace(/,/g, '')), 0);

  const totalGet = dummyCustomers
    .filter(c => c.type === 'get')
    .reduce((sum, c) => sum + parseInt(c.amount.replace(/,/g, '')), 0);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  const handleAddCustomer = () => {
    // TODO: Implement add customer functionality
    console.log('Add customer');
  };

  const handleViewReport = () => {
    // TODO: Implement view report functionality
    console.log('View report');
  };

  const handleOpenCashbook = () => {
    // TODO: Implement open cashbook functionality
    console.log('Open cashbook');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
                You will give
              </Text>
              <Text style={[styles.summaryAmount, { color: colors.foreground }]}>
                ₹{formatAmount(totalGive)}
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
                You will get
              </Text>
              <Text style={[styles.summaryAmount, { color: '#FF3B30' }]}>
                ₹{formatAmount(totalGet)}
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
          {filteredCustomers.map((customer) => (
            <TouchableOpacity
              key={customer.id}
              onPress={() => {
                router.push({
                  pathname: '/tabs/books/[customerId]',
                  params: {
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
                      ₹{customer.amount}
                    </Text>
                    <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>
                      You&apos;ll {customer.type === 'get' ? 'Get' : 'Give'}
                    </Text>
                  </View>
                </View>
              </ResponsiveLiquidGlassCard>
            </TouchableOpacity>
          ))}
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
        }}
        currentFilter={filterType}
        currentSort={sortType}
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
});


