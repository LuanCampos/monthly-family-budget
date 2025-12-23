/**
 * Hook for Settings Panel - General Settings
 * Handles language, theme, and currency preferences
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme, themes, ThemeKey } from '@/contexts/ThemeContext';
import { useCurrency, currencies, CurrencyCode } from '@/contexts/CurrencyContext';
import { logger } from '@/lib/logger';
import type { Language } from '@/i18n';

export interface GeneralSettingsState {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  themes: typeof themes;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  currencies: typeof currencies;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useGeneralSettings = (): GeneralSettingsState => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  const handleThemeChange = (newTheme: ThemeKey) => {
    setTheme(newTheme);
    logger.info('settings.theme.changed', { theme: newTheme });
  };

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    logger.info('settings.currency.changed', { currency: newCurrency });
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    logger.info('settings.language.changed', { language: newLanguage });
  };

  return {
    theme,
    setTheme: handleThemeChange,
    themes,
    currency,
    setCurrency: handleCurrencyChange,
    currencies,
    language,
    setLanguage: handleLanguageChange,
    t,
  };
};
