import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';

export const AdminScreen: React.FC = () => {
  const { colors, theme } = useTheme();
  const { currentOrganization } = useAuth();
  const router = useRouter();
  const [userCount, setUserCount] = useState<number | null>(null);

  const isAdmin =
    currentOrganization?.role === 'owner' ||
    currentOrganization?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      EvenlyBackendService.getAllUsers()
        .then((data) => {
          const seen = new Set<string>();
          const unique = data.filter((u) => {
            if (seen.has(u.id)) return false;
            seen.add(u.id);
            return true;
          });
          setUserCount(unique.length);
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed" size={48} color={colors.mutedForeground} />
          <Text style={[styles.noAccessText, { color: colors.mutedForeground }]}>
            Admin access required
          </Text>
        </View>
      </View>
    );
  }

  const cardBg = theme === 'dark' ? '#1C1C2E' : '#FFFFFF';
  const cardBorder = theme === 'dark' ? '#2E2E45' : '#E5E7EB';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          Admin Panel
        </Text>
      </View>
      <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
        Manage your app and users
      </Text>

      {/* Card 1: Broadcast Notification */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
        onPress={() => router.push('/tabs/admin/broadcast')}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIcon, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="megaphone" size={26} color={colors.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Broadcast Notification
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
            Send push notification to all app users
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Card 2: All Users */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
        onPress={() => router.push('/tabs/admin/users')}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIcon, { backgroundColor: '#3B82F615' }]}>
          <Ionicons name="people" size={26} color="#3B82F6" />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            All Users
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
            View and manage all registered users
          </Text>
        </View>
        <View style={styles.cardRight}>
          {userCount !== null && (
            <View style={[styles.countBadge, { backgroundColor: '#3B82F615' }]}>
              <Text style={styles.countBadgeText}>{userCount}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={22} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>

      {/* Card 3: App Version */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
        onPress={() => router.push('/tabs/admin/app-version')}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIcon, { backgroundColor: '#10B98115' }]}>
          <Ionicons name="cloud-upload" size={26} color="#10B981" />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            App Version
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
            Manage in-app update prompts
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.mutedForeground} />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  noAccessText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
    marginTop: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  pageSubtitle: {
    fontSize: 14,
    marginBottom: 28,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
});
