import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../contexts/ThemeContext';
import evenlyApiClient from '../../services/EvenlyApiClient';

const MAX_FILE_SIZE_MB = 10;

export const BroadcastScreen: React.FC = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // ── Image helpers ──

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileSizeMB = fileInfo.size ? fileInfo.size / (1024 * 1024) : 0;

      let maxWidth = 1920;
      let compressionQuality = 0.7;

      if (fileSizeMB > 10) {
        compressionQuality = 0.6;
      } else if (fileSizeMB > 5) {
        compressionQuality = 0.7;
      } else if (fileSizeMB > 2) {
        compressionQuality = 0.75;
      } else {
        maxWidth = 2048;
        compressionQuality = 0.8;
      }

      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxWidth } }],
        { compress: compressionQuality, format: ImageManipulator.SaveFormat.JPEG }
      );

      return manipulatedImage.uri;
    } catch {
      return uri;
    }
  };

  const validateImageSize = async (uri: string): Promise<{ valid: boolean; sizeMB: number }> => {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      const sizeMB = info.size ? info.size / (1024 * 1024) : 0;
      return { valid: sizeMB <= MAX_FILE_SIZE_MB, sizeMB };
    } catch {
      return { valid: true, sizeMB: 0 };
    }
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const compressedUri = await compressImage(result.assets[0].uri);
        const { valid, sizeMB } = await validateImageSize(compressedUri);

        if (!valid) {
          Alert.alert('Image too large', `Image is ${sizeMB.toFixed(1)}MB. Max is ${MAX_FILE_SIZE_MB}MB.`);
          return;
        }

        setImageUri(compressedUri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your camera.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const compressedUri = await compressImage(result.assets[0].uri);
        const { valid, sizeMB } = await validateImageSize(compressedUri);

        if (!valid) {
          Alert.alert('Image too large', `Image is ${sizeMB.toFixed(1)}MB. Max is ${MAX_FILE_SIZE_MB}MB.`);
          return;
        }

        setImageUri(compressedUri);
      }
    } catch {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImageFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // ── Send broadcast ──

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing fields', 'Please enter both a title and message.');
      return;
    }

    Alert.alert(
      'Send Broadcast',
      `Send this notification to all users?\n\nTitle: ${title}\nMessage: ${body}${imageUri ? '\n\n(with image attached)' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'default',
          onPress: async () => {
            setSending(true);
            try {
              let result: any;

              if (imageUri) {
                const formData = new FormData();
                formData.append('title', title.trim());
                formData.append('body', body.trim());

                const filename = imageUri.split('/').pop() || 'broadcast.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('image', {
                  uri: imageUri,
                  name: filename,
                  type,
                } as any);

                result = await evenlyApiClient.post(
                  '/notifications/broadcast',
                  formData,
                  { timeout: 120000 }
                );
              } else {
                result = await evenlyApiClient.post(
                  '/notifications/broadcast',
                  { title: title.trim(), body: body.trim() }
                );
              }

              const data = result.data || result;
              Alert.alert(
                'Sent',
                data.message || `Broadcast sent to ${data.sent} device(s)`
              );
              setTitle('');
              setBody('');
              setImageUri(null);
            } catch (error: any) {
              Alert.alert(
                'Failed',
                error?.response?.data?.message || 'Failed to send broadcast'
              );
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTextGroup}>
            <Ionicons name="megaphone" size={24} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Broadcast Notification
            </Text>
          </View>
        </View>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          Send a push notification to all app users
        </Text>

        {/* Title Input */}
        <Text style={[styles.label, { color: colors.foreground }]}>Title</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          placeholder="Notification title"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
          maxLength={200}
          returnKeyType="next"
        />

        {/* Body Input */}
        <Text style={[styles.label, { color: colors.foreground }]}>Message</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: colors.card,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          placeholder="Notification message"
          placeholderTextColor={colors.mutedForeground}
          value={body}
          onChangeText={setBody}
          maxLength={500}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Character counts */}
        <View style={styles.countsRow}>
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
            Title: {title.length}/200
          </Text>
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
            Message: {body.length}/500
          </Text>
        </View>

        {/* Image Picker */}
        <Text style={[styles.label, { color: colors.foreground }]}>
          Image <Text style={{ color: colors.mutedForeground, fontWeight: '400' }}>(optional)</Text>
        </Text>

        {imageUri ? (
          <View style={[styles.imagePreviewContainer, { borderColor: colors.border }]}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity
              style={[styles.removeImageButton, { backgroundColor: colors.destructive || '#FF3B30' }]}
              onPress={() => setImageUri(null)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.imagePickerButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={showImagePickerOptions}
            activeOpacity={0.7}
          >
            <Ionicons name="image-outline" size={28} color={colors.mutedForeground} />
            <Text style={[styles.imagePickerText, { color: colors.mutedForeground }]}>
              Tap to add an image
            </Text>
          </TouchableOpacity>
        )}

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            (!title.trim() || !body.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!title.trim() || !body.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={colors.primaryForeground} />
              <Text style={[styles.sendButtonText, { color: colors.primaryForeground }]}>
                Send to All Users
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
    marginTop: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    marginLeft: 40,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  charCount: {
    fontSize: 12,
  },
  imagePickerButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
