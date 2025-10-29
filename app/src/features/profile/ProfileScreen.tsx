import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Alert, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
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

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { colors, toggleTheme } = useTheme();
  const router = useRouter();
  const { netBalance, loading: balancesLoading, refreshUserBalances } = useUserBalances();
  const { groups, loading: groupsLoading, refreshGroups } = useGroups();
  const [refreshing, setRefreshing] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showPrivacySecurityModal, setShowPrivacySecurityModal] = useState(false);
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh both groups and balances
      if (refreshGroups) {
        await refreshGroups();
      }
      if (refreshUserBalances) {
        await refreshUserBalances();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Create pull-to-refresh handlers using utility function
  const { handleScroll, handleScrollBeginDrag, handleScrollEndDrag } = createPullToRefreshHandlers({
    onRefresh,
    refreshing,
  });

  // Calculate user initials from real user data
  const userInitials = useMemo(() => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    return names.map(name => name.charAt(0)).join('').toUpperCase();
  }, [user?.name]);


  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
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
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await EvenlyBackendService.deleteCurrentUser();
              if (res.success) {
                await logout();
                Alert.alert('Account Deleted', res.message || 'Your account has been deleted.');
              } else {
                Alert.alert('Error', res.message || 'Failed to delete account');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete account');
            }
          }
        }
      ]
    );
  };

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
              title="Profile"
              subtitle="Loading user information..."
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
          stats: {
            groups: groups.length,
            totalSpent: netBalance?.totalOwing || 0,
            owed: netBalance?.totalOwed || 0,
          }
        }} 
        initials={userInitials}
        onThemeToggle={toggleTheme}
      />

      {/* Balance Summary */}
      <GlassMenuCard
        title="Balance Summary"
        items={[
          {
            title: "Net Balance",
            subtitle: balancesLoading ? "Loading..." : `₹${netBalance?.netBalance.toFixed(2) || '0.00'}`,
            rightElement: (
              <Text style={[
                styles.balanceText,
                { 
                  color: netBalance && netBalance.netBalance >= 0 ? '#4CAF50' : '#F44336' 
                }
              ]}>
                {netBalance && netBalance.netBalance >= 0 ? 'Owed' : 'Owing'}
              </Text>
            ),
          },
          {
            title: "Total Owed",
            subtitle: balancesLoading ? "Loading..." : `₹${netBalance?.totalOwed.toFixed(2) || '0.00'}`,
          },
          {
            title: "Total Owing",
            subtitle: balancesLoading ? "Loading..." : `₹${netBalance?.totalOwing.toFixed(2) || '0.00'}`,
          },
          {
            title: "Active Groups",
            subtitle: groupsLoading ? "Loading..." : `${groups.length} group${groups.length !== 1 ? 's' : ''}`,
          },
        ]}
      />



      {/* Account Section */}
      <GlassMenuCard
        title="Account"
        items={[
          {
            title: "Personal Information",
            subtitle: "Update your details",
            onPress: () => {
              setShowPersonalInfoModal(true);
            },
          },
          {
            title: "Payment Methods",
            subtitle: "Manage cards and accounts",
            onPress: () => {
              // Handle payment methods
            },
          },
          {
            title: "Notifications",
            subtitle: "Configure alerts",
            onPress: () => {
              // Handle notifications
            },
          },
          {
            title: "Privacy & Security",
            subtitle: "Control your data",
            onPress: () => setShowPrivacySecurityModal(true),
          },
          {
            title: "Delete Account",
            subtitle: "Permanently remove your account",
            onPress: handleDeleteAccount,
          },
        ]}
      />

      {/* Support Section */}
      <GlassMenuCard
        title="Support"
        items={[
          {
            title: "Help Center",
            subtitle: "Send us feedback",
            onPress: () => setShowSupportModal(true),
          },
          {
            title: "About",
            subtitle: "Learn more about the app",
            onPress: () => setShowAboutModal(true),
          },
        ]}
      />

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <PlatformActionButton
          title="Sign Out"
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

      {/* Personal Info Modal */}
      <PersonalInfoModal
        visible={showPersonalInfoModal}
        onClose={() => setShowPersonalInfoModal(false)}
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
  balanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
