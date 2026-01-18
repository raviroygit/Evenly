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

interface CustomerInfoModalProps {
  visible: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    balance: string;
    type: 'give' | 'get' | 'settled';
    createdAt?: string;
    updatedAt?: string;
  } | null;
}

export const CustomerInfoModal: React.FC<CustomerInfoModalProps> = ({
  visible,
  onClose,
  customer,
}) => {
  const { colors, theme } = useTheme();

  if (!customer) return null;

  const formatAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-IN').format(Math.abs(numAmount));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const amountColor =
    customer.type === 'give' ? '#10B981' :
    customer.type === 'get' ? '#EF4444' :
    colors.mutedForeground;

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const InfoRow = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon as any} size={20} color={colors.mutedForeground} />
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>
        {value || 'Not provided'}
      </Text>
    </View>
  );

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
                Customer Details
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

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar and Name Section */}
            <View style={styles.avatarSection}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {getInitials(customer.name)}
                </Text>
              </View>
              <Text style={[styles.customerName, { color: colors.foreground }]}>
                {customer.name}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: amountColor + '20' }]}>
                <Text style={[styles.statusText, { color: amountColor }]}>
                  {customer.type === 'get' ? 'You will give' :
                   customer.type === 'give' ? 'You will get' :
                   'Settled'}
                </Text>
              </View>
            </View>

            {/* Balance Section */}
            <View style={[
              styles.balanceSection,
              {
                backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                borderColor: theme === 'dark' ? '#333333' : '#E0E0E0',
              }
            ]}>
              <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>
                Total Balance
              </Text>
              <Text style={[styles.balanceAmount, { color: amountColor }]}>
                ₹{formatAmount(customer.balance)}
              </Text>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Contact Information
              </Text>
              <View style={[
                styles.sectionContent,
                {
                  backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                  borderColor: theme === 'dark' ? '#333333' : '#E0E0E0',
                }
              ]}>
                <InfoRow label="Email" value={customer.email || ''} icon="mail-outline" />
                <InfoRow label="Phone" value={customer.phone || ''} icon="call-outline" />
                {customer.address && (
                  <InfoRow label="Address" value={customer.address} icon="location-outline" />
                )}
              </View>
            </View>

            {/* Additional Information */}
            {customer.notes && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Notes
                </Text>
                <View style={[
                  styles.notesContainer,
                  {
                    backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                    borderColor: theme === 'dark' ? '#333333' : '#E0E0E0',
                  }
                ]}>
                  <Text style={[styles.notesText, { color: colors.foreground }]}>
                    {customer.notes}
                  </Text>
                </View>
              </View>
            )}

            {/* Account Information */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Account Information
              </Text>
              <View style={[
                styles.sectionContent,
                {
                  backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                  borderColor: theme === 'dark' ? '#333333' : '#E0E0E0',
                }
              ]}>
                <InfoRow
                  label="Created On"
                  value={formatDate(customer.createdAt)}
                  icon="calendar-outline"
                />
                <InfoRow
                  label="Last Updated"
                  value={formatDate(customer.updatedAt)}
                  icon="time-outline"
                />
              </View>
            </View>
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
    height: height * 0.8,
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
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceSection: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionContent: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  notesContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
