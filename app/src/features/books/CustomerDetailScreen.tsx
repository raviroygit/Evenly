import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { ResponsiveLiquidGlassCard } from '../../components/ui/ResponsiveLiquidGlassCard';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';

interface Transaction {
  id: string;
  date: string;
  time: string;
  balance: string;
  amountGiven: string;
  amountGot: string;
  hasAttachment: boolean;
}

const dummyTransactions: Transaction[] = [
  {
    id: '1',
    date: '12 Dec 25',
    time: '05:09 PM',
    balance: '1,95,000',
    amountGiven: '12,000',
    amountGot: '',
    hasAttachment: true,
  },
  {
    id: '2',
    date: '28 Nov 25',
    time: '04:40 PM',
    balance: '1,83,000',
    amountGiven: '12,000',
    amountGot: '',
    hasAttachment: true,
  },
  {
    id: '3',
    date: '27 Nov 25',
    time: '10:48 AM',
    balance: '1,71,000',
    amountGiven: '2,000',
    amountGot: '',
    hasAttachment: true,
  },
  {
    id: '4',
    date: '21 Nov 25',
    time: '04:18 PM',
    balance: '1,69,000',
    amountGiven: '10,000',
    amountGot: '',
    hasAttachment: true,
  },
  {
    id: '5',
    date: '14 Nov 25',
    time: '04:19 PM',
    balance: '1,59,000',
    amountGiven: '5,000',
    amountGot: '',
    hasAttachment: true,
  },
];

export const CustomerDetailScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ customerName?: string; customerInitials?: string }>();
  const { colors, theme } = useTheme();

  const customerName = params.customerName || 'Sujeet Mistri Bengha';
  const customerInitials = params.customerInitials || 'SM';
  const totalAmount = '1,95,000';

  const handleBack = () => {
    router.back();
  };

  const handleSetCollectionDates = () => {
    // TODO: Implement set collection dates
    console.log('Set collection dates');
  };

  const handleReport = () => {
    // TODO: Implement report
    console.log('Report');
  };

  const handleReminders = () => {
    // TODO: Implement reminders
    console.log('Reminders');
  };

  const handleSMS = () => {
    // TODO: Implement SMS
    console.log('SMS');
  };

  const handleYouGave = () => {
    // TODO: Implement you gave transaction
    console.log('You gave');
  };

  const handleYouGot = () => {
    // TODO: Implement you got transaction
    console.log('You got');
  };

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
                You will get
              </Text>
              <Text style={[styles.summaryAmount, { color: '#FF3B30' }]}>
                ₹{totalAmount}
              </Text>
            </View>
          </ResponsiveLiquidGlassCard>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionsContainer}>
          {dummyTransactions.map((transaction) => (
            <ResponsiveLiquidGlassCard
              key={transaction.id}
              padding={{ small: 10, medium: 12, large: 14 }}
              marginBottom={8}
              borderRadius={{ small: 12, medium: 14, large: 16 }}
            >
              <View style={styles.transactionRow}>
                {transaction.hasAttachment && (
                  <View style={styles.imageContainer}>
                    <View style={styles.attachmentThumbnail}>
                      <Ionicons name="image-outline" size={20} color={colors.mutedForeground} />
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
                )}
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
          ))}
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
    backgroundColor: 'transparent',
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
});


