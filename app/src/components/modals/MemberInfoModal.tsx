import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { ShareBalanceModal } from './ShareBalanceModal';
import { generateGroupBalanceMessage, SimplifiedDebt } from '../../utils/messageTemplates';
import { useTranslation } from 'react-i18next';

interface MemberInfoModalProps {
  visible: boolean;
  onClose: () => void;
  member: {
    id: string;
    name: string;
    email: string;
  } | null;
  groupName?: string;
  groupId?: string;
  simplifiedDebts?: any[];
}

export const MemberInfoModal: React.FC<MemberInfoModalProps> = ({
  visible,
  onClose,
  member,
  groupName = 'Group',
  groupId,
  simplifiedDebts = [],
}) => {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const [showShareModal, setShowShareModal] = useState(false);

  const handleClose = () => {
    onClose();
  };

  // Calculate member-specific debts and credits
  const { memberDebts, memberCredits } = useMemo(() => {
    if (!member || !simplifiedDebts.length) {
      return { memberDebts: [], memberCredits: [] };
    }

    const debts: SimplifiedDebt[] = [];
    const credits: SimplifiedDebt[] = [];

    simplifiedDebts.forEach((debt: any) => {
      // If this member owes money (fromUserId is the debtor)
      if (debt.fromUserId === member.id) {
        debts.push({
          owesTo: debt.toUser?.name || 'Unknown',
          amount: debt.amount?.toString() || '0',
        });
      }
      // If this member is owed money (toUserId is the creditor)
      if (debt.toUserId === member.id) {
        credits.push({
          owesTo: debt.fromUser?.name || 'Unknown',
          amount: debt.amount?.toString() || '0',
        });
      }
    });

    return { memberDebts: debts, memberCredits: credits };
  }, [member, simplifiedDebts]);

  if (!visible || !member) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
                  {t('modals.memberInformation')}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      {t('profile.name')}
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>
                      {member.name}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      {t('profile.email')}
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>
                      {member.email}
                    </Text>
                  </View>
                </View>

                {/* Share Balance Button */}
                <TouchableOpacity
                  style={[styles.shareButton, {
                    backgroundColor: colors.primary,
                    borderColor: colors.border
                  }]}
                  onPress={() => setShowShareModal(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.shareButtonText}>{t('modals.shareBalance')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Share Balance Modal */}
      {member && (
        <ShareBalanceModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          message={generateGroupBalanceMessage(
            member.name,
            groupName,
            memberDebts,
            memberCredits,
            groupId
          )}
          recipientName={member.name}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalWrapper: {
    width: '90%',
    maxWidth: 400,
  },
  modalContainer: {
    borderRadius: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    maxHeight: '80%',
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
    padding: 20,
  },
  infoSection: {
    gap: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 16,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});


