import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { ResponsiveLiquidGlassCard } from '../../ui/ResponsiveLiquidGlassCard';
import { SwipeActionRow } from '../../ui/SwipeActionRow';
import { Group } from '../../../types';

interface GroupItemProps {
  group: Group;
  onPress?: () => void;
  onInviteUser?: (groupId: string, groupName: string) => void;
  onEditGroup?: (group: Group) => void;
  onDeleteGroup?: (groupId: string, groupName: string) => void;
  onActionExecuted?: () => void;
}

export const GroupItem: React.FC<GroupItemProps> = ({ 
  group, 
  onPress, 
  onInviteUser, 
  onEditGroup, 
  onDeleteGroup,
  onActionExecuted
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Check if current user is the creator of the group
  const isCreator = user && group.createdBy === user.id;

  // Show permission alert for non-creators
  const showPermissionAlert = (action: string) => {
    Alert.alert(
      'Permission Denied',
      `You don't have permission to ${action} this group because you are not the creator. Only the group creator can ${action} the group.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  // Prepare swipe actions - show all buttons but check permissions
  const swipeActions = [
    ...(onInviteUser ? [{
      id: 'invite',
      title: 'Invite',
      icon: 'person-add-outline',
      color: '#FFFFFF',
      backgroundColor: '#007AFF', // Blue for invite
      onPress: () => {
        console.log('=== GroupItem: Invite action pressed ===');
        console.log('Group:', group.name, group.id);
        console.log('onInviteUser function:', typeof onInviteUser);
        onInviteUser(group.id, group.name);
        console.log('=== GroupItem: Invite action completed ===');
      },
    }] : []),
    ...(onEditGroup ? [{
      id: 'edit',
      title: 'Edit',
      icon: 'pencil-outline',
      color: '#FFFFFF',
      backgroundColor: '#FF9500', // Orange for edit
      onPress: () => {
        if (isCreator) {
          console.log('=== GroupItem: Edit action pressed ===');
          console.log('Group:', group.name, group.id);
          console.log('onEditGroup function:', typeof onEditGroup);
          onEditGroup(group);
          console.log('=== GroupItem: Edit action completed ===');
        } else {
          showPermissionAlert('edit');
        }
      },
    }] : []),
    ...(onDeleteGroup ? [{
      id: 'delete',
      title: 'Delete',
      icon: 'trash-outline',
      color: '#FFFFFF',
      backgroundColor: '#FF3B30', // Red for delete
      onPress: () => {
        if (isCreator) {
          console.log('=== GroupItem: Delete action pressed ===');
          console.log('Group:', group.name, group.id);
          console.log('onDeleteGroup function:', typeof onDeleteGroup);
          onDeleteGroup(group.id, group.name);
          console.log('=== GroupItem: Delete action completed ===');
        } else {
          showPermissionAlert('delete');
        }
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
      <SwipeActionRow 
        actions={swipeActions} 
        swipeId={`group-${group.id}`}
        onActionExecuted={onActionExecuted}
      >
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

