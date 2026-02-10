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
import { EnhancedExpense } from '../../types';
import { formatHumanDateTime } from '../../utils/date';
import { useTranslation } from 'react-i18next';

interface ExpenseDetailModalProps {
  visible: boolean;
  onClose: () => void;
  expense: EnhancedExpense | null;
  onImagePress?: () => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  visible,
  onClose,
  expense,
  onImagePress,
}) => {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();

  if (!expense) return null;

  const amount = typeof expense.totalAmount === 'string'
    ? parseFloat(expense.totalAmount)
    : expense.totalAmount;
  const currency = expense.currency || 'INR';
  const paidByName = expense.paidByUser?.name ?? expense.paidByDisplay ?? t('common.unknown');
  const dateFormatted = formatHumanDateTime(expense.date as string | Date);
  // Match expense item: use netBalance color for amount (You Lent / You Borrowed / Even)
  const amountColor = expense.netBalance?.color ?? colors.mutedForeground;
  const statusText = expense.netBalance
    ? (expense.netBalance.text.includes('you lent') ? t('modals.youLent') :
       expense.netBalance.text.includes('you borrowed') ? t('modals.youBorrowed') :
       expense.netBalance.text)
    : t('modals.even');

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
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                  {t('modals.expenseDetails')}
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
                {/* Receipt Image */}
                {expense.receipt && (
                  <TouchableOpacity
                    style={styles.imageSection}
                    onPress={onImagePress}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: expense.receipt }}
                      style={styles.receiptImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="expand-outline" size={24} color="#FFFFFF" />
                      <Text style={styles.imageOverlayText}>{t('modals.tapToView')}</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Title */}
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>
                    {t('modals.title')}
                  </Text>
                  <Text style={[styles.titleValue, { color: colors.foreground }]}>
                    {expense.title}
                  </Text>
                </View>

                {/* Amount (same color as expense item netBalance) */}
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>
                    {statusText}
                  </Text>
                  <Text style={[styles.amountValue, { color: amountColor }]}>
                    {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency + ' '}
                    {Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}
                  </Text>
                </View>

                {/* Date */}
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>
                    {t('modals.date')}
                  </Text>
                  <View style={styles.valueWithIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={colors.foreground}
                    />
                    <Text style={[styles.value, { color: colors.foreground }]}>
                      {dateFormatted}
                    </Text>
                  </View>
                </View>

                {/* Paid by */}
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>
                    {t('modals.paidBy')}
                  </Text>
                  <View style={styles.valueWithIcon}>
                    <Ionicons name="person-outline" size={18} color={colors.foreground} />
                    <Text style={[styles.value, { color: colors.foreground }]}>
                      {paidByName}
                    </Text>
                  </View>
                </View>

                {/* Expense ID */}
                <View style={[styles.section, styles.lastSection]}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>
                    {t('modals.expenseId')}
                  </Text>
                  <Text style={[styles.idValue, { color: colors.mutedForeground }]}>
                    {expense.id}
                  </Text>
                </View>
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
  receiptImage: {
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
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
  idValue: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
    }),
  },
});
