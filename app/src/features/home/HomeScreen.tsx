import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { useGroups } from '../../hooks/useGroups';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { ResponsiveLiquidGlassCard } from '../../components/ui/ResponsiveLiquidGlassCard';
import { GlassListCard } from '../../components/ui/GlassListCard';
import { SectionHeader } from '../../components/common/SectionHeader';
import { CreateGroupModal } from '../../components/modals/CreateGroupModal';
import { AddExpenseModal } from '../../components/modals/AddExpenseModal';
import { DashboardStats } from '../../components/features/dashboard/DashboardStats';
import { RecentActivity } from '../../components/features/dashboard/RecentActivity';
import { FloatingActionButton } from '../../components/ui/FloatingActionButton';

export const HomeScreen: React.FC = () => {
  const { colors, theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { stats, loading: dashboardLoading, refresh: refreshDashboard } = useDashboard();
  const { createGroup } = useGroups();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Note: Removed useFocusEffect to prevent infinite loops
  // Dashboard and groups will refresh via pull-to-refresh

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshDashboard();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };


  const handleCreateGroup = async (groupData: {
    name: string;
    description?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }) => {
    try {
      await createGroup(groupData);
      setShowCreateGroupModal(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleAddExpense = async (expenseData: {
    groupId: string;
    title: string;
    totalAmount: string;
    date: string;
  }) => {
    try {
      // Check if user is authenticated
      if (!user) {
        Alert.alert('Error', 'You must be logged in to add expenses');
        return;
      }
      
      // Convert simplified expense data to full expense data
      const fullExpenseData = {
        groupId: expenseData.groupId,
        title: expenseData.title,
        totalAmount: expenseData.totalAmount,
        splitType: 'equal' as const,
        category: 'Other',
        date: new Date(expenseData.date).toISOString(),
        paidBy: user.id,
        description: expenseData.title,
      };
      
      await EvenlyBackendService.createExpense(fullExpenseData);
      
      Alert.alert('Success', 'Expense added successfully!');
      setShowAddExpenseModal(false);
      
      // Refresh dashboard data to show updated stats
      await refreshDashboard();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add expense');
    }
  };

  // Use consistent styling for both platforms
  const getPlatformAwareStyles = () => {
    return {
      headerCard: {
        backgroundColor: theme === 'dark' ? '#2C2C2C' : '#FFFFFF',
        borderColor: theme === 'dark' ? '#404040' : '#E0E0E0',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
      activityCard: {
        backgroundColor: theme === 'dark' ? '#2C2C2C' : '#FFFFFF',
        borderColor: theme === 'dark' ? '#404040' : '#E0E0E0',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      activityItem: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginBottom: 6,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 8,
        backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
        borderColor: theme === 'dark' ? '#333333' : '#E0E0E0',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: theme === 'dark' ? 0.2 : 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    };
  };

  const platformStyles = getPlatformAwareStyles();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassListCard
          title="Authentication Required"
          subtitle="Please log in to access the app"
          contentGap={0}
        >
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            You need to be logged in to access this feature.
          </Text>
        </GlassListCard>
      </View>
    );
  }

  // Prepare dashboard stats
  const dashboardStats = [
    {
      label: 'Total Groups',
      value: stats.totalGroups,
      color: '#2196F3',
    },
    {
      label: 'Net Balance',
      value: `₹${stats.netBalance.toFixed(2)}`,
      color: stats.netBalance >= 0 ? '#4CAF50' : '#F44336',
    },
    {
      label: 'You Owe',
      value: `₹${stats.totalOwing.toFixed(2)}`,
      color: '#F44336',
    },
    {
      label: 'You\'re Owed',
      value: `₹${stats.totalOwed.toFixed(2)}`,
      color: '#4CAF50',
    },
  ];

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Welcome Header */}
        <ResponsiveLiquidGlassCard
          padding={{
            small: 20,
            medium: 24,
            large: 28,
            tablet: 32,
          }}
          marginBottom={24}
          borderRadius={{
            small: 20,
            medium: 22,
            large: 24,
            tablet: 26,
          }}
          style={[platformStyles.headerCard, styles.headerCard] as any}
        >
          <SectionHeader
            title={`Welcome back, ${user?.name || 'User'}!`}
            subtitle="Here's your expense overview"
            style={styles.headerContent}
          />
        </ResponsiveLiquidGlassCard>

        {/* Dashboard Stats */}
        <DashboardStats stats={dashboardStats} loading={dashboardLoading} />

        {/* Recent Activity */}
        <RecentActivity
          onViewAll={() => {
            // Navigate to activity screen
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>

      {/* Modals */}
      <CreateGroupModal
        visible={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onCreateGroup={handleCreateGroup}
      />

      {user && (
        <AddExpenseModal
          visible={showAddExpenseModal}
          onClose={() => setShowAddExpenseModal(false)}
          onAddExpense={handleAddExpense}
          currentUserId={user.id}
        />
      )}

      {/* Floating Action Button - Outside container for proper positioning */}
      <FloatingActionButton
        actions={[
          {
            id: 'create-group',
            title: 'Create Group',
            icon: '👥',
            onPress: () => setShowCreateGroupModal(true),
          },
          {
            id: 'add-expense',
            title: 'Add Expense',
            icon: '💰',
            onPress: () => {
              if (stats.totalGroups === 0) {
                Alert.alert('No Groups', 'Please create a group first before adding expenses.');
              } else {
                setShowAddExpenseModal(true);
              }
            },
          },
        ]}
        position="bottom-right"
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  headerCard: {
    marginBottom: 24,
  },
  headerContent: {
    marginBottom: 0,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
