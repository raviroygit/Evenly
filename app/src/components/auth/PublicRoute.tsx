import React from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // Only redirect if we're not loading and user is authenticated
    if (!isLoading && isAuthenticated) {
      // Add a small delay to ensure the Slot component is mounted
      const timer = setTimeout(() => {
        router.replace('/tabs');
      }, 100); // 100ms delay

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render anything if authenticated (will redirect)
  if (!isLoading && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
