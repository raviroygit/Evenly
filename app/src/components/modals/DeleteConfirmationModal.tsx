import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

interface DeleteConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
}) => {
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      await onConfirm(); // Wait for API to complete

      // Close modal only after successful deletion
      setDeleting(false);
      onClose();
    } catch (error) {
      // Error is handled by the parent component
      // Just reset the deleting state
      setDeleting(false);
    }
  };

  const handleClose = () => {
    if (!deleting) {
      onClose();
    }
  };

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
            disabled={deleting}
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
              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
                  <Ionicons name="trash-outline" size={32} color="#FF3B30" />
                </View>
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.foreground }]}>
                {title}
              </Text>

              {/* Description */}
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                {description}
              </Text>

              {/* Buttons */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    {
                      backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={handleClose}
                  disabled={deleting}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      styles.cancelButtonText,
                      { color: colors.foreground },
                      deleting && { opacity: 0.5 },
                    ]}
                  >
                    {cancelButtonText || t('common.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    {
                      backgroundColor: deleting ? '#CC3028' : '#FF3B30',
                    },
                  ]}
                  onPress={handleConfirm}
                  disabled={deleting}
                  activeOpacity={0.8}
                >
                  {deleting ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={[styles.buttonText, styles.confirmButtonText]}>
                        {t('modals.deleting')}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.buttonText, styles.confirmButtonText]}>
                      {confirmButtonText || t('common.delete')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
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
    paddingTop: Platform.OS === 'ios' ? 32 : 24,
    paddingBottom: Platform.OS === 'ios' ? 24 : 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  confirmButton: {
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    // color set dynamically
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
