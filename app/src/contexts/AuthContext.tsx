import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { AuthService } from '../services/AuthService';
import { AuthStorage } from '../utils/storage';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  signup: (email: string) => Promise<{ success: boolean; message: string }>;
  requestOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start with loading false
  
  // Memoize authService to prevent recreation
  const authService = useMemo(() => new AuthService(), []);
  const isAuthenticated = !!user;

  // Initialize user from storage on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        const authData = await AuthStorage.getAuthData();
        
        if (authData && authData.user && authData.ssoToken) {
          setUser(authData.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, otp: string) => {
    try {
      const result = await authService.verifyOTP(email, otp);
      
      // If login was successful and we have user data, use it directly
      if (result.success && result.user) {
        setUser(result.user);
        await AuthStorage.saveAuthData(result.user, result.accessToken, result.refreshToken, result.ssoToken);
        
        return { success: true, message: 'Login successful!' };
      }
      
      // If we have an ssoToken but no user data, try to get current user
      if (result.ssoToken) {
        
        // Try to get current user with the ssoToken
        try {
          const currentUser = await authService.getCurrentUser(result.ssoToken);
          if (currentUser) {
            setUser(currentUser);
            await AuthStorage.saveAuthData(currentUser, result.accessToken, result.refreshToken, result.ssoToken);
            
            return { success: true, message: 'Login successful!' };
          } else {
            return { success: false, message: 'Login failed - could not get user data' };
          }
        } catch (error) {
          return { success: false, message: 'Login failed - could not get user data' };
        }
      } else if (result.success && result.user) {
        // Fallback to original logic if no ssoToken but response is successful
        setUser(result.user);
        await AuthStorage.saveAuthData(result.user, result.accessToken, result.refreshToken, result.ssoToken);
        return { success: true, message: 'Login successful!' };
      } else {
        return { success: false, message: result.message || 'Login failed - no ssoToken received' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' };
    }
  }, [authService]);

  const signup = useCallback(async (email: string) => {
    try {
      const result = await authService.signup(email);
      return { success: result.success, message: result.message };
    } catch (error: any) {
      return { success: false, message: error.message || 'Signup failed' };
    }
  }, [authService]);

  const requestOTP = useCallback(async (email: string) => {
    try {
      const result = await authService.requestOTP(email);
      return { success: result.success, message: result.message };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to send OTP' };
    }
  }, [authService]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      await AuthStorage.clearAuthData();
    } catch (error) {
      setUser(null);
      await AuthStorage.clearAuthData();
    }
  }, [authService]);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await AuthStorage.saveAuthData(currentUser);
      } else {
        setUser(null);
        await AuthStorage.clearAuthData();
      }
    } catch (error) {
    }
  }, [authService]);

  const value: AuthContextType = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    setUser,
    login,
    signup,
    requestOTP,
    logout,
    refreshUser,
  }), [user, isLoading, isAuthenticated, setUser, login, signup, requestOTP, logout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};