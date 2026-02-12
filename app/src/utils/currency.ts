export interface Currency {
  code: string;
  symbol: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const CURRENCIES: Record<string, Currency> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    nativeName: 'भारतीय रुपया',
    flag: '🇮🇳',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    nativeName: 'US Dollar',
    flag: '🇺🇸',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    nativeName: 'Euro',
    flag: '🇪🇺',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    nativeName: 'British Pound',
    flag: '🇬🇧',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    nativeName: 'Australian Dollar',
    flag: '🇦🇺',
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    nativeName: 'Canadian Dollar',
    flag: '🇨🇦',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    nativeName: '日本円',
    flag: '🇯🇵',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    nativeName: '人民币',
    flag: '🇨🇳',
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    nativeName: 'درهم إماراتي',
    flag: '🇦🇪',
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'Saudi Riyal',
    nativeName: 'ريال سعودي',
    flag: '🇸🇦',
  },
};

export const DEFAULT_CURRENCY = 'INR';

export function getCurrencySymbol(currencyCode: string = DEFAULT_CURRENCY): string {
  return CURRENCIES[currencyCode]?.symbol || '₹';
}

export function getCurrencyName(currencyCode: string = DEFAULT_CURRENCY): string {
  return CURRENCIES[currencyCode]?.name || 'Indian Rupee';
}

export function formatAmount(
  amount: number | string,
  currencyCode: string = DEFAULT_CURRENCY,
  showSymbol: boolean = true
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return showSymbol ? `${getCurrencySymbol(currencyCode)}0` : '0';
  }

  const currency = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY];
  const formatted = numAmount.toFixed(2).replace(/\.00$/, '');

  return showSymbol ? `${currency.symbol}${formatted}` : formatted;
}

export function getSupportedCurrencies(): Currency[] {
  return Object.values(CURRENCIES);
}

export function isSupportedCurrency(code: string): boolean {
  return code in CURRENCIES;
}
