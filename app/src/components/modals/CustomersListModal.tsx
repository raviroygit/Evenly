import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export interface KhataCustomerItem {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  balance: string;
  type: 'give' | 'get' | 'settled';
  createdAt?: string;
  updatedAt?: string;
}

interface CustomersListModalProps {
  visible: boolean;
  onClose: () => void;
  customers: KhataCustomerItem[];
  onCustomerPress: (customer: KhataCustomerItem) => void;
  loading?: boolean;
}

export const CustomersListModal: React.FC<CustomersListModalProps> = ({
  visible,
  onClose,
  customers,
  onCustomerPress,
  loading = false,
}) => {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();

  const safeCustomers = Array.isArray(customers) ? customers : [];

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return `₹${Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
          },
        ]}
      >
        <View style={styles.overlayTouchable}>
          <TouchableOpacity
            style={styles.overlayBackground}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={styles.modalWrapper}>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: colors.background,
                },
              ]}
            >
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                  {t('modals.yourCustomers')}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeButton, { backgroundColor: colors.muted }]}
                >
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                      {t('modals.loadingCustomers')}
                    </Text>
                  </View>
                ) : safeCustomers.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name="people-outline"
                      size={48}
                      color={colors.mutedForeground}
                    />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      {t('modals.noCustomersYet')}
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                      {t('modals.addCustomersInKhata')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.list}>
                    {safeCustomers.map((customer) => {
                      const balanceNum = parseFloat(customer.balance);
                      const typeColor =
                        customer.type === 'give' ? '#10B981' :
                        customer.type === 'get' ? '#EF4444' :
                        colors.mutedForeground;
                      return (
                        <TouchableOpacity
                          key={customer.id}
                          style={[
                            styles.customerItem,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                            },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => onCustomerPress(customer)}
                        >
                          <View style={styles.customerInfo}>
                            <View
                              style={[
                                styles.customerIcon,
                                { backgroundColor: colors.primary + '20' },
                              ]}
                            >
                              <Ionicons
                                name="person"
                                size={24}
                                color={colors.primary}
                              />
                            </View>
                            <View style={styles.customerDetails}>
                              <Text
                                style={[styles.customerName, { color: colors.foreground }]}
                                numberOfLines={1}
                              >
                                {customer.name}
                              </Text>
                              <Text
                                style={[styles.customerBalance, { color: typeColor }]}
                                numberOfLines={1}
                              >
                                {customer.type === 'settled'
                                  ? t('khata.settled')
                                  : customer.type === 'give'
                                    ? `${t('khata.willGet')} ${formatAmount(customer.balance)}`
                                    : `${t('khata.willGive')} ${formatAmount(customer.balance)}`}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={[
                              styles.eyeButton,
                              { backgroundColor: colors.primary + '15' },
                            ]}
                            onPress={() => onCustomerPress(customer)}
                          >
                            <Ionicons name="eye-outline" size={20} color={colors.primary} />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  overlayBackground: {
    flex: 1,
  },
  modalWrapper: {
    maxHeight: '85%',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  list: {
    gap: 12,
    paddingBottom: 20,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  customerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerBalance: {
    fontSize: 13,
    fontWeight: '500',
  },
  eyeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
