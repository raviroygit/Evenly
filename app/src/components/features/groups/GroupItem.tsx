import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { ResponsiveLiquidGlassCard } from '../../ui/ResponsiveLiquidGlassCard';
import { SwipeActionRow } from '../../ui/SwipeActionRow';
import { Group } from '../../../types';

interface GroupItemProps {
  group: Group;
  onPress?: () => void;
  onInviteUser?: (groupId: string, groupName: string) => void;
  onEditGroup?: (group: Group) => void;
  onDeleteGroup?: (groupId: string, groupName: string) => void;
}

export const GroupItem: React.FC<GroupItemProps> = ({ 
  group, 
  onPress, 
  onInviteUser, 
  onEditGroup, 
  onDeleteGroup 
}) => {
  const { colors } = useTheme();

  // Prepare swipe actions
  const swipeActions = [
    ...(onInviteUser ? [{
      id: 'invite',
      title: 'Invite',
      icon: 'person-add-outline',
      color: '#FFFFFF',
      backgroundColor: '#007AFF', // Blue for invite
      onPress: () => {
        console.log('Invite action pressed for group:', group.name);
        onInviteUser(group.id, group.name);
      },
    }] : []),
    ...(onEditGroup ? [{
      id: 'edit',
      title: 'Edit',
      icon: 'pencil-outline',
      color: '#FFFFFF',
      backgroundColor: '#FF9500', // Orange for edit
      onPress: () => {
        console.log('Edit action pressed for group:', group.name);
        onEditGroup(group);
      },
    }] : []),
    ...(onDeleteGroup ? [{
      id: 'delete',
      title: 'Delete',
      icon: 'trash-outline',
      color: '#FFFFFF',
      backgroundColor: '#FF3B30', // Red for delete
      onPress: () => {
        console.log('Delete action pressed for group:', group.name);
        onDeleteGroup(group.id, group.name);
      },
    }] : []),
  ];

  const content = (
    <ResponsiveLiquidGlassCard
      padding={{
        small: 12,
        medium: 16,
        large: 20,
        tablet: 24,
      }}
      marginBottom={8}
      borderRadius={{
        small: 12,
        medium: 14,
        large: 16,
        tablet: 18,
      }}
      glassEffectStyle="thick"
      isInteractive={true}
      onPress={onPress}
      style={styles.groupCardOverrides}
    >
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: '#007AFF' }]}>
          <Text style={styles.iconText}>
            {group.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {group.name}
          </Text>
          <Text style={[styles.members, { color: colors.mutedForeground }]}>
            {group.memberCount} members • {group.currency}
          </Text>
          {group.description && (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {group.description}
            </Text>
          )}
        </View>
        <View style={styles.amount}>
          <Text style={[styles.amountText, { color: colors.foreground }]}>
            {group.defaultSplitType}
          </Text>
        </View>
      </View>
    </ResponsiveLiquidGlassCard>
  );

  // If there are actions, wrap with SwipeActionRow
  if (swipeActions.length > 0) {
    return (
      <SwipeActionRow actions={swipeActions} swipeId={`group-${group.id}`}>
        {content}
      </SwipeActionRow>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  groupCardOverrides: {
    // Only override specific properties, don't override glassmorphism
    // The ResponsiveLiquidGlassCard will handle the glassmorphism styling
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  members: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
  },
  amount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

