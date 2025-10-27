import { useState, useMemo } from 'react';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useUser = () => {
  const { user } = useAuth();

  const userInitials = useMemo(() => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    return names.map(name => name.charAt(0)).join('').toUpperCase();
  }, [user?.name]);

  const updateProfile = (updates: Partial<User>) => {
    // TODO: Implement actual profile update
  };

  const updateStats = (stats: Partial<User['stats']>) => {
    // TODO: Implement actual stats update
  };

  return {
    user,
    userInitials,
    updateProfile,
    updateStats,
  };
};
