import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { formatHumanDateTime } from '../../../utils/date';
import { ResponsiveLiquidGlassCard } from '../../ui/ResponsiveLiquidGlassCard';
import { SwipeActionRow } from '../../ui/SwipeActionRow';
import { Group } from '../../../types';

interface GroupItemProps {
  group: Group;
  onPress?: () => void;
  onInviteUser?: (groupId: string, groupName: string) => void;
  onEditGroup?: (group: Group) => void;
  onDeleteGroup?: (groupId: string, groupName: string) => void;
  onShareBalance?: (groupId: string, groupName: string) => void;
  onActionExecuted?: () => void;
}

export const GroupItem: React.FC<GroupItemProps> = ({
  group,
  onPress,
  onInviteUser,
  onEditGroup,
  onDeleteGroup,
  onShareBalance,
  onActionExecuted
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const preventNavigationRef = React.useRef(false);

  const handlePress = () => {
    // Check if we should prevent navigation (share button was clicked)
    if (preventNavigationRef.current) {
      preventNavigationRef.current = false;
      return;
    }

    if (onPress) {
      onPress();
    } else {
      // Navigate to group details screen
      try {
        router.push(`/tabs/groups/${group.id}` as any);
      } catch (error) {
      }
    }
  };

  const handleSharePressIn = () => {
    // Set flag BEFORE the parent's onPress fires
    preventNavigationRef.current = true;
  };

  const handleSharePress = () => {
    // Reset flag after a short delay
    setTimeout(() => {
      preventNavigationRef.current = false;
    }, 200);

    if (onShareBalance) {
      onShareBalance(group.id, group.name);
    }
  };

  // Check if current user is the creator of the group
  const isCreator = user && group.createdBy === user.id;

  // Show permission alert for non-creators
  const showPermissionAlert = (action: string) => {
    Alert.alert(
      t('common.error'),
      `${t('groups.permissionDenied')} ${action}`,
      [{ text: t('common.ok'), style: 'default' }]
    );
  };

  // Prepare swipe actions - show all buttons but check permissions
  const swipeActions = [
    ...(onInviteUser ? [{
      id: 'invite',
      title: t('groups.invite'),
      icon: 'person-add-outline',
      color: '#FFFFFF',
      backgroundColor: '#007AFF', // Blue for invite
      onPress: () => {
        onInviteUser(group.id, group.name);
      },
    }] : []),
    ...(onEditGroup ? [{
      id: 'edit',
      title: t('common.edit'),
      icon: 'pencil-outline',
      color: '#FFFFFF',
      backgroundColor: '#FF9500', // Orange for edit
      onPress: () => {
        if (isCreator) {
          onEditGroup(group);
        } else {
          showPermissionAlert(t('common.edit'));
        }
      },
    }] : []),
    ...(onDeleteGroup ? [{
      id: 'delete',
      title: t('common.delete'),
      icon: 'trash-outline',
      color: '#FFFFFF',
      backgroundColor: '#FF3B30', // Red for delete
      onPress: () => {
        if (isCreator) {
          onDeleteGroup(group.id, group.name);
        } else {
          showPermissionAlert(t('common.delete'));
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
            {t('dashboard.members', { count: group.memberCount })} • {group.currency}
          </Text>
          {group.description && (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {group.description}
            </Text>
          )}
        </View>
        <View style={styles.amount}>
          <View style={styles.rightActions}>
            {onShareBalance && (
              <Pressable
                style={({ pressed }) => [
                  styles.shareButton,
                  { backgroundColor: colors.primary + '20' },
                  pressed && { opacity: 0.7 }
                ]}
                onPressIn={handleSharePressIn}
                onPress={handleSharePress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="share-outline" size={18} color={colors.primary} />
              </Pressable>
            )}
          </View>
          <Text style={[styles.amountText, { color: colors.foreground }]}>
            {group.defaultSplitType === 'equal' ? t('expenses.splitTypeEqual') :
             group.defaultSplitType === 'percentage' ? t('expenses.splitTypePercentage') :
             group.defaultSplitType === 'shares' ? t('expenses.splitTypeShares') :
             group.defaultSplitType === 'exact' ? t('expenses.splitTypeExact') :
             group.defaultSplitType}
          </Text>
          {!!(group as any).updatedAt || !!(group as any).createdAt ? (
            <View style={[styles.metaBadge, { backgroundColor: colors.border + '20' }]}>
              <Text style={[styles.metaBadgeText, { color: colors.mutedForeground }]}>
                {formatHumanDateTime((group as any).updatedAt || (group as any).createdAt)}
              </Text>
            </View>
          ) : null}
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
        onPress={handlePress}
      >
        {content}
      </SwipeActionRow>
    );
  }

  // If no swipe actions, wrap in TouchableOpacity
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
    >
      {content}
    </TouchableOpacity>
  );
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
    gap: 4,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
  },
  metaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  metaBadgeText: {
    fontSize: 9,
    fontWeight: '500',
  },
});

