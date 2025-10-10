import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Helper hook for checking if user is authenticated
export const useIsAuthenticated = () => {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
};

// Helper hook for getting current user
export const useCurrentUser = () => {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
};