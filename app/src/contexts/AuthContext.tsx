import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AuthService } from '../services/AuthService';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { AuthStorage } from '../utils/storage';
import { SilentTokenRefresh } from '../utils/silentTokenRefresh';
import { evenlyApiClient } from '../services/EvenlyApiClient';

import { User as UserType, Organization as OrganizationType } from '../types';

// Use imported types instead of local definitions
type User = UserType;
type Organization = OrganizationType;

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

  // Organization management
  currentOrganization: Organization | null;
  organizations: Organization[];
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Start with loading false
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const appState = useRef(AppState.currentState);
  const lastValidation = useRef<number>(Date.now());
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize authService to prevent recreation
  const authService = useMemo(() => new AuthService(), []);
  const isAuthenticated = !!user;

  const warmAppCache = useCallback(async () => {
    const TTL = 3 * 60 * 1000; // 3 minutes
    try {
      await Promise.all([
        EvenlyBackendService.getGroups({ cacheTTLMs: TTL }),
        EvenlyBackendService.getAllExpenses({ page: 1, limit: 20, sortOrder: 'desc', cacheTTLMs: TTL }),
        EvenlyBackendService.getUserBalances({ cacheTTLMs: TTL }),
        EvenlyBackendService.getUserNetBalance({ cacheTTLMs: TTL }),
      ]);
    } catch {
      // ignore warmup errors
    }
  }, []);

  // Initialize user from storage on app start - STAY LOGGED IN
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        const authData = await AuthStorage.getAuthData();

        if (authData && authData.user && authData.accessToken) {
          // Set user immediately from storage - stay logged in!
          setUser(authData.user);

          // Load organizations from storage if available
          if (authData.organizations) {
            setOrganizations(authData.organizations);

            // Restore current organization
            const storedOrgId = await AuthStorage.getCurrentOrganizationId();
            const storedOrg = authData.organizations.find(org => org.id === storedOrgId);
            if (storedOrg) {
              setCurrentOrganization(storedOrg);
              evenlyApiClient.setOrganizationId(storedOrg.id);
            } else if (authData.organizations.length > 0) {
              setCurrentOrganization(authData.organizations[0]);
              evenlyApiClient.setOrganizationId(authData.organizations[0].id);
            }
          }

          // Try to validate session with backend in background (non-blocking)
          // Preserve phoneNumber from stored user before refreshing
          const storedPhoneNumber = authData.user?.phoneNumber;
          
          authService.getCurrentUser()
            .then(async (currentUser) => {
              if (currentUser) {
                // Preserve phoneNumber if it's missing from the response
                if (!currentUser.phoneNumber && storedPhoneNumber) {
                  currentUser.phoneNumber = storedPhoneNumber;
                }

                // Session is still valid - update user data if changed
                setUser(currentUser);

                // Update organizations if received
                if (currentUser.organizations) {
                  setOrganizations(currentUser.organizations);

                  // Update current organization if not set
                  if (!currentOrganization && currentUser.organizations.length > 0) {
                    const storedOrgId = await AuthStorage.getCurrentOrganizationId();
                    const storedOrg = currentUser.organizations.find(org => org.id === storedOrgId);
                    if (storedOrg) {
                      setCurrentOrganization(storedOrg);
                      evenlyApiClient.setOrganizationId(storedOrg.id);
                    } else {
                      setCurrentOrganization(currentUser.organizations[0]);
                      evenlyApiClient.setOrganizationId(currentUser.organizations[0].id);
                    }
                  }
                }

                await AuthStorage.saveAuthData(
                  currentUser,
                  authData.accessToken,
                  authData.refreshToken,
                  currentUser.organizations
                );
                // Warm cache after validating session
                warmAppCache().catch(() => {});
              } else {
                // Session invalid on backend - but DON'T log out yet
                // User might be offline - keep them logged in with local data
                console.warn('[AuthContext] Session validation returned null - keeping user logged in with local data');
              }
            })
            .catch((error) => {
              // Network error - DON'T log out! User might be offline
              console.error('[AuthContext] Failed to validate session (network error) - keeping user logged in:', error);
              // User stays logged in with local data
            });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('[AuthContext] Auth initialization error:', error);
        // Even on error, try to stay logged in if we have stored data
        const authData = await AuthStorage.getAuthData();
        if (authData?.user) {
          setUser(authData.user);
        } else {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [authService, warmAppCache]);

  // Validate session when app comes to foreground - but NEVER log out automatically
  const validateSessionOnForeground = useCallback(async () => {
    // Only validate if user is logged in
    if (!user) return;

    // Only validate once per 5 minutes to avoid excessive API calls
    const now = Date.now();
    const timeSinceLastValidation = now - lastValidation.current;
    const VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

    if (timeSinceLastValidation < VALIDATION_INTERVAL) {
      console.log('[AuthContext] Skipping validation - validated recently');
      return;
    }

    try {
      console.log('[AuthContext] Validating session on foreground');
      const authData = await AuthStorage.getAuthData();
      // Preserve phoneNumber from stored user before refreshing
      const storedPhoneNumber = authData?.user?.phoneNumber;

      if (authData && authData.accessToken) {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          // Preserve phoneNumber if it's missing from the response
          if (!currentUser.phoneNumber && storedPhoneNumber) {
            currentUser.phoneNumber = storedPhoneNumber;
          }

          // Session still valid - update user data
          setUser(currentUser);
          lastValidation.current = now;

          // Update organizations if received
          if (currentUser.organizations) {
            setOrganizations(currentUser.organizations);

            // Update current organization if not set
            if (!currentOrganization && currentUser.organizations.length > 0) {
              const storedOrgId = await AuthStorage.getCurrentOrganizationId();
              const storedOrg = currentUser.organizations.find(org => org.id === storedOrgId);
              if (storedOrg) {
                setCurrentOrganization(storedOrg);
                evenlyApiClient.setOrganizationId(storedOrg.id);
              } else {
                setCurrentOrganization(currentUser.organizations[0]);
                evenlyApiClient.setOrganizationId(currentUser.organizations[0].id);
              }
            }
          }

          await AuthStorage.saveAuthData(
            currentUser,
            authData.accessToken,
            authData.refreshToken,
            currentUser.organizations
          );
          console.log('[AuthContext] Session validated successfully');
        } else {
          // Session returned null - but DON'T log out
          // User might be offline or backend issue - keep them logged in
          console.warn('[AuthContext] Session validation returned null - keeping user logged in');
          lastValidation.current = now; // Mark as validated to avoid spamming
        }
      }
    } catch (error) {
      console.error('[AuthContext] Session validation error - keeping user logged in:', error);
      // NEVER log out on network errors - user might be offline
      lastValidation.current = now; // Mark as validated to avoid spamming retries
    }
  }, [user, authService]);

  // Listen to app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // When app comes to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[AuthContext] App has come to foreground - validating session');
        validateSessionOnForeground();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [validateSessionOnForeground]);

  // Background token refresh timer - checks every 15 minutes and refreshes if needed
  useEffect(() => {
    if (!user) {
      // Clear timer if user is not logged in
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    console.log('[AuthContext] Starting background token refresh timer');

    // Check and refresh immediately on mount
    SilentTokenRefresh.checkAndRefresh().catch(err => {
      console.error('[AuthContext] Initial token refresh check failed:', err);
    });

    // Then check every 15 minutes
    const interval = setInterval(() => {
      console.log('[AuthContext] Running scheduled token refresh check...');
      SilentTokenRefresh.checkAndRefresh().catch(err => {
        console.error('[AuthContext] Scheduled token refresh check failed:', err);
      });
    }, 15 * 60 * 1000); // 15 minutes

    refreshTimerRef.current = interval;

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [user]);

  // Monitor auth storage for silent logouts - check every 5 seconds
  useEffect(() => {
    if (!user) return; // Only monitor when user is logged in

    const checkAuthStorage = async () => {
      try {
        const authData = await AuthStorage.getAuthData();

        // If auth data was cleared but user is still set, update user state
        if (!authData && user) {
          console.log('[AuthContext] Auth data cleared - logging out user');
          setUser(null);
          // Router will automatically redirect to login
        }
      } catch (error) {
        console.error('[AuthContext] Error checking auth storage:', error);
      }
    };

    // Check immediately
    checkAuthStorage();

    // Then check every 5 seconds
    const storageMonitor = setInterval(checkAuthStorage, 5000);

    return () => {
      clearInterval(storageMonitor);
    };
  }, [user]);

  // Organizations are now loaded from auth responses only
  // No separate API call needed

  // Switch to a different organization
  const switchOrganization = useCallback(async (orgId: string) => {
    try {
      console.log('[AuthContext] Switching to organization:', orgId);
      const response = await authService.switchOrganization(orgId);

      if (response.success && response.organization) {
        setCurrentOrganization(response.organization);
        await AuthStorage.setCurrentOrganizationId(orgId);
        evenlyApiClient.setOrganizationId(orgId);
        console.log('[AuthContext] Successfully switched to:', response.organization.name);

        // Refresh app data after switching organizations
        await warmAppCache();
      }
    } catch (error) {
      console.error('[AuthContext] Failed to switch organization:', error);
      throw error;
    }
  }, [authService, warmAppCache]);

  // Refresh the list of organizations by fetching current user
  const refreshOrganizations = useCallback(async () => {
    try {
      console.log('[AuthContext] Refreshing organizations via /auth/me...');
      const currentUser = await authService.getCurrentUser();

      if (currentUser && currentUser.organizations) {
        setOrganizations(currentUser.organizations);

        // Update current organization if it's in the list
        if (currentOrganization) {
          const updatedCurrent = currentUser.organizations.find(org => org.id === currentOrganization.id);
          if (updatedCurrent) {
            setCurrentOrganization(updatedCurrent);
          }
        }
      }
    } catch (error) {
      console.error('[AuthContext] Failed to refresh organizations:', error);
    }
  }, [authService, currentOrganization]);

  const login = useCallback(async (email: string, otp: string) => {
    try {
      const result = await authService.verifyOTP(email, otp);

      // If login was successful and we have user data, use it directly
      if (result.success && result.user) {
        setUser(result.user);

        // Update organizations if received from login
        console.log('[AuthContext] Login result user:', result.user);
        console.log('[AuthContext] User organizations:', result.user.organizations);
        console.log('[AuthContext] User currentOrganization:', result.user.currentOrganization);

        if (result.user.organizations) {
          setOrganizations(result.user.organizations);
          if (result.user.currentOrganization) {
            console.log('[AuthContext] Setting organization from currentOrganization:', result.user.currentOrganization.id);
            setCurrentOrganization(result.user.currentOrganization);
            await AuthStorage.setCurrentOrganizationId(result.user.currentOrganization.id);
            evenlyApiClient.setOrganizationId(result.user.currentOrganization.id);
          } else if (result.user.organizations.length > 0) {
            // Set first organization as current if not specified
            console.log('[AuthContext] Setting organization from first org:', result.user.organizations[0].id);
            setCurrentOrganization(result.user.organizations[0]);
            await AuthStorage.setCurrentOrganizationId(result.user.organizations[0].id);
            evenlyApiClient.setOrganizationId(result.user.organizations[0].id);
          }
        } else {
          console.warn('[AuthContext] ⚠️ No organizations in login result!');
        }

        await AuthStorage.saveAuthData(
          result.user,
          result.accessToken,
          result.refreshToken,
          result.user.organizations
        );

        // Upgrade to 90-day session
        console.log('[AuthContext] Upgrading to 90-day session after OTP login...');
        const upgraded = await SilentTokenRefresh.refresh();
        if (upgraded) {
          console.log('[AuthContext] ✅ Successfully upgraded to 90-day session');
        } else {
          console.warn('[AuthContext] ⚠️ Failed to upgrade to 90-day session - will use 24-hour session');
        }

        warmAppCache().catch(() => {});

        return { success: true, message: 'Login successful!' };
      } else {
        return { success: false, message: result.message || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' };
    }
  }, [authService, warmAppCache]);

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
      setCurrentOrganization(null);
      setOrganizations([]);
      evenlyApiClient.setOrganizationId(null);
      await AuthStorage.clearAuthData();
      await AuthStorage.clearCurrentOrganization();
    } catch (error) {
      setUser(null);
      setCurrentOrganization(null);
      setOrganizations([]);
      evenlyApiClient.setOrganizationId(null);
      await AuthStorage.clearAuthData();
      await AuthStorage.clearCurrentOrganization();
    }
  }, [authService]);

  const refreshUser = useCallback(async () => {
    try {
      // Get current tokens from storage
      const authData = await AuthStorage.getAuthData();
      // Preserve phoneNumber from stored user before refreshing
      const storedPhoneNumber = authData?.user?.phoneNumber;

      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // Preserve phoneNumber if it's missing from the response
        if (!currentUser.phoneNumber && storedPhoneNumber) {
          currentUser.phoneNumber = storedPhoneNumber;
        }

        setUser(currentUser);

        // Update organizations if received
        if (currentUser.organizations) {
          setOrganizations(currentUser.organizations);
        }

        // Re-save with existing tokens (including preserved phoneNumber)
        await AuthStorage.saveAuthData(
          currentUser,
          authData?.accessToken,
          authData?.refreshToken,
          currentUser.organizations
        );
      } else {
        // NEVER auto-logout - keep user logged in with local data
        console.warn('[AuthContext] refreshUser returned null - keeping user logged in with cached data');
        // Do NOT clear auth data or set user to null
      }
    } catch (error) {
      // NEVER auto-logout on network errors - keep user logged in
      console.warn('[AuthContext] refreshUser failed - keeping user logged in with cached data');
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
    currentOrganization,
    organizations,
    switchOrganization,
    refreshOrganizations,
  }), [user, isLoading, isAuthenticated, setUser, login, signup, requestOTP, logout, refreshUser, currentOrganization, organizations, switchOrganization, refreshOrganizations]);

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