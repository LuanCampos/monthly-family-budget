import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type CurrencyCode = 'BRL' | 'USD';

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
}

const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  currencySymbol: string;
  formatCurrency: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'budget-app-currency';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'BRL' || stored === 'USD') return stored;
    return 'BRL';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currency);
  }, [currency]);

  const setCurrency = useCallback((curr: CurrencyCode) => {
    setCurrencyState(curr);
  }, []);

  const currencySymbol = CURRENCIES[currency].symbol;

  const formatCurrency = useCallback((value: number): string => {
    const config = CURRENCIES[currency];
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
    }).format(value);
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencySymbol, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const currencies: { code: CurrencyCode; name: string }[] = [
  { code: 'BRL', name: 'Real (R$)' },
  { code: 'USD', name: 'Dollar ($)' },
];
