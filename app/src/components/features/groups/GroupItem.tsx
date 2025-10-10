import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { ResponsiveLiquidGlassCard } from '../../ui/ResponsiveLiquidGlassCard';
import { Group } from '../../../types';

interface GroupItemProps {
  group: Group;
  onPress?: () => void;
  onInviteUser?: (groupId: string, groupName: string) => void;
}

export const GroupItem: React.FC<GroupItemProps> = ({ group, onPress, onInviteUser }) => {
  const { colors } = useTheme();

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
      
      {onInviteUser && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.inviteButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
            onPress={() => onInviteUser(group.id, group.name)}
          >
            <Ionicons name="person-add-outline" size={16} color={colors.primary} />
            <Text style={[styles.inviteButtonText, { color: colors.primary }]}>
              Invite
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ResponsiveLiquidGlassCard>
  );

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
  actions: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
