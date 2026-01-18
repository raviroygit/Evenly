import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

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

interface TransactionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onImagePress?: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  visible,
  onClose,
  transaction,
  onImagePress,
}) => {
  const { colors, theme } = useTheme();

  if (!transaction) return null;

  const transactionType = transaction.amountGiven ? 'You Gave' : 'You Got';
  const amount = transaction.amountGiven || transaction.amountGot;
  const isGave = !!transaction.amountGiven;

  return (
    <>
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
                {/* Header */}
                <View style={styles.header}>
                  <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                    Transaction Details
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
                  {/* Transaction Image */}
                  {transaction.imageUrl && (
                    <TouchableOpacity
                      style={styles.imageSection}
                      onPress={onImagePress}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: transaction.imageUrl }}
                        style={styles.transactionImage}
                        resizeMode="cover"
                      />
                      <View style={styles.imageOverlay}>
                        <Ionicons name="expand-outline" size={24} color="#FFFFFF" />
                        <Text style={styles.imageOverlayText}>Tap to view full image</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Transaction Type Badge */}
                  <View style={styles.section}>
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor: isGave
                            ? 'rgba(255, 59, 48, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                          borderColor: isGave ? '#FF3B30' : '#10B981',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isGave ? 'arrow-up-outline' : 'arrow-down-outline'}
                        size={20}
                        color={isGave ? '#FF3B30' : '#10B981'}
                      />
                      <Text
                        style={[
                          styles.typeBadgeText,
                          { color: isGave ? '#FF3B30' : '#10B981' },
                        ]}
                      >
                        {transactionType}
                      </Text>
                    </View>
                  </View>

                  {/* Amount */}
                  <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.mutedForeground }]}>
                      Amount
                    </Text>
                    <Text
                      style={[
                        styles.amountValue,
                        { color: isGave ? '#FF3B30' : '#10B981' },
                      ]}
                    >
                      ₹{amount}
                    </Text>
                  </View>

                  {/* Date & Time */}
                  <View style={styles.section}>
                    <View style={styles.row}>
                      <View style={styles.column}>
                        <Text style={[styles.label, { color: colors.mutedForeground }]}>
                          Date
                        </Text>
                        <View style={styles.valueWithIcon}>
                          <Ionicons
                            name="calendar-outline"
                            size={18}
                            color={colors.foreground}
                          />
                          <Text style={[styles.value, { color: colors.foreground }]}>
                            {transaction.date}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.column}>
                        <Text style={[styles.label, { color: colors.mutedForeground }]}>
                          Time
                        </Text>
                        <View style={styles.valueWithIcon}>
                          <Ionicons name="time-outline" size={18} color={colors.foreground} />
                          <Text style={[styles.value, { color: colors.foreground }]}>
                            {transaction.time}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Balance After Transaction */}
                  <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.mutedForeground }]}>
                      Balance After Transaction
                    </Text>
                    <View style={styles.valueWithIcon}>
                      <Ionicons name="wallet-outline" size={18} color={colors.foreground} />
                      <Text style={[styles.balanceValue, { color: colors.foreground }]}>
                        ₹{transaction.balance}
                      </Text>
                    </View>
                  </View>

                  {/* Transaction ID */}
                  <View style={[styles.section, styles.lastSection]}>
                    <Text style={[styles.label, { color: colors.mutedForeground }]}>
                      Transaction ID
                    </Text>
                    <Text style={[styles.idValue, { color: colors.mutedForeground }]}>
                      {transaction.id}
                    </Text>
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    maxHeight: '90%',
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
  imageSection: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  transactionImage: {
    width: '100%',
    height: 280,
    borderRadius: 16,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 0,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flex: 1,
  },
  valueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  idValue: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
    }),
  },
});
