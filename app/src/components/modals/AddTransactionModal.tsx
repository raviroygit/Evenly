import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../contexts/ThemeContext';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';

interface Transaction {
  id: string;
  date: string;
  time: string;
  balance: string;
  amountGiven: string;
  amountGot: string;
  hasAttachment: boolean;
  imageUrl?: string;
}

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerId: string;
  transactionType: 'give' | 'get';
  editTransaction?: Transaction | null;
  onUpdateTransaction?: (transactionId: string, data: FormData, onProgress?: (progress: number) => void) => Promise<void>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  onSuccess,
  customerId,
  transactionType,
  editTransaction = null,
  onUpdateTransaction,
}) => {
  const { colors, theme } = useTheme();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [selectedType, setSelectedType] = useState<'give' | 'get'>(transactionType);

  // Constants for image optimization
  const MAX_FILE_SIZE_MB = 5; // 5MB limit

  // Pre-fill form when editing
  React.useEffect(() => {
    if (editTransaction) {
      // Extract amount from amountGiven or amountGot (remove commas and ₹)
      const transactionAmount = editTransaction.amountGiven || editTransaction.amountGot;
      const cleanAmount = transactionAmount.replace(/,/g, '');
      setAmount(cleanAmount);
      setDescription(''); // We don't have description in the transaction object
      setImageUri(editTransaction.imageUrl || null);

      // Determine the type from which field has value
      if (editTransaction.amountGiven) {
        setSelectedType('give');
      } else if (editTransaction.amountGot) {
        setSelectedType('get');
      }
    } else {
      setAmount('');
      setDescription('');
      setImageUri(null);
      setSelectedType(transactionType);
    }
    setErrors({});
  }, [editTransaction, visible, transactionType]);

  // Get optimal quality setting based on expected file size
  const getOptimalQuality = (width?: number, height?: number): number => {
    // If we don't have dimensions, use moderate quality
    if (!width || !height) return 0.7;

    // Estimate file size based on dimensions (rough approximation)
    const pixels = width * height;
    const estimatedSizeMB = (pixels * 3) / (1024 * 1024); // RGB, rough estimate

    console.log('[Image Quality] Estimating quality for', width, 'x', height, '(~', estimatedSizeMB.toFixed(1), 'MB)');

    // Adaptive quality based on estimated size
    if (estimatedSizeMB > 8) {
      console.log('[Image Quality] Large image - using quality 0.5');
      return 0.5; // Aggressive compression for very large images
    } else if (estimatedSizeMB > 4) {
      console.log('[Image Quality] Medium-large image - using quality 0.6');
      return 0.6; // Moderate compression
    } else if (estimatedSizeMB > 2) {
      console.log('[Image Quality] Medium image - using quality 0.7');
      return 0.7; // Light compression
    } else {
      console.log('[Image Quality] Small image - using quality 0.8');
      return 0.8; // Minimal compression
    }
  };

  // Validate image size
  const validateImageSize = async (uri: string): Promise<{ valid: boolean; sizeMB: number }> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      console.log('[Image Validation] File info:', fileInfo);

      if (!fileInfo.exists) {
        console.warn('[Image Validation] File does not exist');
        return { valid: false, sizeMB: 0 };
      }

      // File exists but size might be 0 or undefined for some URIs (e.g., content:// URIs on Android)
      if (!fileInfo.size || fileInfo.size === 0) {
        console.warn('[Image Validation] File size unavailable, allowing upload (compressed by ImagePicker)');
        // Since we're using ImagePicker with quality: 0.7, the image is already compressed
        // Allow upload even if we can't determine exact size
        return { valid: true, sizeMB: 0 };
      }

      const sizeMB = fileInfo.size / (1024 * 1024);
      const isValid = sizeMB <= MAX_FILE_SIZE_MB;

      console.log('[Image Validation]', {
        sizeMB: sizeMB.toFixed(2),
        maxSizeMB: MAX_FILE_SIZE_MB,
        valid: isValid
      });

      return { valid: isValid, sizeMB };
    } catch (error) {
      console.error('[Image Validation] Error:', error);
      // Allow upload if validation fails (graceful fallback)
      // Image is already compressed by ImagePicker with quality: 0.7
      console.warn('[Image Validation] Validation failed, allowing upload (image already compressed)');
      return { valid: true, sizeMB: 0 };
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { amount?: string } = {};

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const requestImagePermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to select images!',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera permissions to take photos!',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return;

    try {
      // First, let user select image with high quality to get dimensions
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Keep original aspect ratio (no cropping)
        quality: 0.7, // Default compression (70%)
        exif: false, // Don't include EXIF data (reduces size)
      });

      if (!result.canceled && result.assets[0]) {
        const selectedUri = result.assets[0].uri;
        const width = result.assets[0].width;
        const height = result.assets[0].height;

        console.log('[Image Selection] Selected image:', width, 'x', height);

        // Check file size
        const { valid, sizeMB } = await validateImageSize(selectedUri);

        if (sizeMB > 0) {
          console.log('[Image Selection] Compressed image size:', sizeMB.toFixed(2), 'MB');
        } else {
          console.log('[Image Selection] Image size unknown (already compressed by ImagePicker)');
        }

        if (!valid) {
          Alert.alert(
            'Image Too Large',
            `The selected image (${sizeMB.toFixed(1)} MB) is too large after compression.\n\nMaximum size is ${MAX_FILE_SIZE_MB} MB. Please select a smaller image.`,
            [
              { text: 'Try Again', onPress: pickImageFromGallery },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          return;
        }

        setImageUri(selectedUri);
        if (sizeMB > 0) {
          console.log('[Image Selection] Image ready for upload:', sizeMB.toFixed(2), 'MB');
        } else {
          console.log('[Image Selection] Image ready for upload (compressed by ImagePicker)');
        }
      }
    } catch (error) {
      console.error('[Image Selection] Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // Keep original aspect ratio (no cropping)
        quality: 0.7, // Compress to 70% quality
        exif: false, // Don't include EXIF data (reduces size)
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        const width = result.assets[0].width;
        const height = result.assets[0].height;

        console.log('[Camera] Captured photo:', width, 'x', height);

        // Check file size
        const { valid, sizeMB } = await validateImageSize(photoUri);

        if (sizeMB > 0) {
          console.log('[Camera] Compressed photo size:', sizeMB.toFixed(2), 'MB');
        } else {
          console.log('[Camera] Photo size unknown (already compressed by ImagePicker)');
        }

        if (!valid) {
          Alert.alert(
            'Image Too Large',
            `The photo (${sizeMB.toFixed(1)} MB) is too large after compression.\n\nMaximum size is ${MAX_FILE_SIZE_MB} MB. Please try taking the photo again.`,
            [
              { text: 'Try Again', onPress: takePhoto },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          return;
        }

        setImageUri(photoUri);
        if (sizeMB > 0) {
          console.log('[Camera] Photo ready for upload:', sizeMB.toFixed(2), 'MB');
        } else {
          console.log('[Camera] Photo ready for upload (compressed by ImagePicker)');
        }
      }
    } catch (error) {
      console.error('[Camera] Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: takePhoto,
        },
        {
          text: 'Gallery',
          onPress: pickImageFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      // Create FormData for transaction (with optional image)
      const formData = new FormData();

      if (editTransaction && onUpdateTransaction) {
        // Update existing transaction
        formData.append('type', selectedType);
        formData.append('amount', parseFloat(amount).toFixed(2));
        formData.append('currency', 'INR');

        if (description.trim()) {
          formData.append('description', description.trim());
        }

        // Add image if selected or changed
        if (imageUri && imageUri !== editTransaction.imageUrl) {
          // New image selected or existing image changed
          setUploadingImage(true);

          // Get file info for logging
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          const filename = imageUri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          console.log('[Transaction Update] Uploading image:', {
            transactionId: editTransaction.id,
            filename,
            type,
            sizeMB: fileInfo.size ? (fileInfo.size / (1024 * 1024)).toFixed(2) : 'unknown'
          });

          formData.append('image', {
            uri: imageUri,
            name: filename,
            type,
          } as any);
        }

        // Update transaction with progress callback
        await onUpdateTransaction(editTransaction.id, formData, (progress) => {
          setUploadProgress(progress);
        });

        console.log('[Transaction Update] Success');
      } else {
        // Create new transaction
        formData.append('customerId', customerId);
        formData.append('type', transactionType);
        formData.append('amount', parseFloat(amount).toFixed(2));
        formData.append('currency', 'INR');

        if (description.trim()) {
          formData.append('description', description.trim());
        }

        // Add image if selected
        if (imageUri) {
          setUploadingImage(true);

          // Get file info for logging
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          const filename = imageUri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          console.log('[Transaction Create] Uploading image:', {
            filename,
            type,
            sizeMB: fileInfo.size ? (fileInfo.size / (1024 * 1024)).toFixed(2) : 'unknown'
          });

          formData.append('image', {
            uri: imageUri,
            name: filename,
            type,
          } as any);
        }

        // Create transaction with progress callback
        await EvenlyBackendService.createKhataTransaction(formData, (progress) => {
          setUploadProgress(progress);
        });

        console.log('[Transaction Create] Success');
      }

      // Reset form
      setAmount('');
      setDescription('');
      setImageUri(null);
      setSelectedType(transactionType);
      setErrors({});
      setUploadProgress(0);

      // Refresh data first, then close modal
      await onSuccess();
      onClose();
    } catch (error: any) {
      console.error('[Transaction Error]', {
        type: editTransaction ? 'update' : 'create',
        hasImage: !!imageUri,
        error: error.message,
        code: error.code,
        status: error.response?.status,
        responseData: error.response?.data
      });

      // Determine error type and show specific message
      let errorTitle = 'Error';
      let errorMessage = `Failed to ${editTransaction ? 'update' : 'create'} transaction. Please try again.`;
      let showRetry = true;

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorTitle = 'Upload Timeout';
        errorMessage = 'The upload took too long. This usually happens with large images or slow connections.\n\nTips:\n• Make sure you have a stable internet connection\n• Try connecting to WiFi\n• The image was already compressed, so network speed may be the issue';
      } else if (error.response?.status === 413) {
        errorTitle = 'File Too Large';
        errorMessage = 'The image file is too large for the server to process.\n\nPlease select a different image or take a new photo.';
      } else if (error.response?.status === 400) {
        errorTitle = 'Invalid Data';
        errorMessage = error.response?.data?.message || 'The transaction data is invalid. Please check your inputs.';
        showRetry = false;
      } else if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        errorTitle = 'Network Error';
        errorMessage = 'Cannot connect to the server. Please check your internet connection and try again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      const buttons: any[] = [{ text: 'Cancel', style: 'cancel' }];
      if (showRetry) {
        buttons.push({ text: 'Retry', onPress: handleSubmit });
      }

      Alert.alert(errorTitle, errorMessage, buttons);
    } finally {
      setLoading(false);
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!loading && !uploadingImage) {
      setAmount('');
      setDescription('');
      setImageUri(null);
      setSelectedType(transactionType);
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
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
                <Text style={[styles.title, { color: colors.foreground }]}>
                  {editTransaction
                    ? 'Edit Transaction'
                    : (transactionType === 'give' ? 'You Gave' : 'You Got')}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  disabled={loading || uploadingImage}
                >
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={true}
              >
                {/* Transaction Type Selector - Only show when editing */}
                {editTransaction && (
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.foreground }]}>
                      Transaction Type <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.typeSelector}>
                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          {
                            backgroundColor: selectedType === 'give'
                              ? colors.primary
                              : (theme === 'dark' ? '#1A1A1A' : '#F8F8F8'),
                          },
                        ]}
                        onPress={() => setSelectedType('give')}
                        disabled={loading || uploadingImage}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            {
                              color: selectedType === 'give'
                                ? '#FFFFFF'
                                : colors.foreground,
                            },
                          ]}
                        >
                          You Gave
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          {
                            backgroundColor: selectedType === 'get'
                              ? colors.primary
                              : (theme === 'dark' ? '#1A1A1A' : '#F8F8F8'),
                          },
                        ]}
                        onPress={() => setSelectedType('get')}
                        disabled={loading || uploadingImage}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            {
                              color: selectedType === 'get'
                                ? '#FFFFFF'
                                : colors.foreground,
                            },
                          ]}
                        >
                          You Got
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Amount Field */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Amount (₹) <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                        color: colors.foreground,
                        borderColor: errors.amount ? '#FF3B30' : 'transparent',
                        borderWidth: errors.amount ? 1 : 0,
                      },
                    ]}
                    placeholder="Enter amount"
                    placeholderTextColor={colors.mutedForeground}
                    value={amount}
                    onChangeText={(text) => {
                      // Only allow numbers and decimal point
                      const numericValue = text.replace(/[^0-9.]/g, '');
                      setAmount(numericValue);
                      if (errors.amount) {
                        setErrors({ ...errors, amount: undefined });
                      }
                    }}
                    keyboardType="decimal-pad"
                    editable={!loading && !uploadingImage}
                  />
                  {errors.amount && (
                    <Text style={styles.errorText}>{errors.amount}</Text>
                  )}
                </View>

                {/* Description Field */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Description
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                        color: colors.foreground,
                      },
                    ]}
                    placeholder="Enter description (optional)"
                    placeholderTextColor={colors.mutedForeground}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    editable={!loading && !uploadingImage}
                  />
                </View>

                {/* Image Selection */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    Image (Optional)
                  </Text>
                  {imageUri ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={removeImage}
                        disabled={loading || uploadingImage}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.imagePickerButton,
                        {
                          backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                          borderColor: colors.mutedForeground,
                        },
                      ]}
                      onPress={showImagePickerOptions}
                      disabled={loading || uploadingImage}
                    >
                      <Ionicons name="camera-outline" size={24} color={colors.foreground} />
                      <Text style={[styles.imagePickerText, { color: colors.foreground }]}>
                        Select Image
                      </Text>
                    </TouchableOpacity>
                  )}
                  {uploadingImage && (
                    <View style={styles.uploadProgressContainer}>
                      <View style={styles.uploadProgressHeader}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.uploadProgressText, { color: colors.foreground }]}>
                          Uploading image... {uploadProgress}%
                        </Text>
                      </View>
                      <View style={[styles.progressBarBackground, { backgroundColor: theme === 'dark' ? '#1A1A1A' : '#E0E0E0' }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${uploadProgress}%`,
                              backgroundColor: colors.primary
                            }
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>

              {/* Submit Button */}
              <View style={styles.submitButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: loading || uploadingImage ? colors.mutedForeground : colors.primary,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={loading || uploadingImage}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {editTransaction ? 'Update Transaction' : 'Add Transaction'}
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
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    height: '70%',
    width: '100%',
    flexDirection: 'column',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    minHeight: 200,
    maxHeight: 400,
    borderRadius: 12,
    resizeMode: 'contain', // Show full image without cropping
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  uploadProgressContainer: {
    marginTop: 12,
    gap: 8,
  },
  uploadProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadProgressText: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  submitButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

