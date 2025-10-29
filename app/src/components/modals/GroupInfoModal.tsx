import React, { useState, useEffect } from 'react';
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
import { useGroups } from '../../hooks/useGroups';
import { useAllExpenses } from '../../hooks/useAllExpenses';
import { ExpenseItem } from '../features/expenses/ExpenseItem';
import { SkeletonExpenseList } from '../ui/SkeletonLoader';

interface GroupInfoModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string | null;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  visible,
  onClose,
  groupId,
}) => {
  const { colors, theme } = useTheme();
  const { groups, loading: groupsLoading } = useGroups();
  const { expenses, loading: expensesLoading } = useAllExpenses();

  // Find the specific group
  const group = groups.find(g => g.id === groupId);

  // Filter expenses for this group
  const groupExpenses = expenses.filter(expense => expense.groupId === groupId);

  const handleClose = () => {
    onClose();
  };

  if (!visible || !groupId) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
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
            onPress={handleClose}
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
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Group Information
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {groupsLoading || expensesLoading ? (
                  <View style={styles.loadingContainer}>
                    <View style={styles.skeletonContainer}>
                      <View style={[styles.skeletonLine, { backgroundColor: colors.muted }]} />
                      <View style={[styles.skeletonLine, { backgroundColor: colors.muted }]} />
                      <View style={[styles.skeletonLine, { backgroundColor: colors.muted }]} />
                    </View>
                    <SkeletonExpenseList count={3} />
                  </View>
                ) : group ? (
                  <>
                    {/* Group Information */}
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                        Group Details
                      </Text>
                      <View style={styles.groupInfo}>
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            Group Name
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {group.name}
                          </Text>
                        </View>
                        
                        {group.description && (
                          <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                              Description
                            </Text>
                            <Text style={[styles.infoValue, { color: colors.foreground }]}>
                              {group.description}
                            </Text>
                          </View>
                        )}
                        
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            Members
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {group.memberCount} members
                          </Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            Default Split
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {group.defaultSplitType.charAt(0).toUpperCase() + group.defaultSplitType.slice(1)}
                          </Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            Currency
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {group.currency}
                          </Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            Created
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {new Date(group.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Group Expenses */}
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                        Group Expenses ({groupExpenses.length})
                      </Text>
                      {groupExpenses.length === 0 ? (
                        <View style={styles.emptyState}>
                          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                            No expenses in this group yet.
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.expensesList}>
                          {groupExpenses.map((expense) => (
                            <ExpenseItem key={expense.id} item={expense} />
                          ))}
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colors.destructive }]}>
                      Group not found
                    </Text>
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
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '60%',
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  groupInfo: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  expensesList: {
    gap: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    gap: 20,
  },
  skeletonContainer: {
    gap: 12,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
    opacity: 0.3,
  },
});
