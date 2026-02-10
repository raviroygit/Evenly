import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ReusableModal } from '../ui/ReusableModal';
import { SimpleInput } from '../ui/SimpleInput';
import { ResponsiveButtonRow } from '../ui/ResponsiveButtonRow';
import { ModalButtonContainer } from '../ui/ModalButtonContainer';
import { useTheme } from '../../contexts/ThemeContext';
import { Group } from '../../types';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateGroup: (groupData: {
    name: string;
    description?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }) => Promise<void>;
  onUpdateGroup?: (groupId: string, groupData: {
    name: string;
    description?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }) => Promise<void>;
  editGroup?: Group | null;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
  onCreateGroup,
  onUpdateGroup,
  editGroup,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultSplitType, setDefaultSplitType] = useState<'equal' | 'percentage' | 'shares' | 'exact'>('equal');
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!editGroup;

  // Populate form when editing
  useEffect(() => {
    if (editGroup) {
      setName(editGroup.name);
      setDescription(editGroup.description || '');
      setDefaultSplitType(editGroup.defaultSplitType || 'equal');
    } else {
      // Reset form when creating
      setName('');
      setDescription('');
      setDefaultSplitType('equal');
    }
  }, [editGroup]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('modals.groupNameRequired'));
      return;
    }

    try {
      setIsLoading(true);

      if (isEditMode && onUpdateGroup && editGroup) {
        await onUpdateGroup(editGroup.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          defaultSplitType,
        });
      } else {
        await onCreateGroup({
          name: name.trim(),
          description: description.trim() || undefined,
          defaultSplitType,
        });
      }

      onClose();
    } catch (error) {
      Alert.alert(t('common.error'), error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} group`);
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
      title={isEditMode ? t('modals.editGroup') : t('modals.createGroup')}
      buttons={
        <ModalButtonContainer
          buttons={[
            {
              title: t('common.cancel'),
              onPress: handleClose,
              variant: "destructive",
            },
            {
              title: isEditMode ? t('modals.updateGroup') : t('groups.createGroup'),
              onPress: handleSubmit,
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
          label={t('groups.groupName')}
          value={name}
          onChangeText={setName}
          placeholder={t('modals.enterGroupName')}
          containerStyle={styles.input}
        />

        <SimpleInput
          label={t('modals.descriptionOptional')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('modals.enterGroupDescription')}
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
