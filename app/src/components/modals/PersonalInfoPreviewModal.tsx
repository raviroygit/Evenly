import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReusableModal } from '../ui/ReusableModal';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface PersonalInfoPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  user: {
    name?: string;
    email?: string;
    phoneNumber?: string;
  } | null;
}

export const PersonalInfoPreviewModal: React.FC<PersonalInfoPreviewModalProps> = ({
  visible,
  onClose,
  user,
}) => {
  const { colors } = useTheme();

  return (
    <ReusableModal
      visible={visible}
      onClose={onClose}
      title="Personal Information"
      showCloseButton={true}
    >
      <View style={styles.content}>
        <View style={styles.row}>
          <Ionicons name="person-outline" size={22} color={colors.primary} style={styles.icon} />
          <View style={styles.labelValue}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Name</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>{user?.name || '—'}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={22} color={colors.primary} style={styles.icon} />
          <View style={styles.labelValue}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>{user?.email || '—'}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.row}>
          <Ionicons name="call-outline" size={22} color={colors.primary} style={styles.icon} />
          <View style={styles.labelValue}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Phone</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>{user?.phoneNumber || '—'}</Text>
          </View>
        </View>
      </View>
    </ReusableModal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  icon: {
    marginRight: 14,
  },
  labelValue: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginLeft: 36,
  },
});
