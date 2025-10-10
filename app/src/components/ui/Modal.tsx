import React from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  title,
  showCloseButton = true,
}) => {
  const { colors } = useTheme();

  console.log('Modal render - visible:', visible, 'title:', title);

  if (!visible) {
    console.log('Modal not visible, returning null');
    return null;
  }

  console.log('Modal is visible, rendering modal');

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modal, { backgroundColor: colors.background }]}>
                {title && (
                  <View style={styles.header}>
                    <View style={styles.titleContainer}>
                      <View style={[styles.titleBar, { backgroundColor: colors.primary }]} />
                    </View>
                    <View style={styles.titleTextContainer}>
                      <View style={[styles.titleText, { color: colors.foreground }]}>
                        {title}
                      </View>
                    </View>
                    {showCloseButton && (
                      <TouchableOpacity
                        style={[styles.closeButton, { backgroundColor: colors.muted }]}
                        onPress={onClose}
                      >
                        <View style={[styles.closeIcon, { backgroundColor: colors.foreground }]} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              <View style={styles.content}>
                {children}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    height: '66%', // 2/3 of screen height
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  titleContainer: {
    width: 4,
    height: 20,
    marginRight: 12,
  },
  titleBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  titleTextContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
