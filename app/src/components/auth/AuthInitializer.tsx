import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { sessionEvents, SESSION_EVENTS } from '../../utils/sessionEvents';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const handlingExpired = useRef(false);
  const pendingUnauthorized = useRef(false);

  const showUnauthorizedAlertAndLogout = React.useCallback(() => {
    if (handlingExpired.current) return;
    handlingExpired.current = true;
    pendingUnauthorized.current = false;
    Alert.alert(
      t('common.unauthorizedAccess'),
      t('common.sessionNoLongerValid'),
      [
        {
          text: t('common.ok'),
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth/login');
            } finally {
              handlingExpired.current = false;
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, [t, logout, router]);

  // When SESSION_EXPIRED fires, mark pending. Show alert only after splash is done (not on '/').
  useEffect(() => {
    const handleSessionExpired = () => {
      pendingUnauthorized.current = true;
      if (pathname !== '/') {
        showUnauthorizedAlertAndLogout();
      }
    };

    sessionEvents.on(SESSION_EVENTS.SESSION_EXPIRED, handleSessionExpired);
    return () => {
      sessionEvents.off(SESSION_EVENTS.SESSION_EXPIRED, handleSessionExpired);
    };
  }, [pathname, showUnauthorizedAlertAndLogout]);

  // Once we leave splash, show pending alert if any. Never show on login screen (avoid second alert after redirect).
  useEffect(() => {
    if (pathname === '/auth/login') {
      pendingUnauthorized.current = false;
      return;
    }
    if (pathname !== '/' && pendingUnauthorized.current) {
      showUnauthorizedAlertAndLogout();
    }
  }, [pathname, showUnauthorizedAlertAndLogout]);

  return <>{children}</>;
};
