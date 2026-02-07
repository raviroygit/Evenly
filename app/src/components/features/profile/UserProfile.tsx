import React from 'react';
import { GlassProfileCard } from '../../ui/GlassProfileCard';
import { User } from '../../../types';

interface UserProfileProps {
  user: User;
  initials: string;
  onThemeToggle?: () => void;
  onEditPress?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, initials, onThemeToggle, onEditPress }) => {
  return (
    <GlassProfileCard
      name={user.name}
      email={user.email}
      phoneNumber={user.phoneNumber}
      initials={initials}
      onThemeToggle={onThemeToggle}
      onEditPress={onEditPress}
    />
  );
};
