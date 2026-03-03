import React from 'react';
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
import { useTranslation } from 'react-i18next';

interface ReferredUser {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
}

interface FriendsJoinedModalProps {
  visible: boolean;
  onClose: () => void;
  referredUsers: ReferredUser[];
  loading?: boolean;
}

export const FriendsJoinedModal: React.FC<FriendsJoinedModalProps> = ({
  visible,
  onClose,
  referredUsers,
  loading = false,
}) => {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();

  const safeUsers = Array.isArray(referredUsers) ? referredUsers : [];

  if (!visible) return null;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getInitial = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

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
                  {t('referral.friendsJoined', { count: safeUsers.length })}
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
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                      {t('common.loading')}
                    </Text>
                  </View>
                ) : safeUsers.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name="person-add-outline"
                      size={48}
                      color={colors.mutedForeground}
                    />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      {t('referral.noFriendsYet')}
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                      {t('referral.shareTitle')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.usersList}>
                    {safeUsers.map((user) => (
                      <View
                        key={user.id}
                        style={[
                          styles.userItem,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.userInfo}>
                          <View
                            style={[
                              styles.avatar,
                              { backgroundColor: colors.primary + '20' },
                            ]}
                          >
                            <Text style={[styles.avatarText, { color: colors.primary }]}>
                              {getInitial(user.name)}
                            </Text>
                          </View>
                          <View style={styles.userDetails}>
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
                          </View>
                        </View>
                        <Text style={[styles.joinDate, { color: colors.mutedForeground }]}>
                          {formatDate(user.joinedAt)}
                        </Text>
                      </View>
                    ))}
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
  },
  overlayBackground: {
    flex: 1,
  },
  modalWrapper: {
    maxHeight: '85%',
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  usersList: {
    gap: 12,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
  },
  joinDate: {
    fontSize: 12,
    fontWeight: '500',
  },
});
