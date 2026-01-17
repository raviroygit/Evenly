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
  onUpdateTransaction?: (transactionId: string, data: FormData) => Promise<void>;
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
  const [errors, setErrors] = useState<{ amount?: string }>({});
  const [selectedType, setSelectedType] = useState<'give' | 'get'>(transactionType);

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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
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

        console.log('Updating transaction with FormData:', {
          transactionId: editTransaction.id,
          type: selectedType,
          amount: parseFloat(amount).toFixed(2),
          currency: 'INR',
          description: description.trim() || undefined,
          hasImage: !!imageUri,
        });

        // Add image if selected
        if (imageUri && !editTransaction.imageUrl) {
          // New image selected
          setUploadingImage(true);
          const filename = imageUri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          formData.append('image', {
            uri: imageUri,
            name: filename,
            type,
          } as any);
        }

        // Update transaction
        await onUpdateTransaction(editTransaction.id, formData);
      } else {
        // Create new transaction
        formData.append('customerId', customerId);
        formData.append('type', transactionType);
        formData.append('amount', parseFloat(amount).toFixed(2));
        formData.append('currency', 'INR');

        if (description.trim()) {
          formData.append('description', description.trim());
        }

        console.log('Creating transaction with FormData:', {
          customerId,
          type: transactionType,
          amount: parseFloat(amount).toFixed(2),
          currency: 'INR',
          description: description.trim() || undefined,
          hasImage: !!imageUri,
        });

        // Add image if selected
        if (imageUri) {
          setUploadingImage(true);
          const filename = imageUri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          formData.append('image', {
            uri: imageUri,
            name: filename,
            type,
          } as any);
        }

        // Create transaction (with image if provided)
        await EvenlyBackendService.createKhataTransaction(formData);
      }

      // Reset form
      setAmount('');
      setDescription('');
      setImageUri(null);
      setSelectedType(transactionType);
      setErrors({});

      // Refresh data first, then close modal
      await onSuccess();
      onClose();
    } catch (error: any) {
      console.error(editTransaction ? 'Error updating transaction:' : 'Error creating transaction:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || `Failed to ${editTransaction ? 'update' : 'create'} transaction. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setUploadingImage(false);
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
                    <View style={styles.uploadingContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.uploadingText, { color: colors.mutedForeground }]}>
                        Uploading image...
                      </Text>
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
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  uploadingText: {
    fontSize: 12,
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

