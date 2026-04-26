import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AuthService } from '../services/AuthService';
import { UnifiedAuthService, SendOtpInput, SendOtpResponse, VerifyOtpInput } from '../services/UnifiedAuthService';
import { EvenlyBackendService } from '../services/EvenlyBackendService';
import { AuthStorage } from '../utils/storage';
import { evenlyApiClient } from '../services/EvenlyApiClient';
import { CacheManager } from '../utils/cacheManager';
import { HomeCache } from '../utils/homeCache';
import { OfflineDataCache } from '../utils/offlineDataCache';
import { SilentTokenRefresh } from '../utils/silentTokenRefresh';
import { DataRefreshCoordinator } from '../utils/dataRefreshCoordinator';
import { getStoredPushToken, unregisterTokenFromBackend, clearStoredPushToken } from '../services/PushNotificationService';
import { googleSignOut } from '../lib/google-signin';
import i18n from '../i18n/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HAS_LOGGED_IN_BEFORE_KEY } from '../features/referral/pendingReferralStorage';

import { User as UserType, Organization as OrganizationType } from '../types';

// Use imported types instead of local definitions
type User = UserType;
type Organization = OrganizationType;

// Auth state machine for clear state management
export type AuthState = 'initializing' | 'authenticated' | 'unauthenticated' | 'refreshing';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  authState: AuthState;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  /** Unified passwordless: ask the auth service to send an OTP. Returns the raw response so the OTP screen can branch on intent + user.has* flags. */
  sendOtp: (input: SendOtpInput) => Promise<SendOtpResponse & { success: boolean; message: string }>;
  /** Unified passwordless: verify the OTP and sign the user in. Stores tokens and sets organization. */
  verifyOtpUnified: (input: VerifyOtpInput) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; message: string }>;
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
  const [authState, setAuthState] = useState<AuthState>('initializing');
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const appState = useRef(AppState.currentState);
  const lastValidation = useRef<number>(Date.now());

  // Memoize authService to prevent recreation
  const authService = useMemo(() => new AuthService(), []);
  const isAuthenticated = !!user;

  // Removed warmAppCache - let each screen fetch its own data fresh
  // This prevents stale cache from being shown on app reopen

  // Initialize user from storage on app start - STAY LOGGED IN
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setAuthState('initializing');

        const authData = await AuthStorage.getAuthData();

        if (authData && authData.user && (authData.accessToken || authData.apiKey)) {
          // Set user immediately from storage - stay logged in!
          setUser(authData.user);
          setAuthState('authenticated');

          // Load organizations from storage if available
          if (authData.organizations) {
            setOrganizations(authData.organizations);

            // Restore current organization
            const storedOrgId = await AuthStorage.getCurrentOrganizationId();
            const storedOrg = authData.organizations.find(org => org.id === storedOrgId);
            if (storedOrg) {
              setCurrentOrganization(storedOrg);
            } else if (authData.organizations.length > 0) {
              setCurrentOrganization(authData.organizations[0]);
            }
          }

          // Trust stored token on cold start. Screens that need fresh data fetch it on mount,
          // and validateSessionOnForeground refreshes user info when the app returns from background.
        } else {
          setUser(null);
          setAuthState('unauthenticated');
        }
      } catch (error) {
        // Even on error, try to stay logged in if we have stored data
        const authData = await AuthStorage.getAuthData();
        if (authData?.user) {
          setUser(authData.user);
          setAuthState('authenticated');
        } else {
          setUser(null);
          setAuthState('unauthenticated');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [authService]);

  // Validate session when app comes to foreground - but NEVER log out automatically
  // Mobile tokens never expire (10 years), so we just validate user data
  const validateSessionOnForeground = useCallback(async () => {
    // Only validate if user is logged in
    if (!user) return;

    const now = Date.now();
    const timeSinceLastValidation = now - lastValidation.current;
    const VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

    // Skip validation if validated recently
    if (timeSinceLastValidation < VALIDATION_INTERVAL) {
      return;
    }

    try {

      const authData = await AuthStorage.getAuthData();
      if (!authData?.accessToken) {
        return;
      }

      const storedPhoneNumber = authData.user?.phoneNumber;

      // Validate with backend to get fresh user data
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
            } else {
              setCurrentOrganization(currentUser.organizations[0]);
            }
          }
        }

        await AuthStorage.saveAuthData(
          currentUser,
          authData.accessToken,
          currentUser.organizations
        );
      } else {
        // Session returned null - but DON'T log out
        // User might be offline or backend issue - keep them logged in
        lastValidation.current = now; // Mark as validated to avoid spamming
      }
    } catch (error) {
      // NEVER log out on network errors - user might be offline
      lastValidation.current = now; // Mark as validated to avoid spamming retries
    }
  }, [user, authService, currentOrganization]);

  // Listen to app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // When app comes to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        validateSessionOnForeground();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [validateSessionOnForeground]);

  // NO background token refresh timer needed - mobile tokens never expire (10 years)

  // First time the user authenticates on this device, mark the device as
  // "seen". The auth screen reads this flag pre-Google to decide whether to
  // surface the referral prompt for first-ever signups even with no
  // deep-link code. Best-effort; failure to persist is non-fatal.
  useEffect(() => {
    if (!user) return;
    AsyncStorage.setItem(HAS_LOGGED_IN_BEFORE_KEY, '1').catch(() => {});
  }, [user]);

  // Sync the locally-selected language to the backend whenever a user is
  // present and the local choice differs from `user.preferredLanguage`. Lets
  // the first-launch language picker (run before login) silently propagate
  // its choice once the user authenticates. Best-effort, fire-and-forget.
  const lastSyncedLanguage = useRef<string | null>(null);
  useEffect(() => {
    if (!user) {
      lastSyncedLanguage.current = null;
      return;
    }
    const localLang = i18n.language;
    if (!localLang) return;
    if (localLang === user.preferredLanguage) return;
    if (lastSyncedLanguage.current === localLang) return;
    lastSyncedLanguage.current = localLang;
    EvenlyBackendService.updateUserLanguage(localLang)
      .then(() => {
        // Optimistically reflect the new language on the local user object so
        // this effect doesn't re-fire on the next user-state update.
        setUser((prev) => (prev ? { ...prev, preferredLanguage: localLang } : prev));
      })
      .catch(() => {
        // Reset so we'll retry next time the user state changes.
        lastSyncedLanguage.current = null;
      });
  }, [user]);

  // Monitor auth storage for silent logouts - check every 5 seconds
  useEffect(() => {
    if (!user) return; // Only monitor when user is logged in

    const checkAuthStorage = async () => {
      try {
        const authData = await AuthStorage.getAuthData();

        // If auth data was cleared but user is still set, update user state
        if (!authData && user) {
          setUser(null);
          // Router will automatically redirect to login
        }
      } catch (error) {
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
      const response = await authService.switchOrganization(orgId);

      if (response.success && response.organization) {
        setCurrentOrganization(response.organization);
        await AuthStorage.setCurrentOrganizationId(orgId);

        // Screens will automatically reload when organization changes
      }
    } catch (error) {
      throw error;
    }
  }, [authService]);

  // Refresh the list of organizations by fetching current user
  const refreshOrganizations = useCallback(async () => {
    try {
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
    }
  }, [authService, currentOrganization]);

  const sendOtp = useCallback(async (input: SendOtpInput) => {
    try {
      const result = await UnifiedAuthService.sendOtp(input);
      return {
        ...result,
        success: !!result.success,
        message: result.message || (result.success ? 'OTP sent' : 'Failed to send OTP'),
      };
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message;
      return {
        success: false,
        message: serverMsg || error?.message || 'Failed to send OTP',
      } as SendOtpResponse & { success: boolean; message: string };
    }
  }, []);

  const verifyOtpUnified = useCallback(async (input: VerifyOtpInput) => {
    try {
      const result = await UnifiedAuthService.verifyOtp(input);

      if (!result.success || !result.user || !result.accessToken) {
        return {
          success: false,
          message: result.message || 'Invalid or expired OTP',
        };
      }

      // The auth service returns a minimal user shape. Enrich with the inputs
      // the user just provided so the dashboard renders the right name/phone
      // immediately without waiting on the Evenly-backend sync to complete.
      const enrichedUser: User = {
        id: result.user.id,
        email: result.user.email || input.email || '',
        name: result.user.name || input.name || '',
        phoneNumber: result.user.phoneNumber || input.phoneNumber || '',
        avatar: result.user.avatar || undefined,
        stats: { groups: 0, totalSpent: 0, owed: 0 },
        organizations: result.organization ? [result.organization as any] : undefined,
        currentOrganization: result.organization as any,
      };

      const orgs = enrichedUser.organizations || [];
      if (orgs.length > 0) {
        setOrganizations(orgs);
        const orgToUse = enrichedUser.currentOrganization || orgs[0];
        if (orgToUse) {
          setCurrentOrganization(orgToUse);
          await AuthStorage.setCurrentOrganizationId(orgToUse.id);
        }
      }

      // Save tokens BEFORE setting user state to avoid the storage monitor
      // briefly seeing user-without-token and treating it as a silent logout.
      await AuthStorage.saveAuthData(
        enrichedUser,
        result.accessToken,
        orgs,
        result.refreshToken,
        undefined
      );

      setAuthState('authenticated');
      setUser(enrichedUser);

      // Background refresh from the Evenly backend. The first authenticated
      // request triggers `authenticateToken` middleware, which creates the
      // local users row + populates stats/orgs. We then merge that richer
      // payload back over the minimal shape from the auth service.
      authService.getCurrentUser().then(async (freshUser) => {
        if (!freshUser) return;
        const mergedUser: User = {
          ...freshUser,
          name: freshUser.name || enrichedUser.name,
          phoneNumber: freshUser.phoneNumber || enrichedUser.phoneNumber,
          avatar: freshUser.avatar || enrichedUser.avatar,
        };
        setUser(mergedUser);
        if (mergedUser.organizations?.length) {
          setOrganizations(mergedUser.organizations);
        }
        const authData = await AuthStorage.getAuthData();
        if (authData?.accessToken) {
          await AuthStorage.saveAuthData(
            mergedUser,
            authData.accessToken,
            mergedUser.organizations,
            authData.refreshToken
          );
        }
      }).catch(() => {});

      return {
        success: true,
        message: result.message || 'Logged in successfully',
      };
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message;
      return {
        success: false,
        message: serverMsg || error?.message || 'Verification failed',
      };
    }
  }, [authService]);

  const signInWithGoogle = useCallback(async () => {
    try {
      // Lazy-require to avoid crashes if native module is unavailable (Expo Go)
      const { nativeGoogleSignIn } = require('../lib/google-signin') as typeof import('../lib/google-signin');
      const idToken = await nativeGoogleSignIn();
      if (!idToken) {
        // User cancelled or native module unavailable
        return { success: false, message: 'Google sign-in was cancelled' };
      }

      const result = await authService.signInWithGoogle(idToken);

      if (result.success && result.user) {
        // Update organizations if received
        if (result.user.organizations) {
          setOrganizations(result.user.organizations);
          if (result.user.currentOrganization) {
            setCurrentOrganization(result.user.currentOrganization);
            await AuthStorage.setCurrentOrganizationId(result.user.currentOrganization.id);
          } else if (result.user.organizations.length > 0) {
            setCurrentOrganization(result.user.organizations[0]);
            await AuthStorage.setCurrentOrganizationId(result.user.organizations[0].id);
          }
        }

        // Save auth data BEFORE setting user state (prevents race conditions)
        await AuthStorage.saveAuthData(
          result.user,
          result.accessToken,
          result.user.organizations,
          result.refreshToken,
          result.apiKey
        );

        setAuthState('authenticated');
        setUser(result.user);

        return { success: true, message: 'Login successful!' };
      } else {
        return { success: false, message: result.message || 'Google sign-in failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Google sign-in failed' };
    }
  }, [authService]);

  const logout = useCallback(async () => {
    // Snapshot tokens BEFORE wiping storage. We need them for the two
    // server-side cleanup calls below.
    const authDataBefore = await AuthStorage.getAuthData().catch(() => null);
    const accessTokenSnapshot = authDataBefore?.accessToken;
    const pushTokenSnapshot = await getStoredPushToken().catch(() => null);

    // CRITICAL ORDERING: hit /api/v1/auth/logout (auth service) BEFORE we
    // clear local state. Previously this ran in a fire-and-forget IIFE
    // after `setUser(null)` flipped auth state and PublicRoute redirected
    // to /auth — the navigation cancelled the in-flight request and the
    // server-side session was never invalidated. Await it inline so the
    // refresh token + active sessions are reliably revoked.
    if (accessTokenSnapshot) {
      try {
        await UnifiedAuthService.logoutDirect(accessTokenSnapshot);
        if (__DEV__) {
          console.log('[AuthContext.logout] auth-service /api/v1/auth/logout: ok');
        }
      } catch (error: any) {
        if (__DEV__) {
          console.warn(
            '[AuthContext.logout] auth-service /api/v1/auth/logout failed:',
            error?.response?.status,
            error?.response?.data || error?.message
          );
        }
        // Continue with local cleanup regardless — a network failure must
        // not strand the user "logged in" on their device.
      }
    }

    // Push token unregister: also best-effort and also done while the
    // bearer is still on hand (the EvenlyApiClient interceptor would
    // otherwise fail to authenticate post-clear).
    if (pushTokenSnapshot && accessTokenSnapshot) {
      try {
        await unregisterTokenFromBackend(pushTokenSnapshot, accessTokenSnapshot);
      } catch {
        // best-effort
      }
    }

    // Now clear local state so the UI navigates to /auth.
    setUser(null);
    setCurrentOrganization(null);
    setOrganizations([]);

    // Clear local storage and caches (fast, local-only operations).
    await AuthStorage.clearAuthData();
    await AuthStorage.clearCurrentOrganization();
    await CacheManager.invalidateAllData();
    await HomeCache.clear();
    await OfflineDataCache.clearAll();
    await SilentTokenRefresh.clearRefreshTimestamp();
    DataRefreshCoordinator.clearAll();
    await googleSignOut();
    await clearStoredPushToken();
  }, []);

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

        // Re-save with existing token (including preserved phoneNumber)
        await AuthStorage.saveAuthData(
          currentUser,
          authData?.accessToken,
          currentUser.organizations
        );
      } else {
        // NEVER auto-logout - keep user logged in with local data
        // Do NOT clear auth data or set user to null
      }
    } catch (error) {
      // NEVER auto-logout on network errors - keep user logged in
    }
  }, [authService]);

  const value: AuthContextType = useMemo(() => ({
    user,
    isLoading,
    authState,
    isAuthenticated,
    setUser,
    sendOtp,
    verifyOtpUnified,
    signInWithGoogle,
    logout,
    refreshUser,
    currentOrganization,
    organizations,
    switchOrganization,
    refreshOrganizations,
  }), [user, isLoading, authState, isAuthenticated, setUser, sendOtp, verifyOtpUnified, signInWithGoogle, logout, refreshUser, currentOrganization, organizations, switchOrganization, refreshOrganizations]);

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