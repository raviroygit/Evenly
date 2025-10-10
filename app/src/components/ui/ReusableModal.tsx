import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface ReusableModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  buttons?: React.ReactNode;
  titleGradient?: boolean;
  showInputField?: boolean;
  inputValue?: string;
  onInputChange?: (text: string) => void;
  onSendMessage?: () => void;
  inputPlaceholder?: string;
  isTyping?: boolean;
  isChatMode?: boolean; // New prop to indicate chat mode
  makeContentInteractive?: boolean; // New prop to make content interactive for iOS
  keyboardAvoidingBehavior?: 'height' | 'position' | 'padding'; // New prop for keyboard behavior
}

export const ReusableModal: React.FC<ReusableModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  buttons,
  titleGradient = false,
  showInputField = false,
  inputValue = '',
  onInputChange,
  onSendMessage,
  inputPlaceholder = 'Type your message...',
  isTyping = false,
  isChatMode = false,
  makeContentInteractive = true, // Default to true for better iOS scrolling
  keyboardAvoidingBehavior = Platform.OS === 'ios' ? 'padding' : 'height', // Default behavior
}) => {
  const { colors } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={keyboardAvoidingBehavior}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        enabled={true}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.container, { backgroundColor: colors.background }]}>
              {/* Header */}
              {titleGradient ? (
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientHeader}
                >
                  <View style={styles.header}>
                    <View style={styles.titleContainer}>
                      <Text style={[styles.title, { color: '#FFFFFF' }]}>
                        {title}
                      </Text>
                    </View>
                    {showCloseButton && (
                      <TouchableOpacity
                        style={[styles.closeButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                        onPress={onClose}
                      >
                        <Text style={[styles.closeButtonText, { color: '#FFFFFF' }]}>
                          ✕
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.header}>
                  <View style={styles.titleContainer}>
                    <Text 
                      style={[styles.title, { color: colors.foreground }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.8}
                    >
                      {title}
                    </Text>
                  </View>
                  {showCloseButton && (
                    <TouchableOpacity
                      style={[styles.closeButton, { backgroundColor: colors.muted }]}
                      onPress={onClose}
                    >
                      <Text style={[styles.closeButtonText, { color: colors.foreground }]}>
                        ✕
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Content - ScrollView for regular content, direct content for chat */}
              {isChatMode ? (
                <View style={styles.chatContent}>
                  {children}
                </View>
              ) : (
                <View style={styles.scrollWrapper}>
                  {Platform.OS === 'ios' ? (
                    <TouchableWithoutFeedback>
                      <View style={styles.iosTouchArea}>
                        <ScrollView 
                          style={[styles.scrollContent, styles.iosScrollContent]}
                          contentContainerStyle={[styles.scrollContentContainer, styles.iosScrollContentContainer]}
                          showsVerticalScrollIndicator={true}
                          keyboardShouldPersistTaps="handled"
                          keyboardDismissMode="interactive"
                          nestedScrollEnabled={false}
                          bounces={true}
                          alwaysBounceVertical={true}
                          scrollEventThrottle={1}
                          removeClippedSubviews={false}
                          scrollEnabled={true}
                          persistentScrollbar={true}
                          indicatorStyle="black"
                          scrollIndicatorInsets={{ right: 1, top: 0, bottom: 0, left: 0 }}
                          contentInsetAdjustmentBehavior="never"
                          automaticallyAdjustContentInsets={false}
                          contentInset={{ top: 0, bottom: 0, left: 0, right: 0 }}
                          scrollsToTop={false}
                          canCancelContentTouches={true}
                          delaysContentTouches={false}
                          directionalLockEnabled={false}
                          pinchGestureEnabled={false}
                          showsHorizontalScrollIndicator={false}
                          decelerationRate="fast"
                          minimumZoomScale={1}
                          maximumZoomScale={1}
                          bouncesZoom={false}
                          centerContent={false}
                          fadingEdgeLength={0}
                        >
                          {makeContentInteractive ? (
                            <TouchableWithoutFeedback>
                              <View style={styles.interactiveContent}>
                                {children}
                              </View>
                            </TouchableWithoutFeedback>
                          ) : (
                            children
                          )}
                        </ScrollView>
                      </View>
                    </TouchableWithoutFeedback>
                  ) : (
                    <ScrollView 
                      style={styles.scrollContent}
                      contentContainerStyle={styles.scrollContentContainer}
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="interactive"
                      nestedScrollEnabled={true}
                      bounces={true}
                      alwaysBounceVertical={false}
                      scrollEventThrottle={16}
                      removeClippedSubviews={false}
                      scrollEnabled={true}
                      persistentScrollbar={true}
                      indicatorStyle="default"
                      scrollIndicatorInsets={{ right: 1 }}
                      contentInsetAdjustmentBehavior="automatic"
                      automaticallyAdjustContentInsets={false}
                      contentInset={{ top: 0, bottom: 0, left: 0, right: 0 }}
                      scrollsToTop={false}
                    >
                      {children}
                    </ScrollView>
                  )}
                </View>
              )}

              {/* Fixed Buttons */}
              {buttons && (
                <View style={styles.buttonContainer}>
                  {buttons}
                </View>
              )}

              {/* Input Field - Only show when showInputField is true */}
              {showInputField && (
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                  <View style={styles.inputContainer}>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[
                          styles.input,
                          { color: colors.foreground }
                        ]}
                        value={inputValue}
                        onChangeText={onInputChange}
                        placeholder={inputPlaceholder}
                        placeholderTextColor={colors.mutedForeground}
                        multiline
                        maxLength={1000}
                        editable={!isTyping}
                        onSubmitEditing={onSendMessage}
                        returnKeyType="send"
                      />
                      <TouchableOpacity
                        style={[
                          styles.sendButton,
                          {
                            backgroundColor: inputValue.trim() && !isTyping ? colors.primary : colors.muted,
                          }
                        ]}
                        onPress={onSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                      >
                        <Ionicons 
                          name="send" 
                          size={20} 
                          color={inputValue.trim() && !isTyping ? '#FFFFFF' : colors.mutedForeground} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </KeyboardAvoidingView>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '85%', // Increased maximum height for better keyboard handling
    minHeight: 'auto', // Let content determine minimum height
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    alignSelf: 'flex-end', // Align to bottom instead of flex: 1
    width: '100%', // Full width
    flexShrink: 1, // Allow container to shrink when keyboard appears
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, // Reduced padding for small screens
    paddingTop: 16, // Reduced padding for small screens
    paddingBottom: 8, // Reduced padding for small screens
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22, // Slightly reduced for better fit on small screens
    fontWeight: 'bold',
  },
  gradientHeader: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  gradientTitle: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'center',
  },
  closeButton: {
    width: 28, // Slightly smaller for small screens
    height: 28, // Slightly smaller for small screens
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8, // Add margin to prevent overlap with title
  },
  closeButtonText: {
    fontSize: 16, // Slightly smaller for small screens
    fontWeight: 'bold',
  },
          scrollWrapper: {
            width: '100%', // Ensure full width for touch area
            // iOS-specific touch handling
            ...(Platform.OS === 'ios' && {
              backgroundColor: 'transparent',
            }),
          },
          scrollContent: {
            width: '100%', // Ensure full width for touch area
            // iOS-specific touch handling
            ...(Platform.OS === 'ios' && {
              backgroundColor: 'transparent',
            }),
          },
          scrollContentContainer: {
            paddingHorizontal: 20,
            paddingVertical: 20,
            paddingBottom: 60, // Increased bottom padding for better keyboard handling
            width: '100%', // Ensure full width for touch area
            alignItems: 'stretch', // Ensure content stretches to full width
            flexGrow: 1, // Allow content to grow when needed
          },
          iosScrollContent: {
            // iOS-specific scroll content styling
            backgroundColor: 'transparent',
            width: '100%',
          },
          iosScrollContentContainer: {
            // iOS-specific content container styling
            paddingHorizontal: 20,
            paddingVertical: 20,
            paddingBottom: 60, // Increased bottom padding for better keyboard handling
            width: '100%',
            alignItems: 'stretch',
            backgroundColor: 'transparent',
            flexGrow: 1, // Allow content to grow when needed
          },
          iosTouchArea: {
            width: '100%',
            backgroundColor: 'transparent',
          },
          interactiveContent: {
            width: '100%',
            backgroundColor: 'transparent',
          },
          chatContent: {
            flexShrink: 1, // Allow chat content to shrink based on available space
            paddingHorizontal: 0, // No horizontal padding for chat
            paddingVertical: 0, // No vertical padding for chat
          },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'transparent',
  },
  inputContainer: {
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'transparent',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 8,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 120,
    paddingVertical: 8,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
