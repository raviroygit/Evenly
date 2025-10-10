import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  // AuthContext already handles initialization, so we just pass through
  return <>{children}</>;
};
