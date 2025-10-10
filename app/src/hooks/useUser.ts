import { useState, useMemo } from 'react';
import { User } from '../types';
import { mockUser } from '../data/mockData';

export const useUser = () => {
  const [user] = useState<User>(mockUser);

  const userInitials = useMemo(() => {
    const names = user.name.split(' ');
    return names.map(name => name.charAt(0)).join('').toUpperCase();
  }, [user.name]);

  const updateProfile = (updates: Partial<User>) => {
    // TODO: Implement actual profile update
    console.log('Updating profile:', updates);
  };

  const updateStats = (stats: Partial<User['stats']>) => {
    // TODO: Implement actual stats update
    console.log('Updating stats:', stats);
  };

  return {
    user,
    userInitials,
    updateProfile,
    updateStats,
  };
};
