import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeKey = 'dark' | 'light' | 'nord' | 'dracula' | 'solarized' | 'gruvbox' | 'catppuccin';

export interface ThemeInfo {
  key: ThemeKey;
  labelKey: string;
}

export const themes: ThemeInfo[] = [
  { key: 'dark', labelKey: 'themeDark' },
  { key: 'light', labelKey: 'themeLight' },
  { key: 'nord', labelKey: 'themeNord' },
  { key: 'dracula', labelKey: 'themeDracula' },
  { key: 'solarized', labelKey: 'themeSolarized' },
  { key: 'gruvbox', labelKey: 'themeGruvbox' },
  { key: 'catppuccin', labelKey: 'themeCatppuccin' },
];

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'budget-app-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeKey>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeKey | null;
    if (stored && themes.some(t => t.key === stored)) return stored;
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    
    // Remove all theme classes and add current one
    const root = document.documentElement;
    themes.forEach(t => root.classList.remove(`theme-${t.key}`));
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeKey) => {
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
