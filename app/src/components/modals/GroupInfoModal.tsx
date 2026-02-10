import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useGroups } from '../../hooks/useGroups';
import { useAllExpenses } from '../../hooks/useAllExpenses';
import { SkeletonExpenseList } from '../ui/SkeletonLoader';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { MembersModal } from './MembersModal';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { groups, loading: groupsLoading } = useGroups();
  const { loading: expensesLoading } = useAllExpenses();
  const [creator, setCreator] = useState<{ name: string; email: string } | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  
  // Get screen width for responsive layout
  const screenWidth = Dimensions.get('window').width;
  const isLargeScreen = screenWidth >= 600; // Tablet or large phone threshold

  // Find the specific group
  const group = groups.find(g => g.id === groupId);

  useEffect(() => {
    if (visible && groupId) {
      loadCreator();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, groupId]);

  const loadCreator = async () => {
    if (!group?.createdBy || !groupId) return;
    
    try {
      setLoadingCreator(true);
      // Try to find creator in members first
      const membersData = await EvenlyBackendService.getGroupMembers(groupId);
      const creatorMember = membersData.find((m: any) => (m.userId || m.user?.id) === group.createdBy);
      
      if (creatorMember) {
        setCreator({
          name: creatorMember.user?.name || creatorMember.name || t('common.unknown'),
          email: creatorMember.user?.email || creatorMember.email || t('common.unknown'),
        });
      } else {
        // If not found in members, we'll just show the ID or try to get from auth
        setCreator({
          name: t('common.unknown'),
          email: t('common.unknown'),
        });
      }
    } catch (error) {
      setCreator({
        name: t('common.unknown'),
        email: t('common.unknown'),
      });
    } finally {
      setLoadingCreator(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleViewMembers = () => {
    setShowMembersModal(true);
  };

  const handleViewExpenses = () => {
    if (groupId) {
      onClose(); // Close the GroupInfoModal first
      router.push(`/tabs/groups/${groupId}` as any);
    }
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
                  {t('modals.groupInfo')}
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
                        {t('modals.groupDetails')}
                      </Text>
                      <View style={styles.groupInfo}>
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            {t('groups.groupName')}
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {group.name}
                          </Text>
                        </View>

                        {group.description && (
                          <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                              {t('groups.description')}
                            </Text>
                            <Text style={[styles.infoValue, { color: colors.foreground }]}>
                              {group.description}
                            </Text>
                          </View>
                        )}

                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            {t('modals.createdBy')}
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {loadingCreator ? t('common.loading') : (creator?.name || t('common.unknown'))}
                          </Text>
                        </View>

                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            {t('groups.members')}
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {group.memberCount} {t('modals.members')}
                          </Text>
                        </View>

                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            {t('modals.defaultSplit')}
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {group.defaultSplitType.charAt(0).toUpperCase() + group.defaultSplitType.slice(1)}
                          </Text>
                        </View>

                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            {t('modals.currency')}
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {group.currency}
                          </Text>
                        </View>

                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                            {t('modals.created')}
                          </Text>
                          <Text style={[styles.infoValue, { color: colors.foreground }]}>
                            {new Date(group.createdAt).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.section}>
                      <View style={[
                        styles.buttonsContainer,
                        isLargeScreen ? styles.buttonsRow : styles.buttonsColumn
                      ]}>
                        <TouchableOpacity
                          style={[
                            styles.viewButton,
                            isLargeScreen && styles.viewButtonRow
                          ]}
                          onPress={handleViewMembers}
                        >
                          <Text style={[styles.viewButtonText, { color: colors.primary }]}>
                            {t('modals.viewMembers')}
                      </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.viewButton,
                            isLargeScreen && styles.viewButtonRow
                          ]}
                          onPress={handleViewExpenses}
                        >
                          <Text style={[styles.viewButtonText, { color: colors.primary }]}>
                            {t('modals.viewGroupExpenses')}
                          </Text>
                        </TouchableOpacity>
                        </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colors.destructive }]}>
                      {t('modals.groupNotFound')}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
      
      {/* Members Modal */}
      <MembersModal
        visible={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        groupId={groupId}
        groupName={group?.name}
      />
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
  membersList: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
    fontWeight: '500',
  },
  memberEyeButton: {
    padding: 8,
  },
  buttonsContainer: {
    gap: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  buttonsColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  viewButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 160,
  },
  viewButtonRow: {
    flex: 1,
    maxWidth: 200,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
