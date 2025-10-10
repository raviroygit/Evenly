import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  SkeletonDashboardStats, 
  SkeletonExpenseSummary, 
  SkeletonGlassStatCard,
  SkeletonGlassInfoCard,
  SkeletonGlassListCard,
  SkeletonGlassActionCard,
  SkeletonGlassMenuCard,
  SkeletonRecentActivity,
  SkeletonExpenseList,
  SkeletonGroupList
} from '../ui/SkeletonLoader';
import { DashboardStats } from '../features/dashboard/DashboardStats';
import { ExpenseSummary } from '../features/expenses/ExpenseSummary';
import { GlassStatCard } from '../ui/GlassStatCard';
import { GlassInfoCard } from '../ui/GlassInfoCard';
import { GlassListCard } from '../ui/GlassListCard';
import { GlassActionCard } from '../ui/GlassActionCard';
import { GlassMenuCard } from '../ui/GlassMenuCard';
import { RecentActivity } from '../features/dashboard/RecentActivity';
import { ExpenseItem } from '../features/expenses/ExpenseItem';
import { GroupItem } from '../features/groups/GroupItem';

export const SkeletonDemo: React.FC = () => {
  const { colors, theme } = useTheme();
  const [showSkeletons, setShowSkeletons] = useState(true);

  const mockStats = [
    { label: 'Total Expenses', value: '$1,234.56', color: '#ef4444' },
    { label: 'Total Income', value: '$2,500.00', color: '#10b981' },
    { label: 'Net Balance', value: '$1,265.44', color: '#3b82f6' },
    { label: 'Groups', value: '3', color: '#8b5cf6' },
  ];

  const mockGlassStats = [
    { label: 'This Month', value: '$1,234' },
    { label: 'Last Month', value: '$987' },
    { label: 'Average', value: '$1,110' },
  ];

  const mockInfoItems = [
    { label: 'Total Groups', value: '3' },
    { label: 'Active Members', value: '12' },
    { label: 'Pending Invites', value: '2' },
    { label: 'Settled Debts', value: '8' },
  ];

  const mockMenuItems = [
    { title: 'Profile Settings', subtitle: 'Manage your account' },
    { title: 'Notification Preferences', subtitle: 'Customize alerts' },
    { title: 'Privacy & Security', subtitle: 'Control your data' },
    { title: 'Help & Support', subtitle: 'Get assistance' },
  ];

  const mockActionButtons = [
    { title: 'Add Expense', onPress: () => {}, variant: 'primary' as const },
    { title: 'Create Group', onPress: () => {}, variant: 'secondary' as const },
  ];

  const mockActivities = [
    {
      id: '1',
      type: 'group',
      title: 'Test Groups',
      description: '2 members',
      amount: undefined,
      date: '10/8/2025',
      status: 'completed',
    },
  ];

  const mockExpenses = [
    {
      id: '1',
      title: 'Coffee Shop',
      totalAmount: 4.50,
      paidByUser: { name: 'John Doe' },
      paidByDisplay: 'John paid',
      netBalance: { text: 'You borrowed', amount: 2.25, color: '#ef4444' },
      groupId: 'group1',
    },
  ];

  const mockGroups = [
    {
      id: '1',
      name: 'Test Group',
      memberCount: 2,
      currency: 'USD',
      description: 'Test group description',
      defaultSplitType: 'Equal',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Skeleton Loading Demo
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Compare skeleton loading with actual data cards
        </Text>
        
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowSkeletons(!showSkeletons)}
        >
          <Text style={[styles.toggleButtonText, { color: colors.primaryForeground }]}>
            {showSkeletons ? 'Show Real Data' : 'Show Skeletons'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Dashboard Stats
        </Text>
        {showSkeletons ? (
          <SkeletonDashboardStats />
        ) : (
          <DashboardStats stats={mockStats} loading={false} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Expense Summary
        </Text>
        {showSkeletons ? (
          <SkeletonExpenseSummary />
        ) : (
          <ExpenseSummary 
            totalExpenses={1234.56} 
            totalIncome={2500.00} 
            netBalance={1265.44} 
            loading={false} 
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Glass Stat Card
        </Text>
        {showSkeletons ? (
          <SkeletonGlassStatCard 
            title={true} 
            subtitle={true} 
            statsCount={3} 
          />
        ) : (
          <GlassStatCard
            title="Monthly Overview"
            subtitle="Your spending summary"
            stats={mockGlassStats}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Glass Info Card
        </Text>
        {showSkeletons ? (
          <SkeletonGlassInfoCard 
            title={true} 
            subtitle={false} 
            itemsCount={4} 
          />
        ) : (
          <GlassInfoCard
            title="Group Statistics"
            items={mockInfoItems}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Glass List Card
        </Text>
        {showSkeletons ? (
          <SkeletonGlassListCard 
            title={true} 
            subtitle={true} 
            itemsCount={3} 
          />
        ) : (
          <GlassListCard
            title="Recent Activity"
            subtitle="Your latest transactions"
          >
            <Text style={{ color: colors.mutedForeground, textAlign: 'center' }}>
              List items would go here
            </Text>
          </GlassListCard>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Glass Action Card
        </Text>
        {showSkeletons ? (
          <SkeletonGlassActionCard 
            title={true} 
            subtitle={false} 
            buttonsCount={2} 
          />
        ) : (
          <GlassActionCard
            title="Quick Actions"
            buttons={mockActionButtons}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Glass Menu Card
        </Text>
        {showSkeletons ? (
          <SkeletonGlassMenuCard 
            title={true} 
            subtitle={false} 
            itemsCount={4} 
          />
        ) : (
          <GlassMenuCard
            title="Settings"
            items={mockMenuItems}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Recent Activity
        </Text>
        {showSkeletons ? (
          <SkeletonRecentActivity />
        ) : (
          <RecentActivity
            activities={mockActivities}
            loading={false}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Expense Items
        </Text>
        {showSkeletons ? (
          <SkeletonExpenseList count={3} />
        ) : (
          <View>
            {mockExpenses.map((expense) => (
              <ExpenseItem key={expense.id} item={expense} groupName="Test Group" />
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Group Items
        </Text>
        {showSkeletons ? (
          <SkeletonGroupList count={2} />
        ) : (
          <View>
            {mockGroups.map((group) => (
              <GroupItem key={group.id} group={group} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          ✅ Skeleton loading now uses the same container structure as actual data cards
        </Text>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          ✅ Dimensions and styling match perfectly across all screen sizes
        </Text>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          ✅ ResponsiveLiquidGlassCard is used for consistent glass effects
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  footer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  footerText: {
    fontSize: 14,
    marginBottom: 8,
  },
});
