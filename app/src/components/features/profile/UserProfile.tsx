import React from 'react';
import { GlassProfileCard } from '../../ui/GlassProfileCard';
import { User } from '../../../types';

interface UserProfileProps {
  user: User;
  initials: string;
  realStats?: {
    groups: number;
    totalSpent: number;
    owed: number;
  };
  onThemeToggle?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, initials, realStats, onThemeToggle }) => {
  // Use real stats if provided, otherwise fall back to user.stats
  const stats = realStats || user.stats;

  return (
    <GlassProfileCard
      name={user.name}
      email={user.email}
      initials={initials}
      stats={stats}
      onThemeToggle={onThemeToggle}
    />
  );
};
