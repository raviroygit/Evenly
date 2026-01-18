import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

const { height } = Dimensions.get('window');

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  balance: string;
  type: 'give' | 'get' | 'settled';
  updatedAt: string;
}

interface CustomersListModalProps {
  visible: boolean;
  onClose: () => void;
  customers: Customer[];
  onCustomerPress: (customerId: string, customerName: string, customerInitials: string) => void;
  loading?: boolean;
}

export const CustomersListModal: React.FC<CustomersListModalProps> = ({
  visible,
  onClose,
  customers,
  onCustomerPress,
  loading = false,
}) => {
  const { colors, theme } = useTheme();

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatAmount = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN').format(Math.abs(numAmount));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <BlurView
          intensity={theme === 'dark' ? 80 : 60}
          tint={theme === 'dark' ? 'dark' : 'light'}
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme === 'dark' ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: theme === 'dark' ? '#333333' : '#E0E0E0',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                All Customers
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {loading ? 'Loading...' : `${customers.length} Customer${customers.length !== 1 ? 's' : ''}`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  backgroundColor: theme === 'dark' ? '#333333' : '#F0F0F0',
                },
              ]}
            >
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Customer List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  Loading customers...
                </Text>
              </View>
            ) : customers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No customers found
                </Text>
              </View>
            ) : (
              customers.map((customer) => {
                const initials = getInitials(customer.name);
                const amountColor =
                  customer.type === 'give' ? '#10B981' :
                  customer.type === 'get' ? '#EF4444' :
                  colors.mutedForeground;

                return (
                  <TouchableOpacity
                    key={customer.id}
                    style={[
                      styles.customerItem,
                      {
                        backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                        borderColor: theme === 'dark' ? '#333333' : '#E0E0E0',
                      },
                    ]}
                    onPress={() => onCustomerPress(customer.id, customer.name, initials)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {initials}
                      </Text>
                    </View>

                    <View style={styles.customerInfo}>
                      <Text style={[styles.customerName, { color: colors.foreground }]}>
                        {customer.name}
                      </Text>
                      <Text style={[styles.customerLabel, { color: amountColor }]}>
                        You&apos;ll {customer.type === 'get' ? 'Give' : customer.type === 'give' ? 'Get' : 'Settled'}
                      </Text>
                    </View>

                    <View style={styles.amountContainer}>
                      <Text style={[styles.amountText, { color: amountColor }]}>
                        ₹{formatAmount(customer.balance)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    height: height * 0.7,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
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
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
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
  customerLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
