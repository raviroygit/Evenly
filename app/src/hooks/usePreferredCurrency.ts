import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import {
  getCurrencySymbol,
  formatAmount as formatAmountUtil,
  DEFAULT_CURRENCY,
} from '../utils/currency';

const USER_CURRENCY_KEY = 'userCurrency';

/**
 * Returns the user's preferred currency for display across the app.
 * Priority: user.preferredCurrency (from backend) → AsyncStorage → DEFAULT_CURRENCY.
 * When the user changes currency in Profile, backend + refreshUser() update this globally.
 */
export function usePreferredCurrency(): {
  currencyCode: string;
  symbol: string;
  formatAmount: (amount: number | string, showSymbol?: boolean) => string;
  isReady: boolean;
} {
  const { user } = useAuth();
  const [storedCurrency, setStoredCurrency] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Prefer user.preferredCurrency from backend; fallback to AsyncStorage then default
  const currencyCode = useMemo(() => {
    if (user?.preferredCurrency) return user.preferredCurrency;
    if (storedCurrency) return storedCurrency;
    return DEFAULT_CURRENCY;
  }, [user?.preferredCurrency, storedCurrency]);

  const symbol = useMemo(() => getCurrencySymbol(currencyCode), [currencyCode]);

  const formatAmount = useMemo(
    () => (amount: number | string, showSymbol = true) =>
      formatAmountUtil(amount, currencyCode, showSymbol),
    [currencyCode]
  );

  // Load AsyncStorage fallback on mount and when user might not have preferredCurrency yet
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const code = await AsyncStorage.getItem(USER_CURRENCY_KEY);
      if (mounted && code) setStoredCurrency(code);
      if (mounted) setIsReady(true);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // When user has no preferredCurrency (e.g. old stored session), re-read AsyncStorage so local choice is used
  useEffect(() => {
    if (user && !user.preferredCurrency) {
      AsyncStorage.getItem(USER_CURRENCY_KEY).then((code) => {
        if (code) setStoredCurrency(code);
      });
    }
  }, [user?.preferredCurrency]);

  return { currencyCode, symbol, formatAmount, isReady };
}
