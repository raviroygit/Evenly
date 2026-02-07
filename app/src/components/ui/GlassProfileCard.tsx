import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { ResponsiveLiquidGlassCard } from './ResponsiveLiquidGlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface GlassProfileCardProps {
  name: string;
  email: string;
  phoneNumber?: string;
  initials: string;
  avatarColor?: string;
  style?: ViewStyle;
  padding?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  marginBottom?: number;
  borderRadius?: number | { small?: number; medium?: number; large?: number; tablet?: number };
  onThemeToggle?: () => void;
  onEditPress?: () => void;
}

export const GlassProfileCard: React.FC<GlassProfileCardProps> = ({
  name,
  email,
  phoneNumber,
  initials,
  avatarColor,
  style,
  padding = {
    small: 20,
    medium: 24,
    large: 28,
    tablet: 32,
  },
  marginBottom = 24,
  borderRadius = {
    small: 16,
    medium: 18,
    large: 20,
    tablet: 22,
  },
  onThemeToggle,
  onEditPress,
}) => {
  const { colors, theme } = useTheme();

  return (
    <ResponsiveLiquidGlassCard
      padding={padding}
      marginBottom={marginBottom}
      borderRadius={borderRadius}
      glassEffectStyle="regular"
      isInteractive={false}
      style={style}
    >
      <View style={styles.headerContainer}>
        {/* Edit Button - Top left */}
        {onEditPress ? (
          <TouchableOpacity style={[styles.iconButton, styles.iconButtonLeft]} onPress={onEditPress}>
            <Ionicons name="pencil" size={22} color={colors.foreground} />
          </TouchableOpacity>
        ) : null}
        {/* Theme Toggle Button - Top right */}
        <TouchableOpacity style={styles.iconButton} onPress={onThemeToggle}>
          <Ionicons 
            name={theme === 'dark' ? 'sunny' : 'moon'} 
            size={24} 
            color="#FFD700"
            style={{ 
              textShadowColor: 'rgba(0, 0, 0, 0.5)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}
          />
        </TouchableOpacity>
        
        {/* Centered Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[
            styles.avatar, 
            { backgroundColor: avatarColor || colors.primary }
          ]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.userName, { color: colors.foreground }]}>
        {name}
      </Text>
      <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
        {email}
      </Text>
      {phoneNumber && (
        <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>
          {phoneNumber}
        </Text>
      )}
    </ResponsiveLiquidGlassCard>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  iconButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  iconButtonLeft: {
    right: undefined,
    left: 0,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
  },
});
