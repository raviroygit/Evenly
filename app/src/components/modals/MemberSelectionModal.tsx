import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import { ShareBalanceModal } from './ShareBalanceModal';
import { generateGroupBalanceMessage, SimplifiedDebt } from '../../utils/messageTemplates';
import { GroupMember } from '../../types';
import { useTranslation } from 'react-i18next';
import { shareBalance } from '../../utils/shareHelper';
import { usePreferredCurrency } from '../../hooks/usePreferredCurrency';

interface MemberSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string | null;
  groupName: string;
}

export const MemberSelectionModal: React.FC<MemberSelectionModalProps> = ({
  visible,
  onClose,
  groupId,
  groupName,
}) => {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const { user } = useAuth();
  const { symbol } = usePreferredCurrency();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (visible && groupId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, groupId]);

  const loadData = async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      // Load members and debts in parallel
      const [membersData, debtsData] = await Promise.all([
        EvenlyBackendService.getGroupMembers(groupId),
        EvenlyBackendService.getSimplifiedDebts(groupId),
      ]);

      // Map members and filter out current user
      const allMembers = membersData
        .map((m: any) => ({
          id: m.id || m.userId,
          userId: m.userId || m.user?.id, // Store actual user ID for filtering debts
          name: m.user?.name || m.name || t('common.unknown'),
          email: m.user?.email || m.email || t('common.unknown'),
          phone: m.user?.phone || m.phone, // Get phone number if available
          avatar: m.user?.avatar || m.avatar,
          role: m.role || 'member',
        }))
        .filter((m: any) => {
          // Filter out current user (can't share with yourself)
          // Check multiple possible ID fields to ensure we catch the current user
          if (!user) return true;
          const isCurrentUser = m.id === user.id || m.userId === user.id;
          if (isCurrentUser) {
          }
          return !isCurrentUser;
        });


      setMembers(allMembers);
      setSimplifiedDebts(debtsData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (member: GroupMember) => {
    setSelectedMember(member);

    // If phone exists, show alert to directly share via SMS or WhatsApp
    if (member.phone) {
      Alert.alert(
        t('modals.shareBalance'),
        t('modals.shareBalanceWith', { name: member.name }),
        [
          {
            text: t('modals.sendViaSMS'),
            onPress: () => handleDirectShare(member, 'sms'),
          },
          {
            text: t('modals.sendViaWhatsApp'),
            onPress: () => handleDirectShare(member, 'whatsapp'),
          },
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
        ]
      );
    } else {
      // If no phone, show the modal for manual sharing
      setShowShareModal(true);
    }
  };

  const handleDirectShare = async (member: GroupMember, method: 'sms' | 'whatsapp') => {
    const { debts, credits } = getMemberBalance(member);

    const message = generateGroupBalanceMessage(
      member.name,
      groupName,
      debts,
      credits,
      groupId || undefined,
      t,
      symbol
    );

    await shareBalance(method, message, member.phone);
  };

  const handleShareModalClose = () => {
    setShowShareModal(false);
    setSelectedMember(null);
  };

  // Calculate member-specific debts and credits
  const getMemberBalance = (member: any) => {
    const debts: SimplifiedDebt[] = [];
    const credits: SimplifiedDebt[] = [];

    // Use userId (actual user ID) instead of id (member ID) for matching
    const userIdToMatch = member.userId || member.id;


    simplifiedDebts.forEach((debt: any) => {

      // If this member owes money (fromUserId matches)
      if (debt.fromUserId === userIdToMatch) {
        debts.push({
          owesTo: debt.toUser?.name || 'Unknown',
          amount: debt.amount?.toString() || '0',
        });
      }
      // If this member is owed money (toUserId matches)
      if (debt.toUserId === userIdToMatch) {
        credits.push({
          owesTo: debt.fromUser?.name || 'Unknown',
          amount: debt.amount?.toString() || '0',
        });
      }
    });

    return { debts, credits };
  };

  const handleClose = () => {
    onClose();
  };

  if (!visible || !groupId) {
    return null;
  }

  return (
    <>
      <Modal
        visible={visible && !showShareModal}
        transparent
        animationType="slide"
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
                  <View>
                    <Text style={[styles.title, { color: colors.foreground }]}>
                      {t('modals.shareBalance')}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                      {t('modals.selectMemberToShare')}
                    </Text>
                  </View>
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
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                        {t('modals.loadingMembers')}
                      </Text>
                    </View>
                  ) : members.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
                      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                        {t('modals.noOtherMembers')}
                      </Text>
                      <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                        {t('modals.inviteMembersToShare')}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.membersList}>
                      {members.map((member) => {
                        const { debts, credits } = getMemberBalance(member);
                        const hasBalance = debts.length > 0 || credits.length > 0;

                        return (
                          <TouchableOpacity
                            key={member.id}
                            style={[
                              styles.memberCard,
                              {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                              },
                            ]}
                            onPress={() => handleMemberSelect(member)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.memberInfo}>
                              <View
                                style={[
                                  styles.memberAvatar,
                                  { backgroundColor: colors.primary + '20' },
                                ]}
                              >
                                <Text style={[styles.memberAvatarText, { color: colors.primary }]}>
                                  {member.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <View style={styles.memberDetails}>
                                <Text style={[styles.memberName, { color: colors.foreground }]}>
                                  {member.name}
                                </Text>
                                <Text style={[styles.memberEmail, { color: colors.mutedForeground }]}>
                                  {hasBalance
                                    ? `${debts.length + credits.length} ${debts.length + credits.length !== 1 ? t('modals.transactions') : t('modals.transaction')}`
                                    : t('khata.settled')}
                                </Text>
                              </View>
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={colors.mutedForeground}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Share Balance Modal */}
      {selectedMember && (() => {
        const { debts, credits } = getMemberBalance(selectedMember);
        return (
          <ShareBalanceModal
            visible={showShareModal}
            onClose={handleShareModalClose}
            message={generateGroupBalanceMessage(
              selectedMember.name,
              groupName,
              debts,
              credits,
              groupId || undefined,
              t,
              symbol
            )}
            phoneNumber={selectedMember.phone}
            recipientName={selectedMember.name}
          />
        );
      })()}
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
    minHeight: '50%',
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
  membersList: {
    gap: 8,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  memberEmail: {
    fontSize: 13,
    fontWeight: '500',
  },
});
