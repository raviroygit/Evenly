import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { AdminUser } from '../../types';

export const UsersScreen: React.FC = () => {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await EvenlyBackendService.getAllUsers();
      // Deduplicate by user id (backend should already do this, but guard on client too)
      const seen = new Set<string>();
      const unique = data.filter((u) => {
        if (seen.has(u.id)) return false;
        seen.add(u.id);
        return true;
      });
      setUsers(unique);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return '#F59E0B';
      case 'admin':
        return '#8B5CF6';
      case 'member':
        return '#10B981';
      default:
        return colors.mutedForeground;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const rowBg = theme === 'dark' ? '#1A1A2E' : '#F9FAFB';
  const headerBg = theme === 'dark' ? '#12122080' : '#F3F4F6';
  const borderColor = theme === 'dark' ? '#2E2E45' : '#E5E7EB';
  const cardBg = theme === 'dark' ? '#1C1C2E' : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Ionicons name="people" size={24} color="#3B82F6" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            All Users
          </Text>
        </View>
        {!loading && (
          <View style={[styles.totalBadge, { backgroundColor: '#3B82F615' }]}>
            <Text style={styles.totalBadgeText}>{filteredUsers.length}</Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: cardBg, borderColor },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by name or email..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading users...
          </Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            {search.trim() ? 'No users match your search' : 'No users found'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.tableScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Table Header */}
          <View style={[styles.tableHeader, { backgroundColor: headerBg, borderColor }]}>
            <Text style={[styles.thName, { color: colors.mutedForeground }]}>User</Text>
            <Text style={[styles.thRole, { color: colors.mutedForeground }]}>Role</Text>
            <Text style={[styles.thDate, { color: colors.mutedForeground }]}>Joined</Text>
          </View>

          {/* Table Rows */}
          {filteredUsers.map((user, index) => (
            <TouchableOpacity
              key={`${user.id}-${index}`}
              style={[
                styles.tableRow,
                {
                  backgroundColor: index % 2 === 0 ? rowBg : 'transparent',
                  borderColor,
                },
              ]}
              onPress={() => setSelectedUser(user)}
              activeOpacity={0.6}
            >
              {/* Avatar + Name + Email */}
              <View style={styles.cellName}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.nameGroup}>
                  <Text
                    style={[styles.userName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {user.name}
                  </Text>
                  <Text
                    style={[styles.userEmail, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {user.email}
                  </Text>
                  {user.invitedByName && (
                    <Text
                      style={[styles.invitedByText, { color: '#8B5CF6' }]}
                      numberOfLines={1}
                    >
                      Invited by {user.invitedByName}
                    </Text>
                  )}
                </View>
              </View>

              {/* Role Badge */}
              <View style={styles.cellRole}>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: getRoleBadgeColor(user.role) + '20' },
                  ]}
                >
                  <Text
                    style={[styles.roleText, { color: getRoleBadgeColor(user.role) }]}
                  >
                    {user.role}
                  </Text>
                </View>
              </View>

              {/* Date */}
              <Text style={[styles.cellDate, { color: colors.mutedForeground }]}>
                {formatDate(user.createdAt)}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* User Info Modal */}
      {selectedUser && (
        <UserInfoModal
          user={selectedUser}
          visible={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onDelete={(userId) => {
            setSelectedUser(null);
            setUsers((prev) => prev.filter((u) => u.id !== userId));
          }}
        />
      )}
    </View>
  );
};

// ── User Info Modal ──

interface UserInfoModalProps {
  user: AdminUser;
  visible: boolean;
  onClose: () => void;
  onDelete: (userId: string) => void;
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({ user, visible, onClose, onDelete }) => {
  const { colors, theme } = useTheme();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}? This will remove all their expenses, payments, and group data. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await EvenlyBackendService.adminDeleteUser(user.id);
              Alert.alert('Success', `${user.name} has been deleted.`);
              onDelete(user.id);
            } catch (error: any) {
              const message = error?.response?.data?.message || error?.message || 'Failed to delete user';
              Alert.alert('Error', message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return '#F59E0B';
      case 'admin':
        return '#8B5CF6';
      case 'member':
        return '#10B981';
      default:
        return colors.mutedForeground;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const infoRows: { icon: string; label: string; value: string; action?: () => void }[] = [
    { icon: 'person-outline', label: 'Name', value: user.name },
    {
      icon: 'mail-outline',
      label: 'Email',
      value: user.email,
      action: () => Linking.openURL(`mailto:${user.email}`),
    },
  ];

  if (user.phoneNumber) {
    infoRows.push({
      icon: 'call-outline',
      label: 'Phone',
      value: user.phoneNumber,
      action: () => Linking.openURL(`tel:${user.phoneNumber}`),
    });
  }

  infoRows.push({
    icon: 'calendar-outline',
    label: 'Joined',
    value: formatDate(user.createdAt),
  });

  if (user.invitedByName) {
    infoRows.push({
      icon: 'people-outline',
      label: 'Invited By',
      value: user.invitedByName + (user.invitedByEmail ? ` (${user.invitedByEmail})` : ''),
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[
          modalStyles.overlay,
          { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' },
        ]}
      >
        <TouchableOpacity
          style={modalStyles.overlayBackground}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            modalStyles.container,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            style={modalStyles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={[modalStyles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[modalStyles.avatarText, { color: colors.primary }]}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Name + Role */}
          <Text style={[modalStyles.name, { color: colors.foreground }]}>
            {user.name}
          </Text>
          <View
            style={[
              modalStyles.roleBadge,
              { backgroundColor: getRoleBadgeColor(user.role) + '20' },
            ]}
          >
            <Text style={[modalStyles.roleText, { color: getRoleBadgeColor(user.role) }]}>
              {user.role}
            </Text>
          </View>

          {/* Info Rows */}
          <View style={modalStyles.infoList}>
            {infoRows.map((row) => (
              <TouchableOpacity
                key={row.label}
                style={[
                  modalStyles.infoRow,
                  {
                    backgroundColor: theme === 'dark' ? '#1A1A2E' : '#F9FAFB',
                    borderColor: theme === 'dark' ? '#2E2E45' : '#E5E7EB',
                  },
                ]}
                disabled={!row.action}
                onPress={row.action}
                activeOpacity={row.action ? 0.6 : 1}
              >
                <Ionicons
                  name={row.icon as any}
                  size={20}
                  color={colors.mutedForeground}
                  style={modalStyles.infoIcon}
                />
                <View style={modalStyles.infoContent}>
                  <Text style={[modalStyles.infoLabel, { color: colors.mutedForeground }]}>
                    {row.label}
                  </Text>
                  <Text style={[modalStyles.infoValue, { color: colors.foreground }]}>
                    {row.value}
                  </Text>
                </View>
                {row.action && (
                  <Ionicons name="open-outline" size={16} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Delete Button — hidden for owners */}
          {user.role !== 'owner' && (
            <TouchableOpacity
              style={[modalStyles.deleteButton, deleting && { opacity: 0.5 }]}
              onPress={handleDelete}
              disabled={deleting}
              activeOpacity={0.7}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                  <Text style={modalStyles.deleteButtonText}>Delete User</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  tableScroll: {
    flex: 1,
    paddingHorizontal: 12,
  },

  // Table header
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
  },
  thName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  thRole: {
    width: 72,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  thDate: {
    width: 80,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'right',
  },

  // Table row
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cellName: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  nameGroup: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
  },
  userEmail: {
    fontSize: 11,
  },
  invitedByText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  cellRole: {
    width: 72,
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cellDate: {
    width: 80,
    fontSize: 11,
    textAlign: 'right',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: '88%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 20,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoList: {
    width: '100%',
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
