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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../contexts/ThemeContext';
import { usePreferredCurrency } from '../../hooks/usePreferredCurrency';
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
  onUpdateTransaction?: (
    transactionId: string,
    data: FormData,
    onProgress?: (progress: number) => void,
    oldImageUrl?: string
  ) => Promise<void>;
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
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const { symbol, currencyCode } = usePreferredCurrency();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date()); // Date with current time
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [oldImageUrl, setOldImageUrl] = useState<string | null>(null); // Track original image from edit
  const [imageRemoved, setImageRemoved] = useState(false); // Track if user removed the image
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [selectedType, setSelectedType] = useState<'give' | 'get'>(transactionType);

  // Constants for image optimization
  const MAX_FILE_SIZE_MB = 10; // 10MB limit (matches backend limit)

  // Pre-fill form when editing
  React.useEffect(() => {
    if (editTransaction) {
      // Extract amount from amountGiven or amountGot (remove commas and ₹)
      const transactionAmount = editTransaction.amountGiven || editTransaction.amountGot;
      const cleanAmount = transactionAmount.replace(/,/g, '');
      setAmount(cleanAmount);
      setDescription(''); // We don't have description in the transaction object
      const imageUrl = editTransaction.imageUrl || null;
      setImageUri(imageUrl);
      setOldImageUrl(imageUrl); // Track original image for deletion
      setImageRemoved(false);

      // Parse transaction date (from date and time strings)
      try {
        // Combine date and time strings to create a Date object
        const dateTimeStr = `${editTransaction.date} ${editTransaction.time}`;
        const parsedDate = new Date(dateTimeStr);
        setTransactionDate(parsedDate);
      } catch {
        setTransactionDate(new Date());
      }

      // Determine the type from which field has value
      if (editTransaction.amountGiven) {
        setSelectedType('give');
      } else if (editTransaction.amountGot) {
        setSelectedType('get');
      }
    } else {
      setAmount('');
      setDescription('');
      setTransactionDate(new Date()); // Reset to current date and time
      setImageUri(null);
      setOldImageUrl(null);
      setImageRemoved(false);
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


    // Adaptive quality based on estimated size
    if (estimatedSizeMB > 8) {
      return 0.5; // Aggressive compression for very large images
    } else if (estimatedSizeMB > 4) {
      return 0.6; // Moderate compression
    } else if (estimatedSizeMB > 2) {
      return 0.7; // Light compression
    } else {
      return 0.8; // Minimal compression
    }
  };

  // Compress and resize image to reduce file size and prevent timeouts
  const compressImage = async (uri: string): Promise<string> => {
    try {
      console.log('[Image Compression] Starting compression for:', uri);

      // Get file info to determine compression strategy
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileSizeMB = fileInfo.size ? fileInfo.size / (1024 * 1024) : 0;

      console.log('[Image Compression] Original file size:', fileSizeMB.toFixed(2), 'MB');

      // Determine compression settings based on file size
      let maxWidth = 1920; // Default max width
      let compressionQuality = 0.7; // Default quality

      if (fileSizeMB > 10) {
        // Very large files: aggressive compression
        maxWidth = 1920;
        compressionQuality = 0.6;
      } else if (fileSizeMB > 5) {
        // Large files: moderate compression
        maxWidth = 1920;
        compressionQuality = 0.7;
      } else if (fileSizeMB > 2) {
        // Medium files: light compression
        maxWidth = 1920;
        compressionQuality = 0.75;
      } else {
        // Small files: minimal compression
        maxWidth = 2048;
        compressionQuality = 0.8;
      }

      console.log('[Image Compression] Settings:', { maxWidth, compressionQuality });

      // Compress and resize image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxWidth } }], // Resize to max width, maintains aspect ratio
        {
          compress: compressionQuality,
          format: ImageManipulator.SaveFormat.JPEG, // Always save as JPEG for best compression
        }
      );

      // Get compressed file size
      const compressedInfo = await FileSystem.getInfoAsync(manipulatedImage.uri);
      const compressedSizeMB = compressedInfo.size ? compressedInfo.size / (1024 * 1024) : 0;

      console.log('[Image Compression] Compressed file size:', compressedSizeMB.toFixed(2), 'MB');
      console.log('[Image Compression] Size reduction:', ((fileSizeMB - compressedSizeMB) / fileSizeMB * 100).toFixed(1), '%');

      return manipulatedImage.uri;
    } catch (error) {
      console.error('[Image Compression] Error compressing image:', error);
      // Fallback to original image if compression fails
      return uri;
    }
  };

  // Validate image size
  const validateImageSize = async (uri: string): Promise<{ valid: boolean; sizeMB: number }> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);


      if (!fileInfo.exists) {
        return { valid: false, sizeMB: 0 };
      }

      // File exists but size might be 0 or undefined for some URIs (e.g., content:// URIs on Android)
      if (!fileInfo.size || fileInfo.size === 0) {
        // Since we're using ImagePicker with quality: 0.7, the image is already compressed
        // Allow upload even if we can't determine exact size
        return { valid: true, sizeMB: 0 };
      }

      const sizeMB = fileInfo.size / (1024 * 1024);
      const isValid = sizeMB <= MAX_FILE_SIZE_MB;


      return { valid: isValid, sizeMB };
    } catch (error) {
      // Allow upload if validation fails (graceful fallback)
      // Image is already compressed by ImagePicker with quality: 0.7
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
        mediaTypes: ['images'],
        allowsEditing: false, // Keep original aspect ratio (no cropping)
        quality: 1, // High quality initially (we'll compress with ImageManipulator)
        exif: false, // Don't include EXIF data (reduces size)
      });

      if (!result.canceled && result.assets[0]) {
        const selectedUri = result.assets[0].uri;
        const width = result.assets[0].width;
        const height = result.assets[0].height;

        console.log('[Image Selection] Original dimensions:', width, 'x', height);

        // Compress and resize image using ImageManipulator
        const compressedUri = await compressImage(selectedUri);

        // Check file size after compression
        const { valid, sizeMB } = await validateImageSize(compressedUri);

        if (sizeMB > 0) {
          console.log('[Image Selection] Final file size:', sizeMB.toFixed(2), 'MB');
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

        setImageUri(compressedUri);
        console.log('[Image Selection] Image successfully compressed and set');
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
        quality: 1, // High quality initially (we'll compress with ImageManipulator)
        exif: false, // Don't include EXIF data (reduces size)
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        const width = result.assets[0].width;
        const height = result.assets[0].height;

        console.log('[Photo Capture] Original dimensions:', width, 'x', height);

        // Compress and resize image using ImageManipulator
        const compressedUri = await compressImage(photoUri);

        // Check file size after compression
        const { valid, sizeMB } = await validateImageSize(compressedUri);

        if (sizeMB > 0) {
          console.log('[Photo Capture] Final file size:', sizeMB.toFixed(2), 'MB');
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

        setImageUri(compressedUri);
        console.log('[Photo Capture] Photo successfully compressed and set');
      }
    } catch (error) {
      console.error('[Photo Capture] Error taking photo:', error);
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
    // If removing an existing image, mark it for deletion
    if (editTransaction && imageUri === oldImageUrl && oldImageUrl) {
      setImageRemoved(true);
    }
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
        formData.append('currency', currencyCode);
        formData.append('transactionDate', transactionDate.toISOString());

        if (description.trim()) {
          formData.append('description', description.trim());
        }

        // Check if we need to handle image changes
        const hasNewImage = imageUri && imageUri !== oldImageUrl;
        const shouldDeleteOldImage = (imageRemoved || hasNewImage) && oldImageUrl;

        // Add image if new image selected
        if (hasNewImage) {
          setUploadingImage(true);

          // Get file info for logging
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          const filename = imageUri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;


          formData.append('image', {
            uri: imageUri,
            name: filename,
            type,
          } as any);
        } else if (imageRemoved) {
          // User removed the image - tell backend to clear imageUrl in DB (Cloudinary delete via oldImageUrl in parent)
          formData.append('removeImage', 'true');
        }

        // Update transaction with progress callback and old image URL for deletion
        await onUpdateTransaction(
          editTransaction.id,
          formData,
          (progress) => {
            setUploadProgress(progress);
          },
          shouldDeleteOldImage ? oldImageUrl : undefined
        );

      } else {
        // Create new transaction
        formData.append('customerId', customerId);
        formData.append('type', transactionType);
        formData.append('amount', parseFloat(amount).toFixed(2));
        formData.append('currency', currencyCode);
        formData.append('transactionDate', transactionDate.toISOString());

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

          console.log('[AddTransactionModal] Preparing image for upload:', {
            uri: imageUri,
            filename,
            type,
            fileExists: fileInfo.exists,
            fileSize: fileInfo.size,
            platform: Platform.OS,
          });

          // Ensure proper URI format for both platforms
          // Android needs the full URI including file:// prefix
          // iOS also works with file:// prefix
          let normalizedUri = imageUri;
          if (!imageUri.startsWith('file://') && !imageUri.startsWith('content://')) {
            normalizedUri = `file://${imageUri}`;
          }

          const fileObject: any = {
            uri: normalizedUri,
            name: filename,
            type,
          };

          console.log('[AddTransactionModal] FormData file object:', fileObject);

          formData.append('image', fileObject);
        }

        // Create transaction with progress callback
        await EvenlyBackendService.createKhataTransaction(formData, (progress) => {
          setUploadProgress(progress);
        });

      }

      // Reset form
      setAmount('');
      setDescription('');
      setTransactionDate(new Date()); // Reset to current date and time
      setImageUri(null);
      setOldImageUrl(null);
      setImageRemoved(false);
      setSelectedType(transactionType);
      setErrors({});
      setUploadProgress(0);

      // Refresh data first, then close modal
      await onSuccess();
      onClose();
    } catch (error: any) {

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
      setTransactionDate(new Date()); // Reset to current date and time
      setShowDatePicker(false);
      setShowTimePicker(false);
      setImageUri(null);
      setOldImageUrl(null);
      setImageRemoved(false);
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
                    ? t('common.edit') + ' ' + t('khata.transactions').slice(0, -1)
                    : (transactionType === 'give' ? t('khata.youGave') : t('khata.youGot'))}
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
                          {t('khata.youGave')}
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
                          {t('khata.youGot')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Amount Field */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    {t('expenses.amount')} ({symbol}) <Text style={styles.required}>*</Text>
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
                    placeholder={t('expenses.enterAmount')}
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
                    {t('groups.description')}
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
                    placeholder={t('groups.description') + ' (' + t('expenses.optional') + ')'}
                    placeholderTextColor={colors.mutedForeground}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    editable={!loading && !uploadingImage}
                  />
                </View>

                {/* Date and Time Selection */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    {t('expenses.date')}
                  </Text>

                  {/* Date Display and Picker Button */}
                  <TouchableOpacity
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      },
                    ]}
                    onPress={() => setShowDatePicker(true)}
                    disabled={loading || uploadingImage}
                  >
                    <Text style={[{ color: colors.foreground, fontSize: 16 }]}>
                      {transactionDate.toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={colors.foreground}
                    />
                  </TouchableOpacity>

                  {/* Time Display and Picker Button */}
                  <TouchableOpacity
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 8,
                      },
                    ]}
                    onPress={() => setShowTimePicker(true)}
                    disabled={loading || uploadingImage}
                  >
                    <Text style={[{ color: colors.foreground, fontSize: 16 }]}>
                      {transactionDate.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </Text>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={colors.foreground}
                    />
                  </TouchableOpacity>
                </View>

                {/* Native Date Picker */}
                {showDatePicker && (
                  <DateTimePicker
                    value={transactionDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                      }
                      if (selectedDate) {
                        setTransactionDate(selectedDate);
                      }
                      if (Platform.OS === 'ios' && event.type === 'dismissed') {
                        setShowDatePicker(false);
                      }
                    }}
                  />
                )}

                {/* Native Time Picker */}
                {showTimePicker && (
                  <DateTimePicker
                    value={transactionDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={
                      transactionDate.toDateString() === new Date().toDateString()
                        ? new Date()
                        : undefined
                    }
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === 'android') {
                        setShowTimePicker(false);
                      }
                      if (selectedDate) {
                        const now = new Date();
                        const isToday = selectedDate.toDateString() === now.toDateString();

                        // Prevent future times on today's date
                        if (isToday && selectedDate > now) {
                          // Don't update if trying to select future time
                          setTransactionDate(now);
                        } else {
                          setTransactionDate(selectedDate);
                        }
                      }
                      if (Platform.OS === 'ios' && event.type === 'dismissed') {
                        setShowTimePicker(false);
                      }
                    }}
                  />
                )}

                {/* Image Selection */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelWithHint}>
                    <Text style={[styles.label, { color: colors.foreground }]}>
                      {t('expenses.receiptImage')} ({t('expenses.optional')})
                    </Text>
                    <Text style={styles.maxSizeHint}>
                      {t('expenses.maxImageSize', { size: MAX_FILE_SIZE_MB })}
                    </Text>
                  </View>
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
                        {t('expenses.selectImage')}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {uploadingImage && (
                    <View style={styles.uploadProgressContainer}>
                      <View style={styles.uploadProgressHeader}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.uploadProgressText, { color: colors.foreground }]}>
                          {t('expenses.uploadingImage')}... {uploadProgress}%
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
                      {editTransaction ? t('common.update') + ' ' + t('khata.transactions').slice(0, -1) : t('khata.addTransaction')}
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelWithHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  maxSizeHint: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FF3B30',
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

