import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, ScrollView, TextInput, Dimensions, Image, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ReusableModal } from '../ui/ReusableModal';
import { ResponsiveButtonRow } from '../ui/ResponsiveButtonRow';
import { ModalButtonContainer } from '../ui/ModalButtonContainer';
import { useGroups } from '../../hooks/useGroups';
import { useTheme } from '../../contexts/ThemeContext';
import { EnhancedExpense } from '../../types';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onAddExpense: (expenseData: {
    groupId: string;
    title: string;
    totalAmount: string;
    date: string;
    receipt?: string; // Optional receipt image
  } | FormData) => Promise<void>;
  onUpdateExpense?: (
    expenseId: string,
    expenseData: {
      title: string;
      totalAmount: string;
      date: string;
    } | FormData,
    oldImageUrl?: string
  ) => Promise<void>;
  currentUserId: string;
  editExpense?: EnhancedExpense | null;
  preselectedGroupId?: string; // Optional: preselect and disable group selection
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  onAddExpense,
  onUpdateExpense,
  currentUserId,
  editExpense,
  preselectedGroupId,
}) => {
  const { groups, refreshGroups } = useGroups();
  const { colors, theme } = useTheme();
  const [title, setTitle] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [oldImageUrl, setOldImageUrl] = useState<string | null>(null); // Track original image from edit
  const [imageRemoved, setImageRemoved] = useState(false); // Track if user removed the image
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isEditMode = !!editExpense;

  // Constants for image optimization
  const MAX_FILE_SIZE_MB = 10; // 10MB limit (matches backend limit)

  // Refresh groups when modal opens
  useEffect(() => {
    if (visible) {
      refreshGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Populate form when editing or preselecting group
  useEffect(() => {
    if (editExpense) {
      setTitle(editExpense.title);
      setSelectedGroupId(editExpense.groupId);
      setTotalAmount(editExpense.totalAmount.toString());
      // Normalize to YYYY-MM-DD regardless of incoming format
      try {
        const normalized = new Date(editExpense.date as any).toISOString().split('T')[0];
        setDate(normalized);
      } catch {
        setDate(new Date().toISOString().split('T')[0]);
      }
      // Set image URI and track old image URL for deletion
      const receiptUrl = (editExpense as any).receipt || (editExpense as any).receiptUrl;
      if (receiptUrl) {
        setImageUri(receiptUrl);
        setOldImageUrl(receiptUrl);
      } else {
        setImageUri(null);
        setOldImageUrl(null);
      }
      setImageRemoved(false);
    } else {
      // Reset form when creating
      setTitle('');
      setSelectedGroupId(preselectedGroupId || '');
      setTotalAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setImageUri(null);
      setOldImageUrl(null);
      setImageRemoved(false);
    }
  }, [editExpense, preselectedGroupId, visible]);

  // Image validation
  const validateImageSize = async (uri: string): Promise<{ valid: boolean; sizeMB: number }> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        return { valid: false, sizeMB: 0 };
      }

      if (!fileInfo.size || fileInfo.size === 0) {
        return { valid: true, sizeMB: 0 };
      }

      const sizeMB = fileInfo.size / (1024 * 1024);
      const isValid = sizeMB <= MAX_FILE_SIZE_MB;

      return { valid: isValid, sizeMB };
    } catch (error) {
      return { valid: true, sizeMB: 0 };
    }
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
      const { status} = await ImagePicker.requestCameraPermissionsAsync();
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
        allowsEditing: false,
        quality: 0.7,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedUri = result.assets[0].uri;
        const { valid, sizeMB } = await validateImageSize(selectedUri);

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
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        const { valid, sizeMB } = await validateImageSize(photoUri);

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
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Receipt Image',
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

  const removeImage = async () => {
    // If in edit mode and removing an existing image, mark it for deletion
    if (isEditMode && imageUri === oldImageUrl && oldImageUrl) {
      setImageRemoved(true);
    }
    setImageUri(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Expense title is required');
      return;
    }

    if (!isEditMode && !selectedGroupId) {
      Alert.alert('Error', 'Please select a group');
      return;
    }

    if (!totalAmount.trim() || isNaN(parseFloat(totalAmount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      
      if (isEditMode && onUpdateExpense && editExpense) {
        // Check if we need to handle image changes
        const hasNewImage = imageUri && imageUri !== oldImageUrl;
        const shouldDeleteOldImage = (imageRemoved || hasNewImage) && oldImageUrl;

        if (hasNewImage) {
          // User added a new image - use FormData
          setUploadingImage(true);
          const formData = new FormData();

          formData.append('title', title.trim());
          formData.append('totalAmount', totalAmount.trim());
          formData.append('date', date);

          // Add new image
          const filename = imageUri.split('/').pop() || 'receipt.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          formData.append('image', {
            uri: imageUri,
            name: filename,
            type,
          } as any);

          // Pass old image URL for deletion
          await onUpdateExpense(editExpense.id, formData, oldImageUrl || undefined);
        } else if (imageRemoved) {
          // User removed the image - send regular data but mark for deletion
          await onUpdateExpense(
            editExpense.id,
            {
              title: title.trim(),
              totalAmount: totalAmount.trim(),
              date,
            },
            oldImageUrl || undefined
          );
        } else {
          // No image changes - regular update
          await onUpdateExpense(editExpense.id, {
            title: title.trim(),
            totalAmount: totalAmount.trim(),
            date,
          });
        }
        // Reset form and close modal after successful update
        handleClose();
      } else {
        // For add mode, call onAddExpense and wait for it to complete
        // Check if we have an image - if yes, use FormData
        if (imageUri) {
          setUploadingImage(true);
          const formData = new FormData();

          formData.append('groupId', selectedGroupId);
          formData.append('title', title.trim());
          formData.append('totalAmount', totalAmount.trim());
          formData.append('date', date);
          formData.append('splitType', 'equal'); // Default split type

          // Add image
          const filename = imageUri.split('/').pop() || 'receipt.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          formData.append('image', {
            uri: imageUri,
            name: filename,
            type,
          } as any);

          await onAddExpense(formData);
        } else {
          // No image - use regular object
          await onAddExpense({
            groupId: selectedGroupId,
            title: title.trim(),
            totalAmount: totalAmount.trim(),
            date,
          });
        }

        // Reset form fields after successful add
        setTitle('');
        setSelectedGroupId(preselectedGroupId || '');
        setTotalAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setImageUri(null);
        setOldImageUrl(null);
        setImageRemoved(false);
        // Close modal after successful add (parent may have already closed it, but this ensures it closes)
        // Also handles cases where parent doesn't close it (other screens)
        if (visible) {
          onClose();
        }
      }
    } catch (error) {
      // Error is already handled by parent component or Alert.alert
      // Don't close modal on error so user can retry
      // Don't reset form on error so user can see what they entered
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Don't allow closing while loading
    if (isLoading || uploadingImage) {
      return;
    }
    // Reset form when closing
    setTitle('');
    setSelectedGroupId(preselectedGroupId || '');
    setTotalAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setImageUri(null);
    setOldImageUrl(null);
    setImageRemoved(false);
    setShowGroupDropdown(false);
    onClose();
  };

  const selectedGroup = groups.find(group => group.id === selectedGroupId);

  return (
    <ReusableModal
      visible={visible}
      onClose={handleClose}
      title={isEditMode ? "Edit Expense" : "Add New Expense"}
    >
      <View style={styles.container}>
        {/* Expense Title Input */}
        <View style={styles.input}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Expense Title
          </Text>
          <View style={[styles.inputContainer, { 
            backgroundColor: colors.background,
            borderColor: colors.border 
          }]}>
            <TextInput
              style={[styles.textInput, { color: colors.foreground }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter expense title"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>

        {/* Group Selection Dropdown - Only show in create mode */}
        {!isEditMode && (
          <View style={styles.input}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Group *
            </Text>
            <TouchableOpacity
              style={[styles.inputContainer, {
                backgroundColor: preselectedGroupId ? colors.muted : colors.background,
                borderColor: colors.border,
                opacity: preselectedGroupId ? 0.6 : 1
              }]}
              onPress={() => !preselectedGroupId && setShowGroupDropdown(!showGroupDropdown)}
              disabled={!!preselectedGroupId}
            >
              <Text style={[styles.dropdownText, { 
                color: selectedGroup ? colors.foreground : colors.mutedForeground 
              }]}>
                {selectedGroup ? selectedGroup.name : 'Select a group'}
              </Text>
              <Text style={[styles.dropdownArrow, { color: colors.foreground }]}>
                {showGroupDropdown ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            
            {showGroupDropdown && (
              <View style={[styles.dropdownList, { 
                backgroundColor: colors.background,
                borderColor: colors.border 
              }]}>
                <ScrollView 
                  style={styles.dropdownScrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {groups.map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      style={[styles.dropdownItem, { 
                        borderBottomColor: colors.border 
                      }]}
                      onPress={() => {
                        setSelectedGroupId(group.id);
                        setShowGroupDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: colors.foreground }]}>
                        {group.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Show current group in edit mode */}
        {isEditMode && selectedGroup && (
          <View style={styles.input}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Group
            </Text>
            <View style={[styles.inputContainer, { 
              backgroundColor: colors.background,
              borderColor: colors.border 
            }]}>
              <Text style={[styles.dropdownText, { color: colors.foreground }]}>
                {selectedGroup.name}
              </Text>
            </View>
          </View>
        )}

        {/* Amount Input */}
        <View style={styles.input}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Amount
          </Text>
          <View style={[styles.inputContainer, { 
            backgroundColor: colors.background,
            borderColor: colors.border 
          }]}>
            <TextInput
              style={[styles.textInput, { color: colors.foreground }]}
              value={totalAmount}
              onChangeText={setTotalAmount}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Date Input with Calendar Icon */}
        <View style={styles.input}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Date
          </Text>
          <View style={[styles.inputContainer, { 
            backgroundColor: colors.background,
            borderColor: colors.border 
          }]}>
          <TextInput
              style={[styles.textInput, { color: colors.foreground }]}
            value={new Date(date).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
            placeholder="DD Mon YYYY, HH:MM AM/PM"
              placeholderTextColor={colors.mutedForeground}
              editable={false}
            />
            <TouchableOpacity 
              style={styles.calendarIcon}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons 
                name="calendar-outline" 
                size={20} 
                color={colors.foreground} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <View style={styles.datePickerModal}>
            <View style={[styles.datePickerContainer, { backgroundColor: colors.background }]}>
              <Text style={[styles.datePickerTitle, { color: colors.foreground }]}>
                Select Date
              </Text>
              <TextInput
                style={[styles.datePickerInput, { 
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background 
                }]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
              />
              <View style={styles.datePickerButtons}>
                <TouchableOpacity
                  style={[styles.datePickerButton, { backgroundColor: colors.muted }]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={[styles.datePickerButtonText, { color: colors.foreground }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.datePickerButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={[styles.datePickerButtonText, { color: '#FFFFFF' }]}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Image Upload Section */}
        <View style={styles.input}>
          <View style={styles.labelWithHint}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Receipt Image (Optional)
            </Text>
            <Text style={styles.maxSizeHint}>
              Max image size: {MAX_FILE_SIZE_MB}MB
            </Text>
          </View>

          {!imageUri ? (
            <View style={styles.imagePickerButtons}>
              <TouchableOpacity
                style={[styles.imagePickerButton, {
                  backgroundColor: colors.background,
                  borderColor: colors.border
                }]}
                onPress={pickImageFromGallery}
                disabled={uploadingImage}
              >
                <Ionicons name="images-outline" size={24} color={colors.foreground} />
                <Text style={[styles.imagePickerButtonText, { color: colors.foreground }]}>
                  Choose from Gallery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.imagePickerButton, {
                  backgroundColor: colors.background,
                  borderColor: colors.border
                }]}
                onPress={takePhoto}
                disabled={uploadingImage}
              >
                <Ionicons name="camera-outline" size={24} color={colors.foreground} />
                <Text style={[styles.imagePickerButtonText, { color: colors.foreground }]}>
                  Take Photo
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={[styles.removeImageButton, { backgroundColor: colors.destructive }]}
                onPress={removeImage}
                disabled={uploadingImage}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {uploadingImage && (
                <View style={styles.uploadProgressContainer}>
                  <View style={[styles.progressBarBackground, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${uploadProgress}%`
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.uploadProgressText, { color: colors.foreground }]}>
                    Uploading... {uploadProgress}%
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Buttons moved inside scrollable content */}
        <ModalButtonContainer
          buttons={[
            {
              title: "Cancel",
              onPress: handleClose,
              variant: "destructive",
              disabled: isLoading || uploadingImage, // Disable cancel button while loading or uploading image
            },
            {
              title: isEditMode ? "Update Expense" : "Add Expense",
              onPress: handleSubmit,
              variant: "primary",
              loading: isLoading || uploadingImage,
              disabled: isLoading || uploadingImage, // Disable button while loading or uploading image
            },
          ]}
          style={styles.buttonRow}
          forceVertical={Dimensions.get('window').width < 400}
        />
      </View>
    </ReusableModal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 40, // Increased bottom padding for better scrolling
    minHeight: '100%', // Ensure container takes full height for proper scrolling
  },
  input: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingRight: 8,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 2,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  calendarIcon: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    marginTop: 24, // Increased top margin for better separation
    marginBottom: 20, // Add bottom margin for better spacing
  },
  datePickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerContainer: {
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerInput: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  datePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelWithHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  maxSizeHint: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  imagePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  imagePickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadProgressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  uploadProgressText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
