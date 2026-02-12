import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useGroups } from '../../hooks/useGroups';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { ExpenseItem } from '../../components/features/expenses/ExpenseItem';
import { ExpenseSummary } from '../../components/features/expenses/ExpenseSummary';
import { GroupInfoModal } from '../../components/modals/GroupInfoModal';
import { AddExpenseModal } from '../../components/modals/AddExpenseModal';
import { ExpenseDetailModal } from '../../components/modals/ExpenseDetailModal';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';
import { ImageViewer } from '../../components/ui/ImageViewer';
import { MemberSelectionModal } from '../../components/modals/MemberSelectionModal';
import { InfiniteScrollScreen } from '../../components/ui/InfiniteScrollScreen';
import { SkeletonExpenseList, SkeletonLoader, SkeletonExpenseSummary, SkeletonExpenseItem } from '../../components/ui/SkeletonLoader';
import { EnhancedExpense } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useSwipeAction } from '../../contexts/SwipeActionContext';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';

export const GroupDetailsScreen: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { colors, theme } = useTheme();
  const { groups, loading: groupsLoading } = useGroups();
  const { user } = useAuth();
  const { setActiveSwipeId } = useSwipeAction();
  const [expenses, setExpenses] = useState<EnhancedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<EnhancedExpense | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isUpdatingExpense, setIsUpdatingExpense] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<{ id: string; title: string } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [detailExpense, setDetailExpense] = useState<EnhancedExpense | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const group = groups.find(g => g.id === groupId);

  useEffect(() => {
    if (groupId) {
      loadExpenses();
    }
  }, [groupId]);

  // Calculate group-specific totals
  const groupTotals = React.useMemo(() => {
    if (!user) {
      return { totalExpenses: 0, netBalance: 0 };
    }

    let totalExpenses = 0;
    let userPaidTotal = 0;
    let userShareTotal = 0;

    expenses.forEach(expense => {
      // Add to total expenses (all expenses in the group)
      const expenseAmount = typeof expense.totalAmount === 'string'
        ? parseFloat(expense.totalAmount)
        : expense.totalAmount;
      totalExpenses += expenseAmount || 0;

      // Calculate how much the logged-in user paid
      if (expense.paidBy === user.id) {
        userPaidTotal += expenseAmount || 0;
      }

      // Calculate the logged-in user's share of this expense from splits
      // Note: currentUserShare.amount is the NET amount (lent/borrowed), not the share
      // We need to find the user's split amount from the splits array
      if (expense.splits && expense.splits.length > 0) {
        const userSplit = expense.splits.find(split => split.userId === user.id);
        if (userSplit) {
          const shareAmount = typeof userSplit.amount === 'string'
            ? parseFloat(userSplit.amount)
            : userSplit.amount;
          userShareTotal += shareAmount || 0;
        }
      }
    });

    // Net balance = What user paid - What user owes
    // Positive = user is owed money (paid more than their share)
    // Negative = user owes money (paid less than their share)
    const netBalance = userPaidTotal - userShareTotal;

    return {
      totalExpenses,
      netBalance,
    };
  }, [expenses, user]);

  const loadExpenses = async (skipLoadingState = false) => {
    if (!groupId) return;
    
    try {
      if (!skipLoadingState) {
        setLoading(true);
      }
      const response = await EvenlyBackendService.getGroupExpenses(groupId);
      setExpenses(response.expenses || []);
      setHasMore(false); // For now, we'll load all expenses
    } catch {
      // Ignore
    } finally {
      if (!skipLoadingState) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const handleAddExpense = async (expenseData: FormData | {
    groupId: string;
    title: string;
    totalAmount: string;
    date: string;
  }) => {
    try {
      // Check if it's FormData (with image) or plain object
      if (expenseData instanceof FormData) {
        // FormData with image - pass directly to backend
        await EvenlyBackendService.createExpense(expenseData);
      } else {
        // Plain object without image - add required fields
        const dateWithTime = expenseData.date.includes('T')
          ? expenseData.date
          : `${expenseData.date}T00:00:00.000Z`;

        const fullExpenseData = {
          ...expenseData,
          date: dateWithTime,
          splitType: 'equal' as const,
          category: 'Other',
        };

        // Create expense
        await EvenlyBackendService.createExpense(fullExpenseData);
      }

      // Set loading state BEFORE closing modal so skeleton is ready
      setIsAddingExpense(true);

      // Close modal to allow skeleton to show in background
      setShowAddExpenseModal(false);

      // Wait a bit for modal close animation to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Reload expenses to show new expense (skip loading state since we're using isAddingExpense)
      await loadExpenses(true);

      // Wait a bit to ensure skeleton is visible and data is rendered
      await new Promise(resolve => setTimeout(resolve, 300));

      // Show success message
      Alert.alert(t('common.success'), t('expenses.addExpenseSuccess'));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err instanceof Error ? err.message : t('errors.tryAgain'));
      Alert.alert(t('common.error'), message);
      throw err;
    } finally {
      // Hide skeleton loader after everything is done
      setIsAddingExpense(false);
    }
  };

  const handleUpdateExpense = async (
    expenseId: string,
    expenseData: FormData | {
      title: string;
      totalAmount: string;
      date: string;
    },
    oldImageUrl?: string
  ) => {
    try {
      setIsUpdatingExpense(true);

      // Delete old image from Cloudinary when replacing or removing image
      if (oldImageUrl) {
        try {
          await EvenlyBackendService.deleteExpenseImage(oldImageUrl);
        } catch {
          // Continue with update even if deletion fails
        }
      }

      await EvenlyBackendService.updateExpense(expenseId, expenseData);
      setEditingExpense(null);
      // Reload expenses to show updated data
      await loadExpenses();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err instanceof Error ? err.message : t('errors.tryAgain'));
      Alert.alert(t('common.error'), message);
    } finally {
      setIsUpdatingExpense(false);
    }
  };

  const handleDeleteExpense = (expenseId: string, expenseTitle: string) => {
    setDeletingExpense({ id: expenseId, title: expenseTitle });
    setShowDeleteModal(true);
  };

  const confirmDeleteExpense = async () => {
    if (!deletingExpense) return;

    try {
      await EvenlyBackendService.deleteExpense(deletingExpense.id);
      // Reload expenses to show updated list
      await loadExpenses();

      // Modal will close automatically, show success alert
      Alert.alert(t('common.success'), t('expenses.deleteExpenseSuccess'));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (err instanceof Error ? err.message : t('errors.tryAgain'));
      Alert.alert(t('common.error'), message);
      throw err;
    }
  };

  const handleExpenseDetailImagePress = () => {
    setShowDetailModal(false);
    setTimeout(() => setShowImageViewer(true), 300);
  };

  const handleExpenseDetailImageViewerClose = () => {
    setShowImageViewer(false);
    setTimeout(() => setShowDetailModal(true), 300);
  };

  const renderExpenseItem = ({ item }: { item: EnhancedExpense }) => (
    <ExpenseItem
      key={item.id}
      item={item}
      groupName={group?.name}
      onPress={() => {
        setDetailExpense(item);
        setShowDetailModal(true);
      }}
      onEditExpense={setEditingExpense}
      onDeleteExpense={handleDeleteExpense}
      onActionExecuted={() => {
        // Clear active swipe after action
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setActiveSwipeId(null);
          });
        });
      }}
    />
  );

  const ListHeaderComponent = () => (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {group?.name || t('groups.groupDetails')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              {t('groups.transaction', { count: expenses.length })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => setShowShareModal(true)}
            >
              <Ionicons name="share-outline" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setShowGroupInfoModal(true)}
            >
              <Ionicons name="eye-outline" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        {loading || refreshing || isAddingExpense ? (
          <SkeletonExpenseSummary />
        ) : (
          <ExpenseSummary
            totalExpenses={groupTotals.totalExpenses}
            netBalance={groupTotals.netBalance}
          />
        )}
      </View>
    </>
  );

  // Show skeleton items when adding expense (in footer if items exist, or as main content if list is empty)
  const ListFooterComponent = () => {
    // Don't show footer skeleton - we'll show skeleton items in the main list instead
    return null;
  };

  // Render skeleton items when adding expense
  const renderSkeletonItem = () => {
    return <SkeletonExpenseItem />;
  };

  // If adding expense and list is empty, show skeleton items as the main content
  if (isAddingExpense && expenses.length === 0 && !loading) {
    return (
      <>
        <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ListHeaderComponent />
            <View style={styles.contentContainer}>
              <SkeletonExpenseList count={5} />
            </View>
          </View>
        </View>
        {/* Keep modals available */}
        <GroupInfoModal
          visible={showGroupInfoModal}
          onClose={() => setShowGroupInfoModal(false)}
          groupId={groupId}
        />
        {user && groupId && (
          <AddExpenseModal
            visible={showAddExpenseModal}
            onClose={() => setShowAddExpenseModal(false)}
            onAddExpense={handleAddExpense}
            currentUserId={user.id}
            preselectedGroupId={groupId}
          />
        )}
        <FloatingActionButton
          actions={[
            {
              id: 'add-expense',
              title: 'Add Expense',
              icon: '💰',
              onPress: () => setShowAddExpenseModal(true),
              color: '#10B981',
            },
          ]}
          position="bottom-right"
        />
      </>
    );
  }

  // Show skeleton loading state while groups are loading
  if (groupsLoading) {
    return (
      <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.container, styles.skeletonContainer, { backgroundColor: colors.background }]}>
          {/* Skeleton Header */}
          <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
            <View style={styles.headerRow}>
              <View style={styles.backButton}>
                <SkeletonLoader width={24} height={24} borderRadius={12} />
              </View>
              <View style={styles.headerTitleContainer}>
                <SkeletonLoader width={120} height={20} borderRadius={10} style={styles.skeletonTitle} />
                <SkeletonLoader width={100} height={14} borderRadius={7} style={styles.skeletonSubtitle} />
              </View>
              <View style={styles.infoButton}>
                <SkeletonLoader width={24} height={24} borderRadius={12} />
              </View>
            </View>
          </View>

          {/* Skeleton Summary Cards */}
          <View style={[styles.summaryContainer, { paddingHorizontal: 20 }]}>
            <SkeletonExpenseSummary />
          </View>

          {/* Skeleton Expense List */}
          <View style={[styles.skeletonContentContainer, { backgroundColor: colors.background }]}>
            <SkeletonExpenseList count={5} />
          </View>
        </View>
      </View>
    );
  }

  // Only show error if groups have loaded but group is not found
  if (!group) {
    return (
      <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.errorContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {t('errors.notFound')}
            </Text>
            <Text style={[styles.errorSubtext, { color: colors.mutedForeground }]}>
              The group you're looking for doesn't exist or you don't have access to it.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <InfiniteScrollScreen
            data={isAddingExpense && expenses.length > 0 
              ? (Array.from({ length: Math.min(expenses.length + 3, 10) }).fill(null) as EnhancedExpense[])
              : expenses}
            renderItem={isAddingExpense && expenses.length > 0 
              ? (renderSkeletonItem as any)
              : renderExpenseItem}
            keyExtractor={(item, index) => 
              isAddingExpense && expenses.length > 0 
                ? `skeleton-${index}` 
                : ((item as EnhancedExpense)?.id || `expense-${index}`)}
            loading={loading || (isAddingExpense && expenses.length === 0)}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={() => {}}
            onRefresh={onRefresh}
            refreshing={refreshing}
            emptyMessage={t('expenses.noExpenses')}
            loadingMessage={isAddingExpense ? t('expenses.uploadingImage', { defaultValue: 'Adding expense...' }) : t('common.loading')}
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={ListFooterComponent}
            contentContainerStyle={[styles.contentContainer, { paddingBottom: 100 }]}
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: colors.background, flex: 1 }}
          />
        </View>
      </View>

      {/* Group Info Modal */}
      <GroupInfoModal
        visible={showGroupInfoModal}
        onClose={() => setShowGroupInfoModal(false)}
        groupId={groupId}
      />

      {/* Add Expense Modal */}
      {user && groupId && (
        <AddExpenseModal
          visible={showAddExpenseModal}
          onClose={() => setShowAddExpenseModal(false)}
          onAddExpense={handleAddExpense}
          currentUserId={user.id}
          preselectedGroupId={groupId}
        />
      )}

      {/* Edit Expense Modal */}
      {user && (
        <AddExpenseModal
          visible={!!editingExpense}
          onClose={() => {
            setEditingExpense(null);
          }}
          onAddExpense={async () => {
            // Not used in edit mode
          }}
          onUpdateExpense={handleUpdateExpense}
          currentUserId={user.id}
          editExpense={editingExpense}
        />
      )}

      {/* Expense Detail Modal */}
      <ExpenseDetailModal
        visible={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailExpense(null);
        }}
        expense={detailExpense}
        onImagePress={detailExpense?.receipt ? handleExpenseDetailImagePress : undefined}
      />

      {/* Image Viewer (full-screen receipt) */}
      {detailExpense?.receipt && (
        <ImageViewer
          visible={showImageViewer}
          imageUrl={detailExpense.receipt}
          onClose={handleExpenseDetailImageViewerClose}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingExpense(null);
        }}
        onConfirm={confirmDeleteExpense}
        title={t('expenses.deleteExpense')}
        description={t('expenses.deleteConfirmation', { title: deletingExpense?.title || '' })}
      />

      {/* Member Selection Modal for Sharing */}
      <MemberSelectionModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        groupId={groupId || null}
        groupName={group?.name || t('groups.title')}
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        actions={[
          {
            id: 'add-expense',
            title: t('expenses.addExpense'),
            icon: '💰',
            onPress: () => setShowAddExpenseModal(true),
            color: '#10B981',
          },
        ]}
        position="bottom-right"
      />
    </>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  skeletonContainer: {
    // Additional styling for skeleton state if needed
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 16,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
  },
  infoButton: {
    padding: 8,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 0,
  },
  skeletonContentContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
    overflow: 'hidden',
  },
  skeletonTitle: {
    marginBottom: 8,
  },
  skeletonSubtitle: {
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  skeletonFooterContainer: {
    paddingTop: 8,
  },
  skeletonItemContainer: {
    marginBottom: 8,
  },
});


