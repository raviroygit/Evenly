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
import { Group } from '../../types';

interface GroupsListModalProps {
  visible: boolean;
  onClose: () => void;
  groups: Group[];
  onGroupPress: (groupId: string) => void;
  loading?: boolean;
}

export const GroupsListModal: React.FC<GroupsListModalProps> = ({
  visible,
  onClose,
  groups,
  onGroupPress,
  loading = false,
}) => {
  const { colors, theme } = useTheme();

  if (!visible) return null;

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
                  Your Groups
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
                      Loading groups...
                    </Text>
                  </View>
                ) : groups.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name="people-outline"
                      size={48}
                      color={colors.mutedForeground}
                    />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      No groups yet
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                      Create your first group to start splitting expenses
                    </Text>
                  </View>
                ) : (
                  <View style={styles.groupsList}>
                    {groups.map((group) => (
                      <TouchableOpacity
                        key={group.id}
                        style={[
                          styles.groupItem,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => onGroupPress(group.id)}
                      >
                        <View style={styles.groupInfo}>
                          <View
                            style={[
                              styles.groupIcon,
                              { backgroundColor: colors.primary + '20' },
                            ]}
                          >
                            <Ionicons
                              name="people"
                              size={24}
                              color={colors.primary}
                            />
                          </View>
                          <View style={styles.groupDetails}>
                            <Text
                              style={[styles.groupName, { color: colors.foreground }]}
                              numberOfLines={1}
                            >
                              {group.name}
                            </Text>
                            <View style={styles.groupMeta}>
                              <Ionicons
                                name="person-outline"
                                size={14}
                                color={colors.mutedForeground}
                              />
                              <Text
                                style={[
                                  styles.groupMembers,
                                  { color: colors.mutedForeground },
                                ]}
                              >
                                {group.memberCount} member
                                {group.memberCount !== 1 ? 's' : ''}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.eyeButton,
                            { backgroundColor: colors.primary + '15' },
                          ]}
                          onPress={() => onGroupPress(group.id)}
                        >
                          <Ionicons name="eye-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                      </TouchableOpacity>
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
  groupsList: {
    gap: 12,
    paddingBottom: 20,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupMembers: {
    fontSize: 13,
    fontWeight: '500',
  },
  eyeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
