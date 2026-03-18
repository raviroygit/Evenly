import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './AuthContext';
import {
  setupNotificationHandler,
  registerForPushNotifications,
  registerTokenWithBackend,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
} from '../services/PushNotificationService';

interface NotificationContextType {
  // Extensible — add methods here if needed in the future
}

const NotificationContext = createContext<NotificationContextType>({});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const cleanupReceivedRef = useRef<(() => void) | null>(null);
  const cleanupResponseRef = useRef<(() => void) | null>(null);
  const registeredRef = useRef(false);

  // Set up notification handler once on mount
  useEffect(() => {
    setupNotificationHandler();
  }, []);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (!user) {
      console.log('[NotificationContext] No user, skipping push registration');
      return;
    }
    if (registeredRef.current) {
      console.log('[NotificationContext] Already registered this session, skipping');
      return;
    }

    const register = async () => {
      console.log('[NotificationContext] Starting push notification registration for user:', user.id);
      const token = await registerForPushNotifications();
      if (token) {
        console.log('[NotificationContext] Got token, sending to backend...');
        await registerTokenWithBackend(token);
        registeredRef.current = true;
        console.log('[NotificationContext] Push registration complete!');
      } else {
        console.log('[NotificationContext] No token received — registration skipped');
      }
    };

    register().catch((error) => {
      console.error('[NotificationContext] Push registration failed:', error);
    });
  }, [user]);

  // Set up notification listeners
  useEffect(() => {
    // Foreground notification received
    cleanupReceivedRef.current = addNotificationReceivedListener((_notification) => {
      // Optionally refresh data here in the future
    });

    // User tapped on a notification — navigate to the relevant screen
    cleanupResponseRef.current = addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.groupId && data?.screen === 'group_detail') {
        router.push(`/tabs/groups/${data.groupId}` as any);
      }
    });

    // Handle cold start: check if app was opened from a notification
    const lastResponse = getLastNotificationResponse();
    if (lastResponse) {
      const data = lastResponse?.notification?.request?.content?.data;
      if (data?.groupId && data?.screen === 'group_detail') {
        setTimeout(() => {
          router.push(`/tabs/groups/${data.groupId}` as any);
        }, 500);
      }
    }

    return () => {
      cleanupReceivedRef.current?.();
      cleanupResponseRef.current?.();
    };
  }, [router]);

  // Reset registration flag when user logs out
  useEffect(() => {
    if (!user) {
      registeredRef.current = false;
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
}
