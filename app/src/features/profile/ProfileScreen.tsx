import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { useUserBalances } from '../../hooks/useBalances';
import { useGroups } from '../../hooks/useGroups';
import { PlatformActionButton } from '../../components/ui/PlatformActionButton';
import { GlassMenuCard } from '../../components/ui/GlassMenuCard';
import { UserProfile } from '../../components/features/profile/UserProfile';
import { useTheme } from '../../contexts/ThemeContext';
import { PullToRefreshSpinner } from '../../components/ui/PullToRefreshSpinner';
import { PullToRefreshScrollView } from '../../components/ui/PullToRefreshScrollView';
import { createPullToRefreshHandlers } from '../../utils/pullToRefreshUtils';
import { AboutModal } from '../../components/modals/AboutModal';
import { SupportModal } from '../../components/modals/SupportModal';
import { PrivacySecurityModal } from '../../components/modals/PrivacySecurityModal';
import { PersonalInfoModal } from '../../components/modals/PersonalInfoModal';
import { PersonalInfoPreviewModal } from '../../components/modals/PersonalInfoPreviewModal';
import { GroupsListModal } from '../../components/modals/GroupsListModal';
import { GroupInfoModal } from '../../components/modals/GroupInfoModal';
import { CustomersListModal } from '../../components/modals/CustomersListModal';
import { CustomerInfoModal } from '../../components/modals/CustomerInfoModal';
import { LanguageSelectionModal } from '../../components/modals/LanguageSelectionModal';
import { OrganizationSwitcher } from '../../components/navigation/OrganizationSwitcher';

