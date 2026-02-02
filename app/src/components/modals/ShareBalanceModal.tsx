import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { shareBalance, ShareMethod } from '../../utils/shareHelper';

interface ShareBalanceModalProps {
  visible: boolean;
  onClose: () => void;
  message: string;
  phoneNumber?: string;
  recipientName: string;
}

export const ShareBalanceModal: React.FC<ShareBalanceModalProps> = ({
  visible,
  onClose,
  message,
  phoneNumber,
  recipientName,
}) => {
  const { colors, theme } = useTheme();

  const handleShare = async (method: ShareMethod) => {
    onClose(); // Close modal first for better UX
    await shareBalance(method, message, phoneNumber);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Share Balance
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Share balance with {recipientName}
          </Text>

          {/* SMS Option */}
          <TouchableOpacity
            style={[styles.optionCard, {
              backgroundColor: colors.card,
              borderColor: colors.border
            }]}
            onPress={() => handleShare('sms')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#007AFF20' }]}>
              <Ionicons name="chatbubble-ellipses" size={28} color="#007AFF" />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: colors.foreground }]}>
                Send via SMS
              </Text>
              <Text style={[styles.optionSubtitle, { color: colors.mutedForeground }]}>
                Open messaging app
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* WhatsApp Option */}
          <TouchableOpacity
            style={[styles.optionCard, {
              backgroundColor: colors.card,
              borderColor: colors.border
            }]}
            onPress={() => handleShare('whatsapp')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#25D36620' }]}>
              <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: colors.foreground }]}>
                Send via WhatsApp
              </Text>
              <Text style={[styles.optionSubtitle, { color: colors.mutedForeground }]}>
                Share on WhatsApp
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.muted }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
