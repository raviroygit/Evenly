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

interface MembersModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string | null;
}

export const MembersModal: React.FC<MembersModalProps> = ({
  visible,
  onClose,
  groupId,
}) => {
  const { colors, theme } = useTheme();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ name: string; email: string } | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  useEffect(() => {
    if (visible && groupId) {
      loadMembers();
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
        name: m.user?.name || m.name || 'Unknown',
        email: m.user?.email || m.email || 'Unknown',
        avatar: m.user?.avatar || m.avatar,
        role: m.role || 'member',
      })));
    } catch (error) {
      console.error('Error loading group members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleMemberPress = (member: GroupMember) => {
    setSelectedMember({
      name: member.name,
      email: member.email,
    });
    setShowMemberModal(true);
  };

  if (!visible || !groupId) {
    return null;
  }

  return (
    <>
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
                    Members
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
                        Loading members...
                      </Text>
                    </View>
                  ) : members.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        No members found.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.membersList}>
                      {members.map((member) => (
                        <View
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
                                {member.role === 'admin' ? 'Admin' : 'Member'}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.memberEyeButton}
                            onPress={() => handleMemberPress(member)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="eye-outline" size={20} color={colors.foreground} />
                          </TouchableOpacity>
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

      {/* Member Info Modal */}
      <MemberInfoModal
        visible={showMemberModal}
        onClose={() => {
          setShowMemberModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
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


