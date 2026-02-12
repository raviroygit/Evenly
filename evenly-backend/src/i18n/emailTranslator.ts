import * as path from 'path';
import * as fs from 'fs';
import { getCurrencySymbol, DEFAULT_CURRENCY } from '../utils/currency';

// Load translation files
const translations: Record<string, any> = {};

function loadTranslations(lang: string): any {
  if (!translations[lang]) {
    try {
      const filePath = path.join(__dirname, 'email', `${lang}.json`);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      translations[lang] = JSON.parse(fileContent);
    } catch (error) {
      // Fallback to English if language file not found
      if (lang !== 'en') {
        return loadTranslations('en');
      }
      throw new Error(`Translation file not found for language: ${lang}`);
    }
  }
  return translations[lang];
}

/**
 * Get translated text by key path
 * @param lang - Language code (en, hi, etc.)
 * @param keyPath - Dot-separated key path (e.g., 'groupInvitation.subject')
 * @param params - Parameters to replace in the translation
 */
export function t(lang: string, keyPath: string, params: Record<string, any> = {}): string {
  const trans = loadTranslations(lang);
  const keys = keyPath.split('.');
  let value: any = trans;

  // Navigate through the nested keys
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      // Key not found, return key path as fallback
      return keyPath;
    }
  }

  // If value is not a string, return key path
  if (typeof value !== 'string') {
    return keyPath;
  }

  // Replace parameters in the translation
  let result = value;
  for (const [key, val] of Object.entries(params)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(val));
  }

  return result;
}

/**
 * Get user's preferred language, fallback to English
 */
export function getUserLanguage(user: { preferredLanguage?: string | null }): string {
  return user.preferredLanguage || 'en';
}

/**
 * Get user's preferred currency symbol, fallback to INR
 */
export function getUserCurrencySymbol(user?: { preferredCurrency?: string | null }): string {
  if (!user || !user.preferredCurrency) {
    return getCurrencySymbol(DEFAULT_CURRENCY);
  }
  return getCurrencySymbol(user.preferredCurrency);
}
