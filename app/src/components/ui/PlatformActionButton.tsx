import React from 'react';
import { Platform } from 'react-native';
import { GlassActionButton } from './GlassActionButton';
import { AndroidActionButton } from './AndroidActionButton';

interface PlatformActionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  style?: any;
  glassStyle?: any;
  glassEffectStyle?: any;
  isInteractive?: boolean;
  tint?: 'light' | 'dark' | 'default';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const PlatformActionButton: React.FC<PlatformActionButtonProps> = (props) => {
  if (Platform.OS === 'android') {
    return <AndroidActionButton {...props} />;
  } else {
    return <GlassActionButton {...props} />;
  }
};
