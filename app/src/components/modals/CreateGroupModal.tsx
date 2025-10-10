import React, { useState } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { ReusableModal } from '../ui/ReusableModal';
import { SimpleInput } from '../ui/SimpleInput';
import { ResponsiveButtonRow } from '../ui/ResponsiveButtonRow';
import { ModalButtonContainer } from '../ui/ModalButtonContainer';
import { useTheme } from '../../contexts/ThemeContext';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateGroup: (groupData: {
    name: string;
    description?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }) => Promise<void>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
  onCreateGroup,
}) => {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultSplitType, setDefaultSplitType] = useState<'equal' | 'percentage' | 'shares' | 'exact'>('equal');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    try {
      setIsLoading(true);
      await onCreateGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        defaultSplitType,
      });
      
      // Reset form
      setName('');
      setDescription('');
      setDefaultSplitType('equal');
      
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setName('');
    setDescription('');
    setDefaultSplitType('equal');
    onClose();
  };

  return (
    <ReusableModal
      visible={visible}
      onClose={handleClose}
      title="Create New Group"
      buttons={
        <ModalButtonContainer
          buttons={[
            {
              title: "Cancel",
              onPress: handleClose,
              variant: "destructive",
            },
            {
              title: "Create Group",
              onPress: handleCreate,
              variant: "primary",
              loading: isLoading,
            },
          ]}
          style={styles.buttonRow}
          forceVertical={Dimensions.get('window').width < 400}
        />
      }
    >
      <View style={styles.container}>
        <SimpleInput
          label="Group Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter group name"
          containerStyle={styles.input}
        />

        <SimpleInput
          label="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Enter group description"
          multiline
          numberOfLines={3}
          containerStyle={styles.input}
        />
      </View>
    </ReusableModal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  buttonRow: {
    marginTop: 16,
  },
});
