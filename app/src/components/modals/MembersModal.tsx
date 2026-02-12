import React, { useState, useEffect } from 'react';
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
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { MemberInfoModal } from './MemberInfoModal';
import { GroupMember } from '../../types';
import { useTranslation } from 'react-i18next';

interface MembersModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string | null;
  groupName?: string;
}

export const MembersModal: React.FC<MembersModalProps> = ({
  visible,
  onClose,
  groupId,
  groupName,
}) => {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ name: string; email: string; phone?: string; id: string } | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [simplifiedDebts, setSimplifiedDebts] = useState<any[]>([]);

  useEffect(() => {
    if (visible && groupId) {
      loadMembers();
      loadSimplifiedDebts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, groupId]);

  const loadMembers = async () => {
    if (!groupId) return;

    try {
      setLoadingMembers(true);
      const membersData = await EvenlyBackendService.getGroupMembers(groupId);
      setMembers(membersData.map((m: any) => ({
        id: m.id || m.userId,
        name: m.user?.name || m.name || t('common.unknown'),
        email: m.user?.email || m.email || t('common.unknown'),
        phone: m.user?.phoneNumber || m.phone || m.user?.phone,
        avatar: m.user?.avatar || m.avatar,
        role: m.role || 'member',
      })));
    } catch (error) {
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadSimplifiedDebts = async () => {
    if (!groupId) return;

    try {
      const debtsData = await EvenlyBackendService.getSimplifiedDebts(groupId);
      setSimplifiedDebts(debtsData);
    } catch (error) {
      setSimplifiedDebts([]);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleMemberPress = (member: GroupMember) => {
    setSelectedMember({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
    });
    setShowMemberModal(true);
  };

  if (!visible || !groupId) {
    return null;
  }

  return (
    <>
      <Modal
        visible={visible && !showMemberModal}
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
                    {t('modals.members')}
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
                  {loadingMembers ? (
                    <View style={styles.emptyState}>
                      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        {t('modals.loadingMembers')}
                      </Text>
                    </View>
                  ) : members.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        {t('modals.noMembersFound')}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.membersList}>
                      {members.map((member) => (
                        <TouchableOpacity
                          key={member.id}
                          style={[
                            styles.memberRow,
                            {
                              backgroundColor: theme === 'dark'
                                ? '#1A1A1A'
                                : '#F8F8F8',
                              borderColor: theme === 'dark'
                                ? '#333333'
                                : '#E0E0E0',
                            },
                          ]}
                          onPress={() => handleMemberPress(member)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.memberInfo}>
                            <View style={[styles.memberAvatar, { backgroundColor: colors.primary + '20' }]}>
                              <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
                                {member.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.memberDetails}>
                              <Text style={[styles.memberName, { color: colors.foreground }]}>
                                {member.name}
                              </Text>
                              <Text style={[styles.memberRole, { color: colors.mutedForeground }]}>
                                {member.role === 'admin' ? t('modals.admin') : t('modals.member')}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.memberEyeButton}>
                            <Ionicons name="eye-outline" size={20} color={colors.foreground} />
                          </View>
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

      {/* Member Info Modal */}
      <MemberInfoModal
        visible={showMemberModal}
        onClose={() => {
          setShowMemberModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        groupName={groupName || 'Group'}
        groupId={groupId || undefined}
        simplifiedDebts={simplifiedDebts}
      />
    </>
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
  membersList: {
    gap: 8,
    paddingVertical: 8,
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
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});