export const ProfileScreen: React.FC = () => {
  const { user, logout, currentOrganization, authState, refreshUser } = useAuth();
  const { colors, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { netBalance, loading: balancesLoading, refreshUserBalances } = useUserBalances();
  const { groups, loading: groupsLoading, refreshGroups } = useGroups();
  const [refreshing, setRefreshing] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showPrivacySecurityModal, setShowPrivacySecurityModal] = useState(false);
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  const [showPersonalInfoPreviewModal, setShowPersonalInfoPreviewModal] = useState(false);
  const [showGroupsListModal, setShowGroupsListModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [profileUpdateTrigger, setProfileUpdateTrigger] = useState(0);
  const [khataSummary, setKhataSummary] = useState<{ totalGive: string; totalGet: string } | null>(null);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; email?: string; phone?: string; balance: string; type: 'give' | 'get' | 'settled'; createdAt?: string; updatedAt?: string }>>([]);
  const [khataSummaryLoading, setKhataSummaryLoading] = useState(false);
  const [showCustomersListModal, setShowCustomersListModal] = useState(false);
  const [showCustomerInfoModal, setShowCustomerInfoModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
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
  } | null>(null);

  const fetchKhataSummary = async () => {
    setKhataSummaryLoading(true);
    try {
      const [summary, customersList] = await Promise.all([
        EvenlyBackendService.getKhataFinancialSummary(),
        EvenlyBackendService.getKhataCustomers({ cacheTTLMs: 0 }),
      ]);
      setKhataSummary(summary);
      setCustomers(Array.isArray(customersList) ? customersList : []);
    } catch {
      setKhataSummary(null);
      setCustomers([]);
    } finally {
      setKhataSummaryLoading(false);
    }
  };

  const customerCount = customers.length;

  useEffect(() => {
    fetchKhataSummary();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshUser ? refreshUser() : Promise.resolve(),
        refreshGroups ? refreshGroups() : Promise.resolve(),
        refreshUserBalances ? refreshUserBalances() : Promise.resolve(),
        fetchKhataSummary(),
      ]);
      setProfileUpdateTrigger(prev => prev + 1);
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  // Combined overall balance: groups + khata (customers)
  const overallBalance = useMemo(() => {
    const groupsOwed = typeof netBalance?.totalOwed === 'number' && !isNaN(netBalance.totalOwed) ? netBalance.totalOwed : 0;
    const groupsOwing = typeof netBalance?.totalOwing === 'number' && !isNaN(netBalance.totalOwing) ? netBalance.totalOwing : 0;
    const khataGet = khataSummary ? parseFloat(khataSummary.totalGet) || 0 : 0;
    const khataGive = khataSummary ? parseFloat(khataSummary.totalGive) || 0 : 0;
    const totalOwed = groupsOwed + khataGet;
    const totalOwing = groupsOwing + khataGive;
    const net = totalOwed - totalOwing;
    return {
      totalOwed,
      totalOwing,
      netBalance: net,
    };
  }, [netBalance?.totalOwed, netBalance?.totalOwing, khataSummary]);
  const balanceLoading = balancesLoading || khataSummaryLoading;

  const handlePersonalInfoSuccess = () => {
    // Force re-render when personal info is updated
    setProfileUpdateTrigger(prev => prev + 1);
  };

  // Create pull-to-refresh handlers using utility function
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag } = createPullToRefreshHandlers({
    onRefresh,
    refreshing,
  });

  // Calculate user initials from real user data
  // Include profileUpdateTrigger in dependency to force recalculation
  const userInitials = useMemo(() => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    return names.map(name => name.charAt(0)).join('').toUpperCase();
  }, [user?.name, profileUpdateTrigger]);

  // Get current language display
  const currentLanguageDisplay = useMemo(() => {
    const lang = i18n.language || 'en';
    return lang === 'hi' ? 'हिंदी' : 'English';
  }, [i18n.language]);


  const handleLogout = async () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logout') + '?',
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth/login');
            } catch (error) {
              // Handle logout error silently
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccount') + ' - ' + t('errors.tryAgain'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await EvenlyBackendService.deleteCurrentUser();
              if (res.success) {
                await logout();
                Alert.alert(t('profile.deleteAccount'), res.message || t('profile.deleteAccount'));
              } else {
                Alert.alert(t('common.error'), res.message || t('profile.deleteAccount'));
              }
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message || t('profile.deleteAccount'));
            }
          }
        }
      ]
    );
  };

  const handleGroupPress = (groupId: string) => {
    setSelectedGroupId(groupId);
    setShowGroupsListModal(false);
    setTimeout(() => {
      setShowGroupInfoModal(true);
    }, 300);
  };

  const handleGroupInfoClose = () => {
    setShowGroupInfoModal(false);
    setTimeout(() => {
      setShowGroupsListModal(true);
    }, 300);
  };

  const handleCustomerPress = (customer: {
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
  }) => {
    setShowCustomersListModal(false);
    setSelectedCustomer(customer);
    setTimeout(() => setShowCustomerInfoModal(true), 300);
  };

  const handleCustomerInfoClose = () => {
    setShowCustomerInfoModal(false);
    setSelectedCustomer(null);
  };

  // Show loading state while initializing auth
  if (authState === 'initializing') {
    return (
      <>
        <PullToRefreshSpinner refreshing={refreshing} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <PullToRefreshScrollView
            refreshing={refreshing}
            onRefresh={onRefresh}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            contentContainerStyle={styles.contentContainer}
          >
            <GlassMenuCard
              title={t('profile.title')}
              subtitle={t('common.loading')}
              items={[]}
            />
          </PullToRefreshScrollView>
        </View>
      </>
    );
  }

  // Show loading state while refreshing session
  if (authState === 'refreshing') {
    return (
      <>
        <PullToRefreshSpinner refreshing={refreshing} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <PullToRefreshScrollView
            refreshing={refreshing}
            onRefresh={onRefresh}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            contentContainerStyle={styles.contentContainer}
          >
            <GlassMenuCard
              title={t('profile.title')}
              subtitle={t('common.loading')}
              items={[]}
            />
          </PullToRefreshScrollView>
        </View>
      </>
    );
  }

  // Show loading state if user data is not available
  if (!user) {
    return (
      <>
        <PullToRefreshSpinner refreshing={refreshing} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <PullToRefreshScrollView
            refreshing={refreshing}
            onRefresh={onRefresh}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            contentContainerStyle={styles.contentContainer}
          >
            <GlassMenuCard
              title={t('profile.title')}
              subtitle={t('common.loading')}
              items={[]}
            />
          </PullToRefreshScrollView>
        </View>
      </>
    );
  }

  return (
    <>
      <PullToRefreshSpinner refreshing={refreshing} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <PullToRefreshScrollView
          refreshing={refreshing}
          onRefresh={onRefresh}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          contentContainerStyle={styles.contentContainer}
        >
      {/* Profile Header */}
      <UserProfile 
        user={{
          ...user,
          name: user.name || 'User',
        }} 
        initials={userInitials}
        onThemeToggle={toggleTheme}
        onEditPress={() => setShowPersonalInfoModal(true)}
      />

      {/* Organization Switcher - Only for owners */}
      {currentOrganization?.role === 'owner' && (
        <View style={styles.orgSwitcherContainer}>
          <OrganizationSwitcher />
        </View>
      )}

      {/* Balance Summary (Groups + Khata combined) */}
      <GlassMenuCard
        title={t('dashboard.yourBalance')}
        items={[
          {
            title: t('khata.balance'),
            subtitle: balanceLoading ? t('common.loading') : undefined,
            rightElement: balanceLoading ? undefined : (
              <View style={styles.balanceRow}>
                <Text style={[
                  styles.balanceAmount,
                  {
                    color: overallBalance.netBalance >= 0 ? '#10B981' : '#EF4444'
                  }
                ]}>
                  ₹{overallBalance.netBalance.toFixed(2)}
                </Text>
                <Text style={[
                  styles.balanceLabel,
                  {
                    color: overallBalance.netBalance >= 0 ? '#10B981' : '#EF4444'
                  }
                ]}>
                  {overallBalance.netBalance >= 0 ? t('dashboard.youAreOwed') : t('dashboard.youOwe')}
                </Text>
              </View>
            ),
          },
          {
            title: t('dashboard.youAreOwed'),
            subtitle: balanceLoading ? t('common.loading') : undefined,
            rightElement: balanceLoading ? undefined : (
              <Text style={[styles.balanceAmount, { color: '#10B981' }]}>
                ₹{overallBalance.totalOwed.toFixed(2)}
              </Text>
            ),
          },
          {
            title: t('dashboard.youOwe'),
            subtitle: balanceLoading ? t('common.loading') : undefined,
            rightElement: balanceLoading ? undefined : (
              <Text style={[styles.balanceAmount, { color: '#EF4444' }]}>
                ₹{overallBalance.totalOwing.toFixed(2)}
              </Text>
            ),
          },
          {
            title: t('groups.title'),
            subtitle: groupsLoading ? t('common.loading') : `${groups.length} ${groups.length !== 1 ? t('groups.title').toLowerCase() : t('groups.title').toLowerCase()}`,
            onPress: () => setShowGroupsListModal(true),
          },
          {
            title: t('khata.customers'),
            subtitle: balanceLoading ? t('common.loading') : `${customerCount} ${customerCount !== 1 ? t('khata.customers').toLowerCase() : t('khata.customers').toLowerCase()}`,
            onPress: () => setShowCustomersListModal(true),
          },
        ]}
      />



      {/* Account Section */}
      <GlassMenuCard
        title={t('profile.settings')}
        items={[
          {
            title: t('modals.personalInformation'),
            subtitle: t('modals.viewProfile'),
            onPress: () => setShowPersonalInfoPreviewModal(true),
          },
          {
            title: t('profile.language'),
            subtitle: currentLanguageDisplay,
            onPress: () => setShowLanguageModal(true),
          },
          {
            title: t('profile.privacy'),
            subtitle: t('profile.privacy'),
            onPress: () => setShowPrivacySecurityModal(true),
          },
          {
            title: t('profile.deleteAccount'),
            subtitle: t('profile.deleteAccount'),
            onPress: handleDeleteAccount,
          },
        ]}
      />

      {/* Support Section */}
      <GlassMenuCard
        title={t('profile.about')}
        items={[
          {
            title: t('profile.about'),
            subtitle: t('profile.about'),
            onPress: () => setShowSupportModal(true),
          },
          {
            title: t('profile.version'),
            subtitle: t('profile.version'),
            onPress: () => setShowAboutModal(true),
          },
        ]}
      />

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <PlatformActionButton
          title={t('auth.logout')}
          onPress={handleLogout}
          variant="destructive"
          size="large"
        />

      </View>
        </PullToRefreshScrollView>
      </View>

      {/* About Modal */}
      <AboutModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      {/* Support Modal */}
      <SupportModal
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />

      {/* Privacy & Security Modal */}
      <PrivacySecurityModal
        visible={showPrivacySecurityModal}
        onClose={() => setShowPrivacySecurityModal(false)}
      />

      {/* Personal Info Edit Modal */}
      <PersonalInfoModal
        visible={showPersonalInfoModal}
        onClose={() => setShowPersonalInfoModal(false)}
        onSuccess={handlePersonalInfoSuccess}
      />

      {/* Personal Info Preview Modal (view only) */}
      <PersonalInfoPreviewModal
        visible={showPersonalInfoPreviewModal}
        onClose={() => setShowPersonalInfoPreviewModal(false)}
        user={user}
      />

      {/* Groups List Modal */}
      <GroupsListModal
        visible={showGroupsListModal}
        onClose={() => {
          setShowGroupsListModal(false);
          setSelectedGroupId(null);
        }}
        groups={groups}
        onGroupPress={handleGroupPress}
        loading={groupsLoading}
      />

      {/* Group Info Modal */}
      <GroupInfoModal
        visible={showGroupInfoModal}
        onClose={handleGroupInfoClose}
        groupId={selectedGroupId}
      />

      {/* Customers List Modal */}
      <CustomersListModal
        visible={showCustomersListModal}
        onClose={() => setShowCustomersListModal(false)}
        customers={customers}
        onCustomerPress={handleCustomerPress}
        loading={khataSummaryLoading}
      />

      {/* Customer Info Modal (details when tapping a customer) */}
      <CustomerInfoModal
        visible={showCustomerInfoModal}
        onClose={handleCustomerInfoClose}
        customer={selectedCustomer}
      />

      {/* Language Selection Modal */}
      <LanguageSelectionModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
  },
  logoutContainer: {
    marginTop: 20,
    marginBottom: 120, // Increased bottom margin to ensure button is fully visible above tab bar
    alignItems: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  orgSwitcherContainer: {
    marginBottom: 20,
  },
});
