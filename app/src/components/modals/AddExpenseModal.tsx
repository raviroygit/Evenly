import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, ScrollView, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReusableModal } from '../ui/ReusableModal';
import { ResponsiveButtonRow } from '../ui/ResponsiveButtonRow';
import { ModalButtonContainer } from '../ui/ModalButtonContainer';
import { useGroups } from '../../hooks/useGroups';
import { useTheme } from '../../contexts/ThemeContext';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onAddExpense: (expenseData: {
    groupId: string;
    title: string;
    totalAmount: string;
    date: string;
  }) => Promise<void>;
  currentUserId: string;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  onAddExpense,
  currentUserId,
}) => {
  const { groups } = useGroups();
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Expense title is required');
      return;
    }

    if (!selectedGroupId) {
      Alert.alert('Error', 'Please select a group');
      return;
    }

    if (!totalAmount.trim() || isNaN(parseFloat(totalAmount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      await onAddExpense({
        groupId: selectedGroupId,
        title: title.trim(),
        totalAmount: totalAmount.trim(),
        date,
      });
      
      // Reset form
      setTitle('');
      setSelectedGroupId('');
      setTotalAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add expense');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setTitle('');
    setSelectedGroupId('');
    setTotalAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowGroupDropdown(false);
    onClose();
  };

  const selectedGroup = groups.find(group => group.id === selectedGroupId);

  return (
    <ReusableModal
      visible={visible}
      onClose={handleClose}
      title="Add New Expense"
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

        {/* Group Selection Dropdown */}
        <View style={styles.input}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Group *
          </Text>
          <TouchableOpacity
            style={[styles.inputContainer, { 
              backgroundColor: colors.background,
              borderColor: colors.border 
            }]}
            onPress={() => setShowGroupDropdown(!showGroupDropdown)}
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
              value={date}
              placeholder="YYYY-MM-DD"
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

        {/* Buttons moved inside scrollable content */}
        <ModalButtonContainer
          buttons={[
            {
              title: "Cancel",
              onPress: handleClose,
              variant: "destructive",
            },
            {
              title: "Add Expense",
              onPress: handleAdd,
              variant: "primary",
              loading: isLoading,
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
});
